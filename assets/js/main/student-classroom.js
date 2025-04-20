// Student Classroom functionality

// DOM Elements
const searchInput = document.getElementById('searchInput');
const enrolledClassroomGrid = document.getElementById('enrolledClassroomGrid');
const availableClassroomGrid = document.getElementById('availableClassroomGrid');
const joinForm = document.getElementById('join-form');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    setupTabs();
    setupSearchFunctionality();
    setupJoinForm();
    
    // Load all classroom data at once instead of making separate calls
    loadAllClassroomData();
});

// Function to get studentID from localStorage
function getStudentID() {
    // Try to get userData from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    // Try to get studentID from userData
    if (userData && userData.studentID) {
        return userData.studentID;
    }
    
    // If not in userData, try the separate studentID value
    return localStorage.getItem('studentID');
}

// Load user data from localStorage
function loadUserData() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        const usernameElement = document.querySelector('.username');
        if (usernameElement) {
            usernameElement.textContent = userData.name || 'Student';
        }
    } else {
        console.error('User data not found in localStorage');
        // Redirect to login if no user data
        window.location.href = 'login.html';
    }
}

// Setup tabs functionality
function setupTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Function to load all classroom data
async function loadAllClassroomData() {
    try {
        const studentID = getStudentID();
        if (!studentID) {
            showToast('Student ID not found. Please log in again.', 'error');
            return;
        }
        
        // Show loading state
        showMessage(enrolledClassroomGrid, 'Loading your classrooms...', 'info');
        showMessage(availableClassroomGrid, 'Loading available classrooms...', 'info');
        
        // Fetch enrolled classrooms
        const enrolledResponse = await fetch(`/api/students/${studentID}/classrooms`);
        if (!enrolledResponse.ok) {
            throw new Error(`Error fetching enrolled classrooms: ${enrolledResponse.statusText}`);
        }
        const enrolledClassrooms = await enrolledResponse.json();
        
        // Display enrolled classrooms
        displayEnrolledClassrooms(enrolledClassrooms);
        
        // For available classrooms, we could implement different approaches:
        // 1. For now, just show a message about using the join code
        showMessage(availableClassroomGrid, 'To join a new classroom, use the "Join Classroom" button and enter the code provided by your teacher.', 'info');
        
    } catch (error) {
        console.error('Error loading classroom data:', error);
        showMessage(enrolledClassroomGrid, `Error loading your classrooms: ${error.message}`, 'error');
        showMessage(availableClassroomGrid, `Error loading available classrooms: ${error.message}`, 'error');
    }
}

// Load classrooms the student is enrolled in
async function loadEnrolledClassrooms() {
    // This function now uses the consolidated endpoint via loadAllClassroomData
    await loadAllClassroomData();
}

// Display enrolled classrooms
function displayEnrolledClassrooms(classrooms) {
    enrolledClassroomGrid.innerHTML = '';
    
    if (!Array.isArray(classrooms) || classrooms.length === 0) {
        showMessage(enrolledClassroomGrid, 'You are not enrolled in any classrooms yet.', 'info');
        return;
    }
    
    classrooms.forEach(classroom => {
        const card = createClassroomCard(classroom, true);
        enrolledClassroomGrid.appendChild(card);
    });
}

// Load available classrooms the student can join
async function loadAvailableClassrooms() {
    // This function now just shows a loading message as actual loading is handled by loadAllClassroomData
    showMessage(availableClassroomGrid, 'Loading available classrooms...', 'info');
}

// Display available classrooms
function displayAvailableClassrooms(classrooms) {
    availableClassroomGrid.innerHTML = '';
    
    if (!Array.isArray(classrooms) || classrooms.length === 0) {
        showMessage(availableClassroomGrid, 'No available classrooms found.', 'info');
        return;
    }
    
    classrooms.forEach(classroom => {
        const card = createClassroomCard(classroom, false);
        availableClassroomGrid.appendChild(card);
    });
}

