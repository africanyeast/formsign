// PDF Generation Module
// This file handles all PDF generation functionality

function generatePDF() {
    // Get form data
    const formData = {
        userType: document.querySelector('input[name="userType"]:checked')?.value || '',
        fullName: document.getElementById('fullName')?.value || '',
        subject: document.getElementById('subject')?.value || '',
        place: document.getElementById('place')?.value || '',
        age: document.getElementById('age')?.value || '',
        reportNotes: document.getElementById('reportNotes')?.value || '',
        staffType: document.getElementById('staffType')?.value || '',
        witnessName: document.getElementById('witnessName')?.value || '',
        customerWitnessName: document.getElementById('customerWitnessName')?.value || '',
        customerWitnessPosition: document.getElementById('customerWitnessPosition')?.value || ''
    };

    // Get signatures
    const signatures = {
        staff: getSignatureDataURL('staffSigCanvas'),
        witness: getSignatureDataURL('witnessSigCanvas'),
        customer: getSignatureDataURL('customerSigCanvas'),
        customerWitness: getSignatureDataURL('customerWitnessSigCanvas')
    };

    // Create PDF document
    createPDFDocument(formData, signatures);
}

function getSignatureDataURL(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    // Check if canvas is empty by comparing with placeholder
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw placeholder on temp canvas
    tempCtx.font = 'italic 14px Arial';
    tempCtx.fillStyle = '#999';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText('Sign here', tempCanvas.width / 2, tempCanvas.height / 2);
    
    const placeholderDataUrl = tempCanvas.toDataURL();
    const currentDataUrl = canvas.toDataURL();
    
    return currentDataUrl === placeholderDataUrl ? null : currentDataUrl;
}

