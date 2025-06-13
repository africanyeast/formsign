<?php
error_reporting(E_ALL);
require '../vendor/autoload.php';

// --- Helper Functions ---
function sanitizeInput($data) {
    return trim(htmlspecialchars($data, ENT_QUOTES, 'UTF-8'));
}

// Format date to "12 June 2025" format
function formatDate($date) {
    if (empty($date)) {
        return date('d F Y'); // Current date if empty
    }
    
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) { // YYYY-MM-DD format
        return date('d F Y', strtotime($date));
    }
    
    return $date; // Return as is if not in expected format
}

function decodeSignature($base64Signature, $fileName) {
    if (empty($base64Signature)) return null;
    $base64String = str_replace(['data:image/png;base64,', ' '], ['', '+'], $base64Signature);
    $decoded = base64_decode($base64String);
    if ($decoded === false) {
        error_log("Failed to decode signature: " . $fileName);
        return null;
    }
    if (file_put_contents($fileName, $decoded) === false) {
        error_log("Failed to write signature file: " . $fileName);
        return null;
    }
    return $fileName;
}

// --- Data Validation and Retrieval ---
$userType = isset($_POST['userType']) ? sanitizeInput($_POST['userType']) : null;
$fullName = isset($_POST['fullName']) ? sanitizeInput($_POST['fullName']) : '';
$subject = isset($_POST['subject']) ? sanitizeInput($_POST['subject']) : '';
$place = isset($_POST['place']) ? sanitizeInput($_POST['place']) : '';
$age = isset($_POST['age']) ? sanitizeInput($_POST['age']) : '';
$reportNotes = isset($_POST['reportNotes']) ? sanitizeInput($_POST['reportNotes']) : '';
$dob = isset($_POST['dob']) ? sanitizeInput($_POST['dob']) : ''; // Get DOB for age calculation if needed for PDF
$reportType = isset($_POST['reportType']) ? sanitizeInput($_POST['reportType']) : ''; // Get report type

if (!$userType || !$fullName || !$reportNotes || !$subject || !$place) {
    die("Missing required information (User Type, Full Name, Subject, Place, or Report Notes).");
}

// --- Configuration ---
$logoPath = 'images/logo.png'; // Path to logo
$version = '4.5 01.06.2025'; // Version information
$currentDate = formatDate(date('Y-m-d'));
$signingDate = formatDate(date('Y-m-d'));

// Process signatures based on user type
$signatureFilesToUnlink = [];
$staffSigFile = null;
$witnessSigFile = null;
$customerSigFile = null;
$customerWitnessSigFile = null;
$witnessName = '';
$staffType = '';
$customerWitnessName = '';
$customerWitnessPosition = '';

if ($userType === 'staff') {
    $staffType = isset($_POST['staffType']) ? sanitizeInput($_POST['staffType']) : '';
    $witnessName = isset($_POST['witnessName']) ? sanitizeInput($_POST['witnessName']) : '';
    $staffSignatureB64 = isset($_POST['staffSignature']) ? $_POST['staffSignature'] : null;
    $witnessSignatureB64 = isset($_POST['witnessSignature']) ? $_POST['witnessSignature'] : null;

    if (!$staffSignatureB64) {
        die("Missing Staff Signature.");
    }

    $staffSigFile = decodeSignature($staffSignatureB64, 'staff_signature.png');
    if ($staffSigFile) $signatureFilesToUnlink[] = $staffSigFile;

    if (!empty($witnessSignatureB64) && !empty($witnessName)) {
        $witnessSigFile = decodeSignature($witnessSignatureB64, 'witness_signature.png');
        if ($witnessSigFile) $signatureFilesToUnlink[] = $witnessSigFile;
    }
} elseif ($userType === 'customer') {
    $customerSignatureB64 = isset($_POST['customerSignature']) ? $_POST['customerSignature'] : null;
    $customerWitnessName = isset($_POST['customerWitnessName']) ? sanitizeInput($_POST['customerWitnessName']) : '';
    $customerWitnessPosition = isset($_POST['customerWitnessPosition']) ? sanitizeInput($_POST['customerWitnessPosition']) : '';
    $customerWitnessSignatureB64 = isset($_POST['customerWitnessSignature']) ? $_POST['customerWitnessSignature'] : null;

    if (!$customerSignatureB64) {
        die("Missing Customer Signature.");
    }
    $customerSigFile = decodeSignature($customerSignatureB64, 'customer_signature.png');
    if ($customerSigFile) $signatureFilesToUnlink[] = $customerSigFile;

    if (!empty($customerWitnessSignatureB64) && !empty($customerWitnessName)) {
        $customerWitnessSigFile = decodeSignature($customerWitnessSignatureB64, 'customer_witness_signature.png');
        if ($customerWitnessSigFile) $signatureFilesToUnlink[] = $customerWitnessSigFile;
    }
}