// Create a classroom card
function createClassroomCard(classroom, isEnrolled) {
    const card = document.createElement('div');
    card.classList.add('classroom-card');
    
    card.innerHTML = `
        <div class="classroom-image">
            <img src="../../files/images/default-imageprofile.jpg" alt="classroom-image">
        </div>
        <div class="classroom-header">
            <h3>${classroom.classroomName || 'Unnamed Class'}</h3>
            <span class="class-section">${classroom.section || 'No Section'}</span>
        </div>
        <div class="classroom-stats">
            <div class="stat">
                <i class="fas fa-users"></i>
                <span>${classroom.participants || 0} Students</span>
            </div>
            <div class="stat">
                <i class="fas fa-tasks"></i>
                <span>${classroom.activities || 0} Assignments</span>
            </div>
        </div>
        <div class="classroom-teacher">
            <i class="fas fa-chalkboard-teacher"></i>
            <span>${classroom.teacherName || 'Unknown Teacher'}</span>
        </div>
        <div class="classroom-actions">
            ${isEnrolled 
                ? `<a href="student-view-class.html?id=${classroom.ID}" class="view-class-btn">View Class</a>
                   <button class="leave-class-btn" data-id="${classroom.ID}">
                     <i class="fas fa-sign-out-alt"></i>
                   </button>`
                : `<button class="join-class-btn" data-id="${classroom.ID}">
                     <i class="fas fa-sign-in-alt"></i> Join Class
                   </button>`
            }
        </div>
    `;
    
    // Add event listeners
    if (isEnrolled) {
        const leaveBtn = card.querySelector('.leave-class-btn');
        leaveBtn.addEventListener('click', () => leaveClassroom(classroom.ID));
    } else {
        const joinBtn = card.querySelector('.join-class-btn');
        joinBtn.addEventListener('click', () => joinClassroom(classroom.ID));
    }
    
    return card;
}

// Join a classroom
async function joinClassroom(classroomId) {
    try {
        const studentID = getStudentID();
        if (!studentID) {
            showToast('Student ID not found. Please log in again.', 'error');
            return;
        }
        
        const response = await fetch(`/api/classrooms/${classroomId}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ studentID })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to join classroom');
        }
        
        showToast('Successfully joined classroom!', 'success');
        
        // Reload both classroom lists
        loadEnrolledClassrooms();
        loadAvailableClassrooms();
        
        // Switch to enrolled tab
        tabButtons[0].click();
    } catch (error) {
        console.error('Error joining classroom:', error);
        showToast(`Error joining classroom: ${error.message}`, 'error');
    }
}

// Leave a classroom
async function leaveClassroom(classroomId) {
    if (!confirm('Are you sure you want to leave this classroom?')) {
        return;
    }
    
    try {
        const studentID = getStudentID();
        if (!studentID) {
            showToast('Student ID not found. Please log in again.', 'error');
            return;
        }
        
        const response = await fetch(`/api/classrooms/${classroomId}/students/${studentID}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to leave classroom');
        }
        
        showToast('Successfully left classroom.', 'success');
        
        // Reload both classroom lists
        loadEnrolledClassrooms();
        loadAvailableClassrooms();
    } catch (error) {
        console.error('Error leaving classroom:', error);
        showToast(`Error leaving classroom: ${error.message}`, 'error');
    }
}

// Setup search functionality
function setupSearchFunctionality() {
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            // Get active tab
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab.id === 'my-classrooms') {
                // Search within enrolled classrooms
                const cards = enrolledClassroomGrid.querySelectorAll('.classroom-card');
                cards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(query) ? 'block' : 'none';
                });
            } else {
                // Search within available classrooms
                const cards = availableClassroomGrid.querySelectorAll('.classroom-card');
                cards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(query) ? 'block' : 'none';
                });
            }
        });
    }
}

// Setup join form
function setupJoinForm() {
    if (joinForm) {
        joinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const classCode = document.getElementById('class-code').value.trim();
            if (!classCode) {
                showToast('Please enter a class code.', 'error');
                return;
            }
            
            try {
                // Get all classrooms and find the one with matching class code
                const response = await fetch('/api/classrooms');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const classrooms = await response.json();
                const classroom = classrooms.find(c => c.section === classCode);
                
                if (!classroom) {
                    showToast('Classroom not found with that code.', 'error');
                    return;
                }
                
                // Join the classroom
                joinClassroom(classroom.ID);
                
                // Clear the form
                joinForm.reset();
            } catch (error) {
                console.error('Error joining classroom by code:', error);
                showToast(`Error: ${error.message}`, 'error');
            }
        });
    }
}

// Helper function to show messages in containers
function showMessage(container, message, type = 'info') {
    container.innerHTML = '';
    
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <p>${message}</p>
    `;
    
    container.appendChild(messageEl);
}

// Helper function to show toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Add styles if they don't exist yet
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 4px;
                color: white;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            .toast-success { background-color: #2ecc71; }
            .toast-error { background-color: #e74c3c; }
            .toast-info { background-color: #3498db; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .message {
                padding: 20px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                margin: 20px 0;
            }
            .message i {
                margin-right: 10px;
                font-size: 24px;
            }
            .message-info { background-color: rgba(52, 152, 219, 0.1); color: #3498db; }
            .message-error { background-color: rgba(231, 76, 60, 0.1); color: #e74c3c; }
        `;
        document.head.appendChild(style);
    }
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}