const staffSigCanvasEl = document.getElementById("staffSigCanvas");
const witnessSigCanvasEl = document.getElementById("witnessSigCanvas");
const customerSigCanvasEl = document.getElementById("customerSigCanvas");
const customerWitnessSigCanvasEl = document.getElementById("customerWitnessSigCanvas");
const userTypeRadios = document.querySelectorAll('input[name="userType"]');
const reportForm = document.getElementById('reportForm');
const reportTypeSelect = document.getElementById('reportType');
const fullNameInput = document.getElementById('fullName');
const dobInput = document.getElementById('dob');
const reportNotesTextarea = document.getElementById('reportNotes');

// Create a helper div to get computed styles for the placeholder text
const placeholderStyleHelper = document.createElement('div');
placeholderStyleHelper.className = 'signature-placeholder-text';
placeholderStyleHelper.style.display = 'none';
document.body.appendChild(placeholderStyleHelper);

let staffCtx, witnessCtx, customerCtx, customerWitnessCtx;

function drawSignaturePlaceholder(canvas) {
  if (canvas && canvas.offsetParent !== null) {
    const ctx = canvas.getContext('2d');
    if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = canvas.offsetWidth;
        canvas.height = 150; 
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get styles from the helper div
    const computedStyle = window.getComputedStyle(placeholderStyleHelper);
    const fontStyle = computedStyle.getPropertyValue('font-style');
    const fontSize = computedStyle.getPropertyValue('font-size');
    const fontFamily = computedStyle.getPropertyValue('font-family');
    const color = computedStyle.getPropertyValue('color');

    ctx.font = `${fontStyle} ${fontSize} ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Sign here", canvas.width / 2, canvas.height / 2);
  }
}

function initializeCanvas(canvas) {
  if (canvas) {
    // canvas.width = canvas.offsetWidth; // Set width based on offsetWidth
    // canvas.height = 150; // Match CSS height
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Ensure canvas has dimensions before drawing placeholder
    if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = canvas.offsetWidth > 0 ? canvas.offsetWidth : 300; // Fallback width
        canvas.height = 150;
    }
    drawSignaturePlaceholder(canvas); // Draw placeholder on init
    return ctx;
  }
  return null;
}

let currentDrawingCanvas = null;
let currentDrawingCtx = null;
let drawing = false;

function getPos(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

// Add a flag to track if canvas has actual signature content
let canvasHasSignature = {
  staffSigCanvas: false,
  witnessSigCanvas: false,
  customerSigCanvas: false,
  customerWitnessSigCanvas: false
};

function startDrawing(e, canvasId) {
  e.preventDefault();
  const canvas = document.getElementById(canvasId);
  if (!canvas || canvas.offsetParent === null) return;

  // Only clear placeholder if canvas doesn't have a signature, or clear everything if it's empty
  const tempCtx = canvas.getContext('2d');
  if (!canvasHasSignature[canvasId]) {
    tempCtx.clearRect(0, 0, canvas.width, canvas.height);
  }

  if (canvas.width === 0 || canvas.height === 0) {
    // Re-initialize if dimensions were lost (e.g. due to display:none)
    if (canvasId === 'staffSigCanvas') staffCtx = initializeCanvas(canvas);
    else if (canvasId === 'witnessSigCanvas') witnessCtx = initializeCanvas(canvas);
    else if (canvasId === 'customerSigCanvas') customerCtx = initializeCanvas(canvas);
    else if (canvasId === 'customerWitnessSigCanvas') customerWitnessCtx = initializeCanvas(canvas); // New canvas
    else { // Fallback for safety, though should be one of the above
        canvas.width = canvas.offsetWidth;
        canvas.height = 150;
    }
  }
  
  currentDrawingCanvas = canvas;
  currentDrawingCtx = canvas.getContext('2d'); // Get context again after potential re-init
  currentDrawingCtx.lineWidth = 2;
  currentDrawingCtx.lineCap = 'round';
  currentDrawingCtx.lineJoin = 'round';

  drawing = true;
  const pos = getPos(e, currentDrawingCanvas);
  currentDrawingCtx.beginPath();
  currentDrawingCtx.moveTo(pos.x, pos.y);

  // Set signature color based on position for both staff and customer witness
  if (canvasId === 'staffSigCanvas') {
    const staffType = document.getElementById('staffType').value;
    switch (staffType) {
      case 'supervisor': currentDrawingCtx.strokeStyle = 'blue'; break;
      case 'manager': currentDrawingCtx.strokeStyle = 'red'; break;
      case 'director': currentDrawingCtx.strokeStyle = 'green'; break;
      default: currentDrawingCtx.strokeStyle = 'black';
    }
  } else if (canvasId === 'customerWitnessSigCanvas') {
    const customerWitnessPosition = document.getElementById('customerWitnessPosition').value;
    switch (customerWitnessPosition) {
      case 'supervisor': currentDrawingCtx.strokeStyle = 'blue'; break;
      case 'manager': currentDrawingCtx.strokeStyle = 'red'; break;
      case 'director': currentDrawingCtx.strokeStyle = 'green'; break;
      case 'sales': currentDrawingCtx.strokeStyle = 'orange'; break;
      default: currentDrawingCtx.strokeStyle = 'black';
    }
  } else {
    currentDrawingCtx.strokeStyle = 'black';
  }
}

function stopDrawing(e) {
  if (!drawing || !currentDrawingCtx) return;
  drawing = false;
  currentDrawingCtx.closePath();
  
  // Mark canvas as having signature content
  if (currentDrawingCanvas) {
    canvasHasSignature[currentDrawingCanvas.id] = true;
  }
}

function clearCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (canvas) {
    const ctx = canvas.getContext("2d");
    // Ensure canvas has dimensions before clearing
    if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = canvas.offsetWidth > 0 ? canvas.offsetWidth : 300; // Fallback width
        canvas.height = 150;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSignaturePlaceholder(canvas); // Redraw placeholder after clearing
    
    // Reset signature flag
    canvasHasSignature[canvasId] = false;
    
    const hiddenInputId = canvasId.replace('Canvas', 'Signature'); 
    const hiddenInput = document.getElementById(hiddenInputId);
    if (hiddenInput) {
        hiddenInput.value = '';
    }
  }
}

function draw(e) {
  e.preventDefault();
  if (!drawing || !currentDrawingCtx || !currentDrawingCanvas || currentDrawingCanvas.offsetParent === null) return;
  const pos = getPos(e, currentDrawingCanvas);
  currentDrawingCtx.lineTo(pos.x, pos.y);
  currentDrawingCtx.stroke();
}

[staffSigCanvasEl, witnessSigCanvasEl, customerSigCanvasEl, customerWitnessSigCanvasEl].forEach(canvas => { // Added customerWitnessSigCanvasEl
  if (canvas) {
    const canvasId = canvas.id;
    canvas.addEventListener("mousedown", (e) => startDrawing(e, canvasId));
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);
    canvas.addEventListener("touchstart", (e) => startDrawing(e, canvasId), { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);
    canvas.addEventListener("touchcancel", stopDrawing);
  }
});

function isCanvasEmpty(canvas) {
    if (!canvas || canvas.offsetParent === null) return true; // Not visible or doesn't exist
    // Create a temporary canvas to compare
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    // Draw the placeholder on the temporary canvas to get its data URL
    drawSignaturePlaceholder(tempCanvas); 
    const placeholderDataUrl = tempCanvas.toDataURL();
    // Get current canvas data URL
    const currentDataUrl = canvas.toDataURL();
    return currentDataUrl === placeholderDataUrl;
}

function calculateAge(dobString) {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function toggleFields() {
  let selectedUserType = null;
  userTypeRadios.forEach(radio => {
    if (radio.checked) {
      selectedUserType = radio.value;
    }
  });

  const staffFields = document.querySelector('.staff-fields');
  const customerFields = document.querySelector('.customer-fields');
  const staffTypeFields = document.querySelector('.staff-type-fields');
  const witnessSection = document.querySelector('.witness-section'); // Staff witness section
  const customerWitnessNameField = document.getElementById('customerWitnessName').parentNode; // Customer witness name
  const customerWitnessPositionField = document.querySelector('.customer-witness-position-field'); // Customer witness position
  const customerWitnessSigField = document.getElementById('customerWitnessSigCanvas').parentNode.parentNode; // Customer witness signature

  const ageField = document.querySelector('.age-field');
  const dobField = document.querySelector('.dob-field');
  const reportTypeField = document.querySelector('.report-type-field');

  // Cache DOM elements for hidden signature inputs
  const staffSignatureInput = document.getElementById('staffSignature');
  const customerSignatureInput = document.getElementById('customerSignature');
  const witnessSignatureInput = document.getElementById('witnessSignature'); // Staff witness
  const customerWitnessSignatureInput = document.getElementById('customerWitnessSignature'); // Customer witness
  const staffTypeInput = document.getElementById('staffType');
  const customerWitnessPositionInput = document.getElementById('customerWitnessPosition'); // Customer witness position
  const witnessNameInput = document.getElementById('witnessName'); // Staff witness name
  const customerWitnessNameInput = document.getElementById('customerWitnessName'); // Customer witness name
  const ageInput = document.getElementById('age');
  const dobInputEl = document.getElementById('dob');

  // Hide all by default & remove/add required attributes
  if (reportForm) reportForm.style.display = 'none';
  if (staffFields) staffFields.style.display = 'none';
  if (customerFields) customerFields.style.display = 'none';
  if (staffTypeFields) staffTypeFields.style.display = 'none';
  if (witnessSection) witnessSection.style.display = 'none';
  if (customerWitnessNameField) customerWitnessNameField.style.display = 'none';
  if (customerWitnessPositionField) customerWitnessPositionField.style.display = 'none';
  if (customerWitnessSigField) customerWitnessSigField.style.display = 'none';
  if (ageField) ageField.style.display = 'block'; // Default for age
  if (dobField) dobField.style.display = 'none';   // Default for DOB
  if (reportTypeField) reportTypeField.style.display = 'none'; // Default for report type

  // Reset required attributes initially
  if (staffSignatureInput) staffSignatureInput.required = false;
  if (customerSignatureInput) customerSignatureInput.required = false;
  if (staffTypeInput) staffTypeInput.required = false;
  if (customerWitnessPositionInput) customerWitnessPositionInput.required = false;
  if (witnessNameInput) witnessNameInput.required = false; 
  if (customerWitnessNameInput) customerWitnessNameInput.required = false;
  if (ageInput) ageInput.required = true; // Default for age
  if (dobInputEl) dobInputEl.required = false; // Default for DOB
  if (reportTypeSelect) reportTypeSelect.required = false;
  // witnessSignatureInput is never strictly required by itself
  // customerWitnessSignatureInput is never strictly required by itself

  if (selectedUserType) {
    if (reportForm) reportForm.style.display = 'block';

    if (selectedUserType === 'staff') {
      if (staffFields) staffFields.style.display = 'block';
      if (staffTypeFields) staffTypeFields.style.display = 'block';
      if (witnessSection) witnessSection.style.display = 'block';
      if (ageField) ageField.style.display = 'block';
      if (dobField) dobField.style.display = 'none';
      if (reportTypeField) reportTypeField.style.display = 'none';

      if (staffSignatureInput) staffSignatureInput.required = true;
      if (staffTypeInput) staffTypeInput.required = true;
      if (ageInput) ageInput.required = true;
      if (dobInputEl) dobInputEl.required = false;
      if (reportTypeSelect) reportTypeSelect.required = false;
      // customerSignatureInput remains not required

      if (staffSigCanvasEl) staffCtx = initializeCanvas(staffSigCanvasEl);
      if (witnessSigCanvasEl) witnessCtx = initializeCanvas(witnessSigCanvasEl);
      
      if (customerSigCanvasEl) drawSignaturePlaceholder(customerSigCanvasEl);
      if (customerWitnessSigCanvasEl) drawSignaturePlaceholder(customerWitnessSigCanvasEl);
      clearCanvas('customerSigCanvas');
      clearCanvas('customerWitnessSigCanvas');

    } else if (selectedUserType === 'customer') {
      if (customerFields) customerFields.style.display = 'block';
      if (customerWitnessNameField) customerWitnessNameField.style.display = 'block';
      if (customerWitnessPositionField) customerWitnessPositionField.style.display = 'block';
      if (customerWitnessSigField) customerWitnessSigField.style.display = 'block';
      if (ageField) ageField.style.display = 'none';
      if (dobField) dobField.style.display = 'block';
      if (reportTypeField) reportTypeField.style.display = 'block';

      if (customerSignatureInput) customerSignatureInput.required = true;
      if (dobInputEl) dobInputEl.required = true;
      if (reportTypeSelect) reportTypeSelect.required = true;
      if (ageInput) ageInput.required = false;
      // staffSignatureInput remains not required
      // staffTypeInput remains not required

      if (customerSigCanvasEl) customerCtx = initializeCanvas(customerSigCanvasEl);
      if (customerWitnessSigCanvasEl) customerWitnessCtx = initializeCanvas(customerWitnessSigCanvasEl); // New canvas

      if (staffSigCanvasEl) drawSignaturePlaceholder(staffSigCanvasEl);
      if (witnessSigCanvasEl) drawSignaturePlaceholder(witnessSigCanvasEl);
      clearCanvas('staffSigCanvas');
      clearCanvas('witnessSigCanvas');
    }
  } else {
    [staffSigCanvasEl, witnessSigCanvasEl, customerSigCanvasEl, customerWitnessSigCanvasEl].forEach(canvas => { // Added customerWitnessSigCanvasEl
        if(canvas) {
          drawSignaturePlaceholder(canvas);
          canvasHasSignature[canvas.id] = false;
        }
    });
  }
  // Reset report notes when user type changes
  if (reportNotesTextarea) reportNotesTextarea.value = '';
  if (reportTypeSelect) reportTypeSelect.value = ''; 
}

function prepareFormData() {
  let selectedUserType = null;
  userTypeRadios.forEach(radio => {
    if (radio.checked) {
      selectedUserType = radio.value;
    }
  });

  const hiddenUserTypeInput = document.getElementById('hiddenUserType');
  if (hiddenUserTypeInput) {
    hiddenUserTypeInput.value = selectedUserType;
  }

  if (selectedUserType === 'staff') {
    const staffTypeSelect = document.getElementById('staffType');
    if (staffTypeSelect && staffTypeSelect.value === "") {
        alert("Please select a staff position.");
        return false; // Prevent submission
    }
    if (isCanvasEmpty(staffSigCanvasEl)) {
        alert("Staff signature is required.");
        document.getElementById("staffSignature").value = ''; // Ensure it's empty for HTML5 validation too
        return false; // Prevent submission
    }
    document.getElementById("staffSignature").value = staffSigCanvasEl.toDataURL("image/png");
    
    const witnessNameInput = document.getElementById('witnessName');
    const witnessSignatureValue = witnessSigCanvasEl && witnessSigCanvasEl.offsetParent !== null && !isCanvasEmpty(witnessSigCanvasEl) 
                                  ? witnessSigCanvasEl.toDataURL("image/png") 
                                  : '';
    document.getElementById("witnessSignature").value = witnessSignatureValue;

    if (witnessSignatureValue !== '' && witnessNameInput && witnessNameInput.value.trim() === '') {
        alert("Witness name is required when a witness signature is provided.");
        witnessNameInput.focus(); // Focus the witness name field
        return false; // Prevent submission
    }
    if (witnessNameInput && witnessNameInput.value.trim() !== '' && witnessSignatureValue === ''){
        alert("Witness signature is required when a witness name is provided.");
        return false; // Prevent submission
    }

    if(document.getElementById('customerSignature')) document.getElementById('customerSignature').value = '';

  } else if (selectedUserType === 'customer') {
    if (isCanvasEmpty(customerSigCanvasEl)) {
        alert("Customer signature is required.");
        document.getElementById("customerSignature").value = ''; // Ensure it's empty for HTML5 validation too
        return false; // Prevent submission
    }
    document.getElementById("customerSignature").value = customerSigCanvasEl.toDataURL("image/png");
    // Handle Customer Witness Signature
    const customerWitnessNameInput = document.getElementById('customerWitnessName');
    const customerWitnessSignatureValue = customerWitnessSigCanvasEl && customerWitnessSigCanvasEl.offsetParent !== null && !isCanvasEmpty(customerWitnessSigCanvasEl) 
                                  ? customerWitnessSigCanvasEl.toDataURL("image/png") 
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

    if(document.getElementById('staffSignature')) document.getElementById('staffSignature').value = '';
    if(document.getElementById('witnessSignature')) document.getElementById('witnessSignature').value = '';
  }
  return true; // Proceed with submission
}

// if(userTypeSelect) { // No longer a select
//     userTypeSelect.addEventListener('change', toggleFields);
// }
userTypeRadios.forEach(radio => {
  radio.addEventListener('change', toggleFields);
});

if (reportTypeSelect) {
    reportTypeSelect.addEventListener('change', function() {
        const selectedUserType = document.querySelector('input[name="userType"]:checked');
        if (selectedUserType && selectedUserType.value === 'customer') {
            const fullName = fullNameInput.value;
            const dob = dobInput.value;
            const age = calculateAge(dob);
            const reportType = this.value;
            let defaultText = '';

            if (reportType === 'deposit') {
                defaultText = `My name is ${fullName}.\nI am currently ${age}.\nToday I put down a deposit toward buying a cool tool.\nI know it’s nonrefundable`;
            } else if (reportType === 'cancel') {
                defaultText = `My name is ${fullName}.\nI am currently ${age}.\nAs of today I wish to cancel my order.\nI know my deposit was nonrefundable so I can not get a refund on this.\nWith that said I still wish to cancel my order.`;
            }
            reportNotesTextarea.value = defaultText;
        }
    });
}

// Add event listeners for the new clear buttons
document.querySelectorAll('.clear-sig-btn').forEach(button => {
    button.addEventListener('click', function() {
        const canvasId = this.dataset.canvasId;
        clearCanvas(canvasId);
    });
});

// Updated form submission handler
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate and prepare form data
    if (!prepareFormData()) {
        return false;
    }
    
    // Generate PDF using the modular function
    if (typeof generatePDF === 'function') {
        generatePDF();
    } else {
        console.error('PDF generation module not loaded');
        alert('PDF generation is not available. Please refresh the page.');
    }
    
    return false; // Prevent default form submission
}

// Update DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    // Ensure the helper is in the DOM before trying to get styles
    if (!document.body.contains(placeholderStyleHelper)) {
        document.body.appendChild(placeholderStyleHelper);
    }

    if (staffSigCanvasEl) staffCtx = initializeCanvas(staffSigCanvasEl);
    if (witnessSigCanvasEl) witnessCtx = initializeCanvas(witnessSigCanvasEl);
    if (customerSigCanvasEl) customerCtx = initializeCanvas(customerSigCanvasEl);
    if (customerWitnessSigCanvasEl) customerWitnessCtx = initializeCanvas(customerWitnessSigCanvasEl);
    
    toggleFields();
    
    // Add form submit event listener
    const form = document.getElementById('reportForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});