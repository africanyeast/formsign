// PDF Generation Module using pdfmake
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
    tempCtx.font = 'italic 12px Arial';
    tempCtx.fillStyle = '#999';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText('Sign here', tempCanvas.width / 2, tempCanvas.height / 2);
    
    const placeholderDataUrl = tempCanvas.toDataURL();
    const currentDataUrl = canvas.toDataURL();
    
    return currentDataUrl === placeholderDataUrl ? null : currentDataUrl;
}

function createPDFDocument(formData, signatures) {
    // Format dates
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
        .filter(line => line.length > 0);
    
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
    
    // Load the company logo
    const logoUrl = '/public/images/logo.webp';
    
    // Create a promise to load the logo image
    const loadLogoImage = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL());
        };
        img.onerror = reject;
        img.src = logoUrl;
    });
    
    // Create promises for signature images
    const loadWitnessSignature = witnessSignature ? Promise.resolve(witnessSignature) : Promise.resolve(null);
    const loadMainSignature = mainSignature ? Promise.resolve(mainSignature) : Promise.resolve(null);
    
    // Wait for all images to load
    Promise.all([loadLogoImage, loadWitnessSignature, loadMainSignature])
        .then(([logoDataUrl, witnessSignatureDataUrl, mainSignatureDataUrl]) => {
            // Create document definition for pdfmake
            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 40, 40, 40], // [left, top, right, bottom]
                // In the docDefinition object, replace:
                
                defaultStyle: {
                    fontSize: 10,
                    color: '#000000'
                },
                footer: function(currentPage, pageCount) {
                    return {
                        text: `Page ${currentPage} of ${pageCount}`,
                        alignment: 'right',
                        margin: [0, 0, 80, 10],
                        fontSize: 9,
                        bold: false
                    };
                },
                // In the docDefinition object, modify the content array to remove the existing signature section
                // and add a new absolutePosition element at the end:
                
                content: [
                    // Header Section
                    {
                        table: {
                            widths: [60, '*'],
                            body: [
                                [
                                    // Logo Cell
                                    {
                                        image: logoDataUrl,
                                        width: 60,
                                        height: 60,
                                        alignment: 'left'
                                    },
                                    // Header Content Area
                                    {
                                        stack: [
                                            // Grey Header Bar
                                            {
                                                table: {
                                                    widths: ['*', 'auto'],
                                                    body: [
                                                        [
                                                            // Company Name
                                                            {
                                                                text: 'COMPANY NAME GOES HERE',
                                                                fontSize: 11,
                                                                bold: true,
                                                                color: '#666666'
                                                            },
                                                            // Form Info
                                                            {
                                                                text: 'FORM19',
                                                                fontSize: 10,
                                                                bold: true,
                                                                color: '#666666',
                                                                alignment: 'right'
                                                            }
                                                        ]
                                                    ]
                                                },
                                                layout: {
                                                    fillColor: function() {
                                                        return '#e6e6e6';
                                                    },
                                                    paddingLeft: function() { return 10; },
                                                    paddingRight: function() { return 10; },
                                                    paddingTop: function() { return 5; },
                                                    paddingBottom: function() { return 5; },
                                                    hLineWidth: function() { return 0; },
                                                    vLineWidth: function() { return 0; }
                                                }
                                            },
                                            // Version Info
                                            {
                                                text: 'Version 4.51 (05/2025)',
                                                fontSize: 9,
                                                color: '#666666',
                                                alignment: 'right',
                                                margin: [0, 2, 0, 0]
                                            }
                                        ]
                                    }
                                ]
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, 0, 0, 0]
                    },
                    
                    // Document Title - Make it dynamic based on user type
                    {
                        text: formData.userType === 'staff' ? 'STATEMENT OF A STAFF' : 'STATEMENT OF A CUSTOMER',
                        fontSize: 12,
                        bold: true,
                        alignment: 'center',
                        margin: [0, 0, 0, 15]
                    },
                    
                    // Separator Line
                    {
                        canvas: [
                            {
                                type: 'line',
                                x1: 0, y1: 0,
                                x2: 515, y2: 0,
                                lineWidth: 3
                            }
                        ],
                        margin: [0, 0, 0, 25]
                    },
                    
                    // In the docDefinition object, update the Info Section and Name Section tables:
                    
                    // Info Section - updated to have only outer borders with no internal horizontal lines
                    // and reduced right margin between label and value
                    {
                        table: {
                            widths: [80, '*'],
                            body: [
                                [
                                    { text: 'Subject:', bold: true, margin: [5, 5, 0, 5], border: [true, true, false, false] },
                                    { text: formData.subject, margin: [0, 5, 5, 5], border: [false, true, true, false] }
                                ],
                                [
                                    { text: 'Place:', bold: true, margin: [5, 5, 0, 5], border: [true, false, false, false] },
                                    { text: formData.place, margin: [0, 5, 5, 5], border: [false, false, true, false] }
                                ],
                                [
                                    { text: 'Date:', bold: true, margin: [5, 5, 0, 5], border: [true, false, false, true] },
                                    { text: currentDate, margin: [0, 5, 5, 5], border: [false, false, true, true] }
                                ]
                            ]
                        },
                        layout: {
                            hLineWidth: function(i, node) { return 2; },
                            vLineWidth: function(i, node) { return 2; },
                            hLineColor: function(i, node) { return '#666666'; },
                            vLineColor: function(i, node) { return '#666666'; },
                            // Custom border layout is handled by the cell border property
                        },
                        margin: [0, 0, 0, 15]
                    },
                    
                    // Name Section - reduced right margin between label and value
                    {
                        table: {
                            widths: [80, '*'],
                            body: [
                                [
                                    { text: 'Name:', bold: true, margin: [5, 8, 0, 8], border: [true, true, false, true] },
                                    { text: formData.fullName, margin: [0, 8, 5, 8], border: [false, true, true, true] }
                                ]
                            ]
                        },
                        layout: {
                            hLineWidth: function(i, node) { return 2; },
                            vLineWidth: function(i, node) { return 2; },
                            hLineColor: function(i, node) { return '#666666'; },
                            vLineColor: function(i, node) { return '#666666'; },
                            // Custom border layout is handled by the cell border property
                        },
                        margin: [0, 0, 0, 20]
                    },
                    
                    // States Section
                    {
                        text: 'STATES:',
                        bold: true,
                        fontSize: 11,
                        margin: [0, 0, 0, 15]
                    },
                    
                    // Report Lines
                    ...reportLines.map((line, index) => ({
                        columns: [
                            {
                                width: 20,
                                text: `${index + 1}.`,
                                bold: true,
                                margin: [0, 0, 8, 12]
                            },
                            {
                                width: '*',
                                text: line,
                                margin: [0, 0, 0, 12]
                            }
                        ]
                    })),
                ],
                
                // Add this after the content array to position the signature section at the bottom
                // In the background function, update the signature section implementation:
                background: function(currentPage, pageSize) {
                    return [
                        // Only add the signature section to the first/last page
                        {
                            absolutePosition: {x: 40, y: pageSize.height - 140},
                            width: pageSize.width - 80, // Set width to page width minus margins
                            columns: [
                                // Witness Signature
                                {
                                    width: '50%', // Use percentage instead of '*' to control width
                                    stack: [
                                        {
                                            columns: [
                                                {
                                                    width: 'auto',
                                                    text: 'Witness:',
                                                    bold: true,
                                                    margin: [0, 0, 5, 0]
                                                },
                                                {
                                                    width: '*',
                                                    // Position the line at the bottom of the label
                                                    stack: [
                                                        { text: '', margin: [0, 15, 0, 0] }, // Add space to align with bottom of label
                                                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }] },
                                                        // Then position the signature on top of the line with negative margin
                                                        witnessSignatureDataUrl ? {
                                                            image: witnessSignatureDataUrl,
                                                            width: 200, // Reduced width to prevent overflow
                                                            height: 50,
                                                            margin: [0, -40, 0, 0] // Adjusted negative margin for larger image
                                                        } : {}
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            text: [
                                                witnessName + '\n',
                                                witnessPosition + '\n',
                                                signingDate
                                            ],
                                            fontSize: 10,
                                            margin: [70, 5, 0, 0]
                                        }
                                    ],
                                    margin: [0, 0, 10, 0]
                                },
                                // Main Signature
                                {
                                    width: '50%', // Use percentage instead of '*' to control width
                                    stack: [
                                        {
                                            columns: [
                                                {
                                                    width: 'auto',
                                                    text: 'Signature:',
                                                    bold: true,
                                                    margin: [0, 0, 5, 0]
                                                },
                                                {
                                                    width: '*',
                                                    // Position the line at the bottom of the label
                                                    stack: [
                                                        { text: '', margin: [0, 15, 0, 0] }, // Add space to align with bottom of label
                                                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }] },
                                                        // Then position the signature on top of the line with negative margin
                                                        mainSignatureDataUrl ? {
                                                            image: mainSignatureDataUrl,
                                                            width: 200, // Reduced width to prevent overflow
                                                            height: 50,
                                                            margin: [0, -40, 0, 0] // Adjusted negative margin for larger image
                                                        } : {}
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            text: [
                                                formData.fullName + '\n',
                                                signingDate
                                            ],
                                            fontSize: 10,
                                            margin: [70, 5, 0, 0]
                                        }
                                    ],
                                    margin: [10, 0, 0, 0]
                                }
                            ]
                        }
                    ];
                },
                margin: [0, 60, 0, 0]
        };
        
        // Generate filename
        const filename = `Statement_${formData.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        
        // Create the PDF
        pdfMake.createPdf(docDefinition).getBlob((blob) => {
            // Create a URL for the blob
            const pdfUrl = URL.createObjectURL(blob);
            
            // Open the PDF in a new tab
            window.open(pdfUrl, '_blank');
            
            // Also download the PDF for the user to keep
            pdfMake.createPdf(docDefinition).download(filename);
            
            // Show success message
            alert('PDF generated successfully!');
        });
    })
    .catch(error => {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    });
}