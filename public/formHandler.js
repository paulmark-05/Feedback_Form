// Prevent multiple submissions
let isSubmitting = false;
let selectedFiles = [];
let currentCompressFileIndex = -1;

// Enhanced file size display function
function formatFileSize(bytes) {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    if (bytes < k) {
        return bytes + ' bytes';
    } else if (bytes < k * k) {
        return (bytes / k).toFixed(2) + ' KB';
    } else if (bytes < k * k * k) {
        return (bytes / (k * k)).toFixed(2) + ' MB';
    } else {
        return (bytes / (k * k * k)).toFixed(2) + ' GB';
    }
}

// Check if file is a full-display image
function isFullDisplayImage(file) {
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    return imageTypes.includes(file.type.toLowerCase());
}

// Setup relationship toggle functionality
function setupRelationshipToggle() {
    const relationshipRadios = document.querySelectorAll('input[name="relationship"]');
    relationshipRadios.forEach(radio => {
        let isSelected = false;
        
        radio.addEventListener('click', function() {
            if (isSelected && this.checked) {
                // Deselect if already selected
                this.checked = false;
                isSelected = false;
            } else {
                // Clear all others and select this one
                relationshipRadios.forEach(r => {
                    r.parentElement.isSelected = false;
                });
                this.checked = true;
                isSelected = true;
            }
            
            // Remove error styling when a selection is made
            const label = document.getElementById('relationshipLabel');
            if (label) {
                label.classList.remove('required-error');
            }
        });
        
        // Track selection state
        radio.addEventListener('change', function() {
            if (this.checked) {
                relationshipRadios.forEach(r => {
                    if (r !== this) {
                        r.parentElement.isSelected = false;
                    }
                });
                isSelected = true;
                
                // Remove error styling when a selection is made
                const label = document.getElementById('relationshipLabel');
                if (label) {
                    label.classList.remove('required-error');
                }
            }
        });
    });
}

// Validate relationship selection
function validateRelationshipField() {
    const radios = document.getElementsByName('relationship');
    const label = document.getElementById('relationshipLabel');
    const section = document.getElementById('relationshipSection');
    
    for (const radio of radios) {
        if (radio.checked) {
            label.classList.remove('required-error');
            return true;
        }
    }
    
    // No relationship selected - show error
    label.classList.add('required-error');
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
}

// Simplified consent validation
function validateConsent() {
    const consentCheckbox = document.getElementById('consentCheckbox');
    const submitBtn = document.getElementById('submitBtn');
    
    if (consentCheckbox && consentCheckbox.checked) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('disabled');
    } else {
        submitBtn.disabled = true;
        submitBtn.classList.add('disabled');
    }
}

// Phone number validation
function validatePhoneNumber(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleanPhone);
}

// Real-time phone validation
function setupPhoneValidation() {
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function() {
        const phone = this.value.trim();
        
        if (phone === '') {
            phoneError.textContent = '';
            phoneError.style.display = 'none';
            return;
        }
        
        if (!validatePhoneNumber(phone)) {
            phoneError.textContent = 'Please enter a valid 10-digit mobile number';
            phoneError.style.display = 'block';
        } else {
            phoneError.textContent = '';
            phoneError.style.display = 'none';
        }
    });
    
    // EMAIL VALIDATION
    const emailInput = document.getElementById('email');
    if (emailInput) {
        let emailError = document.getElementById('email-error');
        
        // If the error span doesn't already exist, create it
        if (!emailError) {
            emailError = document.createElement('span');
            emailError.id = 'email-error';
            emailError.className = 'error-message';
            emailError.style.display = 'none';
            emailError.style.color = 'red';
            emailInput.parentNode.appendChild(emailError);
        }
        
        emailInput.addEventListener('input', function () {
            const email = this.value.trim();
            
            if (email === '') {
                emailError.textContent = '';
                emailError.style.display = 'none';
                return;
            }
            
            const emailRegex = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
            if (!emailRegex.test(email)) {
                emailError.textContent = 'Please enter a valid email (e.g. example@domain.com)';
                emailError.style.display = 'block';
            } else {
                emailError.textContent = '';
                emailError.style.display = 'none';
            }
        });
    }
}

// Custom Modal Functions
function showModal(message, type = 'info', title = 'Notification') {
    const modal = document.getElementById('customModal');
    const container = modal.querySelector('.modal-container');
    const titleElement = modal.querySelector('.modal-title');
    const messageElement = document.getElementById('modalMessage');
    const footerElement = modal.querySelector('.modal-footer');
    
    container.classList.remove('success', 'error', 'warning', 'info', 'confirm');
    if (type) {
        container.classList.add(type);
    }
    
    titleElement.textContent = title;
    messageElement.innerHTML = message;
    footerElement.innerHTML = '';
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const modalBody = modal.querySelector('.modal-body');
    modalBody.scrollTop = 0;
}

