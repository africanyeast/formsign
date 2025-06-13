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
    $convertedString = iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $string);
    if ($convertedString === false) {
        error_log("iconv conversion failed for string: " . $string);
        return $string; // Return original string if conversion fails
    }
    return $convertedString;
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

// --- Initialize PDF ---
$pdf = new Fpdi('P', 'mm', 'A4'); // A4 Portrait
$pdf->SetMargins(20, 20, 20); // Left, Top, Right
$pdf->SetAutoPageBreak(false); // Turn off auto page break for more control
$pdf->AddPage();

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

// Change line color to black (instead of default gray)
$pdf->SetDrawColor(0, 0, 0); // RGB Black
$pdf->Line(20, 50, 190, 50); // Horizontal line under title

// --- Form Fields ---
$pdf->SetY(55);
$pdf->SetFont($fontFamily, 'B', $baseFontSize);

// Create a box for Subject, Place, and Date
$boxStartY = $pdf->GetY();
$pdf->Rect(20, $boxStartY, 170, 20); // x, y, width, height

// Subject - Added more top padding (2mm)
$pdf->Ln(2); // Add 2mm top padding for Subject
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

// Name in a separate box
$nameBoxY = $pdf->GetY();
$pdf->Rect(20, $nameBoxY, 170, 10); // x, y, width, height
$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Ln(2); // Add 2mm top padding for Name
$pdf->Cell(30, $lineHeight, toPdfEncoding('Name:'));
$pdf->SetFont($fontFamily, '', $baseFontSize);
$pdf->Cell(0, $lineHeight, toPdfEncoding($fullName), 0, 1);
$pdf->Ln(10); // Increased spacing after name box to prevent overlap with STATES

// STATES: section
$pdf->SetFont($fontFamily, 'B', $baseFontSize);
$pdf->Cell(0, $lineHeight, toPdfEncoding('STATES:'), 0, 1);
$pdf->Ln(2);

// Report content with numbered lines
$pdf->SetFont($fontFamily, '', $baseFontSize);
$lineNumber = 1;

// Trim the reportNotes initially to handle cases where it might be all whitespace
$trimmedReportNotes = trim($reportNotes);

if (empty($trimmedReportNotes)) {
    // If no actual content, add a single placeholder line
    $pdf->Cell(10, $lineHeight, toPdfEncoding($lineNumber . '.'));
    $pdf->MultiCell(0, $lineHeight, ""); // Empty content
    $pdf->Ln(2);
} else {
    // Check if the original (untrimmed, but we care about content) $reportNotes contains a newline character
    if ($userType === 'staff' && strpos($reportNotes, "\n") === false) {
        // Staff report with no line breaks: display all content under a single number
        $pdf->Cell(10, $lineHeight, toPdfEncoding($lineNumber . '.'));
        $encodedTrimmedReportNotes = toPdfEncoding($trimmedReportNotes);
        // If encoding results in an empty string but original was not, use original (might have unsupported chars)
        if (empty($encodedTrimmedReportNotes) && !empty($trimmedReportNotes)) {
             $pdf->MultiCell(0, $lineHeight, $trimmedReportNotes); 
        } else {
             $pdf->MultiCell(0, $lineHeight, $encodedTrimmedReportNotes);
        }
        $pdf->Ln(2);
    } else {
        // Customer report, or Staff report with line breaks: process line by line
        $reportLines = explode("\n", $reportNotes);
        foreach ($reportLines as $line) {
            $trimmedLine = trim($line);
            // For staff, print the line if it's not empty after trimming, or if it is empty but it's a staff report (to preserve empty lines between content)
            // For customers, only print if the trimmed line is not empty.
            if (($userType === 'staff' && ($line !== '' || $trimmedLine !== '')) || ($userType === 'customer' && !empty($trimmedLine))) {
                $pdf->Cell(10, $lineHeight, toPdfEncoding($lineNumber . '.'));
                // For staff, use the original $line to preserve indentation if any, otherwise use $trimmedLine
                $pdf->MultiCell(0, $lineHeight, toPdfEncoding(($userType === 'staff') ? $line : $trimmedLine));
                $pdf->Ln(2);
                $lineNumber++;
            }
        }
        // If, after iterating, no lines were printed (e.g., a customer report with only whitespace lines, or staff report that was all empty lines)
        // and the initial $trimmedReportNotes was also empty, this case is covered by the first 'if'.
        // If $trimmedReportNotes was NOT empty, but all lines were filtered out (e.g. customer report with only spaces per line), add a placeholder.
        if ($lineNumber === 1 && !empty($trimmedReportNotes) && $userType === 'customer') {
             $pdf->Cell(10, $lineHeight, toPdfEncoding('1.'));
             $pdf->MultiCell(0, $lineHeight, ""); // Empty content
             $pdf->Ln(2);
        }
    }
}

// --- Fixed Positioning for Signatures ---
// Calculate page dimensions
$pageHeight = $pdf->GetPageHeight();
$pageWidth = $pdf->GetPageWidth();

