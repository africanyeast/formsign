<?php
error_reporting(E_ALL);
require '../vendor/autoload.php';

// --- Helper Functions ---
function sanitizeInput($data) {
    return trim(htmlspecialchars($data, ENT_QUOTES, 'UTF-8'));
}

// Format date to "Friday, 13 June 2025" format
function formatDate($date, $includeDay = false) {
    if (empty($date)) {
        $timestamp = time();
    } else if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) { // YYYY-MM-DD format
        $timestamp = strtotime($date);
    } else {
        return $date; // Return as is if not in expected format
    }
    
    if ($includeDay) {
        return date('l, d F Y', $timestamp); // Friday, 13 June 2025
    } else {
        return date('d/m/Y', $timestamp); // 13/06/2025 format
    }
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
$userType = isset($_POST['userType']) ? sanitizeInput($_POST['userType']) : '';
$fullName = isset($_POST['fullName']) ? sanitizeInput($_POST['fullName']) : '';
$subject = isset($_POST['subject']) ? sanitizeInput($_POST['subject']) : '';
$place = isset($_POST['place']) ? sanitizeInput($_POST['place']) : '';
$age = isset($_POST['age']) ? sanitizeInput($_POST['age']) : '';
$reportNotes = isset($_POST['reportNotes']) ? $_POST['reportNotes'] : '';

$dob = isset($_POST['dob']) ? sanitizeInput($_POST['dob']) : ''; 
$reportType = isset($_POST['reportType']) ? sanitizeInput($_POST['reportType']) : ''; 

// --- Configuration ---
$logoPath = 'images/logo.png'; // Shell logo
$version = '4.51 (05/2025)';
$currentDate = formatDate(date('Y-m-d'), true);
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

    if ($staffSignatureB64) {
        $staffSigFile = decodeSignature($staffSignatureB64, 'staff_signature.png');
        if ($staffSigFile) $signatureFilesToUnlink[] = $staffSigFile;
    }

    if (!empty($witnessSignatureB64)) {
        $witnessSigFile = decodeSignature($witnessSignatureB64, 'witness_signature.png');
        if ($witnessSigFile) $signatureFilesToUnlink[] = $witnessSigFile;
    }
} elseif ($userType === 'customer') {
    $customerSignatureB64 = isset($_POST['customerSignature']) ? $_POST['customerSignature'] : null;
    $customerWitnessName = isset($_POST['customerWitnessName']) ? sanitizeInput($_POST['customerWitnessName']) : '';
    $customerWitnessPosition = isset($_POST['customerWitnessPosition']) ? sanitizeInput($_POST['customerWitnessPosition']) : '';
    $customerWitnessSignatureB64 = isset($_POST['customerWitnessSignature']) ? $_POST['customerWitnessSignature'] : null;

    if ($customerSignatureB64) {
        $customerSigFile = decodeSignature($customerSignatureB64, 'customer_signature.png');
        if ($customerSigFile) $signatureFilesToUnlink[] = $customerSigFile;
    }

    if (!empty($customerWitnessSignatureB64)) {
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
    if (!empty($trimmedLine)) {
        $formattedReportLines[] = ["number" => $lineNumber, "text" => $trimmedLine];
        $lineNumber++;
    }
}

// Define CSS styles for the PDF - mPDF COMPATIBLE VERSION
$styles = <<<EOD
<style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            color: #333;
            background-color: #f5f5f5;
        }
        /*
        .document {
            background-color: white;
            margin: 0 auto;
            padding: 20px;
        } */
        
        /* Header Table */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .header-table td {
            vertical-align: top;
            padding: 0;
        }
        
        .logo-cell {
            width: 75px;
            padding-right: 15px;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            display: block;
        }
        
        .company-name {
            padding: 5px 10px;
            font-weight: bold;
            font-size: 11px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .form-info {
            text-align: right;
            font-size: 10px;
            color: #666;
        }
        
        .document-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
            letter-spacing: 1px;
        }
        
        .separator {
            border-top: 3px solid #000;
            margin: 15px 0;
            height: 0;
        }
        
        /* Info Section Table */
        .info-table {
            width: 100%;
            border: 2px solid #666;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .info-table tr:last-child {
            border-bottom: none;
        }
        
        .info-label {
            padding: 5px 10px;
            font-weight: bold;
            width: 80px;
            vertical-align: middle;
        }
        
        .info-value {
            padding: 5px 10px;
            vertical-align: middle;
        }
        
        /* Name Section Table */
        .name-table {
            width: 100%;
            border: 2px solid #666;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .name-label {
            padding: 8px 10px;
            font-weight: bold;
            width: 80px;
            vertical-align: middle;
        }
        
        .name-value {
            padding: 8px 10px;
            vertical-align: middle;
        }
        
        .states-section {
            margin-bottom: 30px;
        }
        
        .states-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .statement-item {
            margin-bottom: 12px;
            line-height: 1.4;
        }
        
        .statement-number {
            font-weight: bold;
            margin-right: 8px;
        }
        
        .lorem-text {
            text-align: justify;
            line-height: 1.3;
        }
        
        /* Signature Section Table */
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 60px;
            margin-bottom: 30px;
        }
        
        .signature-table td {
            width: 50%;
            vertical-align: top;
            padding: 0 10px;
        }
        
        .signature-table td:first-child {
            padding-left: 0;
        }
        
        .signature-table td:last-child {
            padding-right: 0;
        }
        
        .signature-label {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            height: 20px;
            margin-bottom: 5px;
        }
        
        .signature-details {
            line-height: 1.3;
        }
        
        .page-number {
            text-align: right;
            font-size: 10px;
            color: #666;
            margin-top: 20px;
        }
    </style>
