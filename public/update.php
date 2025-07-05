<?php
// Set error reporting to suppress warnings and notices
error_reporting(E_ERROR);
ini_set('display_errors', 0);

// Set response headers
header('Content-Type: application/json');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Only POST allowed']);
    exit;
}

// Get raw POST data
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$csvFile = 'data.csv';

// Check if file exists to write header
$fileExists = file_exists($csvFile);
$fp = fopen($csvFile, 'a');

if (!$fileExists) {
    // Write headers with escape parameter
    fputcsv($fp, array_keys($data), ',', '"', '\\', "\r\n");
}

// Write data with escape parameter
fputcsv($fp, array_values($data), ',', '"', '\\', "\r\n");
fclose($fp);

echo json_encode(['success' => true, 'message' => 'Data saved to CSV']);
?>
