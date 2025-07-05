// Staff Form JavaScript

// DOM Elements
const staffSigCanvasEl = document.getElementById("staffSigCanvas");
const witnessSigCanvasEl = document.getElementById("witnessSigCanvas");
const staffForm = document.getElementById('staffForm');
const staffReportTemplate = document.getElementById('staffReportTemplate');
const staffFullNameInput = document.getElementById('staffFullName');
const staffAgeInput = document.getElementById('staffAge');
const staffReportNotesTextarea = document.getElementById('staffReportNotes');

// Create a helper div to get computed styles for the placeholder text
const staffPlaceholderStyleHelper = document.createElement('div');
staffPlaceholderStyleHelper.className = 'signature-placeholder-text';
staffPlaceholderStyleHelper.style.display = 'none';
document.body.appendChild(staffPlaceholderStyleHelper);

// Signature pad instances
let staffSignaturePad, witnessSignaturePad;

// Track if canvases have signatures
let staffCanvasHasSignature = {
  staffSigCanvas: false,
  witnessSigCanvas: false
};

// Track if canvases have placeholders
let staffCanvasHasPlaceholder = {
  staffSigCanvas: true,
  witnessSigCanvas: true
};

function initializeStaffSignaturePad(canvas, options = {}) {
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
  drawStaffSignaturePlaceholder(canvas);
  
  // Add event listeners for the signature pad
  signaturePad.addEventListener("beginStroke", () => {
    // Clear placeholder when drawing begins
    if (staffCanvasHasPlaceholder[canvas.id]) {
      clearStaffPlaceholder(canvas);
      staffCanvasHasPlaceholder[canvas.id] = false;
    }
  });
  
  signaturePad.addEventListener("endStroke", () => {
    // Update signature flag
    staffCanvasHasSignature[canvas.id] = !signaturePad.isEmpty();
  });
  
  return signaturePad;
}

function clearStaffPlaceholder(canvas) {
  if (canvas && canvas.offsetParent !== null) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function drawStaffSignaturePlaceholder(canvas) {
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
    const computedStyle = window.getComputedStyle(staffPlaceholderStyleHelper);
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
      case 'staffSigCanvas':
        placeholderText = "Staff Sign Here";
        break;
      case 'witnessSigCanvas':
        placeholderText = "Witness Sign Here";
        break;
      default:
        placeholderText = "Sign Here";
    }
    
    ctx.fillText(placeholderText, (canvas.width / ratio) / 2, (canvas.height / ratio) / 2);
    
    // Mark that this canvas has a placeholder
    staffCanvasHasPlaceholder[canvas.id] = true;
  }
}

function clearStaffCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  let signaturePad;
  
  // Get the correct signature pad instance
  switch (canvasId) {
    case 'staffSigCanvas':
      signaturePad = staffSignaturePad;
      break;
    case 'witnessSigCanvas':
      signaturePad = witnessSignaturePad;
      break;
    default:
      return;
  }
  
  if (signaturePad) {
    signaturePad.clear();
    drawStaffSignaturePlaceholder(canvas);
    
    // Reset signature flag
    staffCanvasHasSignature[canvasId] = false;
    // Set placeholder flag
    staffCanvasHasPlaceholder[canvasId] = true;
    
    // Clear hidden input
    const hiddenInputId = canvasId.replace('Canvas', 'Signature'); 
    const hiddenInput = document.getElementById(hiddenInputId);
    if (hiddenInput) {
      hiddenInput.value = '';
    }
  }
}

function isStaffCanvasEmpty(canvas) {
  if (!canvas || canvas.offsetParent === null) return true;
  
  let signaturePad;
  
  // Get the correct signature pad instance
  switch (canvas.id) {
    case 'staffSigCanvas':
      signaturePad = staffSignaturePad;
      break;
    case 'witnessSigCanvas':
      signaturePad = witnessSignaturePad;
      break;
    default:
      return true;
  }
  
  if (signaturePad) {
    return signaturePad.isEmpty();
  }
  
  return true;
}

function prepareStaffFormData() {
  const staffTypeSelect = document.getElementById('staffType');
  if (staffTypeSelect && staffTypeSelect.value === "") {
    alert("Please select a staff position.");
    return false;
  }
  
  if (staffSignaturePad && staffSignaturePad.isEmpty()) {
    alert("Staff signature is required.");
    document.getElementById("staffSignature").value = '';
    return false;
  }
  
  document.getElementById("staffSignature").value = staffSignaturePad.toDataURL("image/png");
  
  const witnessNameInput = document.getElementById('witnessName');
  const witnessPositionInput = document.getElementById('witnessPosition');
  const witnessSignatureDataURL = witnessSignaturePad && !witnessSignaturePad.isEmpty() ? witnessSignaturePad.toDataURL('image/png') : '';
  
  document.getElementById("witnessSignature").value = witnessSignatureDataURL;
  document.getElementById('hiddenWitnessPosition').value = witnessPositionInput ? witnessPositionInput.value : '';

  if (witnessSignatureDataURL !== '' && witnessNameInput && witnessNameInput.value.trim() === '') {
    alert("Witness name is required when a witness signature is provided.");
    witnessNameInput.focus();
    return false;
  }
  
  if (witnessNameInput && witnessNameInput.value.trim() !== '' && witnessSignatureDataURL === '') {
    alert("Witness signature is required when a witness name is provided.");
    return false;
  }

  return true;
}