function closeModal() {
    const modal = document.getElementById('customModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    currentCompressFileIndex = -1;
}

// Hide loading overlay - NEW FUNCTION
function hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    const submitOverlay = document.querySelector('.submit-overlay');
    
    if (overlay) {
        overlay.style.display = 'none';
    }
    if (submitOverlay) {
        submitOverlay.style.display = 'none';
    }
    
    // Reset submitting flag
    isSubmitting = false;
}

// Show loading overlay - NEW FUNCTION
function showLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    const submitOverlay = document.querySelector('.submit-overlay');
    
    if (overlay) {
        overlay.style.display = 'flex';
    }
    if (submitOverlay) {
        submitOverlay.style.display = 'flex';
    }
}

// Reset form function - NEW FUNCTION
function resetForm() {
    const form = document.getElementById('feedbackForm') || document.querySelector('form');
    if (form) {
        form.reset();
        
        // Clear any error messages
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });
        
        // Clear file selections
        selectedFiles = [];
        const fileDisplay = document.getElementById('selectedFiles');
        if (fileDisplay) {
            fileDisplay.innerHTML = '';
        }
        
        // Reset relationship toggles
        const relationshipRadios = document.querySelectorAll('input[name="relationship"]');
        relationshipRadios.forEach(radio => {
            radio.checked = false;
            radio.parentElement.isSelected = false;
        });
        
        // Reset submit button state
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('disabled');
        }
        
        console.log('Form reset completed');
    }
}

// MAIN FORM SUBMISSION HANDLER - This was missing!
async function submitForm(event) {
    if (event) {
        event.preventDefault();
    }
    
    // Prevent multiple submissions
    if (isSubmitting) {
        console.log('Form already being submitted...');
        return;
    }
    
    console.log('Starting form submission...');
    isSubmitting = true;
    
    try {
        // Show loading overlay
        showLoadingOverlay();
        
        // Get form data
        const form = document.getElementById('feedbackForm') || document.querySelector('form');
        if (!form) {
            throw new Error('Form not found');
        }
        
        // Create FormData object
        const formData = new FormData();
        
        // Add form fields - make sure field names match server expectations
        const name = document.getElementById('name')?.value?.trim();
        const serviceNumber = document.getElementById('serviceNumber')?.value?.trim() || 
                           document.getElementById('service_number')?.value?.trim();
        const email = document.getElementById('email')?.value?.trim();
        const phone = document.getElementById('phone')?.value?.trim();
        const address = document.getElementById('address')?.value?.trim();
        const branch = document.getElementById('branch')?.value;
        const message = document.getElementById('message')?.value?.trim();
        
        // Get selected relationship
        let relationship = '';
        const relationshipRadios = document.querySelectorAll('input[name="relationship"]');
        for (const radio of relationshipRadios) {
            if (radio.checked) {
                relationship = radio.value;
                break;
            }
        }
        
        // Validate required fields
        if (!name || !email || !branch) {
            throw new Error('Please fill in all required fields: Name, Email, and Branch');
        }
        
        // Add data to FormData
        formData.append('name', name);
        if (serviceNumber) formData.append('serviceNumber', serviceNumber);
        formData.append('email', email);
        if (phone) formData.append('phone', phone);
        if (address) formData.append('address', address);
        formData.append('branch', branch);
        if (relationship) formData.append('relationship', relationship);
        if (message) formData.append('message', message);
        
        // Add files
        const fileInput = document.getElementById('files');
        if (fileInput && fileInput.files) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('files', fileInput.files[i]);
            }
        }
        
        console.log('Sending form data...');
        
        // Submit form
        const response = await fetch('/submit-form', {
            method: 'POST',
            body: formData
            // Don't set Content-Type header - let browser set it for multipart/form-data
        });
        
        const result = await response.json();
        console.log('Server response:', result);
        
        // Hide loading overlay before showing modal
        hideLoadingOverlay();
        
        if (result.success) {
            // Show success modal
            showModal(
                `<div style="text-align: center;">
                    <div style="color: #28a745; font-size: 48px; margin-bottom: 15px;">✓</div>
                    <h3 style="color: #28a745; margin-bottom: 15px;">Form Submitted Successfully!</h3>
                    <p>${result.message}</p>
                    <p style="margin-top: 20px; font-size: 14px; color: #666;">
                        You will receive a confirmation email shortly.
                    </p>
                </div>`,
                'success',
                'Success'
            );
            
            // Reset form after successful submission
            setTimeout(() => {
                resetForm();
            }, 1000);
            
        } else {
            // Show error modal
            showModal(
                `<div style="text-align: center;">
                    <div style="color: #dc3545; font-size: 48px; margin-bottom: 15px;">✗</div>
                    <h3 style="color: #dc3545; margin-bottom: 15px;">Submission Failed</h3>
                    <p>${result.message || 'Please try again later.'}</p>
                </div>`,
                'error',
                'Error'
            );
        }
        
    } catch (error) {
        console.error('Form submission error:', error);
        
        // Hide loading overlay
        hideLoadingOverlay();
        
        // Show error modal
        showModal(
            `<div style="text-align: center;">
                <div style="color: #dc3545; font-size: 48px; margin-bottom: 15px;">✗</div>
                <h3 style="color: #dc3545; margin-bottom: 15px;">Submission Error</h3>
                <p>${error.message || 'An unexpected error occurred. Please try again.'}</p>
            </div>`,
            'error',
            'Error'
        );
        
        // Reset form on error
        setTimeout(() => {
            resetForm();
        }, 2000);
    }
}

