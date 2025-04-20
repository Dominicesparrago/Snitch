// Initialize classroom manager
initializeClassroomManager();

// DOM Elements
const classroomForm = document.getElementById('classroomForm');
const subjectSelect = document.getElementById('subject');
const gradeSelect = document.getElementById('grade');

// Setup dark theme
document.addEventListener('DOMContentLoaded', function() {
    // Apply dark theme
    setupDarkTheme();
    
    // Initialize other functionality
    populateDropdowns();
    initializeImageUpload();
    initializeFormSubmission();
});

// Apply dark theme styles
function setupDarkTheme() {
    // Add dark theme styles
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        body, .dashboard-container {
            background-color: #121212;
            color: #e0e0e0;
        }
        
        .form-container {
            background-color: #1e1e1e;
            border: 1px solid #333;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 25px;
        }
        
        .form-group input, .form-group select, .form-group textarea {
            background-color: #333;
            color: #e0e0e0;
            border: 1px solid #444;
        }
        
        .form-group label {
            color: #aaa;
        }
        
        .btn-create {
            background-color: #4a90e2;
            color: white;
        }
        
        .btn-cancel {
            background-color: #333;
            color: #ddd;
        }
        
        .image-preview {
            border: 1px dashed #444;
            background-color: #1e1e1e;
        }
    `;
    document.head.appendChild(styleTag);
}

// Populate subject and grade dropdowns
function populateDropdowns() {
    // Check if elements exist
    if (!subjectSelect || !gradeSelect) return;
    
    // Subjects
    const subjects = ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Art', 'Music', 'Physical Education'];
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.toLowerCase();
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });

    // Grades
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Grade ${i}`;
        gradeSelect.appendChild(option);
    }
}

// Handle form submission
function initializeFormSubmission() {
    const form = document.getElementById('classroom-form') || document.getElementById('classroomForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form inputs
        const className = document.getElementById('class-name').value;
        const section = document.getElementById('class-section').value;
        const description = document.getElementById('description') ? document.getElementById('description').value : '';
        
        // Get teacherID using our helper function
        const teacherID = getTeacherID();
        if (!teacherID) {
            showToast('Teacher ID not found. Please log in again.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        // Generate custom code using section as a base
        const customCode = `${section}-${teacherID}-${Date.now().toString().slice(-4)}`;
        
        const classData = {
            classroomName: className,
            section: section,
            activities: 0, // Start with 0 activities
            score: 0,      // Start with 0 score
            participants: 0, // Start with 0 participants
            teacherID: teacherID,
            customCode: customCode // Add the custom code to the classroom data
        };

        console.log('Creating classroom with data:', classData);

        try {
            // Show loading state
            const createBtn = form.querySelector('.create-btn') || form.querySelector('button[type="submit"]');
            const originalBtnText = createBtn.innerHTML;
            createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            createBtn.disabled = true;

            // Create classroom
            const response = await fetch('/api/classrooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(classData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create classroom');
            }
            
            // Show success message
            showToast(`Classroom created successfully! Invite code: ${customCode}`, 'success');
            
            // Redirect to the classrooms page
            setTimeout(() => {
                window.location.href = 'classroom.html';
            }, 1500);

        } catch (error) {
            console.error('Error creating classroom:', error);
            showToast(error.message || 'Failed to create classroom. Please try again.', 'error');
            
            // Reset button state
            createBtn.innerHTML = originalBtnText;
            createBtn.disabled = false;
        }
    });
}

// Local function to generate custom classroom code if global function is not available
async function generateLocalCustomCode(teacherID) {
    try {
        // Try to fetch classroom count
        const response = await fetch(`/api/teachers/${teacherID}/classrooms`);
        if (!response.ok) {
            throw new Error('Failed to fetch teacher classrooms');
        }
        
        const classrooms = await response.json();
        const classroomCount = classrooms.length + 1; // Add 1 for the new classroom
        
        // Generate code format: [YEAR][TEACHER_ID][CLASSROOM_COUNT]
        const year = new Date().getFullYear();
        const code = `${year}${teacherID}${classroomCount}`;
        
        return code;
    } catch (error) {
        console.error('Error in local code generation:', error);
        // Fallback
        return `${teacherID}${Date.now().toString().slice(-6)}`;
    }
}

// Function to get teacherID from localStorage
function getTeacherID() {
    // Try to get userData from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    // First try to get teacherID from userData
    if (userData && userData.teacherID) {
        return userData.teacherID;
    }
    
    // If not in userData, try the separate teacherID value
    return localStorage.getItem('teacherID');
}

// Initialize image upload preview functionality
function initializeImageUpload() {
    const imageInput = document.getElementById('class-image');
    if (!imageInput) return;
    
    const previewImage = document.getElementById('preview-image');
    const imagePreview = document.getElementById('image-preview');

    imagePreview.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Generate a random class code
function generateClassCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Upload classroom image
async function uploadClassImage(classroomId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch(`/api/classrooms/${classroomId}/image`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload classroom image');
        }

        return await response.json();
    } catch (error) {
        throw new Error('Failed to upload image: ' + error.message);
    }
}

// Show notification toast
function showToast(message, type = 'info') {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // Create the toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.backgroundColor = type === 'success' ? '#4CAF50' : 
                                  type === 'error' ? '#F44336' : 
                                  type === 'warning' ? '#FF9800' : '#2196F3';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.marginBottom = '10px';
    toast.style.borderRadius = '4px';
    toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    toast.style.display = 'flex';
    toast.style.justifyContent = 'space-between';
    toast.style.alignItems = 'center';
    toast.style.minWidth = '250px';
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease-in-out';

    // Add icon based on type
    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle"></i>';
    else if (type === 'error') icon = '<i class="fas fa-exclamation-circle"></i>';
    else if (type === 'warning') icon = '<i class="fas fa-exclamation-triangle"></i>';
    else icon = '<i class="fas fa-info-circle"></i>';

    // Toast content
    toast.innerHTML = `
        <div style="display: flex; align-items: center;">
            ${icon} <span style="margin-left: 10px;">${message}</span>
        </div>
        <button class="toast-close" style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add to container
    toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 50);

    // Close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        closeToast(toast);
    });

    // Auto close after 5 seconds
    setTimeout(() => {
        closeToast(toast);
    }, 5000);
}

// Helper function to close a toast with animation
function closeToast(toast) {
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Add some CSS for the toast notifications
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 4px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }

    .toast-success {
        background-color: #2ecc71;
    }

    .toast-error {
        background-color: #e74c3c;
    }

    .toast-info {
        background-color: #3498db;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .create-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style); 