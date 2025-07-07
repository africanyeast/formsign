// Dashcam Form JavaScript

// DOM Elements
const dashcamSigCanvasEl = document.getElementById("dashcamSigCanvas");
const dashcamWitnessSigCanvasEl = document.getElementById("dashcamWitnessSigCanvas");
const dashcamForm = document.getElementById('dashcamForm');
const dashcamReportType = document.getElementById('dashcamReportType');
const dashcamFullNameInput = document.getElementById('dashcamFullName');
const dashcamDobInput = document.getElementById('dashcamDob');
const dashcamReportNotesTextarea = document.getElementById('dashcamReportNotes');
const dashcamRealTimeInput = document.getElementById('dashcamRealTime');
const dashcamTimeInput = document.getElementById('dashcamTime');

// Create a helper div to get computed styles for the placeholder text
const dashcamPlaceholderStyleHelper = document.createElement('div');
dashcamPlaceholderStyleHelper.className = 'signature-placeholder-text';
dashcamPlaceholderStyleHelper.style.display = 'none';
document.body.appendChild(dashcamPlaceholderStyleHelper);

// Signature pad instances
let dashcamSignaturePad, dashcamWitnessSignaturePad;

// Track if canvases have signatures
let dashcamCanvasHasSignature = {
  dashcamSigCanvas: false,
  dashcamWitnessSigCanvas: false
};

// Track if canvases have placeholders
let dashcamCanvasHasPlaceholder = {
  dashcamSigCanvas: true,
  dashcamWitnessSigCanvas: true
};

function initializeDashcamSignaturePad(canvas, options = {}) {
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
  drawDashcamSignaturePlaceholder(canvas);
  
  // Add event listeners for the signature pad
  signaturePad.addEventListener("beginStroke", () => {
    // Clear placeholder when drawing begins
    if (dashcamCanvasHasPlaceholder[canvas.id]) {
      clearDashcamPlaceholder(canvas);
      dashcamCanvasHasPlaceholder[canvas.id] = false;
    }
  });
  
  signaturePad.addEventListener("endStroke", () => {
    // Update signature flag
    dashcamCanvasHasSignature[canvas.id] = !signaturePad.isEmpty();
  });
  
  return signaturePad;
}

function clearDashcamPlaceholder(canvas) {
  if (canvas && canvas.offsetParent !== null) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function drawDashcamSignaturePlaceholder(canvas) {
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
    const computedStyle = window.getComputedStyle(dashcamPlaceholderStyleHelper);
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
      case 'dashcamSigCanvas':
        placeholderText = "Customer Sign Here";
        break;
      case 'dashcamWitnessSigCanvas':
        placeholderText = "Witness Sign Here";
        break;
      default:
        placeholderText = "Sign Here";
    }
    
    ctx.fillText(placeholderText, (canvas.width / ratio) / 2, (canvas.height / ratio) / 2);
    
    // Mark that this canvas has a placeholder
    dashcamCanvasHasPlaceholder[canvas.id] = true;
  }
}

function clearDashcamCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  let signaturePad;
  
  // Get the correct signature pad instance
  switch (canvasId) {
    case 'dashcamSigCanvas':
      signaturePad = dashcamSignaturePad;
      break;
    case 'dashcamWitnessSigCanvas':
      signaturePad = dashcamWitnessSignaturePad;
      break;
    default:
      return;
  }
  
  if (signaturePad) {
    signaturePad.clear();
    drawDashcamSignaturePlaceholder(canvas);
    
    // Reset signature flag
    dashcamCanvasHasSignature[canvasId] = false;
    // Set placeholder flag
    dashcamCanvasHasPlaceholder[canvasId] = true;
    
    // Clear hidden input
    const hiddenInputId = canvasId.replace('Canvas', 'Signature'); 
    const hiddenInput = document.getElementById(hiddenInputId);
    if (hiddenInput) {
      hiddenInput.value = '';
    }
  }
}

