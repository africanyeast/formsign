<?php
require '../vendor/autoload.php';

use setasign\Fpdi\Fpdi;

// --- Configuration ---
$logoPath = 'images/logo.png'; // Path to logo
$fontFamily = 'Arial';
$baseFontSize = 12;
$lineHeight = 7;

// --- Helper Functions ---
function sanitizeInput($data) {
    // Use ENT_COMPAT to only encode double quotes, leave single quotes alone.
    return htmlspecialchars(trim($data), ENT_COMPAT, 'UTF-8');
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
    die("Missing required general information (User Type, Full Name, or Report Notes).");
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
$pdf->SetFont($fontFamily, 'B', $baseFontSize + 2); // Slightly larger title
$pdf->Cell(0, $lineHeight, 'REPORT DETAILS', 0, 1, 'C');
$pdf->Ln($lineHeight); // Increased space after title

$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(30, $lineHeight, 'Full Name:');
$pdf->SetFont($fontFamily, '', $baseFontSize);
$pdf->MultiCell(0, $lineHeight, $fullName);
// $pdf->Ln($lineHeight / 2); // Removed redundant Ln, MultiCell adds one

if (!empty($age)) {
    $pdf->SetFont($fontFamily, 'B', $baseFontSize);
    $pdf->Cell(30, $lineHeight, 'Age:');
    $pdf->SetFont($fontFamily, '', $baseFontSize);
    $pdf->MultiCell(0, $lineHeight, $age);
    // $pdf->Ln($lineHeight / 2); // Removed redundant Ln
}

$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(0, $lineHeight, 'Report:', 0, 1);
$pdf->SetFont($fontFamily, '', $baseFontSize);
$reportLines = explode("\n", $reportNotes);
$lineNumber = 1;
foreach ($reportLines as $line) {
    $trimmedLine = trim($line);
    if (!empty($trimmedLine)) { // Avoid printing empty lines with numbers
        $pdf->MultiCell(0, $lineHeight, $lineNumber . '. ' . $trimmedLine);
        $lineNumber++;
    }
}
$pdf->Ln($lineHeight * 1.5); // Increased space before signatures

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
        die("Missing Staff Signature.");
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
    $pdf->MultiCell($columnWidth, $lineSpacingForNames, "Staff Signature", 0, 'L');
    $pdf->SetX($currentX);
    $pdf->SetFont($fontFamily, '', $baseFontSize - 2);
    $pdf->MultiCell($columnWidth, $lineSpacingForNames, $fullName, 0, 'L');
    if ($staffType && $staffType !== 'Position') {
        $pdf->SetX($currentX);
        $pdf->MultiCell($columnWidth, $lineSpacingForNames, "(" . ucwords(str_replace('-', ' ', $staffType)) . ")", 0, 'L');
    }

    // Witness Signature (Right Column)
    $currentX = $leftMargin + $columnWidth + 10; // Position for the right column (10mm gap)
    if ($witnessSigFile && !empty($witnessName)) {
        $pdf->Image($witnessSigFile, $currentX, $yPosBeforeSignatures, $columnWidth, $sigHeight);
        $pdf->SetXY($currentX, $yPosBeforeSignatures + $textBlockYOffset);
        $pdf->SetFont($fontFamily, 'B', $baseFontSize - 2);
        $pdf->MultiCell($columnWidth, $lineSpacingForNames, "Witness Signature", 0, 'L');
        $pdf->SetX($currentX);
        $pdf->SetFont($fontFamily, '', $baseFontSize - 2);
        $pdf->MultiCell($columnWidth, $lineSpacingForNames, $witnessName, 0, 'L');
    } elseif (empty($witnessName) && !empty($witnessSignatureB64)) {
        $pdf->SetXY($currentX, $yPosBeforeSignatures + $textBlockYOffset);
        $pdf->SetFont($fontFamily, '', $baseFontSize - 2);
        $pdf->MultiCell($columnWidth, $lineSpacingForNames, "Witness signature provided without name.", 0, 'L');
    }
    $pdf->Ln($sigHeight + $lineHeight * 3); // Ensure enough space after the signature block

} elseif ($userType === 'customer') {
    $customerSignatureB64 = isset($_POST['customerSignature']) ? $_POST['customerSignature'] : null;
    if (!$customerSignatureB64) {
        die("Missing Customer Signature.");
    }
    $customerSigFile = decodeSignature($customerSignatureB64, 'customer_signature.png');
    if ($customerSigFile) $signatureFilesToUnlink[] = $customerSigFile;

    $yPosBeforeSignature = $pdf->GetY();
    $sigWidth = $pageContentWidth * 0.6; // Signature width relative to content width
    $sigHeight = 35; // Height for customer signature
    $sigX = $leftMargin + ($pageContentWidth - $sigWidth) / 2; // Center the signature block

    if ($customerSigFile) {
        $pdf->Image($customerSigFile, $sigX, $yPosBeforeSignature, $sigWidth, $sigHeight);
    }
    $pdf->SetY($yPosBeforeSignature + $sigHeight + 2); // Move below signature
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 2);
    $pdf->Cell(0, $lineHeight - 2, "Customer Signature", 0, 1, 'C'); // Centered label
    $pdf->SetFont($fontFamily, '', $baseFontSize - 2);
    $pdf->Cell(0, $lineHeight - 2, $fullName, 0, 1, 'C'); // Centered name
    $pdf->Ln($lineHeight * 2); // Space after customer signature block
}

// --- Cleanup temporary signature files ---
foreach ($signatureFilesToUnlink as $file) {
    if (file_exists($file)) {
        unlink($file);
    }
}

// --- Output PDF ---
$pdf->Output('I', 'report_'. strtolower(str_replace(' ', '_', $fullName)) . '_' . date('Ymd') . '.pdf');
?>
