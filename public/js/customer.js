// Customer Form JavaScript

// DOM Elements
const customerSigCanvasEl = document.getElementById("customerSigCanvas");
const customerWitnessSigCanvasEl = document.getElementById("customerWitnessSigCanvas");
const customerForm = document.getElementById('customerForm');
const customerReportType = document.getElementById('customerReportType');
const customerFullNameInput = document.getElementById('customerFullName');
const customerDobInput = document.getElementById('customerDob');
const customerReportNotesTextarea = document.getElementById('customerReportNotes');

// Create a helper div to get computed styles for the placeholder text
const customerPlaceholderStyleHelper = document.createElement('div');
customerPlaceholderStyleHelper.className = 'signature-placeholder-text';
customerPlaceholderStyleHelper.style.display = 'none';
document.body.appendChild(customerPlaceholderStyleHelper);

// Signature pad instances
let customerSignaturePad, customerWitnessSignaturePad;

// Track if canvases have signatures
let customerCanvasHasSignature = {
  customerSigCanvas: false,
  customerWitnessSigCanvas: false
};

// Track if canvases have placeholders
let customerCanvasHasPlaceholder = {
  customerSigCanvas: true,
  customerWitnessSigCanvas: true
};

function initializeCustomerSignaturePad(canvas, options = {}) {
  if (!canvas || canvas.offsetParent === null) return null;
  
  // Ensure canvas has dimensions and proper scaling for device pixel ratio
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
  
  // Create signature pad instance with optimized options for smooth drawing
  const defaultOptions = {
    // Use a function for dotSize to create more natural dots
    dotSize: function () {
      return (this.minWidth + this.maxWidth) / 2;
    },
    minWidth: 0.5,
    maxWidth: 2.5,
    penColor: 'black',
    backgroundColor: 'rgba(0,0,0,0)',
    // Set throttle to 0 for more responsive drawing
    throttle: 0,
    // Reduce minDistance for more precise drawing
    minDistance: 1,
    // Increase velocityFilterWeight for smoother lines
    velocityFilterWeight: 0.8,
    // Add canvas context options for better rendering
    canvasContextOptions: {
      lineCap: 'round',
      lineJoin: 'round',
      miterLimit: 10
    }
  };
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create and return the signature pad instance
  const signaturePad = new SignaturePad(canvas, mergedOptions);
  
  // Add placeholder text
  drawCustomerSignaturePlaceholder(canvas);
  
  // Add event listeners for the signature pad
  signaturePad.addEventListener("beginStroke", () => {
    // Clear placeholder when drawing begins
    if (customerCanvasHasPlaceholder[canvas.id]) {
      clearCustomerPlaceholder(canvas);
      customerCanvasHasPlaceholder[canvas.id] = false;
    }
  });
  
  signaturePad.addEventListener("endStroke", () => {
    // Update signature flag
    customerCanvasHasSignature[canvas.id] = !signaturePad.isEmpty();
  });
  
  return signaturePad;
}

