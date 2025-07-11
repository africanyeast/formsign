// Dashcam Form JavaScript

// Initialize signature manager for dashcam forms
let dashcamSignatureManager;
let dashcamSignaturePad, dashcamWitnessSignaturePad;

// DOM Elements (will be set when form is loaded)
let dashcamSigCanvasEl, dashcamWitnessSigCanvasEl, dashcamForm, dashcamReportType, dashcamRealTimeInput, dashcamTimeInput, dashcamReportNotesTextarea, dashcamFullNameInput, dashcamDobInput;

function initializeDashcamDOMElements() {
  dashcamSigCanvasEl = document.getElementById("dashcamSigCanvas");
  dashcamWitnessSigCanvasEl = document.getElementById("dashcamWitnessSigCanvas");
  dashcamForm = document.getElementById('dashcamForm');
  dashcamReportType = document.getElementById('dashcamReportType');
  dashcamRealTimeInput = document.getElementById('dashcamRealTime');
  dashcamTimeInput = document.getElementById('dashcamTime');
  dashcamReportNotesTextarea = document.getElementById('dashcamReportNotes');
  dashcamFullNameInput = document.getElementById('dashcamFullName');
  dashcamDobInput = document.getElementById('dashcamDob');
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
  if (dashcamSignatureManager.isCanvasEmpty('dashcamSigCanvas')) {
    alert("Customer signature is required.");
    document.getElementById("dashcamSignature").value = '';
    return false;
  }
  
  document.getElementById("dashcamSignature").value = dashcamSignatureManager.getSignatureDataURL('dashcamSigCanvas');
  
  // Handle Dashcam Witness Signature
  const dashcamWitnessNameInput = document.getElementById('dashcamWitnessName');
  const dashcamWitnessSignatureValue = dashcamSignatureManager.getSignatureDataURL('dashcamWitnessSigCanvas');
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
  
  // Clear signatures using signature manager
  dashcamSignatureManager.clearCanvas('dashcamSigCanvas');
  dashcamSignatureManager.clearCanvas('dashcamWitnessSigCanvas');
  
  // Reset hidden inputs
  document.getElementById("dashcamSignature").value = '';
  document.getElementById("dashcamWitnessSignature").value = '';
  
  // Clear report notes
  dashcamReportNotesTextarea.value = '';
}

window.initializeDashcamForm = function() {
  // Initialize DOM elements
  initializeDashcamDOMElements();
  
  // Initialize signature manager
  dashcamSignatureManager = new SignatureManager('dashcam');
  
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
        sideBySide: false,
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
        sideBySide: false,
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
  
  // Initialize signature pads using signature manager
  if (dashcamSigCanvasEl) {
    dashcamSignaturePad = dashcamSignatureManager.initializeSignaturePad(dashcamSigCanvasEl);
  }
  
  if (dashcamWitnessSigCanvasEl) {
    dashcamWitnessSignaturePad = dashcamSignatureManager.initializeSignaturePad(dashcamWitnessSigCanvasEl);
    
    // Add event listener to dashcam witness position select to update pen color
    const dashcamWitnessPositionSelect = document.getElementById('dashcamWitnessPosition');
    if (dashcamWitnessPositionSelect) {
      dashcamWitnessPositionSelect.addEventListener('change', function() {
        dashcamSignatureManager.updatePenColor('dashcamWitnessSigCanvas', this.value);
      });
    }
  }
  
  // Add form submit event listener
  if (dashcamForm) {
    dashcamForm.addEventListener('submit', handleDashcamFormSubmit);
  }
  
  // Setup clear buttons using signature manager
  if (dashcamSignatureManager) {
    dashcamSignatureManager.setupClearButtons('.clear-sig-btn[data-canvas-id="dashcamSigCanvas"], .clear-sig-btn[data-canvas-id="dashcamWitnessSigCanvas"]');
  }
  
  // Add event listener for report type select
  if (dashcamReportType) {
    dashcamReportType.addEventListener('change', function() {
      const dashcamFullNameInput = document.getElementById('dashcamFullName');
      const dashcamDobInput = document.getElementById('dashcamDob');
      
      const fullName = dashcamFullNameInput ? dashcamFullNameInput.value : '';
      const dob = dashcamDobInput ? dashcamDobInput.value : '';
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
      
      if (dashcamReportNotesTextarea) {
        dashcamReportNotesTextarea.value = defaultText;
      }
    });
  }
  
  // Add reset button event listener
  const resetDashcamFormBtn = document.getElementById('resetDashcamForm');
  if (resetDashcamFormBtn) {
    resetDashcamFormBtn.addEventListener('click', resetDashcamForm);
  }
};