// Request for Service Form JavaScript

// Initialize signature manager for reqforservice forms
let reqForServiceSignatureManager;
let reqForServiceStaffSignaturePad, reqForServiceWitnessSignaturePad;

// DOM Elements (will be set when form is loaded)
let reqForServiceStaffSigCanvasEl, reqForServiceWitnessSigCanvasEl, reqForServiceForm;
let requestTypeSelect, infoToReadBtn, infoToReadSection, infoToReadText, infoToReadButton;
let infoToReadButtonContainer, reqForServiceFormButtons;
let reqstaffFullNameInput, reqstaffPositionInput, reqstaffOfficeLocationInput;
let clientFullNameInput, clientAddressInput, clientDobInput, clientVehicleRegInput, clientVehicleDescInput;
let issueDescriptionInput, issueLocationInput, issueDateTimeInput, issueTimeTakenInput;

function initializeReqForServiceDOMElements() {
  reqForServiceStaffSigCanvasEl = document.getElementById("reqForServiceStaffSigCanvas");
  reqForServiceWitnessSigCanvasEl = document.getElementById("reqForServiceWitnessSigCanvas");
  reqForServiceForm = document.getElementById('reqForServiceForm');
  requestTypeSelect = document.getElementById('requestType');
  infoToReadBtn = document.getElementById('infoToReadBtn');
  infoToReadSection = document.getElementById('infoToReadSection');
  infoToReadText = document.getElementById('infoToReadText');
  infoToReadButton = document.getElementById('infoToReadButton');
  infoToReadButtonContainer = document.getElementById('infoToReadButtonContainer');
  reqForServiceFormButtons = document.getElementById('reqForServiceFormButtons');
  
  // Staff fields
  reqstaffFullNameInput = document.getElementById('reqstaffFullName');
  reqstaffPositionInput = document.getElementById('reqstaffPosition');
  reqstaffOfficeLocationInput = document.getElementById('reqstaffOfficeLocation');
  
  // Client fields
  clientFullNameInput = document.getElementById('clientFullName');
  clientAddressInput = document.getElementById('clientAddress');
  clientDobInput = document.getElementById('clientDob');
  clientVehicleRegInput = document.getElementById('clientVehicleReg');
  clientVehicleDescInput = document.getElementById('clientVehicleDesc');
  
  // Issue fields
  issueDescriptionInput = document.getElementById('issueDescription');
  issueLocationInput = document.getElementById('issueLocation');
  issueDateTimeInput = document.getElementById('issueDateTime');
  issueTimeTakenInput = document.getElementById('issueTimeTaken');
}

// Function to check if all required fields are filled
function checkRequiredFields() {
  const requiredFields = [
    reqstaffFullNameInput,
    reqstaffPositionInput,
    reqstaffOfficeLocationInput,
    clientFullNameInput,
    clientAddressInput,
    clientDobInput,
    clientVehicleRegInput,
    clientVehicleDescInput,
    issueDescriptionInput,
    issueLocationInput,
    issueDateTimeInput,
    issueTimeTakenInput
  ];
  
  return requiredFields.every(field => field.value.trim() !== '');
}

// Function to update the visibility of the "Info to Read" button
function updateInfoToReadButtonVisibility() {
  if (checkRequiredFields()) {
    infoToReadButtonContainer.style.display = 'block';
  } else {
    infoToReadButtonContainer.style.display = 'none';
  }
}

function prepareReqForServiceFormData() {
  if (reqForServiceSignatureManager.isCanvasEmpty('reqForServiceStaffSigCanvas')) {
    alert("Staff signature is required.");
    document.getElementById("reqForServiceStaffSignature").value = '';
    return false;
  }
  
  document.getElementById("reqForServiceStaffSignature").value = reqForServiceSignatureManager.getSignatureDataURL('reqForServiceStaffSigCanvas');
  
  // Handle Customer Signature (not witness)
  if (reqForServiceSignatureManager.isCanvasEmpty('reqForServiceCustomerSigCanvas')) {
    alert("Customer signature is required.");
    document.getElementById("reqForServiceCustomerSignature").value = '';
    return false;
  }
  
  document.getElementById("reqForServiceCustomerSignature").value = reqForServiceSignatureManager.getSignatureDataURL('reqForServiceCustomerSigCanvas');

  return true;
}

