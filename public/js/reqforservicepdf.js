// PDF Generation Module for Request for Service Reports using pdfmake
// This file handles PDF generation for reqforservice forms

function generateReqForServicePDF() {
    // Get form data
    const formData = {
        userType: 'reqforservice',
        requestType: document.getElementById('requestType')?.value || '',
        
        // Staff information
        staffFullName: document.getElementById('reqstaffFullName')?.value || '',
        staffPosition: ((document.getElementById('reqstaffPosition')?.value || '').toLowerCase().replace(/^\w/, c => c.toUpperCase())),
        staffOfficeLocation: document.getElementById('reqstaffOfficeLocation')?.value || '',
        
        // Client information
        clientFullName: document.getElementById('clientFullName')?.value || '',
        clientAddress: document.getElementById('clientAddress')?.value || '',
        clientDob: document.getElementById('clientDob')?.value || '',
        clientVehicleReg: document.getElementById('clientVehicleReg')?.value || '',
        clientVehicleDesc: document.getElementById('clientVehicleDesc')?.value || '',
        
        // Issue information
        issueDescription: document.getElementById('issueDescription')?.value || '',
        issueLocation: document.getElementById('issueLocation')?.value || '',
        issueDateTime: document.getElementById('issueDateTime')?.value || '',
        issueTimeTaken: document.getElementById('issueTimeTaken')?.value || '',
        
        // Info to read responses
        clientIdentityReply: document.getElementById('clientIdentityReply')?.value || '',
        vehicleOwnershipReply: document.getElementById('vehicleOwnershipReply')?.value || '',
        feesUnderstandingReply: document.getElementById('feesUnderstandingReply')?.value || '',
        additionalInfoReply: document.getElementById('additionalInfoReply')?.value || ''
    };

    // Get signatures
    const signatures = {
        staff: getSignatureDataURL('reqForServiceStaffSigCanvas'),
        customer: getSignatureDataURL('reqForServiceCustomerSigCanvas')
    };

    // Create PDF document
    createReqForServicePDFDocument(formData, signatures);
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
      case 'reqForServiceStaffSigCanvas':
        placeholderText = "Staff Sign Here";
        break;
      case 'reqForServiceCustomerSigCanvas':
        placeholderText = "Customer Sign Here";
        break;
      default:
        placeholderText = "Sign Here";
    }
    
    tempCtx.fillText(placeholderText, tempCanvas.width / 2, tempCanvas.height / 2);
    
    const placeholderDataUrl = tempCanvas.toDataURL();
    const currentDataUrl = canvas.toDataURL();
    
    return currentDataUrl === placeholderDataUrl ? null : currentDataUrl;
}

