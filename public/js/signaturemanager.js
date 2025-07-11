// Signature Module - Reusable signature pad functionality

class SignatureManager {
  constructor(namespace = 'default') {
    this.namespace = namespace;
    this.signaturePads = new Map();
    this.canvasHasSignature = {};
    this.canvasHasPlaceholder = {};
    this.placeholderHelper = this.createPlaceholderHelper();
  }

  createPlaceholderHelper() {
    const helper = document.createElement('div');
    helper.className = 'signature-placeholder-text';
    helper.style.display = 'none';
    document.body.appendChild(helper);
    return helper;
  }

  initializeSignaturePad(canvas, options = {}) {
    if (!canvas || canvas.offsetParent === null) return null;
    
    // Ensure canvas has dimensions and proper scaling for device pixel ratio
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    
    // Create signature pad instance with optimized options for smooth drawing
    const defaultOptions = {
      dotSize: function () {
        return (this.minWidth + this.maxWidth) / 2;
      },
      minWidth: 0.5,
      maxWidth: 2.5,
      penColor: 'black',
      backgroundColor: 'rgba(0,0,0,0)',
      throttle: 0,
      minDistance: 1,
      velocityFilterWeight: 0.8,
      canvasContextOptions: {
        lineCap: 'round',
        lineJoin: 'round',
        miterLimit: 10
      }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    const signaturePad = new SignaturePad(canvas, mergedOptions);
    
    // Store the signature pad
    this.signaturePads.set(canvas.id, signaturePad);
    
    // Initialize state tracking
    this.canvasHasSignature[canvas.id] = false;
    this.canvasHasPlaceholder[canvas.id] = true;
    
    // Add placeholder text
    this.drawSignaturePlaceholder(canvas);
    
    // Add event listeners
    signaturePad.addEventListener("beginStroke", () => {
      if (this.canvasHasPlaceholder[canvas.id]) {
        this.clearPlaceholder(canvas);
        this.canvasHasPlaceholder[canvas.id] = false;
      }
    });
    
    signaturePad.addEventListener("endStroke", () => {
      this.canvasHasSignature[canvas.id] = !signaturePad.isEmpty();
    });
    
    return signaturePad;
  }

  clearPlaceholder(canvas) {
    if (canvas && canvas.offsetParent !== null) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  drawSignaturePlaceholder(canvas, customText = null) {
    if (canvas && canvas.offsetParent !== null) {
      const ctx = canvas.getContext('2d');
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      
      if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = 150 * ratio; 
        ctx.scale(ratio, ratio);
      }
      
      ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);

      // Get styles from the helper div
      const computedStyle = window.getComputedStyle(this.placeholderHelper);
      const fontStyle = computedStyle.getPropertyValue('font-style');
      const fontSize = computedStyle.getPropertyValue('font-size');
      const fontFamily = computedStyle.getPropertyValue('font-family');
      const color = computedStyle.getPropertyValue('color');

      ctx.font = `${fontStyle} ${fontSize} ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Use custom text or determine based on canvas ID
      let placeholderText = customText || this.getDefaultPlaceholderText(canvas.id);
      
      ctx.fillText(placeholderText, (canvas.width / ratio) / 2, (canvas.height / ratio) / 2);
      this.canvasHasPlaceholder[canvas.id] = true;
    }
  }

  getDefaultPlaceholderText(canvasId) {
    // Default placeholder text mapping
    const placeholderMap = {
      'customerSigCanvas': 'Customer Sign Here',
      'customerWitnessSigCanvas': 'Witness Sign Here',
      'staffSigCanvas': 'Staff Sign Here',
      'witnessSigCanvas': 'Witness Sign Here',
      'dashcamSigCanvas': 'Customer Sign Here',
      'dashcamWitnessSigCanvas': 'Witness Sign Here',
      'reqForServiceStaffSigCanvas': 'Staff Sign Here',
      'reqForServiceCustomerSigCanvas': 'Customer Sign Here'
    };
    
    return placeholderMap[canvasId] || 'Sign Here';
}

  clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const signaturePad = this.signaturePads.get(canvasId);
    
    if (signaturePad) {
      signaturePad.clear();
      this.drawSignaturePlaceholder(canvas);
      
      this.canvasHasSignature[canvasId] = false;
      this.canvasHasPlaceholder[canvasId] = true;
      
      // Clear hidden input
      const hiddenInputId = canvasId.replace('Canvas', 'Signature'); 
      const hiddenInput = document.getElementById(hiddenInputId);
      if (hiddenInput) {
        hiddenInput.value = '';
      }
    }
  }

  isCanvasEmpty(canvasId) {
    const signaturePad = this.signaturePads.get(canvasId);
    return signaturePad ? signaturePad.isEmpty() : true;
  }

  getSignaturePad(canvasId) {
    return this.signaturePads.get(canvasId);
  }

  updatePenColor(canvasId, position) {
    const signaturePad = this.signaturePads.get(canvasId);
    if (!signaturePad) return;
    
    let penColor = 'black';
    switch (position) {
      case 'supervisor': penColor = 'blue'; break;
      case 'manager': penColor = 'red'; break;
      case 'director': penColor = 'green'; break;
      default: penColor = 'black';
    }
    
    signaturePad.penColor = penColor;
  }

  getSignatureDataURL(canvasId, format = 'image/png') {
    const signaturePad = this.signaturePads.get(canvasId);
    return signaturePad && !signaturePad.isEmpty() ? signaturePad.toDataURL(format) : '';
  }

  setupClearButtons(buttonSelector) {
    document.querySelectorAll(buttonSelector).forEach(button => {
      const canvasId = button.dataset.canvasId;
      if (canvasId) {
        button.addEventListener('click', () => {
          this.clearCanvas(canvasId);
        });
      }
    });
  }

  reinitializeSignaturePads(canvasIds) {
    canvasIds.forEach(canvasId => {
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        this.initializeSignaturePad(canvas);
      }
    });
  }
}

// Export for use in other modules
window.SignatureManager = SignatureManager;