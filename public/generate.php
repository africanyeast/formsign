<?php
error_reporting(0); // Suppress notices to prevent interference with PDF output (temporary measure)
require '../vendor/autoload.php';

use setasign\Fpdi\Fpdi;

// --- Configuration ---
$logoPath = 'images/logo.png'; // Path to logo
$fontFamily = 'Arial';
$baseFontSize = 12;
$lineHeight = 7;

// --- Helper Functions ---
function sanitizeInput($data) {
    return trim($data); 
}

// Helper function to convert UTF-8 to ISO-8859-1 for FPDF
function toPdfEncoding($string) {
    return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $string);
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
$age = isset($_POST['age']) ? sanitizeInput($_POST['age']) : '';
$reportNotes = isset($_POST['reportNotes']) ? sanitizeInput($_POST['reportNotes']) : '';

if (!$userType || !$fullName || !$reportNotes) {
    die(toPdfEncoding("Missing required general information (User Type, Full Name, or Report Notes)."));
}

$pdf = new Fpdi('P', 'mm', 'A4'); // A4 Portrait
$pdf->AddPage();
$pdf->SetFont($fontFamily, '', $baseFontSize);
$pdf->SetMargins(20, 20, 20); // Left, Top, Right
$pdf->SetAutoPageBreak(true, 25); // Increased bottom margin for auto page break

// --- 1. Logo ---
if (file_exists($logoPath)) {
    $pageWidth = $pdf->GetPageWidth();
    $logoWidth = 50; // Desired logo width in mm
    $logoX = ($pageWidth - $logoWidth) / 2; // Center the logo
    $pdf->Image($logoPath, $logoX, 15, $logoWidth);
    $pdf->Ln(35); // Space after logo (adjust as needed)
} else {
    $pdf->Ln(15); // Space if no logo
}

// --- 2. Report Details ---
$pdf->SetFont($fontFamily, 'B', $baseFontSize + 2); 
$pdf->Cell(0, $lineHeight, toPdfEncoding('REPORT DETAILS'), 0, 1, 'C');
$pdf->Ln($lineHeight); 

$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(30, $lineHeight, toPdfEncoding('Full Name:'));
$pdf->SetFont($fontFamily, '', $baseFontSize);
$pdf->MultiCell(0, $lineHeight, toPdfEncoding($fullName));

if (!empty($age)) {
    $pdf->SetFont($fontFamily, 'B', $baseFontSize);
    $pdf->Cell(30, $lineHeight, toPdfEncoding('Age:'));
    $pdf->SetFont($fontFamily, '', $baseFontSize);
    $pdf->MultiCell(0, $lineHeight, toPdfEncoding($age));
}

$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(0, $lineHeight, toPdfEncoding('Report:'), 0, 1);
$pdf->SetFont($fontFamily, '', $baseFontSize);
$reportLines = explode("\n", $reportNotes);
$lineNumber = 1;
foreach ($reportLines as $line) {
    $trimmedLine = trim($line);
    if (!empty($trimmedLine)) { 
        $pdf->MultiCell(0, $lineHeight, toPdfEncoding($lineNumber . '. ' . $trimmedLine));
        $lineNumber++;
    }
}
$pdf->Ln($lineHeight * 1.5); 

