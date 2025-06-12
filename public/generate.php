<?php
error_reporting(0); // Suppress notices to prevent interference with PDF output (temporary measure)
require '../vendor/autoload.php';

use setasign\Fpdi\Fpdi;

// --- Configuration ---
$logoPath = 'images/logo.png'; // Path to logo
$fontFamily = 'Arial';
$baseFontSize = 11;
$lineHeight = 4;
$version = '4.5 01.06.2025'; // Version information

// --- Helper Functions ---
function sanitizeInput($data) {
    return trim($data); 
}

// Helper function to convert UTF-8 to ISO-8859-1 for FPDF
function toPdfEncoding($string) {
    return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $string);
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
    die(toPdfEncoding("Missing required information (User Type, Full Name, Subject, Place, or Report Notes)."));
}

$pdf = new Fpdi('P', 'mm', 'A4'); // A4 Portrait
$pdf->AddPage();
$pdf->SetFont($fontFamily, '', $baseFontSize);
$pdf->SetMargins(20, 20, 20); // Left, Top, Right
$pdf->SetAutoPageBreak(true, 25); // Increased bottom margin for auto page break

// --- Header Section ---
// Logo (Top Left)
if (file_exists($logoPath)) {
    $pdf->Image($logoPath, 20, 15, 30); // Left aligned, smaller size
}

// Sales Team Form (Top Center)
$pdf->SetXY(70, 15);
$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(60, 10, toPdfEncoding('SALES TEAM FORM'), 0, 0, 'C');

// Form19 and Version (Top Right)
$pdf->SetXY(140, 15);
$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(50, 5, toPdfEncoding('FORM19'), 0, 1, 'R');
$pdf->SetXY(140, 20);
$pdf->SetFont($fontFamily, '', $baseFontSize - 2);
$pdf->Cell(50, 5, toPdfEncoding('Version ' . $version), 0, 1, 'R');

// Title - Statement of Customer/Staff
$pdf->SetY(40);
$pdf->SetFont($fontFamily, 'B', $baseFontSize + 2);
$statementTitle = ($userType === 'customer') ? 'STATEMENT OF A CUSTOMER' : 'STATEMENT OF A STAFF';
$pdf->Cell(0, 10, toPdfEncoding($statementTitle), 0, 1, 'C');
$pdf->Line(20, 50, 190, 50); // Horizontal line under title

// --- Form Fields ---
$pdf->SetY(55);
$pdf->SetFont($fontFamily, 'B', $baseFontSize);

// Subject
$pdf->Cell(30, $lineHeight, toPdfEncoding('Subject:'));
$pdf->SetFont($fontFamily, '', $baseFontSize);
$pdf->Cell(0, $lineHeight, toPdfEncoding($subject), 0, 1);
$pdf->Ln(2);

// Place
$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(30, $lineHeight, toPdfEncoding('Place:'));
$pdf->SetFont($fontFamily, '', $baseFontSize);
$pdf->Cell(0, $lineHeight, toPdfEncoding($place), 0, 1);
$pdf->Ln(2);

// Date
$currentDate = formatDate(date('Y-m-d'));
$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(30, $lineHeight, toPdfEncoding('Date:'));
$pdf->SetFont($fontFamily, '', $baseFontSize);
$pdf->Cell(0, $lineHeight, toPdfEncoding($currentDate), 0, 1);
$pdf->Ln(5);

// Name
$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(30, $lineHeight, toPdfEncoding('Name:'));
$pdf->SetFont($fontFamily, '', $baseFontSize);
$pdf->Cell(0, $lineHeight, toPdfEncoding($fullName), 0, 1);
$pdf->Ln(5);

// STATES: section
$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(0, $lineHeight, toPdfEncoding('STATES:'), 0, 1);
$pdf->Ln(2);