// Form submission handler
function handleReqForServiceFormSubmit(event) {
  event.preventDefault();
  
  // Validate and prepare form data
  if (!prepareReqForServiceFormData()) {
    return false;
  }
  
  // Generate PDF using the reqforservice-specific function
  if (typeof generateReqForServicePDF === 'function') {
    generateReqForServicePDF();
  } else {
    console.error('ReqForService PDF generation module not loaded');
    alert('PDF generation is not available. Please refresh the page.');
  }
  
  return false;
}

// Reset form function
function updateFormHeading(text) {
  const heading = document.getElementById('reqforserviceFormHeading');
  if (heading) {
    const headingElement = heading.querySelector('h5');
    if (headingElement) {
      headingElement.textContent = text;
    }
  }
}

function showInfoToReadSection() {
  populateInfoToReadTexts();
  
  // Update the main heading
  updateFormHeading('Read and confirm information');
  
  const infoToReadSection = document.getElementById('infoToReadSection');
  const infoToReadButtonContainer = document.getElementById('infoToReadButtonContainer');
  const mainFormSections = document.getElementById('mainFormSections');
  const formButtons = document.getElementById('reqForServiceFormButtons');
  
  if (infoToReadSection && mainFormSections) {
    // Hide main form sections
    mainFormSections.style.display = 'none';
    
    // Hide the Info to Read button
    if (infoToReadButtonContainer) {
      infoToReadButtonContainer.style.display = 'none';
    }
    
    // Show the Info to Read section
    infoToReadSection.style.display = 'block';
    
    // Show form buttons
    if (formButtons) {
      formButtons.style.display = 'block';
    }
    
    // Initialize signature pads with a slight delay
    setTimeout(() => {
      initializeSignaturePads();
    }, 100);
  }
}

function resetReqForServiceForm() {
  // Reset all form fields
  reqForServiceForm.reset();
  
  // Clear signatures using signature manager
  reqForServiceSignatureManager.clearCanvas('reqForServiceStaffSigCanvas');
  reqForServiceSignatureManager.clearCanvas('reqForServiceCustomerSigCanvas');
  
  // Reset hidden inputs
  document.getElementById("reqForServiceStaffSignature").value = '';
  document.getElementById("reqForServiceCustomerSignature").value = '';
  
  // Reset form heading
  updateFormHeading('Welcome to the request for service page');
  
  // Show main form sections container
  const mainFormSections = document.getElementById('mainFormSections');
  if (mainFormSections) {
    mainFormSections.style.display = 'block';
  }
  
  // Hide the info to read section
  if (infoToReadSection) infoToReadSection.style.display = 'none';
  if (infoToReadButtonContainer) infoToReadButtonContainer.style.display = 'none';
  if (reqForServiceFormButtons) reqForServiceFormButtons.style.display = 'none';
  
  // Show only request type dropdown
  showRequestTypeOnly();
}

// Function to show only the request type dropdown
function showRequestTypeOnly() {
  if (!reqForServiceForm) return;
  
  // Hide all form sections except the request type dropdown
  const formSections = reqForServiceForm.querySelectorAll('.mb-3:not(:first-child)');
  formSections.forEach(section => {
    section.style.display = 'none';
  });
  
  // Show the request type dropdown
  const requestTypeContainer = reqForServiceForm.querySelector('.mb-3:first-child');
  if (requestTypeContainer) {
    requestTypeContainer.style.display = 'block';
  }
  
  // Hide the info to read section and button
  if (infoToReadSection) infoToReadSection.style.display = 'none';
  if (infoToReadButtonContainer) infoToReadButtonContainer.style.display = 'none';
  if (reqForServiceFormButtons) reqForServiceFormButtons.style.display = 'none';
}