function clearCustomerPlaceholder(canvas) {
  if (canvas && canvas.offsetParent !== null) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function drawCustomerSignaturePlaceholder(canvas) {
  if (canvas && canvas.offsetParent !== null) {
    const ctx = canvas.getContext('2d');
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = 150 * ratio; 
      ctx.scale(ratio, ratio);
    }
    
    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);

    // Get styles from the helper div
    const computedStyle = window.getComputedStyle(customerPlaceholderStyleHelper);
    const fontStyle = computedStyle.getPropertyValue('font-style');
    const fontSize = computedStyle.getPropertyValue('font-size');
    const fontFamily = computedStyle.getPropertyValue('font-family');
    const color = computedStyle.getPropertyValue('color');

    ctx.font = `${fontStyle} ${fontSize} ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Customize placeholder text based on canvas ID
    let placeholderText = "Sign here";
    
    switch (canvas.id) {
      case 'customerSigCanvas':
        placeholderText = "Customer Sign Here";
        break;
      case 'customerWitnessSigCanvas':
        placeholderText = "Witness Sign Here";
        break;
      default:
        placeholderText = "Sign Here";
    }
    
    ctx.fillText(placeholderText, (canvas.width / ratio) / 2, (canvas.height / ratio) / 2);
    
    // Mark that this canvas has a placeholder
    customerCanvasHasPlaceholder[canvas.id] = true;
  }
}

function clearCustomerCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  let signaturePad;
  
  // Get the correct signature pad instance
  switch (canvasId) {
    case 'customerSigCanvas':
      signaturePad = customerSignaturePad;
      break;
    case 'customerWitnessSigCanvas':
      signaturePad = customerWitnessSignaturePad;
      break;
    default:
      return;
  }
  
  if (signaturePad) {
    signaturePad.clear();
    drawCustomerSignaturePlaceholder(canvas);
    
    // Reset signature flag
    customerCanvasHasSignature[canvasId] = false;
    // Set placeholder flag
    customerCanvasHasPlaceholder[canvasId] = true;
    
    // Clear hidden input
    const hiddenInputId = canvasId.replace('Canvas', 'Signature'); 
    const hiddenInput = document.getElementById(hiddenInputId);
    if (hiddenInput) {
      hiddenInput.value = '';
    }
  }
}

function isCustomerCanvasEmpty(canvas) {
  if (!canvas || canvas.offsetParent === null) return true;
  
  let signaturePad;
  
  // Get the correct signature pad instance
  switch (canvas.id) {
    case 'customerSigCanvas':
      signaturePad = customerSignaturePad;
      break;
    case 'customerWitnessSigCanvas':
      signaturePad = customerWitnessSignaturePad;
      break;
    default:
      return true;
  }
  
  if (signaturePad) {
    return signaturePad.isEmpty();
  }
  
  return true;
}

function calculateAge(dobString) {
  if (!dobString) return '';
  
  // Parse DD/MM/YYYY format
  const parts = dobString.split('/');
  if (parts.length !== 3) return '';
  
  // Create date with parts[0] as day, parts[1] as month (0-indexed), parts[2] as year
  const birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
  
  // Check if the date is valid
  if (isNaN(birthDate.getTime())) {
    return ''; // Return empty string for invalid date formats
  }
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function prepareCustomerFormData() {
  if (customerSignaturePad && customerSignaturePad.isEmpty()) {
    alert("Customer signature is required.");
    document.getElementById("customerSignature").value = '';
    return false;
  }
  
  document.getElementById("customerSignature").value = customerSignaturePad.toDataURL("image/png");
  
  // Handle Customer Witness Signature
  const customerWitnessNameInput = document.getElementById('customerWitnessName');
  const customerWitnessSignatureValue = customerWitnessSignaturePad && !customerWitnessSignaturePad.isEmpty() 
                            ? customerWitnessSignaturePad.toDataURL("image/png") 
                            : '';
  document.getElementById("customerWitnessSignature").value = customerWitnessSignatureValue;

  if (customerWitnessSignatureValue !== '' && customerWitnessNameInput && customerWitnessNameInput.value.trim() === '') {
    alert("Witness name is required when a witness signature is provided for the customer.");
    customerWitnessNameInput.focus();
    return false;
  }
  
  if (customerWitnessNameInput && customerWitnessNameInput.value.trim() !== '' && customerWitnessSignatureValue === ''){
    alert("Witness signature is required when a witness name is provided for the customer.");
    return false;
  }

  return true;
}

// Add event listener for report type select
if (customerReportType) {
  customerReportType.addEventListener('change', function() {
    const fullName = customerFullNameInput.value;
    const dob = customerDobInput.value;
    const age = calculateAge(dob);
    const reportType = this.value;
    let defaultText = '';

    if (reportType === 'deposit') {
      defaultText = `My name is ${fullName}.\nI am currently ${age}.\nToday I put down a deposit toward buying a cool tool.\nI know it's nonrefundable`;
    } else if (reportType === 'cancel') {
      defaultText = `My name is ${fullName}.\nI am currently ${age}.\nAs of today I wish to cancel my order.\nI know my deposit was nonrefundable so I can not get a refund on this.\nWith that said I still wish to cancel my order.`;
    }
    
    customerReportNotesTextarea.value = defaultText;
  });
}