// Report content with numbered lines
$pdf->SetFont($fontFamily, '', $baseFontSize);
$reportLines = explode("\n", $reportNotes);
$lineNumber = 1;
foreach ($reportLines as $line) {
    $trimmedLine = trim($line);
    if (!empty($trimmedLine)) { 
        $pdf->Cell(10, $lineHeight, toPdfEncoding($lineNumber . '.'));
        $pdf->MultiCell(0, $lineHeight, toPdfEncoding($trimmedLine));
        $pdf->Ln(2);
        $lineNumber++;
    }
}

// Add page number at bottom center
// $pdf->SetY(-15);
// $pdf->SetFont($fontFamily, 'I', $baseFontSize - 2);
// $pdf->Cell(0, 10, toPdfEncoding('Page 1 of 1'), 0, 0, 'C');

// --- Signatures ---
$signatureFilesToUnlink = [];
$leftMargin = 20;
$pageContentWidth = $pdf->GetPageWidth() - ($leftMargin * 2); // Usable width within margins
$signingDate = formatDate(date('Y-m-d')); // Get current date for signing in proper format

// Simple approach: just add a small fixed space after content
$pdf->Ln(5); // Adjusted from 3mm to 5mm (original was 8mm)
$yPosBeforeSignatures = $pdf->GetY();

// Remove all the complex page break logic - let natural flow handle it
$columnWidth = ($pageContentWidth / 2) - 5; // Width for each signature column, with a 10mm gap total
$sigHeight = 15; // Reduced from 25mm to 15mm max height for signature image

