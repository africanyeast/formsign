// Customer Form JavaScript

// Initialize signature manager for customer forms
let customerSignatureManager;
let customerSignaturePad, customerWitnessSignaturePad;

// DOM Elements (will be set when form is loaded)
let customerSigCanvasEl, customerWitnessSigCanvasEl, customerForm, customerReportType, customerFullNameInput, customerDobInput, customerReportNotesTextarea;

function initializeCustomerDOMElements() {
  customerSigCanvasEl = document.getElementById("customerSigCanvas");
  customerWitnessSigCanvasEl = document.getElementById("customerWitnessSigCanvas");
  customerForm = document.getElementById('customerForm');
  customerReportType = document.getElementById('customerReportType');
  customerFullNameInput = document.getElementById('customerFullName');
  customerDobInput = document.getElementById('customerDob');
  customerReportNotesTextarea = document.getElementById('customerReportNotes');
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
  if (customerSignatureManager.isCanvasEmpty('customerSigCanvas')) {
    alert("Customer signature is required.");
    document.getElementById("customerSignature").value = '';
    return false;
  }
  
  document.getElementById("customerSignature").value = customerSignatureManager.getSignatureDataURL('customerSigCanvas');
  
  // Handle Customer Witness Signature
  const customerWitnessNameInput = document.getElementById('customerWitnessName');
  const customerWitnessSignatureValue = customerSignatureManager.getSignatureDataURL('customerWitnessSigCanvas');
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
  if (customerForm) {
    customerForm.reset();
  }
  
  // Clear signatures using signature manager
  if (customerSignatureManager) {
    customerSignatureManager.clearCanvas('customerSigCanvas');
    customerSignatureManager.clearCanvas('customerWitnessSigCanvas');
  }
  
  // Reset hidden inputs
  const customerSignatureInput = document.getElementById("customerSignature");
  const customerWitnessSignatureInput = document.getElementById("customerWitnessSignature");
  
  if (customerSignatureInput) customerSignatureInput.value = '';
  if (customerWitnessSignatureInput) customerWitnessSignatureInput.value = '';
  
  // Clear report notes
  if (customerReportNotesTextarea) {
    customerReportNotesTextarea.value = '';
  }
}

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

// Initialize customer form - called by FormLoader
window.initializeCustomerForm = function() {
  // Initialize DOM elements
  initializeCustomerDOMElements();
  
  // Initialize signature manager
  customerSignatureManager = new SignatureManager('customer');
  
  // Initialize signature pads using signature manager
  if (customerSigCanvasEl) {
    customerSignaturePad = customerSignatureManager.initializeSignaturePad(customerSigCanvasEl);
  }
  
  if (customerWitnessSigCanvasEl) {
    customerWitnessSignaturePad = customerSignatureManager.initializeSignaturePad(customerWitnessSigCanvasEl);
    
    // Add event listener to customer witness position select to update pen color
    const customerWitnessPositionSelect = document.getElementById('customerWitnessPosition');
    if (customerWitnessPositionSelect) {
      customerWitnessPositionSelect.addEventListener('change', function() {
        customerSignatureManager.updatePenColor('customerWitnessSigCanvas', this.value);
      });
    }
  }
  
  // Add form submit event listener
  if (customerForm) {
    customerForm.addEventListener('submit', handleCustomerFormSubmit);
  }
  
  // Setup clear buttons using signature manager
  customerSignatureManager.setupClearButtons('.clear-sig-btn[data-canvas-id="customerSigCanvas"], .clear-sig-btn[data-canvas-id="customerWitnessSigCanvas"]');
  
  // Add event listener for report type select
  if (customerReportType) {
    customerReportType.addEventListener('change', function() {
      const fullName = customerFullNameInput ? customerFullNameInput.value : '';
      const dob = customerDobInput ? customerDobInput.value : '';
      const age = calculateAge(dob);
      const reportType = this.value;
      let defaultText = '';

      if (reportType === 'deposit') {
        defaultText = `My name is ${fullName}.\nI am currently ${age}.\nToday I put down a deposit toward buying a cool tool.\nI know it's nonrefundable`;
      } else if (reportType === 'cancel') {
        defaultText = `My name is ${fullName}.\nI am currently ${age}.\nAs of today I wish to cancel my order.\nI know my deposit was nonrefundable so I can not get a refund on this.\nWith that said I still wish to cancel my order.`;
      }
      
      if (customerReportNotesTextarea) {
        customerReportNotesTextarea.value = defaultText;
      }
    });
  }
  
  // Add reset button event listener
  const resetCustomerFormBtn = document.getElementById('resetCustomerForm');
  if (resetCustomerFormBtn) {
    resetCustomerFormBtn.addEventListener('click', resetCustomerForm);
  }
};