// Function to show form fields after request type selection
function showFormFields() {
  if (!reqForServiceForm) return;
  
  // Hide the request type dropdown
  const requestTypeContainer = reqForServiceForm.querySelector('.mb-3:first-child');
  if (requestTypeContainer) {
    requestTypeContainer.style.display = 'none';
  }
  
  // Show all form fields except the info to read section
  const formSections = reqForServiceForm.querySelectorAll('.mb-3:not(:first-child)');
  formSections.forEach(section => {
    if (!section.contains(infoToReadSection) && section !== infoToReadButtonContainer) {
      section.style.display = 'block';
    }
  });
  
  // Show the info to read button container (but button visibility depends on fields being filled)
  if (infoToReadButtonContainer) {
    infoToReadButtonContainer.style.display = 'none'; // Initially hidden until fields are filled
  }
  updateInfoToReadButtonVisibility(); // Check if fields are already filled
}

// Function to update Info to Read button visibility
function updateInfoToReadButtonVisibility() {
  const requiredFields = [
    reqstaffFullNameInput,
    reqstaffPositionInput,
    reqstaffOfficeLocationInput,
    clientFullNameInput,
    clientAddressInput,
    clientDobInput,
    clientVehicleRegInput,
    clientVehicleDescInput,
    issueDescriptionInput,
    issueLocationInput,
    issueDateTimeInput,
    issueTimeTakenInput
  ];
  
  const allFieldsFilled = requiredFields.every(field => field && field.value.trim() !== '');
  
  if (infoToReadButtonContainer) {
    infoToReadButtonContainer.style.display = allFieldsFilled ? 'block' : 'none';
  }
}

// Function to populate individual info to read text elements
function populateInfoToReadTexts() {
  // Get current date and time
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
  const formattedTime = `${formattedHours}:${formattedMinutes}${ampm}`;
  
  // Format the date as "Sunday 06 July 2025"
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = days[now.getDay()];
  const date = now.getDate().toString().padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const formattedDate = `${day} ${date} ${month} ${year}`;
  
  // Populate individual text elements
  const timeAndStaffEl = document.getElementById('timeAndStaffText');
  if (timeAndStaffEl) {
    timeAndStaffEl.innerHTML = `The time at the moment is ${formattedTime} on ${formattedDate}<br>I am ${reqstaffFullNameInput.value}. I am a ${reqstaffPositionInput.value} from ${reqstaffOfficeLocationInput.value}.`;
  }
  
  const clientIdentityEl = document.getElementById('clientIdentityText');
  if (clientIdentityEl) {
    clientIdentityEl.textContent = `Are you ${clientFullNameInput.value} from ${clientAddressInput.value} and date of birth: ${clientDobInput.value}?`;
  }
  
  const vehicleOwnershipEl = document.getElementById('vehicleOwnershipText');
  if (vehicleOwnershipEl) {
    vehicleOwnershipEl.textContent = `Are you the owner of ${clientVehicleDescInput.value} (${clientVehicleRegInput.value})?`;
  }
  
  const serviceExplanationEl = document.getElementById('serviceExplanationText');
  if (serviceExplanationEl) {
    serviceExplanationEl.textContent = `I understand that you would like us to do a service on your vehicle. I must explain a few conditions to you. I understand that you want us to look at ${issueDescriptionInput.value} located at ${issueLocationInput.value} on ${issueDateTimeInput.value}.`;
  }
  
  const additionalInfoEl = document.getElementById('additionalInfoText');
  if (additionalInfoEl) {
    additionalInfoEl.textContent = `Please verbally tell me more information about the ${issueDescriptionInput.value} at ${issueLocationInput.value}.`;
  }
}

