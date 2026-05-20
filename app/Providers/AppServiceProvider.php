<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        \Carbon\Carbon::setLocale('es');

        \Laravel\Sanctum\Sanctum::getAccessTokenFromRequestUsing(function (\Illuminate\Http\Request $request) {
            // 1. Try regular bearer token
            $token = $request->bearerToken();
            if ($token) {
                return $token;
            }

            // 2. Try 'X-Authorization' header
            $xAuth = $request->header('X-Authorization');
            if ($xAuth && str_starts_with($xAuth, 'Bearer ')) {
                return substr($xAuth, 7);
            }

            // 3. Try checking raw headers from PHP if getallheaders is available
            if (function_exists('getallheaders')) {
                $headers = getallheaders();
                foreach ($headers as $name => $value) {
                    if (strtolower($name) === 'authorization' && str_starts_with($value, 'Bearer ')) {
                        return substr($value, 7);
                    }
                }
            }

            // 4. Try query parameter 'token'
            if ($token = $request->query('token')) {
                return $token;
            }

            // 5. Try request input 'token'
            if ($token = $request->input('token')) {
                return $token;
            }

            return null;
        });
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