// Define fixed positions for signatures (always at bottom of page 1)
$signatureY = $pageHeight - 70; // Fixed position from bottom
$leftMargin = 20;
$pageContentWidth = $pageWidth - ($leftMargin * 2);
$columnWidth = ($pageContentWidth / 2) - 5;
$sigHeight = 15;

// --- Signatures ---
$signatureFilesToUnlink = [];
$signingDate = formatDate(date('Y-m-d'));

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
    $pdf->SetXY($currentX, $signatureY);
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 5, toPdfEncoding("Witness:"), 0, 1);
    
    if ($witnessSigFile && !empty($witnessName)) {
        $pdf->Image($witnessSigFile, $currentX, $signatureY + 5, $columnWidth / 2, $sigHeight);
    }
    
    $pdf->SetXY($currentX, $signatureY + $sigHeight + 2);
    $pdf->SetFont($fontFamily, '', $baseFontSize - 1);
    if (!empty($witnessName)) {
        $pdf->Cell($columnWidth, 4, toPdfEncoding($witnessName), 0, 1);
        $pdf->SetX($currentX);
        if ($staffType) {
            $pdf->Cell($columnWidth, 4, toPdfEncoding(ucfirst($staffType)), 0, 1);
        }
        $pdf->SetX($currentX);
        $pdf->Cell($columnWidth, 4, toPdfEncoding($signingDate), 0, 1);
    }

    // Signature (Right Column)
    $currentX = $leftMargin + $columnWidth + 10;
    $pdf->SetXY($currentX, $signatureY);
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 5, toPdfEncoding("Signature:"), 0, 1);
    
    if ($staffSigFile) {
        $pdf->Image($staffSigFile, $currentX, $signatureY + 5, $columnWidth / 2, $sigHeight);
    }
    
    $pdf->SetXY($currentX, $signatureY + $sigHeight + 2);
    $pdf->SetFont($fontFamily, '', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 4, toPdfEncoding($fullName), 0, 1);
    $pdf->SetX($currentX);
    if ($staffType) {
        $pdf->Cell($columnWidth, 4, toPdfEncoding(ucfirst($staffType)), 0, 1);
    }
    $pdf->SetX($currentX);
    $pdf->Cell($columnWidth, 4, toPdfEncoding($signingDate), 0, 1);

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
    $pdf->SetXY($currentX, $signatureY);
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 5, toPdfEncoding("Witness:"), 0, 1);
    
    if ($customerWitnessSigFile && !empty($customerWitnessName)) {
        $pdf->Image($customerWitnessSigFile, $currentX, $signatureY + 5, $columnWidth / 2, $sigHeight);
    }
    
    $pdf->SetXY($currentX, $signatureY + $sigHeight + 2);
    $pdf->SetFont($fontFamily, '', $baseFontSize - 1);
    if (!empty($customerWitnessName)) {
        $pdf->Cell($columnWidth, 4, toPdfEncoding($customerWitnessName), 0, 1);
        $pdf->SetX($currentX);
        if ($customerWitnessPosition) {
            $pdf->Cell($columnWidth, 4, toPdfEncoding(ucfirst($customerWitnessPosition)), 0, 1);
        }
        $pdf->SetX($currentX);
        $pdf->Cell($columnWidth, 4, toPdfEncoding($signingDate), 0, 1);
    }

    // Signature (Right Column)
    $currentX = $leftMargin + $columnWidth + 10;
    $pdf->SetXY($currentX, $signatureY);
    $pdf->SetFont($fontFamily, 'B', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 5, toPdfEncoding("Signature:"), 0, 1);
    
    if ($customerSigFile) {
        $pdf->Image($customerSigFile, $currentX, $signatureY + 5, $columnWidth / 2, $sigHeight);
    }
    
    $pdf->SetXY($currentX, $signatureY + $sigHeight + 2);
    $pdf->SetFont($fontFamily, '', $baseFontSize - 1);
    $pdf->Cell($columnWidth, 4, toPdfEncoding($fullName), 0, 1);
    $pdf->SetX($currentX);
    $pdf->Cell($columnWidth, 4, toPdfEncoding($signingDate), 0, 1);
}

// Add page number at bottom center (fixed position)
$pdf->SetXY(0, $pageHeight - 15);
$pdf->SetFont($fontFamily, 'I', $baseFontSize - 2);
$pdf->Cell($pageWidth, 10, toPdfEncoding('Page ' . $pdf->PageNo() . ' of ' . $pdf->PageNo()), 0, 0, 'C');

// --- Cleanup temporary signature files ---
foreach ($signatureFilesToUnlink as $file) {
    if (file_exists($file)) {
        unlink($file);
    }
}

// --- Output PDF ---
$pdf->Output('I', toPdfEncoding('report_'. strtolower(str_replace(' ', '_', $fullName))) . '_' . date('Ymd') . '.pdf');
?>
