<?php
/**
 * Dictionary API Proxy
 * මෙය CORS issues විසඳන්න භාවිතා කරන PHP proxy එකක්
 * 
 * Installation:
 * 1. මෙම file එක ඔබේ website root folder එකේ save කරන්න
 * 2. File name එක හරියටම "dictionary-proxy.php" විය යුතුයි
 * 3. PHP 5.6+ server එකක් අවශ්‍යයි
 */

// CORS headers - සියලු domains වලින් access කරන්න allow කරනවා
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS request handle කරන්න (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Word parameter එක ගන්න
$word = isset($_GET['word']) ? $_GET['word'] : '';

// Validate word
if (empty($word)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Word parameter is required',
        'message' => 'Please provide a word to lookup',
        'usage' => 'dictionary-proxy.php?word=example'
    ]);
    exit;
}

// Sanitize word - අකුරු පමණක් allow කරන්න
$word = preg_replace('/[^a-zA-Z\-]/', '', $word);

if (empty($word)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid word format',
        'message' => 'Word should contain only letters'
    ]);
    exit;
}

// Dictionary API URL එක
$apiUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/" . urlencode(strtolower($word));

// Cache directory එකක් හදන්න (optional - performance වැඩි කරන්න)
$cacheDir = __DIR__ . '/cache';
$cacheFile = $cacheDir . '/' . md5($word) . '.json';
$cacheTime = 86400; // 24 hours

// Cache directory එක නැත්නම් හදන්න
if (!file_exists($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

// Cache එකේ තියෙනවා නම් return කරන්න
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTime)) {
    $cachedData = file_get_contents($cacheFile);
    header('X-Cache: HIT');
    echo $cachedData;
    exit;
}

// cURL භාවිතා කරලා API එකෙන් data ගන්න
if (function_exists('curl_init')) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Accept-Language: en-US,en;q=0.9'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    // Response එක process කරන්න
    if ($response === false) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to fetch data',
            'message' => $error,
            'word' => $word
        ]);
        exit;
    }
    
    if ($httpCode === 200) {
        // Success - cache එකේ save කරන්න
        header('X-Cache: MISS');
        @file_put_contents($cacheFile, $response);
        echo $response;
    } elseif ($httpCode === 404) {
        http_response_code(404);
        echo json_encode([
            'title' => 'No Definitions Found',
            'message' => "Sorry pal, we couldn't find definitions for the word \"$word\".",
            'resolution' => 'You can try the search again with a different spelling or try searching for another word.'
        ]);
    } else {
        http_response_code($httpCode);
        echo $response;
    }
    
} else {
    // cURL නැත්නම් file_get_contents භාවිතා කරන්න
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0\r\n" .
                       "Accept: application/json\r\n",
            'timeout' => 10
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    
    $response = @file_get_contents($apiUrl, false, $context);
    
    if ($response === false) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to fetch data',
            'message' => 'Unable to connect to dictionary API',
            'word' => $word
        ]);
        exit;
    }
    
    header('X-Cache: MISS');
    @file_put_contents($cacheFile, $response);
    echo $response;
}

// Optional: Cache cleaning function
// පරණ cache files delete කරන්න (30 දින වලට වඩා පරණ)
function cleanOldCache($dir, $maxAge = 2592000) {
    if (!is_dir($dir)) return;
    
    $files = glob($dir . '/*.json');
    $now = time();
    
    foreach ($files as $file) {
        if (is_file($file) && ($now - filemtime($file) > $maxAge)) {
            @unlink($file);
        }
    }
}

// 5% chance එකක් තියෙනවා cache clean කරන්න (automatic maintenance)
if (rand(1, 100) <= 5) {
    cleanOldCache($cacheDir);
}
?>
