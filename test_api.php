<?php

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$url = 'https://boletea.com.mx/UpcomingEventPerformanceJSON.asp';
echo "Fetching from $url...\n";

try {
    $response = Http::withoutVerifying()->get($url);
    echo "Status: " . $response->status() . "\n";
    $body = $response->body();
    echo "Body length: " . strlen($body) . "\n";
    echo "Start: " . substr($body, 0, 50) . "\n";
    echo "End: " . substr($body, -50) . "\n";

    // encoding check
    $enc = mb_detect_encoding($body, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'ASCII'], true);
    echo "Detected Encoding: " . ($enc ?: 'False') . "\n";

    // Attempt 1: Direct decode
    $json = json_decode($body, true);
    if ($json !== null) {
        echo "Success: Direct decode.\n";
        if (isset($json[0]['Event'][0]['EventImage'])) {
            echo "Image URL: " . $json[0]['Event'][0]['EventImage'] . "\n";
        } else {
            echo "No image found in first item.\n";
        }
        exit;
    }
    echo "Direct decode failed: " . json_last_error_msg() . "\n";

    // Attempt 2: Strip BOM
    $bodyNoBom = preg_replace('/^\xEF\xBB\xBF/', '', $body);
    $json = json_decode($bodyNoBom, true);
    if ($json !== null) {
        echo "Success: Strip BOM.\n";
        exit;
    }

    // Attempt 3: Trim whitespace/BOM via trim
    $bodyTrim = trim($body, "\xEF\xBB\xBF \t\n\r\0\x0B");
    $json = json_decode($bodyTrim, true);
    if ($json !== null) {
        echo "Success: trim.\n";
        exit;
    }

    // Attempt 4: ISO-8859-1 to UTF-8
    $bodyUtf8 = mb_convert_encoding($body, 'UTF-8', 'ISO-8859-1');
    $json = json_decode($bodyUtf8, true);
    if ($json !== null) {
        echo "Success: ISO-8859-1 to UTF-8\n";
        exit;
    }

    // Attempt 5: Windows-1252 to UTF-8
    $bodyCp1252 = mb_convert_encoding($body, 'UTF-8', 'Windows-1252');
    $json = json_decode($bodyCp1252, true);
    if ($json !== null) {
        echo "Success: Windows-1252 to UTF-8\n";
        exit;
    }

    // Attempt 6: UTF-8 to UTF-8 (ignore errors)
    $bodyIgnore = mb_convert_encoding($body, 'UTF-8', 'UTF-8');
    $json = json_decode($bodyIgnore, true);
    if ($json !== null) {
        echo "Success: UTF-8 ignore errors\n";
        exit;
    }

    // Attempt 7: Remove trailing comma
    $body = trim($body);
    if (str_ends_with($body, ',]')) {
        $bodyComma = substr($body, 0, -2) . ']';
        $json = json_decode($bodyComma, true);
        if ($json !== null) {
            echo "Success: Trailing comma removed.\n";
            exit;
        }
    }
    // Regex for trailing comma in array
    $bodyRegex = preg_replace('/,\s*\]/', ']', $body);
    $json = json_decode($bodyRegex, true);
    if ($json !== null) {
        echo "Success: Trailing comma regex.\n";
        if (isset($json[0]['Event'][0]['EventImage'])) {
            echo "Image URL: " . $json[0]['Event'][0]['EventImage'] . "\n";
        }
        exit;
    }

    echo "All attempts failed.\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