function createReqForServicePDFDocument(formData, signatures) {
    // Format dates
    const currentDate = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Use the same date format for signatures
    const signingDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    // Get current time for the document
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedTime = `${formattedHours}:${formattedMinutes}${ampm}`;
    
    // Determine signatures to display
    const staffSignature = signatures.staff || '';
    const customerSignature = signatures.customer || '';
    
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
    const loadStaffSignature = staffSignature ? Promise.resolve(staffSignature) : Promise.resolve(null);
    const loadCustomerSignature = customerSignature ? Promise.resolve(customerSignature) : Promise.resolve(null);
    
    // Wait for all images to load
    Promise.all([loadLogoImage, loadStaffSignature, loadCustomerSignature])
        .then(([logoDataUrl, staffSignatureDataUrl, customerSignatureDataUrl]) => {
            // Create document definition for pdfmake
            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 80, 40, 120], // [left, top, right, bottom] - space for signatures
                
                defaultStyle: {
                    fontSize: 10,
                    color: '#000000'
                },
                
                // Use background function for signatures only (no page numbers)
                background: function(currentPage, pageSize) {
                    // Create signature section that will appear on every page
                    return [
                        // Signature section positioned at the bottom of each page
                        {
                            absolutePosition: {x: 40, y: pageSize.height - 100},
                            columns: [
                                // Staff Signature
                                {
                                    width: '50%',
                                    stack: [
                                        {
                                            columns: [
                                                {
                                                    width: 'auto',
                                                    text: 'Staff:',
                                                    bold: true,
                                                    margin: [0, 0, 5, 0]
                                                },
                                                {
                                                    width: '*',
                                                    stack: [
                                                        { text: '', margin: [0, 15, 0, 0] },
                                                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }] },
                                                        staffSignatureDataUrl ? {
                                                            image: staffSignatureDataUrl,
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
                                                const textArray = [];
                                                
                                                if (formData.staffFullName) {
                                                    textArray.push(formData.staffFullName + '\n');
                                                }
                                                
                                                if (formData.staffPosition) {
                                                    textArray.push(formData.staffPosition + '\n');
                                                }
                                                
                                                if (formData.staffOfficeLocation) {
                                                    textArray.push(formData.staffOfficeLocation + '\n');
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
                                // Customer Signature
                                {
                                    width: '50%',
                                    stack: [
                                        {
                                            columns: [
                                                {
                                                    width: 'auto',
                                                    text: 'Customer:',
                                                    bold: true,
                                                    margin: [0, 0, 5, 0]
                                                },
                                                {
                                                    width: '*',
                                                    stack: [
                                                        { text: '', margin: [0, 15, 0, 0] },
                                                        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }] },
                                                        customerSignatureDataUrl ? {
                                                            image: customerSignatureDataUrl,
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
                                                const textArray = [];
                                                
                                                if (formData.clientFullName) {
                                                    textArray.push(formData.clientFullName + '\n');
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
                                            {
                                                text: (formData.requestType === 'serious' ? 
                                                    'SERIOUS REQUEST FOR CONFIRMATION OF ISSUE\nRELATING TO ISSUE REPORTED BY CUSTOMER\nFORMAL REQUEST' :
                                                    'NORMAL REQUEST FOR CONFIRMATION OF ISSUE\nRELATING TO ISSUE REPORTED BY CUSTOMER\nFORMAL REQUEST'),
                                                fontSize: 12,
                                                bold: true,
                                                alignment: 'left',
                                                margin: [110, 0, 0, 0]
                                            }
                                        ]
                                    }
                                ]
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, -60, 0, 10]
                    },
                    
                    // Document Title
                    {
                        text: 'REQUEST FROM CUSTOMER',
                        fontSize: 12,
                        bold: true,
                        alignment: 'center',
                        decoration: 'underline',
                        margin: [0, 0, 0, 20]
                    },
                    
                    // Content Section - Questions and Answers
                    {
                        stack: [
                            // Time and Staff Introduction
                            {
                                text: [
                                    '1. The time at the moment is ',
                                    formattedTime,
                                    ' on ',
                                    currentDate,
                                    '.'
                                ],
                                margin: [50, 0, 0, 10] // All numbered statements aligned
                            },
                            
                            {
                                text: [
                                    '2. I am ',
                                    formData.staffFullName,
                                    '. I am a ',
                                    formData.staffPosition,
                                    ' from ',
                                    formData.staffOfficeLocation,
                                    '.'
                                ],
                                margin: [50, 0, 0, 10] 
                            },
                            
                            // Client Identity Question
                            {
                                text: [
                                    '3. Are you ',
                                    formData.clientFullName,
                                    ' from ',
                                    formData.clientAddress,
                                    ' and date of birth ',
                                    formData.clientDob,
                                    '?'
                                ],
                                margin: [50, 0, 0, 5] 
                            },
                            {
                                text: [
                                    '>> ',
                                    {text: 'Answer:', bold: true},
                                    ' ',
                                    formData.clientIdentityReply
                                ],
                                margin: [30, 0, 0, 15] 
                            },
                            
                            // Vehicle Ownership Question
                            {
                                text: [
                                    '4. Are you the owner of ',
                                    formData.clientVehicleDesc,
                                    ' (',
                                    formData.clientVehicleReg,
                                    ')?'
                                ],
                                margin: [50, 0, 0, 5] 
                            },
                            {
                                text: [
                                    '>> ',
                                    {text: 'Answer:', bold: true},
                                    ' ',
                                    formData.vehicleOwnershipReply
                                ],
                                margin: [30, 0, 0, 15] 
                            },
                            
                            // Service Explanation
                            {
                                text: [
                                    '5. I understand that you would like us to do a service on your vehicle. I must explain a few conditions to you. I understand that you want us to look at ',
                                    {text: formData.issueDescription, bold: true},
                                    ' located at ',
                                    {text: formData.issueLocation, bold: true},
                                    ' on ',
                                    {text: formData.issueDateTime, bold: true},
                                    '.'
                                ],
                                margin: [50, 0, 0, 15] 
                            },
                            
                            // Fees Understanding Question
                            {
                                text: '6. There may be fees associated with this service which will be explained in writing to you. Do you understand that?',
                                margin: [50, 0, 0, 5] 
                            },
                            {
                                text: [
                                    '>> ',
                                    {text: 'Answer:', bold: true},
                                    ' ',
                                    formData.feesUnderstandingReply
                                ],
                                margin: [30, 0, 0, 15] 
                            },
                            
                            // Additional Information Request
                            {
                                text: [
                                    '7. Please verbally tell me more information about the ',
                                    {text: formData.issueDescription, bold: true},
                                    ' at ',
                                    {text: formData.issueLocation, bold: true},
                                    '.'
                                ],
                                margin: [50, 0, 0, 5] 
                            },
                            {
                                text: [
                                    '>> ',
                                    {text: 'Answer:', bold: true},
                                    ' ',
                                    formData.additionalInfoReply
                                ],
                                margin: [30, 0, 0, 20] 
                            }
                        ]
                    }
                ]
            };
            
            // Generate and download the PDF
            pdfMake.createPdf(docDefinition).download(`reqforservice_${formData.clientFullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        })
        .catch(error => {
            console.error('Error loading images:', error);
            alert('Error generating PDF. Please try again.');
        });
}