// PDF Generation Module for Dashcam Reports using pdfmake
// This file handles PDF generation for dashcam forms

function generateDashcamPDF() {
    // Get form data
    const formData = {
        userType: 'dashcam', // Hardcoded for dashcam report
        fullName: document.getElementById('dashcamFullName')?.value || '',
        subject: document.getElementById('dashcamSubject')?.value || '',
        place: document.getElementById('dashcamPlace')?.value || '',
        age: calculateAge(document.getElementById('dashcamDob')?.value) || '',
        reportNotes: document.getElementById('dashcamReportNotes')?.value || '',
        dashcamWitnessName: document.getElementById('dashcamWitnessName')?.value || '',
        dashcamWitnessPosition: ((document.getElementById('dashcamWitnessPosition')?.value || '').toLowerCase().replace(/^\w/, c => c.toUpperCase())),
        dashcamWitnessOffice: document.getElementById('dashcamWitnessOffice')?.value || '',
        realTime: document.getElementById('dashcamRealTime')?.value || '',
        dashcamTime: document.getElementById('dashcamTime')?.value || ''
    };

    // Get signatures
    const signatures = {
        dashcam: getSignatureDataURL('dashcamSigCanvas'),
        dashcamWitness: getSignatureDataURL('dashcamWitnessSigCanvas')
    };

    // Create PDF document
    createDashcamPDFDocument(formData, signatures);
}

function getSignatureDataURL(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    // Check if canvas is empty by comparing with placeholder
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw placeholder on temp canvas with the appropriate text
    tempCtx.font = 'italic 12px Arial';
    tempCtx.fillStyle = '#999';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    
    // Customize placeholder text based on canvas ID
    let placeholderText = "Sign here";
    
    switch (canvasId) {
      case 'dashcamSigCanvas':
        placeholderText = "Customer Sign Here";
        break;
      case 'dashcamWitnessSigCanvas':
        placeholderText = "Witness Sign Here";
        break;
      default:
        placeholderText = "Sign Here";
    }
    
    tempCtx.fillText(placeholderText, tempCanvas.width / 2, tempCanvas.height / 2);
    
    const placeholderDataUrl = tempCanvas.toDataURL();
    const currentDataUrl = canvas.toDataURL();
    
    return currentDataUrl === placeholderDataUrl ? null : currentDataUrl;
}

