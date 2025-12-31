// Contact Form JavaScript

class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.messageDiv = document.getElementById('formMessage');
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }
    }

    async handleSubmit() {
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        // Validate form
        if (!this.validateForm(data)) {
            return;
        }

        // Show loading state
        this.setLoading(true);
        this.hideMessage();

        try {
            // Simulate form submission (in production, this would be a real API call)
            await this.simulateSubmission(data);
            
            // Show success message
            this.showMessage('success', 'Thank you for your message! We\'ll get back to you within 24 hours.');
            
            // Reset form
            this.form.reset();
            
        } catch (error) {
            this.showMessage('error', 'Failed to send message. Please try again later.');
        } finally {
            this.setLoading(false);
        }
    }

    validateForm(data) {
        const errors = [];

        // Check required fields
        if (!data.firstName || data.firstName.trim().length < 2) {
            errors.push('First name must be at least 2 characters');
        }

        if (!data.lastName || data.lastName.trim().length < 2) {
            errors.push('Last name must be at least 2 characters');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }

        if (!data.subject) {
            errors.push('Please select a subject');
        }

        if (!data.message || data.message.trim().length < 10) {
            errors.push('Message must be at least 10 characters');
        }

        if (!data.privacy) {
            errors.push('You must agree to the Privacy Policy and Terms of Service');
        }

        if (errors.length > 0) {
            this.showMessage('error', errors.join('<br>'));
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async simulateSubmission(data) {
        // Simulate API call delay
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Form submitted:', data);
                resolve({ success: true });
            }, 1500);
        });
    }

    setLoading(isLoading) {
        const submitButton = this.form.querySelector('button[type="submit"]');
        
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
            `;
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
        }
    }

    showMessage(type, message) {
        this.messageDiv.classList.remove('hidden');
        
        if (type === 'success') {
            this.messageDiv.className = 'mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg';
            this.messageDiv.innerHTML = `
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-green-800 dark:text-green-200">Success!</h3>
                        <div class="mt-2 text-sm text-green-700 dark:text-green-300">
                            ${message}
                        </div>
                    </div>
                </div>
            `;
        } else {
            this.messageDiv.className = 'mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg';
            this.messageDiv.innerHTML = `
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                        <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                            ${message}
                        </div>
                    </div>
                </div>
            `;
        }

        // Auto-hide success messages after 10 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage();
            }, 10000);
        }
    }

    hideMessage() {
        this.messageDiv.classList.add('hidden');
        this.messageDiv.innerHTML = '';
    }
}

// Initialize contact form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactForm();
});
