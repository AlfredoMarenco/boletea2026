<?php

namespace App\Services;

use App\Models\SiteSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WorldCupScoreService
{
    /**
     * Update the World Cup settings automatically by querying the public API.
     * Caches the API request for 60 seconds to avoid hitting rate limits.
     */
    public function updateScore(): array
    {
        // Check if theme and auto mode are enabled
        $themeEnabled = SiteSetting::where('key', 'world_cup_theme_enabled')->first()?->value === '1';
        $scoreMode = SiteSetting::where('key', 'world_cup_score_mode')->first()?->value ?? 'manual';

        if (! $themeEnabled || $scoreMode !== 'auto') {
            return $this->getLocalSettings();
        }

        // Cache the external API fetch for 60 seconds
        return Cache::remember('world_cup_api_status', 60, function () {
            try {
                // 1. Check current live matches
                $response = Http::timeout(4)->get('https://worldcupjson.net/matches/current');

                if ($response->successful()) {
                    $matches = $response->json();

                    if (is_array($matches) && count($matches) > 0) {
                        foreach ($matches as $match) {
                            $homeName = $match['home_team']['name'] ?? '';
                            $awayName = $match['away_team']['name'] ?? '';

                            if ($this->isMexico($homeName) || $this->isMexico($awayName)) {
                                return $this->processActiveMatch($match);
                            }
                        }
                    }
                }

                // 2. If no live match, check matches today
                $todayResponse = Http::timeout(4)->get('https://worldcupjson.net/matches/today');
                if ($todayResponse->successful()) {
                    $todayMatches = $todayResponse->json();

                    if (is_array($todayMatches) && count($todayMatches) > 0) {
                        foreach ($todayMatches as $match) {
                            $homeName = $match['home_team']['name'] ?? '';
                            $awayName = $match['away_team']['name'] ?? '';

                            if ($this->isMexico($homeName) || $this->isMexico($awayName)) {
                                return $this->processUpcomingMatch($match);
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Error fetching World Cup API: '.$e->getMessage());
            }

            // Fallback to current database settings
            $settings = $this->getLocalSettings();
            $settings['status'] = 'countdown';

            return $settings;
        });
    }

    /**
     * Check if the team name corresponds to Mexico.
     */
    private function isMexico(string $name): bool
    {
        $name = strtolower(trim($name));

        return $name === 'mexico' || $name === 'méxico';
    }

    /**
     * Process an active match and save results to DB.
     */
    private function processActiveMatch(array $match): array
    {
        $homeName = $match['home_team']['name'] ?? 'México';
        $awayName = $match['away_team']['name'] ?? 'Oponente';

        $isHome = $this->isMexico($homeName);

        $mexicoScore = $isHome ? ($match['home_team']['goals'] ?? 0) : ($match['away_team']['goals'] ?? 0);
        $opponentScore = $isHome ? ($match['away_team']['goals'] ?? 0) : ($match['home_team']['goals'] ?? 0);
        $opponentName = $isHome ? $awayName : $homeName;

        // Get translation if possible or clean up
        $opponentName = $this->translateCountry($opponentName);

        // Fetch old score to check if a goal was scored
        $oldMexicoScoreVal = SiteSetting::where('key', 'world_cup_mexico_score')->first()?->value ?? '0';
        $oldMexicoScore = (int) $oldMexicoScoreVal;

        if ($mexicoScore > $oldMexicoScore) {
            SiteSetting::updateOrCreate(
                ['key' => 'world_cup_last_goal_time'],
                ['value' => (string) now()->timestamp]
            );
        }

        SiteSetting::updateOrCreate(['key' => 'world_cup_mexico_score'], ['value' => (string) $mexicoScore]);
        SiteSetting::updateOrCreate(['key' => 'world_cup_opponent_score'], ['value' => (string) $opponentScore]);
        SiteSetting::updateOrCreate(['key' => 'world_cup_match_opponent'], ['value' => $opponentName]);
        SiteSetting::updateOrCreate(['key' => 'world_cup_match_status'], ['value' => 'live']);

        return [
            'enabled' => true,
            'opponent' => $opponentName,
            'status' => 'live',
            'mexico_score' => $mexicoScore,
            'opponent_score' => $opponentScore,
            'last_goal_time' => (int) (SiteSetting::where('key', 'world_cup_last_goal_time')->first()?->value ?? 0),
        ];
    }

    /**
     * Process an upcoming match and save status to DB.
     */
    private function processUpcomingMatch(array $match): array
    {
        $homeName = $match['home_team']['name'] ?? 'México';
        $awayName = $match['away_team']['name'] ?? 'Oponente';

        $isHome = $this->isMexico($homeName);
        $opponentName = $isHome ? $awayName : $homeName;
        $opponentName = $this->translateCountry($opponentName);

        SiteSetting::updateOrCreate(['key' => 'world_cup_match_opponent'], ['value' => $opponentName]);

        // If it was live before, but now it's scheduled/timed, it might have finished or is upcoming.
        // Let's set it to countdown since it's scheduled today.
        SiteSetting::updateOrCreate(['key' => 'world_cup_match_status'], ['value' => 'countdown']);

        return [
            'enabled' => true,
            'opponent' => $opponentName,
            'status' => 'countdown',
            'mexico_score' => 0,
            'opponent_score' => 0,
            'last_goal_time' => (int) (SiteSetting::where('key', 'world_cup_last_goal_time')->first()?->value ?? 0),
        ];
    }

    /**
     * Translate country name from English to Spanish.
     */
    private function translateCountry(string $country): string
    {
        $translations = [
            'Poland' => 'Polonia',
            'Argentina' => 'Argentina',
            'Saudi Arabia' => 'Arabia Saudita',
            'France' => 'Francia',
            'Germany' => 'Alemania',
            'Brazil' => 'Brasil',
            'Spain' => 'España',
            'USA' => 'Estados Unidos',
            'United States' => 'Estados Unidos',
            'Canada' => 'Canadá',
            'Italy' => 'Italia',
            'England' => 'Inglaterra',
            'Portugal' => 'Portugal',
            'Netherlands' => 'Países Bajos',
            'Belgium' => 'Bélgica',
            'Croatia' => 'Croacia',
            'Uruguay' => 'Uruguay',
            'Colombia' => 'Colombia',
            'Chile' => 'Chile',
            'Ecuador' => 'Ecuador',
            'Peru' => 'Perú',
            'Japan' => 'Japón',
            'South Korea' => 'Corea del Sur',
            'Morocco' => 'Marruecos',
            'Senegal' => 'Senegal',
            'Cameroon' => 'Camerún',
            'Ghana' => 'Ghana',
            'Tunisia' => 'Túnez',
            'Switzerland' => 'Suiza',
            'Denmark' => 'Dinamarca',
            'Sweden' => 'Suecia',
            'Norway' => 'Noruega',
        ];

        return $translations[$country] ?? $country;
    }

    /**
     * Get the settings stored in the local DB.
     */
    public function getLocalSettings(): array
    {
        $settings = SiteSetting::whereIn('key', [
            'world_cup_theme_enabled',
            'world_cup_match_opponent',
            'world_cup_match_status',
            'world_cup_mexico_score',
            'world_cup_opponent_score',
            'world_cup_last_goal_time',
        ])->pluck('value', 'key');

        return [
            'enabled' => ($settings['world_cup_theme_enabled'] ?? '0') === '1',
            'opponent' => $settings['world_cup_match_opponent'] ?? 'Polonia',
            'status' => $settings['world_cup_match_status'] ?? 'countdown',
            'mexico_score' => (int) ($settings['world_cup_mexico_score'] ?? 0),
            'opponent_score' => (int) ($settings['world_cup_opponent_score'] ?? 0),
            'last_goal_time' => (int) ($settings['world_cup_last_goal_time'] ?? 0),
        ];
    }
}
