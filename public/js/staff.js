// Staff Form JavaScript

// Initialize signature manager for staff forms
let staffSignatureManager;
let staffSignaturePad, witnessSignaturePad;

// DOM Elements (will be set when form is loaded)
let staffSigCanvasEl, witnessSigCanvasEl, staffForm, staffReportTemplate, staffFullNameInput, staffAgeInput, staffReportNotesTextarea;

function initializeStaffDOMElements() {
  staffSigCanvasEl = document.getElementById("staffSigCanvas");
  witnessSigCanvasEl = document.getElementById("witnessSigCanvas");
  staffForm = document.getElementById('staffForm');
  staffReportTemplate = document.getElementById('staffReportTemplate');
  staffFullNameInput = document.getElementById('staffFullName');
  staffAgeInput = document.getElementById('staffAge');
  staffReportNotesTextarea = document.getElementById('staffReportNotes');
}

function prepareStaffFormData() {
  const staffTypeSelect = document.getElementById('staffType');
  if (staffTypeSelect && staffTypeSelect.value === "") {
    alert("Please select a staff position.");
    return false;
  }
  
  if (staffSignatureManager.isCanvasEmpty('staffSigCanvas')) {
    alert("Staff signature is required.");
    document.getElementById("staffSignature").value = '';
    return false;
  }
  
  document.getElementById("staffSignature").value = staffSignatureManager.getSignatureDataURL('staffSigCanvas');
  
  const witnessNameInput = document.getElementById('witnessName');
  const witnessPositionInput = document.getElementById('witnessPosition');
  const witnessSignatureDataURL = staffSignatureManager.getSignatureDataURL('witnessSigCanvas');
  
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
  if (staffForm) {
    staffForm.reset();
  }
  
  // Clear signatures using signature manager
  if (staffSignatureManager) {
    staffSignatureManager.clearCanvas('staffSigCanvas');
    staffSignatureManager.clearCanvas('witnessSigCanvas');
  }
  
  // Reset hidden inputs
  const staffSignatureInput = document.getElementById("staffSignature");
  const witnessSignatureInput = document.getElementById("witnessSignature");
  const hiddenWitnessPositionInput = document.getElementById('hiddenWitnessPosition');
  
  if (staffSignatureInput) staffSignatureInput.value = '';
  if (witnessSignatureInput) witnessSignatureInput.value = '';
  if (hiddenWitnessPositionInput) hiddenWitnessPositionInput.value = '';
  
  // Clear report notes
  if (staffReportNotesTextarea) {
    staffReportNotesTextarea.value = '';
  }
}

// Initialize staff form - called by FormLoader
window.initializeStaffForm = function() {
  // Initialize DOM elements
  initializeStaffDOMElements();
  
  // Initialize signature manager
  staffSignatureManager = new SignatureManager('staff');
  
  // Initialize signature pads using signature manager
  if (staffSigCanvasEl) {
    staffSignaturePad = staffSignatureManager.initializeSignaturePad(staffSigCanvasEl);
    
    // Add event listener to staff type select to update pen color
    const staffTypeSelect = document.getElementById('staffType');
    if (staffTypeSelect) {
      staffTypeSelect.addEventListener('change', function() {
        staffSignatureManager.updatePenColor('staffSigCanvas', this.value);
      });
    }
  }
  
  if (witnessSigCanvasEl) {
    witnessSignaturePad = staffSignatureManager.initializeSignaturePad(witnessSigCanvasEl);
    
    // Add event listener to witness position select to update pen color
    const witnessPositionSelect = document.getElementById('witnessPosition');
    if (witnessPositionSelect) {
      witnessPositionSelect.addEventListener('change', function() {
        staffSignatureManager.updatePenColor('witnessSigCanvas', this.value);
      });
    }
  }
  
  // Add form submit event listener
  if (staffForm) {
    staffForm.addEventListener('submit', handleStaffFormSubmit);
  }
  
  // Setup clear buttons using signature manager
  staffSignatureManager.setupClearButtons('.clear-sig-btn[data-canvas-id="staffSigCanvas"], .clear-sig-btn[data-canvas-id="witnessSigCanvas"]');
  
  // Add event listener for staff report template select
  if (staffReportTemplate) {
    staffReportTemplate.addEventListener('change', function() {
      const fullName = staffFullNameInput ? staffFullNameInput.value : '';
      const age = staffAgeInput ? staffAgeInput.value : '';
      const staffTemplate = this.value;
      let defaultText = '';

      if (staffTemplate === 'staff1') {
        defaultText = `My name is ${fullName}.\nI am currently ${age}.\n`;
      } else if (staffTemplate === 'staff2') {
        defaultText = `My name is ${fullName}.\nI am currently ${age}.\n`;
      } else if (staffTemplate === 'staff3') {
        defaultText = `My name is ${fullName}.\nI am currently ${age}.\n`;
      }
      
      if (staffReportNotesTextarea) {
        staffReportNotesTextarea.value = defaultText;
      }
    });
  }
  
  // Add reset button event listener
  const resetStaffFormBtn = document.getElementById('resetStaffForm');
  if (resetStaffFormBtn) {
    resetStaffFormBtn.addEventListener('click', resetStaffForm);
  }
};