// Prepare report content with numbered lines
$reportLines = explode("\n", $reportNotes);
$formattedReportLines = [];
$lineNumber = 1;

foreach ($reportLines as $line) {
    $trimmedLine = trim($line);
    if (!empty($trimmedLine) || $userType === 'staff') { // Always process lines for staff reports
        $formattedReportLines[] = "<div class='report-line'><span class='line-number'>{$lineNumber}.</span> {$trimmedLine}</div>";
        $lineNumber++;
    }
}

// Create HTML content for the PDF
$statementTitle = ($userType === 'customer') ? 'STATEMENT OF A CUSTOMER' : 'STATEMENT OF A STAFF';

// Define CSS styles for the PDF
$styles = <<<EOD
<style>
    body {
        font-family: Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.4;
        margin: 0;
        padding: 0;
    }
    .header {
        position: relative;
        height: 80px;
        width: 100%;
        margin-bottom: 20px;
    }
    .logo {
        position: absolute;
        top: 15px;
        left: 20px;
        height: 30px;
    }
    .form-title {
        position: absolute;
        top: 15px;
        left: 0;
        width: 100%;
        text-align: center;
        font-weight: bold;
        font-size: 11pt;
    }
    .form-info {
        position: absolute;
        top: 15px;
        right: 20px;
        text-align: right;
        font-size: 11pt;
    }
    .form-version {
        font-size: 9pt;
    }
    .statement-title {
        text-align: center;
        font-weight: bold;
        font-size: 13pt;
        margin: 20px 0 10px 0;
    }
    .divider {
        border-bottom: 3px solid #000;
        margin: 5px 0 20px 0;
    }
    .info-box {
        border: 1px solid #000;
        padding: 10px;
        margin-bottom: 10px;
    }
    .info-row {
        margin-bottom: 5px;
    }
    .info-label {
        font-weight: bold;
        display: inline-block;
        width: 80px;
    }
    .states-section {
        margin: 20px 0;
    }
    .states-title {
        font-weight: bold;
        margin-bottom: 10px;
    }
    .report-line {
        margin-bottom: 5px;
    }
    .line-number {
        display: inline-block;
        width: 20px;
    }
    .signatures {
        position: fixed;
        bottom: 70px;
        width: 100%;
        display: flex;
        justify-content: space-between;
    }
    .signature-column {
        width: 50%;
    }
    .signature-title {
        font-weight: bold;
        font-size: 10pt;
        margin-bottom: 5px;
    }
    .signature-image {
        height: 50px;
        margin-bottom: 5px;
    }
    .signature-info {
        font-size: 10pt;
        line-height: 1.3;
    }
    .footer {
        position: fixed;
        bottom: 10px;
        width: 100%;
        text-align: right;
        font-style: italic;
        font-size: 9pt;
    }
</style>
EOD;

// Create HTML content
$html = <<<EOD
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Report</title>
    {$styles}
</head>
<body>
    <div class="header">
        <img src="{$logoPath}" class="logo" alt="Logo">
        <div class="form-title">SALES TEAM FORM</div>
        <div class="form-info">
            <div>FORM19</div>
            <div class="form-version">Version {$version}</div>
        </div>
    </div>
    
    <div class="statement-title">{$statementTitle}</div>
    <div class="divider"></div>
    
    <div class="info-box">
        <div class="info-row">
            <span class="info-label">Subject:</span> {$subject}
        </div>
        <div class="info-row">
            <span class="info-label">Place:</span> {$place}
        </div>
        <div class="info-row">
            <span class="info-label">Date:</span> {$currentDate}
        </div>
    </div>
    
    <div class="info-box">
        <div class="info-row">
            <span class="info-label">Name:</span> {$fullName}
        </div>
EOD;

// Add age or DOB based on user type
if ($userType === 'customer' && !empty($age)) {
    $html .= <<<EOD
        <div class="info-row">
            <span class="info-label">Age:</span> {$age}
        </div>
EOD;
} elseif ($userType === 'customer' && !empty($dob)) {
    $formattedDob = formatDate($dob);
    $html .= <<<EOD
        <div class="info-row">
            <span class="info-label">DOB:</span> {$formattedDob}
        </div>
EOD;
} elseif ($userType === 'staff' && !empty($staffType)) {
    $html .= <<<EOD
        <div class="info-row">
            <span class="info-label">Position:</span> {$staffType}
        </div>
EOD;
}