// Remove oversized file
function removeOversizedFile() {
    if (currentCompressFileIndex >= 0 && currentCompressFileIndex < selectedFiles.length) {
        selectedFiles.splice(currentCompressFileIndex, 1);
        updateFileDisplay();
        closeModal();
    }
}

// Update file display
function updateFileDisplay() {
    const fileDisplay = document.getElementById('selectedFiles');
    if (!fileDisplay) return;
    
    if (selectedFiles.length === 0) {
        fileDisplay.innerHTML = '';
        return;
    }
    
    fileDisplay.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <span>${file.name} (${formatFileSize(file.size)})</span>
            <button type="button" onclick="removeFile(${index})">Remove</button>
        </div>
    `).join('');
}

// Remove file
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileDisplay();
}

// Show compression confirmation dialog
function showCompressionConfirmation(fileIndex) {
    const file = selectedFiles[fileIndex];
    if (!file) return;
    
    currentCompressFileIndex = fileIndex;
    
    const modal = document.getElementById('customModal');
    const container = modal.querySelector('.modal-container');
    const titleElement = modal.querySelector('.modal-title');
    const messageElement = document.getElementById('modalMessage');
    const footerElement = modal.querySelector('.modal-footer');
    
    container.classList.remove('success', 'error', 'warning', 'info');
    container.classList.add('confirm');
    
    titleElement.textContent = 'Compress File Confirmation';
    
    messageElement.innerHTML = `
        <div style="text-align: left;">
            <p><strong>File:</strong> ${file.name}</p>
            <p><strong>Current Size:</strong> ${formatFileSize(file.size)}</p>
            <p><strong>Size Limit:</strong> 10 MB</p>
            <p>What would you like to do with this oversized file?</p>
        </div>
    `;
    
    footerElement.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px; width: 100%;">
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="removeOversizedFile()" class="btn btn-danger" style="flex: 1;">Remove File</button>
                <button onclick="closeModal()" class="btn btn-secondary" style="flex: 1;">Keep & Continue</button>
            </div>
            
            <div style="border-top: 1px solid #ddd; padding-top: 15px;">
                <h4 style="margin: 0 0 10px; color: #666; font-size: 14px;">💡 Compress <strong>${file.name}</strong> using one of these free online tools:</h4>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
                    <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" class="compress-link">📄 PDF • No registration • Multiple formats</a>
                    <a href="https://smallpdf.com/compress-pdf" target="_blank" class="compress-link">🎯 PDF specialist • High quality</a>
                    <a href="https://www.adobe.com/acrobat/online/compress-pdf.html" target="_blank" class="compress-link">⚡ Easy • Quick processing</a>
                </div>
                <p style="font-size: 12px; color: #666; margin: 10px 0 0; text-align: center;">
                    💡 After compressing, download the new file and re-upload it here to replace the original.
                </p>
            </div>
            
            <div style="border-top: 1px solid #ddd; padding-top: 10px; text-align: center;">
                <p style="font-size: 12px; color: #888; margin: 0;">
                    Need help? Contact your Parent ZSB branch office.
                </p>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing form handlers...');
    
    // Setup validations
    setupRelationshipToggle();
    setupPhoneValidation();
    
    // Setup consent checkbox
    const consentCheckbox = document.getElementById('consentCheckbox');
    if (consentCheckbox) {
        consentCheckbox.addEventListener('change', validateConsent);
        validateConsent(); // Initial check
    }
    
    // Setup form submission
    const form = document.getElementById('feedbackForm') || document.querySelector('form');
    if (form) {
        form.addEventListener('submit', submitForm);
        console.log('Form submission handler attached');
    }
    
    // Setup submit button click handler as backup
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            e.preventDefault();
            submitForm();
        });
    }
    
    // Setup file input handler
    const fileInput = document.getElementById('files');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            selectedFiles = Array.from(e.target.files);
            updateFileDisplay();
        });
    }
    
    // Setup modal close handlers
    const modal = document.getElementById('customModal');
    if (modal) {
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
    }
    
    console.log('Form initialization complete');
});

// Make functions globally available
window.submitForm = submitForm;
window.resetForm = resetForm;
window.showModal = showModal;
window.closeModal = closeModal;
window.removeFile = removeFile;
window.removeOversizedFile = removeOversizedFile;
window.showCompressionConfirmation = showCompressionConfirmation;
