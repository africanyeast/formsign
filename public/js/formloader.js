class FormLoader {
    constructor() {
        this.formContainer = document.getElementById('formContainer');
        this.currentForm = null;
        this.initializeFormSwitching();
    }

    initializeFormSwitching() {
        const formTypeInputs = document.querySelectorAll('input[name="formType"]');
        formTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.loadForm(e.target.value);
                    this.showFormHeading(e.target.value);
                }
            });
        });
    }

    async loadForm(formType) {
        try {
            const response = await fetch(`forms/${formType}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${formType} form`);
            }
            const formHTML = await response.text();
            this.formContainer.innerHTML = formHTML;
            this.currentForm = formType;
            
            // Initialize form-specific functionality
            this.initializeFormSpecificFeatures(formType);
        } catch (error) {
            console.error('Error loading form:', error);
            this.formContainer.innerHTML = '<p class="text-danger">Error loading form. Please try again.</p>';
        }
    }

    initializeFormSpecificFeatures(formType) {
        // Re-initialize signature pads and form-specific JavaScript
        if (window.SignatureManager) {
            // Initialize signature manager for the loaded form
            switch(formType) {
                case 'staff':
                    if (typeof window.initializeStaffForm === 'function') {
                        window.initializeStaffForm();
                    }
                    break;
                case 'customer':
                    if (typeof window.initializeCustomerForm === 'function') {
                        window.initializeCustomerForm();
                    }
                    break;
                case 'dashcam':
                    if (typeof window.initializeDashcamForm === 'function') {
                        window.initializeDashcamForm();
                    }
                    break;
                case 'reqforservice':
                    if (typeof window.initializeReqForServiceForm === 'function') {
                        window.initializeReqForServiceForm();
                    }
                    break;
            }
        }
    }

    showFormHeading(formType) {
        // Hide all headings
        const headings = ['staff', 'customer', 'dashcam', 'reqforservice'];
        headings.forEach(type => {
            const heading = document.getElementById(`${type}FormHeading`);
            if (heading) {
                heading.style.display = 'none';
            }
        });
        
        // Show selected heading
        const selectedHeading = document.getElementById(`${formType}FormHeading`);
        if (selectedHeading) {
            selectedHeading.style.display = 'block';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FormLoader();
});