EOD;

// Create HTML content - mPDF COMPATIBLE STRUCTURE
$html = <<<EOD
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Statement of Customer</title>
    {$styles}
</head>
<body>
    <div class="document">
        <!-- Header Section - Fixed Layout -->
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    <img src="{$logoPath}" alt="Company Logo" class="logo">
                </td>
                <td class="company-cell">
                    <div class="company-name">COMPANY NAME GOES HERE</div>
                </td>
                <td class="form-cell">
                    <div class="form-info">
                        FORM19<br>
                        Version {$version}
                    </div>
                </td>
            </tr>
        </table>
        
        <!-- Content Area -->
        <div class="content-area">
            <!-- Document Title -->
            <div class="document-title">STATEMENT OF A CUSTOMER</div>
            
            <!-- Separator Line -->
            <div class="separator"></div>
            
            <!-- Info Section -->
            <table class="info-table">
                <tr>
                    <td class="info-label">Subject:</td>
                    <td class="info-value">{$subject}</td>
                </tr>
                <tr>
                    <td class="info-label">Place:</td>
                    <td class="info-value">{$place}</td>
                </tr>
                <tr>
                    <td class="info-label">Date:</td>
                    <td class="info-value">{$currentDate}</td>
                </tr>
            </table>
            
            <!-- Name Section -->
            <table class="name-table">
                <tr>
                    <td class="name-label">Name:</td>
                    <td class="name-value">{$fullName}</td>
                </tr>
            </table>
            
            <!-- States Section -->
            <div class="states-section">
                <div class="states-title">STATES:</div>
EOD;

// Add dynamic report content
foreach ($formattedReportLines as $line) {
    $html .= <<<EOD
                <div class="statement-item">
                    <span class="statement-number">{$line['number']}.</span>
                    <span class="statement-text">{$line['text']}</span>
                </div>
EOD;
}

$html .= <<<EOD
            </div>
        </div>
        
        <!-- Signature Section - Fixed to Bottom -->
        <div class="signature-section">
            <table class="signature-table">
                <tr>
                    <td>
                        <div class="signature-label">Witness:</div>
                        <div class="signature-line">
EOD;

// Add witness signature image if available
if ($userType === 'customer' && $customerWitnessSigFile && file_exists($customerWitnessSigFile)) {
    $html .= '<img src="' . $customerWitnessSigFile . '" class="signature-image" alt="Witness Signature">';
} elseif ($userType === 'staff' && $witnessSigFile && file_exists($witnessSigFile)) {
    $html .= '<img src="' . $witnessSigFile . '" class="signature-image" alt="Witness Signature">';
}

$witnessDisplayName = ($userType === 'customer') ? $customerWitnessName : $witnessName;
$witnessDisplayPosition = ($userType === 'customer') ? $customerWitnessPosition : $staffType;

$html .= <<<EOD
                        </div>
                        <div class="signature-details">
                            {$witnessDisplayName}<br>
                            {$witnessDisplayPosition}<br>
                            {$signingDate}
                        </div>
                    </td>
                    <td>
                        <div class="signature-label">Signature:</div>
                        <div class="signature-line">
EOD;

// Add customer/staff signature image if available
if ($userType === 'customer' && $customerSigFile && file_exists($customerSigFile)) {
    $html .= '<img src="' . $customerSigFile . '" class="signature-image" alt="Customer Signature">';
} elseif ($userType === 'staff' && $staffSigFile && file_exists($staffSigFile)) {
    $html .= '<img src="' . $staffSigFile . '" class="signature-image" alt="Staff Signature">';
}

$html .= <<<EOD
                        </div>
                        <div class="signature-details">
                            {$fullName}<br>
                            {$signingDate}
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Page Number - Fixed to Bottom -->
        <div class="page-number">Page {PAGENO} of {nbpg}</div>
    </div>
</body>
</html>
EOD;

// Initialize mPDF with optimal settings for template matching
try {
    // Configure mPDF for exact template rendering
    $mpdf = new \Mpdf\Mpdf([
        'mode' => 'utf-8',
        'format' => 'A4',
        'margin_left' => 15,
        'margin_right' => 15,
        'margin_top' => 15,
        'margin_bottom' => 15,
        'margin_header' => 0,
        'margin_footer' => 0,
        'default_font_size' => 12,
        'default_font' => 'Arial',
        'orientation' => 'P',
        // Enable better CSS support
        'tempDir' => sys_get_temp_dir(),
    ]);
    
    // Set document metadata
    $mpdf->SetTitle('Statement of Customer - ' . $fullName);
    $mpdf->SetAuthor('FORM19 System');
    $mpdf->SetCreator('FORM19 System');
    $mpdf->SetSubject('Customer Statement');
    
    // Improve rendering quality
    $mpdf->img_dpi = 300;
    $mpdf->pdf_version = '1.6';
    
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
    // If mPDF fails, log the error
    error_log('mPDF Error: ' . $e->getMessage());
    // Clean up temporary signature files even on error
    foreach ($signatureFilesToUnlink as $file) {
        if (file_exists($file)) {
            unlink($file);
        }
    }
    // For now, output the error
    die('Error creating PDF: ' . $e->getMessage());
}
?>