// Add event listener for staff report template select
if (staffReportTemplate) {
  staffReportTemplate.addEventListener('change', function() {
    const fullName = staffFullNameInput.value;
    const age = staffAgeInput.value;
    const staffTemplate = this.value;
    let defaultText = '';

    if (staffTemplate === 'staff1') {
      defaultText = `My name is ${fullName}.\nI am currently ${age}.\n`;
    } else if (staffTemplate === 'staff2') {
      defaultText = `My name is ${fullName}.\nI am currently ${age}.\n`;
    } else if (staffTemplate === 'staff3') {
      defaultText = `My name is ${fullName}.\nI am currently ${age}.\n`;
    }
    
    staffReportNotesTextarea.value = defaultText;
  });
}

// Form submission handler
function handleStaffFormSubmit(event) {
  event.preventDefault();
  
  // Validate and prepare form data
  if (!prepareStaffFormData()) {
    return false;
  }
  
  // Generate PDF using the staff-specific function
  if (typeof generateStaffPDF === 'function') {
    generateStaffPDF();
  } else {
    console.error('Staff PDF generation module not loaded');
    alert('PDF generation is not available. Please refresh the page.');
  }
  
  return false;
}

// Reset form function
function resetStaffForm() {
  // Reset all form fields
  staffForm.reset();
  
  // Clear signatures
  clearStaffCanvas('staffSigCanvas');
  clearStaffCanvas('witnessSigCanvas');
  
  // Reset hidden inputs
  document.getElementById("staffSignature").value = '';
  document.getElementById("witnessSignature").value = '';
  document.getElementById('hiddenWitnessPosition').value = '';
  
  // Clear report notes
  staffReportNotesTextarea.value = '';
}

// DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
  // Ensure the helper is in the DOM before trying to get styles
  if (!document.body.contains(staffPlaceholderStyleHelper)) {
    document.body.appendChild(staffPlaceholderStyleHelper);
  }

  // Initialize signature pads
  if (staffSigCanvasEl) {
    staffSignaturePad = initializeStaffSignaturePad(staffSigCanvasEl);
    
    // Add event listener to staff type select to update pen color
    document.getElementById('staffType').addEventListener('change', function() {
      const staffType = this.value;
      let penColor = 'black';
      
      switch (staffType) {
        case 'supervisor': penColor = 'blue'; break;
        case 'manager': penColor = 'red'; break;
        case 'director': penColor = 'green'; break;
        default: penColor = 'black';
      }
      
      if (staffSignaturePad) {
        staffSignaturePad.penColor = penColor;
      }
    });
  }
  
  if (witnessSigCanvasEl) {
    witnessSignaturePad = initializeStaffSignaturePad(witnessSigCanvasEl);
    
    // Add event listener to witness position select to update pen color
    document.getElementById('witnessPosition').addEventListener('change', function() {
      const witnessPosition = this.value;
      let penColor = 'black';
      
      switch (witnessPosition) {
        case 'supervisor': penColor = 'blue'; break;
        case 'manager': penColor = 'red'; break;
        case 'director': penColor = 'green'; break;
        default: penColor = 'black';
      }
      
      if (witnessSignaturePad) {
        witnessSignaturePad.penColor = penColor;
      }
    });
  }
  
  // Add form submit event listener
  if (staffForm) {
    staffForm.addEventListener('submit', handleStaffFormSubmit);
  }
  
  // Add event listeners for clear buttons
  document.querySelectorAll('.clear-sig-btn').forEach(button => {
    const canvasId = button.dataset.canvasId;
    if (canvasId === 'staffSigCanvas' || canvasId === 'witnessSigCanvas') {
      button.addEventListener('click', function() {
        clearStaffCanvas(canvasId);
      });
    }
  });
  
  // Add event listeners for form toggle
  document.getElementById('showStaffForm').addEventListener('change', function() {
    if (this.checked) {
      document.getElementById('staffForm').style.display = 'block';
      document.getElementById('customerForm').style.display = 'none';
      document.getElementById('dashcamForm').style.display = 'none';
      document.getElementById('staffFormHeading').style.display = 'block';
      document.getElementById('customerFormHeading').style.display = 'none';
      document.getElementById('dashcamFormHeading').style.display = 'none';
      
      // Reinitialize staff signature pads when switching to staff form
      if (staffSigCanvasEl) {
        staffSignaturePad = initializeStaffSignaturePad(staffSigCanvasEl);
      }
      
      if (witnessSigCanvasEl) {
        witnessSignaturePad = initializeStaffSignaturePad(witnessSigCanvasEl);
      }
    }
  });
});

// Add reset button event listener
const resetStaffFormBtn = document.getElementById('resetStaffForm');
if (resetStaffFormBtn) {
  resetStaffFormBtn.addEventListener('click', resetStaffForm);
}