document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get the target page
            const targetPage = this.getAttribute('href');
            
            // If the link is not the current page, navigate to it
            if (targetPage !== window.location.pathname.split('/').pop()) {
                window.location.href = targetPage;
            }
        });
    });

    // Create Classroom Form Submission
    const classroomForm = document.getElementById('classroom-form');
    if (classroomForm) {
        classroomForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                className: document.getElementById('class-name').value,
                classCode: document.getElementById('class-code').value,
                subject: document.getElementById('subject').value,
                gradeLevel: document.getElementById('grade-level').value,
                description: document.getElementById('description').value,
                startDate: document.getElementById('start-date').value,
                endDate: document.getElementById('end-date').value,
                classImage: fileInput.files[0] ? URL.createObjectURL(fileInput.files[0]) : '../../files/images/digital-art-isolated-house.jpg'
            };
            
            // Validate form data
            if (!formData.className || !formData.classCode || !formData.subject || 
                !formData.gradeLevel || !formData.startDate || !formData.endDate) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Validate dates
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            if (endDate < startDate) {
                alert('End date must be after start date');
                return;
            }

            // Get existing classrooms from localStorage
            let classrooms = JSON.parse(localStorage.getItem('classrooms')) || [];
            
            // Add new classroom
            classrooms.push({
                id: Date.now(), // Unique ID for the classroom
                ...formData,
                students: 0,
                assignments: 0
            });
            
            // Save updated classrooms to localStorage
            localStorage.setItem('classrooms', JSON.stringify(classrooms));
            
            // Show success message and redirect
            alert('Classroom created successfully!');
            window.location.href = 'classroom.html';
        });
    }

    // Load Classrooms
    const classroomGrid = document.querySelector('.classroom-grid');
    if (classroomGrid) {
        // Get classrooms from localStorage
        const classrooms = JSON.parse(localStorage.getItem('classrooms')) || [];
        
        // Remove the add classroom card temporarily
        const addClassroomCard = classroomGrid.querySelector('.add-classroom');
        if (addClassroomCard) {
            classroomGrid.removeChild(addClassroomCard);
        }
        
        // Add each classroom card
        classrooms.forEach(classroom => {
            const classroomCard = document.createElement('div');
            classroomCard.className = 'classroom-card';
            classroomCard.innerHTML = `
                <div class="classroom-image">
                    <img src="${classroom.classImage}" alt="${classroom.className}">
                </div>
                <div class="classroom-header">
                    <h3>${classroom.className}</h3>
                    <span class="class-code">${classroom.classCode}</span>
                </div>
                <div class="classroom-stats">
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        <span>${classroom.students} Students</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-tasks"></i>
                        <span>${classroom.assignments} Assignments</span>
                    </div>
                </div>
                <div class="classroom-actions">
                    <a href="class-detail.html?id=${classroom.id}" class="view-class-btn">View Class</a>
                    <button class="delete-class-btn" data-id="${classroom.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            classroomGrid.appendChild(classroomCard);
        });
        
        // Add back the add classroom card
        if (addClassroomCard) {
            classroomGrid.appendChild(addClassroomCard);
        }

        // Add event listeners for delete buttons
        const deleteButtons = document.querySelectorAll('.delete-class-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const classId = parseInt(this.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
                    // For existing cards (101, 201, 301)
                    if (classId <= 301) {
                        // Remove the card from the DOM
                        this.closest('.classroom-card').remove();
                        alert('Classroom deleted successfully!');
                    } else {
                        // For new cards (stored in localStorage)
                        // Get classrooms from localStorage
                        let classrooms = JSON.parse(localStorage.getItem('classrooms')) || [];
                        
                        // Filter out the classroom to be deleted
                        classrooms = classrooms.filter(classroom => classroom.id !== classId);
                        
                        // Save updated classrooms to localStorage
                        localStorage.setItem('classrooms', JSON.stringify(classrooms));
                        
                        // Remove the card from the DOM
                        this.closest('.classroom-card').remove();
                        
                        // Show success message
                        alert('Classroom deleted successfully!');
                    }
                }
            });
        });
    }

    // Profile Edit Button
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // Add your profile editing logic here
            alert('Profile editing functionality will be implemented here.');
        });
    }

    // Classroom View Button
    const viewClassBtns = document.querySelectorAll('.view-class-btn');
    viewClassBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Add your classroom viewing logic here
            alert('Classroom viewing functionality will be implemented here.');
        });
    });

    // Settings Toggle Switches
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const settingId = this.id;
            const isEnabled = this.checked;
            
            // Add your settings change logic here
            console.log(`${settingId} is now ${isEnabled ? 'enabled' : 'disabled'}`);
        });
    });

    // Search Functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            // Add your search logic here
            console.log('Searching for:', searchTerm);
        });
    }

    // Notifications
    const notifications = document.querySelector('.notifications');
    if (notifications) {
        notifications.addEventListener('click', function() {
            // Add your notifications logic here
            alert('Notifications functionality will be implemented here.');
        });
    }

    // Profile Dropdown
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        profileDropdown.addEventListener('click', function() {
            // Add your profile dropdown logic here
            alert('Profile dropdown functionality will be implemented here.');
        });
    }

}); 