// --- 3. Signatures ---
$signatureFilesToUnlink = [];
$leftMargin = $pdf->GetX();
$pageContentWidth = $pdf->GetPageWidth() - ($leftMargin * 2); // Usable width within margins

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

    $yPosBeforeSignatures = $pdf->GetY();
    $columnWidth = ($pageContentWidth / 2) - 5; // Width for each signature column, with a 10mm gap total
    $sigHeight = 30; // Max height for signature image
    $textBlockYOffset = $sigHeight + 2; // Y offset for text below signature
    $lineSpacingForNames = $lineHeight - 1;

    // Staff Signature (Left Column)
    $currentX = $leftMargin;
    if ($staffSigFile) {
        $pdf->Image($staffSigFile, $currentX, $yPosBeforeSignatures, $columnWidth, $sigHeight);
    }
    $pdf->SetXY($currentX, $yPosBeforeSignatures + $textBlockYOffset);
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 2);
    $pdf->MultiCell($columnWidth, $lineSpacingForNames, toPdfEncoding("Staff Signature"), 0, 'L');
    $pdf->SetX($currentX);
    $pdf->SetFont($fontFamily, '', $baseFontSize - 2);
    $pdf->MultiCell($columnWidth, $lineSpacingForNames, toPdfEncoding($fullName), 0, 'L');
    if ($staffType && $staffType !== 'Position') {
        $pdf->SetX($currentX);
        $pdf->MultiCell($columnWidth, $lineSpacingForNames, toPdfEncoding("(" . ucwords(str_replace('-', ' ', $staffType)) . ")"), 0, 'L');
    }

    // Witness Signature (Right Column)
    $currentX = $leftMargin + $columnWidth + 10; 
    if ($witnessSigFile && !empty($witnessName)) {
        $pdf->Image($witnessSigFile, $currentX, $yPosBeforeSignatures, $columnWidth, $sigHeight);
        $pdf->SetXY($currentX, $yPosBeforeSignatures + $textBlockYOffset);
        $pdf->SetFont($fontFamily, 'B', $baseFontSize - 2);
        $pdf->MultiCell($columnWidth, $lineSpacingForNames, toPdfEncoding("Witness Signature"), 0, 'L');
        $pdf->SetX($currentX);
        $pdf->SetFont($fontFamily, '', $baseFontSize - 2);
        $pdf->MultiCell($columnWidth, $lineSpacingForNames, toPdfEncoding($witnessName), 0, 'L');
    } elseif (empty($witnessName) && !empty($witnessSignatureB64)) {
        $pdf->SetXY($currentX, $yPosBeforeSignatures + $textBlockYOffset);
        $pdf->SetFont($fontFamily, '', $baseFontSize - 2);
        $pdf->MultiCell($columnWidth, $lineSpacingForNames, toPdfEncoding("Witness signature provided without name."), 0, 'L');
    }
    $pdf->Ln($sigHeight + $lineHeight * 3); // Ensure enough space after the signature block

} elseif ($userType === 'customer') {
    $customerSignatureB64 = isset($_POST['customerSignature']) ? $_POST['customerSignature'] : null;
    if (!$customerSignatureB64) {
        die(toPdfEncoding("Missing Customer Signature."));
    }
    $customerSigFile = decodeSignature($customerSignatureB64, 'customer_signature.png');
    if ($customerSigFile) $signatureFilesToUnlink[] = $customerSigFile;

    $yPosBeforeSignature = $pdf->GetY();
    $sigWidth = $pageContentWidth * 0.6; // Signature width relative to content width
    $sigHeight = 35; // Height for customer signature
    // $sigX = $leftMargin + ($pageContentWidth - $sigWidth) / 2; // Center the signature block
    $sigX = $leftMargin; // Align signature block to the left margin

    if ($customerSigFile) {
        $pdf->Image($customerSigFile, $sigX, $yPosBeforeSignature, $sigWidth, $sigHeight);
    }
    $pdf->SetY($yPosBeforeSignature + $sigHeight + 2); // Move below signature
    $pdf->SetX($sigX); // Set X position to the start of the signature for the labels
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 2);
    // Use Cell with width for left alignment, not 0 for full width centered
    $pdf->Cell($sigWidth, $lineHeight - 2, toPdfEncoding("Customer Signature"), 0, 1, 'L'); 
    $pdf->SetX($sigX);
    $pdf->SetFont($fontFamily, '', $baseFontSize - 2);
    $pdf->Cell($sigWidth, $lineHeight - 2, toPdfEncoding($fullName), 0, 1, 'L'); 
    $pdf->Ln($lineHeight * 2); 
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