function createPDFDocument(formData, signatures) {
    // Create a temporary container for the PDF content
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.width = '210mm';
    pdfContainer.style.minHeight = '297mm';
    pdfContainer.style.padding = '15mm 15mm 15mm 15mm'; 
    pdfContainer.style.fontFamily = 'Arial, sans-serif';
    pdfContainer.style.fontSize = '12px';
    pdfContainer.style.color = '#000';
    pdfContainer.style.backgroundColor = 'white';
    
    // Generate the HTML content
    pdfContainer.innerHTML = generatePDFHTML(formData, signatures);
    
    // Add to document
    document.body.appendChild(pdfContainer);
    
    // Generate PDF
    html2canvas(pdfContainer, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        onclone: function(clonedDoc) {
            // Make sure the page number is visible in the cloned document
            const pageNumber = clonedDoc.querySelector('.page-number');
            if (pageNumber) {
                pageNumber.style.display = 'block';
                pageNumber.style.visibility = 'visible';
                pageNumber.style.opacity = '1';
            }
        }
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Track page count
        let pageCount = 1;
        
        // Only add additional pages if there's significant content remaining
        while (heightLeft > 20) { // Only create new page if more than 20mm of content remains
            position = heightLeft - imgHeight;
            pdf.addPage();
            pageCount++;
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Calculate total pages
        const totalPages = pageCount;
        
        // Add page numbers to all pages
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`Page ${i} of ${totalPages}`, 170, 290); // Position at bottom right
        }
        
        // Download the PDF
        const filename = `Statement_${formData.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        pdf.save(filename);
        
        // Clean up
        document.body.removeChild(pdfContainer);
        
        // Show success message
        alert('PDF generated successfully!');
        
    }).catch(error => {
        console.error('Error generating PDF:', error);
        document.body.removeChild(pdfContainer);
        alert('Error generating PDF. Please try again.');
    });
}

function generatePDFHTML(formData, signatures) {
    const currentDate = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const signingDate = new Date().toLocaleDateString('en-GB');
    
    // Process report notes into numbered lines
    const reportLines = formData.reportNotes.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, index) => `<div class="statement-item"><span class="statement-number">${index + 1}.</span><span class="statement-text">${line}</span></div>`)
        .join('');
    
    // Determine signatures to display
    let witnessSignature = '';
    let mainSignature = '';
    let witnessName = '';
    let witnessPosition = '';
    
    if (formData.userType === 'staff') {
        witnessSignature = signatures.witness || '';
        mainSignature = signatures.staff || '';
        witnessName = formData.witnessName;
        witnessPosition = formData.staffType;
    } else {
        witnessSignature = signatures.customerWitness || '';
        mainSignature = signatures.customer || '';
        witnessName = formData.customerWitnessName;
        witnessPosition = formData.customerWitnessPosition;
    }
    
    return `
        <style>
            .pdf-container {
                width: 100%;
                /* max-width: 794px; This will be controlled by the 210mm width and padding */
                box-sizing: border-box; /* Ensure padding is included in width/height */
                margin: 0 auto;
                background: white;
                position: relative;
                min-height: 1123px; /* Corresponds to 297mm at ~96 DPI */
            }
            
            .header-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                /* table-layout: fixed; May not be needed with new structure */
            }
            
            .header-table td {
                vertical-align: middle;
                padding: 0; /* Reset padding for main td cells if using inner elements for spacing */
            }
            
            .logo-cell {
                width: 80px; /* Keep logo cell width */
                text-align: left;
                padding-right: 10px; /* Add some space between logo and grey bar */
                vertical-align: top; /* Align logo to the top of its cell */
            }
            
            .logo {
                width: 60px;
                height: 60px;
            }

            /* New styles for the grey header bar */
            .header-content-area {
                width: calc(100% - 90px); /* Remaining width after logo cell and its padding */
                vertical-align: middle;
            }

            .header-grey-bar {
                background-color: #e6e6e6; /* Light grey background */
                padding: 5px 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                /* min-height: 60px; Ensure bar has some height, same as logo - adjust as needed */
                box-sizing: border-box;
            }

            .company-cell-content {
                text-align: left;
            }
            
            .company-name {
                font-weight: bold;
                font-size: 11px;
                color: #666;
                padding: 3px 0; /* Adjusted padding */
                display: inline-block;
            }

            .form-cell-content {
                text-align: right;
            }
            
            .form-info-main {
                font-size: 10px;
                color: #666;
                padding: 3px 0; /* Adjusted padding */
                display: inline-block;
                font-weight: bold; /* FORM19 is bold in template */
            }

            .form-info-version {
                font-size: 9px; /* Slightly smaller for version */
                color: #666;
                display: block; /* Make it appear on a new line */
                text-align: right; /* Ensure it aligns with FORM19 */
                padding-top: 2px; /* Space between FORM19 and version */
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
                margin-bottom: 60px;
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
            
            .signature-section {
                position: absolute;
                bottom: 100px;
                left: 20px;
                right: 20px;
            }
            
            .signature-table {
                width: 100%;
                border-collapse: collapse;
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
            
            .signature-block {
                display: block;
                width: 100%;
                margin-bottom: 15px;
            }
            
            .signature-row {
                display: flex;
                align-items: flex-end;
                width: 100%;
                margin-bottom: 5px;
            }
            
            .signature-label {
                font-weight: bold;
                white-space: nowrap;
                margin-right: 5px; /* Space between label and signature line */
            }
            
            .signature-line {
                flex: 1;
                border-bottom: 1px solid #000;
                height: 25px; /* Height for signature line */
                position: relative;
                display: flex;
                align-items: flex-end;
                padding-bottom: 2px;
            }
            
            .signature-image {
                height: 80px;
                width: 250px;
                display: block;
                margin-bottom: -25px;
            }
            
            .signature-details {
                line-height: 1.3;
                font-size: 11px;
                margin-top: 5px;
                margin-left: 70px; /* Align with start of signature line */
                display: block;
            }
            
            .page-number {
                position: absolute;
                bottom: 30px; /* Move it up a bit from the bottom */
                right: 30px; /* Move it in a bit from the right */
                font-size: 12px; /* Make it slightly larger */
                color: #000; /* Make it black for better visibility */
                font-weight: bold; /* Make it bold */
                z-index: 9999; /* Ensure it's above all other elements */
                background-color: white; /* Add background to ensure visibility */
                padding: 3px 8px; /* Add more padding */
                border: 1px solid #ccc; /* Add a border */
                border-radius: 3px; /* Round the corners */
            }
        </style>
        
        <div class="pdf-container">
            <!-- Header Section -->
            <table class="header-table">
                <tr>
                    <td class="logo-cell">
                        <img src="/images/logo.png" alt="Company Logo" class="logo">
                    </td>
                    <td class="header-content-area">
                        <div class="header-grey-bar">
                            <div class="company-cell-content">
                                <div class="company-name">COMPANY NAME GOES HERE</div>
                            </div>
                            <div class="form-cell-content">
                                <div class="form-info-main">FORM19</div>
                            </div>
                        </div>
                        <div class="form-info-version">Version 4.51 (05/2025)</div>
                    </td>
                </tr>
            </table>
            
            <!-- Document Title -->
            <div class="document-title">STATEMENT OF A CUSTOMER</div>
            
            <!-- Separator Line -->
            <div class="separator"></div>
            
            <!-- Info Section -->
            <table class="info-table">
                <tr>
                    <td class="info-label">Subject:</td>
                    <td class="info-value">${formData.subject}</td>
                </tr>
                <tr>
                    <td class="info-label">Place:</td>
                    <td class="info-value">${formData.place}</td>
                </tr>
                <tr>
                    <td class="info-label">Date:</td>
                    <td class="info-value">${currentDate}</td>
                </tr>
            </table>
            
            <!-- Name Section -->
            <table class="name-table">
                <tr>
                    <td class="name-label">Name:</td>
                    <td class="name-value">${formData.fullName}</td>
                </tr>
            </table>
            
            <!-- States Section -->
            <div class="states-section">
                <div class="states-title">STATES:</div>
                ${reportLines}
            </div>
            
            <!-- Signature Section -->
            <div class="signature-section">
                <table class="signature-table">
                    <tr>
                        <td>
                            <div class="signature-block">
                                <div class="signature-row">
                                    <div class="signature-label">Witness:</div>
                                    <div class="signature-line">
                                        ${witnessSignature ? `<img src="${witnessSignature}" class="signature-image" alt="Witness Signature">` : ''}
                                    </div>
                                </div>
                                <div class="signature-details">
                                    ${witnessName}<br>
                                    ${witnessPosition}<br>
                                    ${signingDate}
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="signature-block">
                                <div class="signature-row">
                                    <div class="signature-label">Signature:</div>
                                    <div class="signature-line">
                                        ${mainSignature ? `<img src="${mainSignature}" class="signature-image" alt="Main Signature">` : ''}
                                    </div>
                                </div>
                                <div class="signature-details">
                                    ${formData.fullName}<br>
                                    ${signingDate}
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Page Number - Moved outside and after signature section -->
            <div class="page-number">Page 1 of 1</div>
        </div>
    `;
}