if ($userType === 'staff') {
    $staffType = isset($_POST['staffType']) ? sanitizeInput($_POST['staffType']) : '';
    $witnessName = isset($_POST['witnessName']) ? sanitizeInput($_POST['witnessName']) : '';
    $staffSignatureB64 = isset($_POST['staffSignature']) ? $_POST['staffSignature'] : null;
    $witnessSignatureB64 = isset($_POST['witnessSignature']) ? $_POST['witnessSignature'] : null;

    if (!$staffSignatureB64) {
        die(toPdfEncoding("Missing Staff Signature."));
    }

    $staffSigFile = decodeSignature($staffSignatureB64, 'staff_signature.png');
    if ($staffSigFile) $signatureFilesToUnlink[] = $staffSigFile;

    $witnessSigFile = null;
    if (!empty($witnessSignatureB64) && !empty($witnessName)) {
        $witnessSigFile = decodeSignature($witnessSignatureB64, 'witness_signature.png');
        if ($witnessSigFile) $signatureFilesToUnlink[] = $witnessSigFile;
    }

    // Witness (Left Column)
    $currentX = $leftMargin;
    $pdf->SetXY($currentX, $yPosBeforeSignatures);
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 5, toPdfEncoding("Witness:"), 0, 1);
    
    if ($witnessSigFile && !empty($witnessName)) {
        $pdf->Image($witnessSigFile, $currentX, $yPosBeforeSignatures + 5, $columnWidth / 2, $sigHeight);
    }
    
    $pdf->SetXY($currentX, $yPosBeforeSignatures + $sigHeight + 5);
    $pdf->SetFont($fontFamily, '', $baseFontSize - 1);
    if (!empty($witnessName)) {
        $pdf->Cell($columnWidth, 5, toPdfEncoding($witnessName), 0, 1);
        $pdf->SetX($currentX);
        if ($staffType) {
            $pdf->Cell($columnWidth, 5, toPdfEncoding(ucfirst($staffType)), 0, 1);
        }
        $pdf->SetX($currentX);
        $pdf->Cell($columnWidth, 5, toPdfEncoding($signingDate), 0, 1);
    }

    // Signature (Right Column)
    $currentX = $leftMargin + $columnWidth + 10;
    $pdf->SetXY($currentX, $yPosBeforeSignatures);
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 5, toPdfEncoding("Signature:"), 0, 1);
    
    if ($staffSigFile) {
        $pdf->Image($staffSigFile, $currentX, $yPosBeforeSignatures + 5, $columnWidth / 2, $sigHeight);
    }
    
    $pdf->SetXY($currentX, $yPosBeforeSignatures + $sigHeight + 2); // Reduced from +5 to +2
    $pdf->SetFont($fontFamily, '', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 4, toPdfEncoding($fullName), 0, 1); // Reduced height from 5 to 4
    $pdf->SetX($currentX);
    if ($staffType) {
        $pdf->Cell($columnWidth, 4, toPdfEncoding(ucfirst($staffType)), 0, 1); // Reduced height from 5 to 4
    }
    $pdf->SetX($currentX);
    $pdf->Cell($columnWidth, 4, toPdfEncoding($signingDate), 0, 1); // Reduced height from 5 to 4

} elseif ($userType === 'customer') {
    $customerSignatureB64 = isset($_POST['customerSignature']) ? $_POST['customerSignature'] : null;
    $customerWitnessName = isset($_POST['customerWitnessName']) ? sanitizeInput($_POST['customerWitnessName']) : '';
    $customerWitnessPosition = isset($_POST['customerWitnessPosition']) ? sanitizeInput($_POST['customerWitnessPosition']) : '';
    $customerWitnessSignatureB64 = isset($_POST['customerWitnessSignature']) ? $_POST['customerWitnessSignature'] : null;

    if (!$customerSignatureB64) {
        die(toPdfEncoding("Missing Customer Signature."));
    }
    $customerSigFile = decodeSignature($customerSignatureB64, 'customer_signature.png');
    if ($customerSigFile) $signatureFilesToUnlink[] = $customerSigFile;

    $customerWitnessSigFile = null;
    if (!empty($customerWitnessSignatureB64) && !empty($customerWitnessName)) {
        $customerWitnessSigFile = decodeSignature($customerWitnessSignatureB64, 'customer_witness_signature.png');
        if ($customerWitnessSigFile) $signatureFilesToUnlink[] = $customerWitnessSigFile;
    }

    // Witness (Left Column)
    $currentX = $leftMargin;
    $pdf->SetXY($currentX, $yPosBeforeSignatures);
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 5, toPdfEncoding("Witness:"), 0, 1);
    
    if ($customerWitnessSigFile && !empty($customerWitnessName)) {
        $pdf->Image($customerWitnessSigFile, $currentX, $yPosBeforeSignatures + 5, $columnWidth / 2, $sigHeight);
    }
    
    $pdf->SetXY($currentX, $yPosBeforeSignatures + $sigHeight + 5);
    $pdf->SetFont($fontFamily, '', $baseFontSize - 1);
    if (!empty($customerWitnessName)) {
        $pdf->Cell($columnWidth, 5, toPdfEncoding($customerWitnessName), 0, 1);
        $pdf->SetX($currentX);
        if ($customerWitnessPosition) {
            $pdf->Cell($columnWidth, 5, toPdfEncoding(ucfirst($customerWitnessPosition)), 0, 1);
        }
        $pdf->SetX($currentX);
        $pdf->Cell($columnWidth, 5, toPdfEncoding($signingDate), 0, 1);
    }

    // Signature (Right Column)
    $currentX = $leftMargin + $columnWidth + 10;
    $pdf->SetXY($currentX, $yPosBeforeSignatures);
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 5, toPdfEncoding("Signature:"), 0, 1);
    
    if ($customerSigFile) {
        $pdf->Image($customerSigFile, $currentX, $yPosBeforeSignatures + 5, $columnWidth / 2, $sigHeight);
    }
    
    $pdf->SetXY($currentX, $yPosBeforeSignatures + $sigHeight + 5);
    $pdf->SetFont($fontFamily, '', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 5, toPdfEncoding($fullName), 0, 1);
    $pdf->SetX($currentX);
    $pdf->Cell($columnWidth, 5, toPdfEncoding($signingDate), 0, 1);
}

// --- Cleanup temporary signature files ---
foreach ($signatureFilesToUnlink as $file) {
    if (file_exists($file)) {
        unlink($file);
    }
}

// --- Output PDF ---
$pdf->Output('I', toPdfEncoding('report_'. strtolower(str_replace(' ', '_', $fullName))) . '_' . date('Ymd') . '.pdf');
?>