function createDashcamPDFDocument(formData, signatures) {
    // Format dates
    const currentDate = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Use the same date format for signatures as the one at the top of the PDF
    const signingDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    // Format the times for display
    const formattedRealTime = formatDateTime(formData.realTime);
    const formattedDashcamTime = formatDateTime(formData.dashcamTime);
    
    // Calculate time difference
    const timeDifference = calculateTimeDifference(formData.realTime, formData.dashcamTime);
    
    // Process report notes into numbered lines
    const reportLines = formData.reportNotes.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    // Determine signatures to display
    const witnessSignature = signatures.dashcamWitness || '';
    const mainSignature = signatures.dashcam || '';
    const witnessName = formData.dashcamWitnessName;
    const witnessPosition = formData.dashcamWitnessPosition; // Witness position for dashcam reports
    const mainPosition = ''; // No position for main signature in dashcam reports
    
    // Load the company logo
    const logoUrl = 'images/logo.webp';
    
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
                pageMargins: [40, 80, 40, 140], // [left, top, right, bottom] - increased top margin for header
                
                defaultStyle: {
                    fontSize: 10,
                    color: '#000000'
                },
                
                // Add header function for pages 2 and above
                header: function(currentPage, pageCount) {
                    // Only show header on pages 2 and above
                    if (currentPage >= 2) {
                        return {
                            margin: [40, 20, 40, 30],
                            stack: [
                                {
                                    text: 'Report of: ' + formData.fullName,
                                    fontSize: 11,
                                    bold: true,
                                    alignment: 'center'
                                },
                                {
                                    text: 'Subject: ' + formData.subject,
                                    fontSize: 11,
                                    bold: true,
                                    alignment: 'center',
                                    margin: [0, 5, 0, 0]
                                }
                            ]
                        };
                    }
                    return '';
                },
                
                // Keep the footer function for page numbers
                footer: function(currentPage, pageCount) {
                    return {
                        text: `Page ${currentPage} of ${pageCount}`,
                        alignment: 'right',
                        margin: [0, 100, 80, 0], // Increased top margin to position below signatures
                        fontSize: 9,
                        bold: false
                    };
                },
                
                // Use background function for signatures only
                background: function(currentPage, pageSize) {
                    // Create signature section that will appear on every page
                    return [
                        // Signature section positioned at the bottom of each page
                        // but above the page numbers
                        {
                            absolutePosition: {x: 40, y: pageSize.height - 120}, // Moved up to make room for page numbers
                            columns: [
                                // Witness Signature
                                {
                                    width: '50%',
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
                                                    stack: [
                                                        { text: '', margin: [0, 15, 0, 0] },
                                                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }] },
                                                        witnessSignatureDataUrl ? {
                                                            image: witnessSignatureDataUrl,
                                                            width: 200,
                                                            height: 50,
                                                            margin: [0, -40, 0, 0]
                                                        } : {}
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            text: (() => {
                                                // Build witness text array conditionally
                                                const textArray = [];
                                                
                                                if (witnessName) {
                                                    textArray.push(witnessName + '\n');
                                                }
                                                
                                                if (witnessPosition) {
                                                    textArray.push(witnessPosition + '\n');
                                                }
                                                
                                                if (formData.dashcamWitnessOffice) {
                                                    textArray.push(formData.dashcamWitnessOffice + '\n');
                                                }
                                                
                                                textArray.push(signingDate);
                                                
                                                return textArray;
                                            })(),
                                            fontSize: 10,
                                            margin: [70, 0, 0, 0]
                                        }
                                    ],
                                    margin: [0, 0, 10, 0]
                                },
                                // Main Signature
                                {
                                    width: '50%',
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
                                                    stack: [
                                                        { text: '', margin: [0, 15, 0, 0] },
                                                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }] },
                                                        mainSignatureDataUrl ? {
                                                            image: mainSignatureDataUrl,
                                                            width: 200,
                                                            height: 50,
                                                            margin: [0, -40, 0, 0]
                                                        } : {}
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            text: (() => {
                                                // Build main signature text array conditionally
                                                const textArray = [];
                                                
                                                if (formData.fullName) {
                                                    textArray.push(formData.fullName + '\n');
                                                }
                                                
                                                if (mainPosition) {
                                                    textArray.push(mainPosition + '\n');
                                                }
                                                
                                                textArray.push(signingDate);
                                                
                                                return textArray;
                                            })(),
                                            fontSize: 10,
                                            margin: [70, 0, 0, 0]
                                        }
                                    ],
                                    margin: [10, 0, 0, 0]
                                }
                            ]
                        }
                    ];
                },
                
                content: [
                    // Header Section
                    {
                        table: {
                            widths: [50, '*'],
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
                                                                fontSize: 10,
                                                                bold: true,
                                                                color: '#333'
                                                            },
                                                            // Form Info
                                                            {
                                                                text: 'FORM19',
                                                                fontSize: 10,
                                                                bold: true,
                                                                color: '#333',
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
                                                color: '#333',
                                                alignment: 'right',
                                                margin: [0, 2, 0, 0]
                                            }
                                        ]
                                    }
                                ]
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, -60, 0, 0]
                    },
                    
                    // Document Title - Dashcam specific
                    {
                        text: 'DASHCAM REPORT',
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
                    
                    // Info Section
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
                            hLineWidth: function(i, node) { return 1; },
                            vLineWidth: function(i, node) { return 1; },
                            hLineColor: function(i, node) { return '#333'; },
                            vLineColor: function(i, node) { return '#333'; },
                        },
                        margin: [0, 0, 0, 15]
                    },
                    
                    // Name Section
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
                            hLineWidth: function(i, node) { return 1; },
                            vLineWidth: function(i, node) { return 1; },
                            hLineColor: function(i, node) { return '#333'; },
                            vLineColor: function(i, node) { return '#333'; },
                        },
                        margin: [0, 0, 0, 20]
                    },
                    
                    // Time Section
                    // {
                    //     table: {
                    //         widths: [80, '*'],
                    //         body: [
                    //             [
                    //                 { text: 'Real Time:', bold: true, margin: [5, 5, 0, 5], border: [true, true, false, false] },
                    //                 { text: formattedRealTime, margin: [0, 5, 5, 5], border: [false, true, true, false] }
                    //             ],
                    //             [
                    //                 { text: 'Dashcam Time:', bold: true, margin: [5, 5, 0, 5], border: [true, false, false, true] },
                    //                 { text: formattedDashcamTime, margin: [0, 5, 5, 5], border: [false, false, true, true] }
                    //             ]
                    //         ]
                    //     },
                    //     layout: {
                    //         hLineWidth: function(i, node) { return 1; },
                    //         vLineWidth: function(i, node) { return 1; },
                    //         hLineColor: function(i, node) { return '#333'; },
                    //         vLineColor: function(i, node) { return '#333'; },
                    //     },
                    //     margin: [0, 0, 0, 15]
                    // },
                    
                    // // Time Difference
                    // {
                    //     text: timeDifference,
                    //     bold: true,
                    //     fontSize: 11,
                    //     margin: [0, 0, 0, 20]
                    // },
                    
                    // States Section
                    {
                        text: 'STATES:',
                        bold: true,
                        fontSize: 11,
                        margin: [0, 0, 0, 15]
                    },
                    
                    // Report Lines - with automatic page breaks
                    ...reportLines.map((line, index) => ({
                        columns: [
                            {
                                width: 30,
                                text: `${index + 1}.`,
                                fontSize: 11,
                                bold: true,
                                margin: [0, 0, 8, 12]
                            },
                            {
                                width: '*',
                                text: line,
                                fontSize: 12,
                                margin: [0, 0, 0, 12]
                            }
                        ]
                    })),
                ]
            };
            
            // Generate filename
            const filename = `Dashcam_Report_${formData.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
            
            // Create the PDF
            pdfMake.createPdf(docDefinition).getBlob((blob) => {
                // Create a URL for the blob
                const pdfUrl = URL.createObjectURL(blob);
                
                // Create a download link
                const downloadLink = document.createElement('a');
                downloadLink.href = pdfUrl;
                downloadLink.download = filename;
                downloadLink.style.display = 'none';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                // Save report data to CSV
                const reportData = {
                    date_time: getFormattedDateTime(),
                    report_type: 'dashcam',
                    full_name: formData.fullName,
                    subject: formData.subject,
                    place: formData.place,
                    age: formData.age,
                    real_time: formattedRealTime,
                    dashcam_time: formattedDashcamTime,
                    time_difference: timeDifference,
                    witness_name: formData.dashcamWitnessName,
                    witness_position: formData.dashcamWitnessPosition,
                    witness_office: formData.dashcamWitnessOffice,
                    // Add empty fields for staff-specific data to maintain consistent structure
                    staff_type: '',
                    staff_office: ''
                };
                
                // Get the current URL's origin for the endpoint
                const endpoint = window.location.origin + '/update.php';
                
                // Send data to server
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reportData)
                })
                .then(response => {
                    // Check if response is ok before parsing JSON
                    if (!response.ok) {
                        throw new Error('Network response was not ok: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Report data saved');
                })
                .catch(error => {
                    console.error('Error saving report data:', error);
                });
                
                // Clean up after download starts
                setTimeout(() => {
                    document.body.removeChild(downloadLink);
                }, 100);
            });
        })
        .catch(error => {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        });
}