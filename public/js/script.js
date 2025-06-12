const staffSigCanvasEl = document.getElementById("staffSigCanvas");
const witnessSigCanvasEl = document.getElementById("witnessSigCanvas");
const customerSigCanvasEl = document.getElementById("customerSigCanvas");
const userTypeRadios = document.querySelectorAll('input[name="userType"]');
const reportForm = document.getElementById('reportForm');

// Create a helper div to get computed styles for the placeholder text
const placeholderStyleHelper = document.createElement('div');
placeholderStyleHelper.className = 'signature-placeholder-text';
placeholderStyleHelper.style.display = 'none'; // Keep it hidden
document.body.appendChild(placeholderStyleHelper);

let staffCtx, witnessCtx, customerCtx;

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

function startDrawing(e, canvasId) {
  e.preventDefault();
  const canvas = document.getElementById(canvasId);
  if (!canvas || canvas.offsetParent === null) return;

  // Clear placeholder before drawing
  const tempCtx = canvas.getContext('2d');
  tempCtx.clearRect(0, 0, canvas.width, canvas.height);

  if (canvas.width === 0 || canvas.height === 0) {
    // Re-initialize if dimensions were lost (e.g. due to display:none)
    if (canvasId === 'staffSigCanvas') staffCtx = initializeCanvas(canvas);
    else if (canvasId === 'witnessSigCanvas') witnessCtx = initializeCanvas(canvas);
    else if (canvasId === 'customerSigCanvas') customerCtx = initializeCanvas(canvas);
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

  if (canvasId === 'staffSigCanvas') {
    const staffType = document.getElementById('staffType').value;
    switch (staffType) {
      case 'supervisor': currentDrawingCtx.strokeStyle = 'blue'; break;
      case 'manager': currentDrawingCtx.strokeStyle = 'red'; break;
      case 'director': currentDrawingCtx.strokeStyle = 'green'; break;
      default: currentDrawingCtx.strokeStyle = 'black';
    }
  } else {
    currentDrawingCtx.strokeStyle = 'black';
  }
}

function draw(e) {
  e.preventDefault();
  if (!drawing || !currentDrawingCtx || !currentDrawingCanvas || currentDrawingCanvas.offsetParent === null) return;
  const pos = getPos(e, currentDrawingCanvas);
  currentDrawingCtx.lineTo(pos.x, pos.y);
  currentDrawingCtx.stroke();
}

function stopDrawing(e) {
  if (!drawing || !currentDrawingCtx) return;
  drawing = false;
  currentDrawingCtx.closePath();
}

[staffSigCanvasEl, witnessSigCanvasEl, customerSigCanvasEl].forEach(canvas => {
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

function clearCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSignaturePlaceholder(canvas); // Redraw placeholder after clearing
    const hiddenInputId = canvasId.replace('Canvas', 'Signature'); // Corrected replacement
    const hiddenInput = document.getElementById(hiddenInputId);
    if (hiddenInput) {
        hiddenInput.value = '';
    }
  }
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
  const witnessSection = document.querySelector('.witness-section');

  // Cache DOM elements for hidden signature inputs
  const staffSignatureInput = document.getElementById('staffSignature');
  const customerSignatureInput = document.getElementById('customerSignature');
  const witnessSignatureInput = document.getElementById('witnessSignature');
  const staffTypeInput = document.getElementById('staffType');
  const witnessNameInput = document.getElementById('witnessName');

  // Hide all by default & remove/add required attributes
  if (reportForm) reportForm.style.display = 'none';
  if (staffFields) staffFields.style.display = 'none';
  if (customerFields) customerFields.style.display = 'none';
  if (staffTypeFields) staffTypeFields.style.display = 'none';
  if (witnessSection) witnessSection.style.display = 'none';

  // Reset required attributes initially
  if (staffSignatureInput) staffSignatureInput.required = false;
  if (customerSignatureInput) customerSignatureInput.required = false;
  if (staffTypeInput) staffTypeInput.required = false;
  if (witnessNameInput) witnessNameInput.required = false; 
  // witnessSignatureInput is never strictly required by itself

  if (selectedUserType) {
    if (reportForm) reportForm.style.display = 'block';

    if (selectedUserType === 'staff') {
      if (staffFields) staffFields.style.display = 'block';
      if (staffTypeFields) staffTypeFields.style.display = 'block';
      if (witnessSection) witnessSection.style.display = 'block';

      if (staffSignatureInput) staffSignatureInput.required = true;
      if (staffTypeInput) staffTypeInput.required = true;
      // customerSignatureInput remains not required

      if (staffSigCanvasEl) staffCtx = initializeCanvas(staffSigCanvasEl);
      if (witnessSigCanvasEl) witnessCtx = initializeCanvas(witnessSigCanvasEl);
      
      if (customerSigCanvasEl) drawSignaturePlaceholder(customerSigCanvasEl);
      clearCanvas('customerSigCanvas');

    } else if (selectedUserType === 'customer') {
      if (customerFields) customerFields.style.display = 'block';
      if (customerSignatureInput) customerSignatureInput.required = true;
      // staffSignatureInput remains not required
      // staffTypeInput remains not required

      if (customerSigCanvasEl) customerCtx = initializeCanvas(customerSigCanvasEl);

      if (staffSigCanvasEl) drawSignaturePlaceholder(staffSigCanvasEl);
      if (witnessSigCanvasEl) drawSignaturePlaceholder(witnessSigCanvasEl);
      clearCanvas('staffSigCanvas');
      clearCanvas('witnessSigCanvas');
    }
  } else {
    [staffSigCanvasEl, witnessSigCanvasEl, customerSigCanvasEl].forEach(canvas => {
        if(canvas) drawSignaturePlaceholder(canvas);
    });
  }
}

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

  // Clear previous custom validation messages if any (optional)
  // You might want a more sophisticated way to display errors

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

// Add event listeners for the new clear buttons
document.querySelectorAll('.clear-sig-btn').forEach(button => {
    button.addEventListener('click', function() {
        const canvasId = this.dataset.canvasId;
        clearCanvas(canvasId);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Ensure the helper is in the DOM before trying to get styles
    if (!document.body.contains(placeholderStyleHelper)) {
        document.body.appendChild(placeholderStyleHelper);
    }

    if (staffSigCanvasEl) staffCtx = initializeCanvas(staffSigCanvasEl);
    if (witnessSigCanvasEl) witnessCtx = initializeCanvas(witnessSigCanvasEl);
    if (customerSigCanvasEl) customerCtx = initializeCanvas(customerSigCanvasEl);
    
    toggleFields(); 
});