// Add report type for customer
if ($userType === 'customer' && !empty($reportType)) {
    $html .= <<<EOD
        <div class="info-row">
            <span class="info-label">Type:</span> {$reportType}
        </div>
EOD;
}

$html .= <<<EOD
    </div>
    
    <div class="states-section">
        <div class="states-title">STATES:</div>
        <div class="report-content">
EOD;

// Add report content
foreach ($formattedReportLines as $line) {
    $html .= $line;
}

$html .= <<<EOD
        </div>
    </div>
    
    <div class="signatures">
EOD;

// Add signatures based on user type
if ($userType === 'staff') {
    $html .= <<<EOD
        <div class="signature-column">
            <div class="signature-title">STAFF SIGNATURE:</div>
EOD;
    
    if ($staffSigFile) {
        $html .= <<<EOD
            <img src="{$staffSigFile}" class="signature-image" alt="Staff Signature">
EOD;
    }
    
    $html .= <<<EOD
            <div class="signature-info">
                <div>{$fullName}</div>
                <div>{$staffType}</div>
                <div>Date: {$signingDate}</div>
            </div>
        </div>
EOD;
    
    if ($witnessSigFile && !empty($witnessName)) {
        $html .= <<<EOD
        <div class="signature-column">
            <div class="signature-title">WITNESS SIGNATURE:</div>
            <img src="{$witnessSigFile}" class="signature-image" alt="Witness Signature">
            <div class="signature-info">
                <div>{$witnessName}</div>
                <div>Date: {$signingDate}</div>
            </div>
        </div>
EOD;
    } else {
        $html .= '<div class="signature-column"></div>';
    }
} elseif ($userType === 'customer') {
    // For customer, put witness on left and signature on right
    if ($customerWitnessSigFile && !empty($customerWitnessName)) {
        $html .= <<<EOD
        <div class="signature-column">
            <div class="signature-title">WITNESS:</div>
            <img src="{$customerWitnessSigFile}" class="signature-image" alt="Customer Witness Signature">
            <div class="signature-info">
                <div>{$customerWitnessName}</div>
                <div>{$customerWitnessPosition}</div>
                <div>Date: {$signingDate}</div>
            </div>
        </div>
EOD;
    } else {
        $html .= '<div class="signature-column"></div>';
    }
    
    $html .= <<<EOD
        <div class="signature-column">
            <div class="signature-title">SIGNATURE:</div>
EOD;
    
    if ($customerSigFile) {
        $html .= <<<EOD
            <img src="{$customerSigFile}" class="signature-image" alt="Customer Signature">
EOD;
    }
    
    $html .= <<<EOD
            <div class="signature-info">
                <div>{$fullName}</div>
                <div>Date: {$signingDate}</div>
            </div>
        </div>
EOD;
}

$html .= <<<EOD
    </div>
    
    <div class="footer">
        Page {PAGENO} of {nbpg}
    </div>
</body>
</html>
EOD;

// Initialize mPDF
try {
    // Configure mPDF
    $mpdf = new \Mpdf\Mpdf([
        'mode' => 'utf-8',
        'format' => 'A4',
        'margin_left' => 15,
        'margin_right' => 15,
        'margin_top' => 15,
        'margin_bottom' => 15,
        'margin_header' => 0,
        'margin_footer' => 0,
    ]);
    
    // Enable page numbers
    //$mpdf->SetFooter('{PAGENO} of {nbpg}');
    
    // Set document metadata
    $mpdf->SetTitle('Statement - ' . $fullName);
    $mpdf->SetAuthor('FORM19 System');
    $mpdf->SetCreator('FORM19 System');
    
    // Write HTML to PDF
    $mpdf->WriteHTML($html);
    
    // Output PDF
    $filename = 'Statement_' . str_replace(' ', '_', $fullName) . '_' . date('Ymd_His') . '.pdf';
    $mpdf->Output($filename, 'D'); // 'D' forces download
    // Clean up temporary signature files
    foreach ($signatureFilesToUnlink as $file) {
        if (file_exists($file)) {
            unlink($file);
        }
    }
} catch (\Mpdf\MpdfException $e) {
    die('Error creating PDF: ' . $e->getMessage());
}