function isDashcamCanvasEmpty(canvas) {
  if (!canvas || canvas.offsetParent === null) return true;
  
  let signaturePad;
  
  // Get the correct signature pad instance
  switch (canvas.id) {
    case 'dashcamSigCanvas':
      signaturePad = dashcamSignaturePad;
      break;
    case 'dashcamWitnessSigCanvas':
      signaturePad = dashcamWitnessSignaturePad;
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

// Calculate time difference between real time and dashcam time
function calculateTimeDifference(realTime, dashcamTime) {
  if (!realTime || !dashcamTime) return '';
  
  // Parse the date strings in DD/MM/YYYY H:i:S format
  let realDate, dashcamDate;
  
  try {
    // Skip direct constructor and always use manual parsing for DD/MM/YYYY format
    const parseCustomDate = (dateStr) => {
      // Format: DD/MM/YYYY H:i:S
      const parts = dateStr.split(' ');
      if (parts.length !== 2) return null;
      
      const dateParts = parts[0].split('/');
      const timeParts = parts[1].split(':');
      
      if (dateParts.length !== 3 || timeParts.length !== 3) return null;
      
      // Note: months are 0-indexed in JavaScript Date
      return new Date(
        parseInt(dateParts[2]), // year
        parseInt(dateParts[1]) - 1, // month (0-indexed)
        parseInt(dateParts[0]), // day
        parseInt(timeParts[0]), // hours
        parseInt(timeParts[1]), // minutes
        parseInt(timeParts[2])  // seconds
      );
    };
    
    realDate = parseCustomDate(realTime);
    dashcamDate = parseCustomDate(dashcamTime);
    
    if (!realDate || !dashcamDate) return '';
  } catch (e) {
    console.error('Error parsing dates:', e);
    return '';
  }
  
  // Calculate difference in milliseconds
  const diffMs = Math.abs(realDate.getTime() - dashcamDate.getTime());
  
  // Convert to hours, minutes, and seconds
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  // Format the time difference string
  let diffString = '';
  if (hours > 0) {
    diffString += `${hours} hour${hours !== 1 ? 's' : ''} `;
  }
  if (minutes > 0 || hours > 0) {
    diffString += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
  }
  diffString += `${seconds} second${seconds !== 1 ? 's' : ''}`;
  
  if (diffMs === 0) {
    return "The dashcam time is accurate.";
  } else if (realDate > dashcamDate) {
    return `Therefore the dashcam time is ${diffString} slow.`;
  } else {
    return `Therefore the dashcam time is ${diffString} fast.`;
  }
}

function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  
  let date;
  
  try {
    // Skip standard Date constructor and always use manual parsing
    const parts = dateTimeStr.split(' ');
    if (parts.length !== 2) return '';
    
    const dateParts = parts[0].split('/');
    const timeParts = parts[1].split(':');
    
    if (dateParts.length !== 3 || timeParts.length !== 3) return '';
    
    // Note: months are 0-indexed in JavaScript Date
    date = new Date(
      parseInt(dateParts[2]), // year
      parseInt(dateParts[1]) - 1, // month (0-indexed)
      parseInt(dateParts[0]), // day
      parseInt(timeParts[0]), // hours
      parseInt(timeParts[1]), // minutes
      parseInt(timeParts[2])  // seconds
    );
    
    if (isNaN(date.getTime())) return '';
  } catch (e) {
    console.error('Error parsing date:', e);
    return '';
  }
  
  // Format as DD/MM/YYYY HH:MM:SS AM/PM
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Return in the correct format: DD/MM/YYYY
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}${ampm}`;
}

function prepareDashcamFormData() {
  if (dashcamSignaturePad && dashcamSignaturePad.isEmpty()) {
    alert("Customer signature is required.");
    document.getElementById("dashcamSignature").value = '';
    return false;
  }
  
  document.getElementById("dashcamSignature").value = dashcamSignaturePad.toDataURL("image/png");
  
  // Handle Dashcam Witness Signature
  const dashcamWitnessNameInput = document.getElementById('dashcamWitnessName');
  const dashcamWitnessSignatureValue = dashcamWitnessSignaturePad && !dashcamWitnessSignaturePad.isEmpty() 
                            ? dashcamWitnessSignaturePad.toDataURL("image/png") 
                            : '';
  document.getElementById("dashcamWitnessSignature").value = dashcamWitnessSignatureValue;

  if (dashcamWitnessSignatureValue !== '' && dashcamWitnessNameInput && dashcamWitnessNameInput.value.trim() === '') {
    alert("Witness name is required when a witness signature is provided for the dashcam report.");
    dashcamWitnessNameInput.focus();
    return false;
  }
  
  if (dashcamWitnessNameInput && dashcamWitnessNameInput.value.trim() !== '' && dashcamWitnessSignatureValue === ''){
    alert("Witness signature is required when a witness name is provided for the dashcam report.");
    return false;
  }

  return true;
}

// Add event listener for report type select
if (dashcamReportType) {
  dashcamReportType.addEventListener('change', function() {
    const fullName = dashcamFullNameInput.value;
    const dob = dashcamDobInput.value;
    const age = calculateAge(dob);
    const reportType = this.value;
    const realTime = dashcamRealTimeInput.value;
    const dashcamTime = dashcamTimeInput.value;
    
    // Format the times for display
    const formattedRealTime = formatDateTime(realTime);
    const formattedDashcamTime = formatDateTime(dashcamTime);
    
    // Calculate time difference
    const timeDifference = calculateTimeDifference(realTime, dashcamTime);
    
    let defaultText = '';

    if (reportType === 'typeA') {
      defaultText = `My name is ${fullName}.\nI am currently ${age}.\nThe real time is ${formattedRealTime}.\nThe dashcam time is ${formattedDashcamTime}.\n${timeDifference}`;
    } else if (reportType === 'typeB') {
      defaultText = `My name is ${fullName}.\nI am currently ${age}.\nThe real time is ${formattedRealTime}.\nThe dashcam time is ${formattedDashcamTime}.\n${timeDifference}`;
    }
    
    dashcamReportNotesTextarea.value = defaultText;
  });
}

// Form submission handler
function handleDashcamFormSubmit(event) {
  event.preventDefault();
  
  // Validate and prepare form data
  if (!prepareDashcamFormData()) {
    return false;
  }
  
  // Generate PDF using the dashcam-specific function
  if (typeof generateDashcamPDF === 'function') {
    generateDashcamPDF();
  } else {
    console.error('Dashcam PDF generation module not loaded');
    alert('PDF generation is not available. Please refresh the page.');
  }
  
  return false;
}

// Reset form function
function resetDashcamForm() {
  // Reset all form fields
  dashcamForm.reset();
  
  // Clear signatures
  clearDashcamCanvas('dashcamSigCanvas');
  clearDashcamCanvas('dashcamWitnessSigCanvas');
  
  // Reset hidden inputs
  document.getElementById("dashcamSignature").value = '';
  document.getElementById("dashcamWitnessSignature").value = '';
  
  // Clear report notes
  dashcamReportNotesTextarea.value = '';
}

// DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Tempus Dominus for date/time pickers
  let realTimePicker;
  let dashcamTimePicker;
  
  if (dashcamRealTimeInput) {
    realTimePicker = new tempusDominus.TempusDominus(dashcamRealTimeInput, {
      display: {
        components: {
          calendar: true,
          date: true,
          month: true,
          year: true,
          decades: true,
          clock: true,
          hours: true,
          minutes: true,
          seconds: true
        },
        icons: {
          time: 'fa-solid fa-clock',
          date: 'fa-solid fa-calendar',
          up: 'fa-solid fa-arrow-up',
          down: 'fa-solid fa-arrow-down',
          previous: 'fa-solid fa-chevron-left',
          next: 'fa-solid fa-chevron-right',
          today: 'fa-solid fa-calendar-check',
          clear: 'fa-solid fa-trash',
          close: 'fa-solid fa-xmark'
        },
        sideBySide: true,
        keepOpen: false,
        buttons: {
          today: false,
          clear: true,
          close: true
        },
      },
      localization: {
        format: 'dd/MM/yyyy HH:mm:ss',
        locale: 'en-GB' // Use British English for DD/MM/YYYY format
      },
      restrictions: {
        minDate: new Date(2000, 0, 1), // Jan 1, 2000
        maxDate: new Date(2100, 11, 31) // Dec 31, 2100
      },
      useCurrent: true
    });
    
    // Set current date/time as default
    const now = new Date();
    realTimePicker.dates.setValue(tempusDominus.DateTime.convert(now));
    
    // Add readonly attribute to prevent editing
    dashcamRealTimeInput.setAttribute('readonly', 'readonly');
  }
  
  if (dashcamTimeInput) {
    dashcamTimePicker = new tempusDominus.TempusDominus(dashcamTimeInput, {
      display: {
        components: {
          calendar: true,
          date: true,
          month: true,
          year: true,
          decades: true,
          clock: true,
          hours: true,
          minutes: true,
          seconds: true
        },
        icons: {
          time: 'fa-solid fa-clock',
          date: 'fa-solid fa-calendar',
          up: 'fa-solid fa-arrow-up',
          down: 'fa-solid fa-arrow-down',
          previous: 'fa-solid fa-chevron-left',
          next: 'fa-solid fa-chevron-right',
          today: 'fa-solid fa-calendar-check',
          clear: 'fa-solid fa-trash',
          close: 'fa-solid fa-xmark'
        },
        sideBySide: true,
        keepOpen: true,
        buttons: {
          today: false,
          clear: true,
          close: true
        },
      },
      localization: {
        format: 'dd/MM/yyyy HH:mm:ss',
        locale: 'en-GB' // Use British English for DD/MM/YYYY format
      },
      restrictions: {
        minDate: new Date(2000, 0, 1), // Jan 1, 2000
        maxDate: new Date(2100, 11, 31) // Dec 31, 2100
      }
    });
    
    // Add event listener for when dashcam time is selected using the subscribe method
    dashcamTimePicker.subscribe(tempusDominus.Namespace.events.change, function(e) {
      // Update real time input to current date/time when dashcam time is selected
      if (dashcamRealTimeInput && realTimePicker) {
        const now = new Date();
        realTimePicker.dates.setValue(tempusDominus.DateTime.convert(now));
      }
    });
    
    // Add readonly attribute to prevent editing
    dashcamTimeInput.setAttribute('readonly', 'readonly');
  }
  
  // Ensure the helper is in the DOM before trying to get styles
  if (!document.body.contains(dashcamPlaceholderStyleHelper)) {
    document.body.appendChild(dashcamPlaceholderStyleHelper);
  }

  // Initialize signature pads
  if (dashcamSigCanvasEl) {
    dashcamSignaturePad = initializeDashcamSignaturePad(dashcamSigCanvasEl);
  }
  
  if (dashcamWitnessSigCanvasEl) {
    dashcamWitnessSignaturePad = initializeDashcamSignaturePad(dashcamWitnessSigCanvasEl);
    
    // Add event listener to dashcam witness position select to update pen color
    document.getElementById('dashcamWitnessPosition').addEventListener('change', function() {
      const dashcamWitnessPosition = this.value;
      let penColor = 'black';
      
      switch (dashcamWitnessPosition) {
        case 'supervisor': penColor = 'blue'; break;
        case 'manager': penColor = 'red'; break;
        case 'director': penColor = 'green'; break;
        default: penColor = 'black';
      }
      
      if (dashcamWitnessSignaturePad) {
        dashcamWitnessSignaturePad.penColor = penColor;
      }
    });
  }
  
  // Add form submit event listener
  if (dashcamForm) {
    dashcamForm.addEventListener('submit', handleDashcamFormSubmit);
  }
  
  // Add event listeners for clear buttons
  document.querySelectorAll('.clear-sig-btn').forEach(button => {
    const canvasId = button.dataset.canvasId;
    if (canvasId === 'dashcamSigCanvas' || canvasId === 'dashcamWitnessSigCanvas') {
      button.addEventListener('click', function() {
        clearDashcamCanvas(canvasId);
      });
    }
  });
  
  // Add event listeners for form toggle
  document.getElementById('showDashcamForm').addEventListener('change', function() {
    if (this.checked) {
      document.getElementById('dashcamForm').style.display = 'block';
      document.getElementById('staffForm').style.display = 'none';
      document.getElementById('customerForm').style.display = 'none';
      document.getElementById('dashcamFormHeading').style.display = 'block';
      document.getElementById('staffFormHeading').style.display = 'none';
      document.getElementById('customerFormHeading').style.display = 'none';
      
      // Reinitialize dashcam signature pads when switching to dashcam form
      if (dashcamSigCanvasEl) {
        dashcamSignaturePad = initializeDashcamSignaturePad(dashcamSigCanvasEl);
      }
      
      if (dashcamWitnessSigCanvasEl) {
        dashcamWitnessSignaturePad = initializeDashcamSignaturePad(dashcamWitnessSigCanvasEl);
      }
    }
  });
  
  // Add reset button event listener
  const resetDashcamFormBtn = document.getElementById('resetDashcamForm');
  if (resetDashcamFormBtn) {
    resetDashcamFormBtn.addEventListener('click', resetDashcamForm);
  }
});