// Function to show the combined text and input fields section
function showInfoToReadSection() {
  populateInfoToReadTexts();
  
  // Update the main heading
  updateFormHeading('Read and confirm information');
  
  const infoToReadSection = document.getElementById('infoToReadSection');
  const infoToReadButtonContainer = document.getElementById('infoToReadButtonContainer');
  const mainFormSections = document.getElementById('mainFormSections');
  const formButtons = document.getElementById('reqForServiceFormButtons');
  
  if (infoToReadSection && mainFormSections) {
    // Hide main form sections
    mainFormSections.style.display = 'none';
    
    // Hide the Info to Read button
    if (infoToReadButtonContainer) {
      infoToReadButtonContainer.style.display = 'none';
    }
    
    // Show the Info to Read section
    infoToReadSection.style.display = 'block';
    
    // Show form buttons
    if (formButtons) {
      formButtons.style.display = 'block';
    }
    
    // Initialize signature pads with a slight delay
    setTimeout(() => {
      initializeSignaturePads();
    }, 100);
  }
}


// Initialize reqforservice form - called by FormLoader
window.initializeReqForServiceForm = function() {
  // Initialize DOM elements
  initializeReqForServiceDOMElements();
  
  // Initialize signature manager
  reqForServiceSignatureManager = new SignatureManager('reqForService');
  
  // Initially show only the request type dropdown
  showRequestTypeOnly();
  
  // Add event listener for request type selection
  if (requestTypeSelect) {
    requestTypeSelect.addEventListener('change', function() {
      if (this.value) {
        showFormFields();
      }
    });
  }
  
  // Add form submit event listener
  if (reqForServiceForm) {
    reqForServiceForm.addEventListener('submit', handleReqForServiceFormSubmit);
  }
  
  // Add reset button event listener
  const resetReqForServiceFormBtn = document.getElementById('resetReqForServiceForm');
  if (resetReqForServiceFormBtn) {
    resetReqForServiceFormBtn.addEventListener('click', resetReqForServiceForm);
  }
  
  // Add event listeners for required fields to show/hide the "Info to Read" button
  const requiredFields = [
    reqstaffFullNameInput,
    reqstaffPositionInput,
    reqstaffOfficeLocationInput,
    clientFullNameInput,
    clientAddressInput,
    clientDobInput,
    clientVehicleRegInput,
    clientVehicleDescInput,
    issueDescriptionInput,
    issueLocationInput,
    issueDateTimeInput,
    issueTimeTakenInput
  ];
  
  requiredFields.forEach(field => {
    if (field) {
      field.addEventListener('input', updateInfoToReadButtonVisibility);
    }
  });
  
  // Add event listener for "Info to Read" button
  if (infoToReadButton) {
    infoToReadButton.addEventListener('click', showInfoToReadSection);
  }
  
  // Add event listener to staff position select to update pen color
  if (reqstaffPositionInput) {
    reqstaffPositionInput.addEventListener('change', function() {
      reqForServiceSignatureManager.updatePenColor('reqForServiceStaffSigCanvas', this.value);
    });
  }
};

// Function to initialize signature pads for reqforservice form
function initializeSignaturePads() {
  if (!reqForServiceSignatureManager) {
    console.error('Signature manager not initialized');
    return;
  }
  
  // Initialize staff signature canvas
  const staffCanvas = document.getElementById('reqForServiceStaffSigCanvas');
  if (staffCanvas) {
    reqForServiceSignatureManager.initializeSignaturePad(staffCanvas);
    
    // Set initial pen color based on current staff position
    const staffPosition = reqstaffPositionInput ? reqstaffPositionInput.value : '';
    if (staffPosition) {
      reqForServiceSignatureManager.updatePenColor('reqForServiceStaffSigCanvas', staffPosition);
    }
  }
  
  // Initialize customer signature canvas
  const customerCanvas = document.getElementById('reqForServiceCustomerSigCanvas');
  if (customerCanvas) {
    reqForServiceSignatureManager.initializeSignaturePad(customerCanvas);
  }
  
  // Setup clear buttons
  reqForServiceSignatureManager.setupClearButtons('.clear-sig-btn');
}