// Form submission handler
function handleCustomerFormSubmit(event) {
  event.preventDefault();
  
  // Validate and prepare form data
  if (!prepareCustomerFormData()) {
    return false;
  }
  
  // Generate PDF using the customer-specific function
  if (typeof generateCustomerPDF === 'function') {
    generateCustomerPDF();
  } else {
    console.error('Customer PDF generation module not loaded');
    alert('PDF generation is not available. Please refresh the page.');
  }
  
  return false;
}

// Reset form function
function resetCustomerForm() {
  // Reset all form fields
  customerForm.reset();
  
  // Clear signatures
  clearCustomerCanvas('customerSigCanvas');
  clearCustomerCanvas('customerWitnessSigCanvas');
  
  // Reset hidden inputs
  document.getElementById("customerSignature").value = '';
  document.getElementById("customerWitnessSignature").value = '';
  
  // Clear report notes
  customerReportNotesTextarea.value = '';
}

// DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
  // Ensure the helper is in the DOM before trying to get styles
  if (!document.body.contains(customerPlaceholderStyleHelper)) {
    document.body.appendChild(customerPlaceholderStyleHelper);
  }

  // Initialize signature pads
  if (customerSigCanvasEl) {
    customerSignaturePad = initializeCustomerSignaturePad(customerSigCanvasEl);
  }
  
  if (customerWitnessSigCanvasEl) {
    customerWitnessSignaturePad = initializeCustomerSignaturePad(customerWitnessSigCanvasEl);
    
    // Add event listener to customer witness position select to update pen color
    document.getElementById('customerWitnessPosition').addEventListener('change', function() {
      const customerWitnessPosition = this.value;
      let penColor = 'black';
      
      switch (customerWitnessPosition) {
        case 'supervisor': penColor = 'blue'; break;
        case 'manager': penColor = 'red'; break;
        case 'director': penColor = 'green'; break;
        default: penColor = 'black';
      }
      
      if (customerWitnessSignaturePad) {
        customerWitnessSignaturePad.penColor = penColor;
      }
    });
  }
  
  // Add form submit event listener
  if (customerForm) {
    customerForm.addEventListener('submit', handleCustomerFormSubmit);
  }
  
  // Add event listeners for clear buttons
  document.querySelectorAll('.clear-sig-btn').forEach(button => {
    const canvasId = button.dataset.canvasId;
    if (canvasId === 'customerSigCanvas' || canvasId === 'customerWitnessSigCanvas') {
      button.addEventListener('click', function() {
        clearCustomerCanvas(canvasId);
      });
    }
  });
  
  // Add event listeners for form toggle
  document.getElementById('showCustomerForm').addEventListener('change', function() {
    if (this.checked) {
      document.getElementById('customerForm').style.display = 'block';
      document.getElementById('staffForm').style.display = 'none';
      document.getElementById('dashcamForm').style.display = 'none';
      document.getElementById('customerFormHeading').style.display = 'block';
      document.getElementById('staffFormHeading').style.display = 'none';
      document.getElementById('dashcamFormHeading').style.display = 'none';
      
      // Reinitialize customer signature pads when switching to customer form
      if (customerSigCanvasEl) {
        customerSignaturePad = initializeCustomerSignaturePad(customerSigCanvasEl);
      }
      
      if (customerWitnessSigCanvasEl) {
        customerWitnessSignaturePad = initializeCustomerSignaturePad(customerWitnessSigCanvasEl);
      }
    }
  });
  
  // Add reset button event listener
  const resetCustomerFormBtn = document.getElementById('resetCustomerForm');
  if (resetCustomerFormBtn) {
    resetCustomerFormBtn.addEventListener('click', resetCustomerForm);
  }
});


function getFormattedDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(now.getDate()).padStart(2, '0');

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
