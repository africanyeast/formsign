<?php
require '../vendor/autoload.php';

use setasign\Fpdi\Fpdi;

if (empty($_POST['message']) || empty($_POST['username']) || empty($_POST['signature'])) {
    die("Missing required data.");
}

$message = htmlspecialchars($_POST['message']);
$name = htmlspecialchars($_POST['username']);
$signature = $_POST['signature'];

$signature = str_replace('data:image/png;base64,', '', $signature);
$signature = str_replace(' ', '+', $signature);
$decoded = base64_decode($signature);
file_put_contents('signature.png', $decoded);

$pdf = new Fpdi();
$pdf->AddPage();
$pdf->SetFont('Arial','',12);
$pdf->SetMargins(20, 30, 20);

// Add message text and track where it ends
$pdf->SetXY(20, 30);
$pdf->MultiCell(0, 8, $message);
$yAfterText = $pdf->GetY(); // Get vertical position after text

// Add name just below the text
$pdf->SetY($yAfterText + 5); // small 5pt gap
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 10, "Signed by: $name", 0, 1);

// Add signature slightly below the name
$pdf->SetY($pdf->GetY() + 3);
if (file_exists('signature.png')) {
    $pdf->Image('signature.png', 20, $pdf->GetY(), 60, 30);
    unlink('signature.png');
}

$pdf->Output('I', 'signed_message.pdf');
?>
