// Programming Class page functionality

// Get URL parameters
function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
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

// Load classroom data
async function loadClassroomData() {
    try {
        const classId = getUrlParameter('id');
        if (!classId) {
            showError('No classroom ID specified');
            return;
        }

        // Fetch classroom data
        const response = await fetch(`/api/classrooms/${classId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const classroom = await response.json();
        displayClassroomData(classroom);
    } catch (error) {
        console.error('Error loading classroom data:', error);
        showError(`Error loading classroom data: ${error.message}`);
    }
}

// Display classroom data
function displayClassroomData(classroom) {
    console.log('Classroom data:', classroom);
    
    // Get user role from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    const isTeacher = userData && userData.role === 'teacher';
    
    // Update page title and header
    document.title = `Snitch - ${classroom.classroomName || 'Class Details'}`;
    
    // Update welcome section
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) {
        welcomeSection.innerHTML = `
            <h1>${classroom.classroomName || 'Unnamed Class'}</h1>
            <p>${classroom.section || 'No Section'} - Class Activities and Performance</p>
        `;
        
        // Extract the classroom code with better logic
        let classCode = classroom.customCode || classroom.ID;
        
        // If it's in the format (teacherID)<20241906>(ID)<1>, extract just 20241906
        if (classroom.customCode && classroom.customCode.includes('<') && classroom.customCode.includes('>')) {
            // Find all values between < and >
            const matches = classroom.customCode.match(/<([^>]+)>/g);
            if (matches && matches.length > 0) {
                // Get the first capture group without the brackets
                classCode = matches[0].replace('<', '').replace('>', '');
            }
        }
        
        // If classCode is only a number and not the customCode, make it more unique
        if (!classroom.customCode && classCode && !isNaN(classCode)) {
            const teacherId = getTeacherID() || '2024';
            classCode = `${teacherId}${classCode}`;
        }
        
        // Only show the class code for teachers
        if (classCode && isTeacher) {
            // Add classroom code with more prominent styling
            const codeElement = document.createElement('div');
            codeElement.className = 'classroom-code';
            codeElement.innerHTML = `
                <div style="margin-top: 15px; padding: 15px; background-color: #1a1a1a; 
                    border-radius: 8px; border: 1px solid #333; display: inline-block;">
                    <div style="display: flex; align-items: center;">
                        <i class="fas fa-key" style="color: #4a90e2; margin-right: 10px; font-size: 20px;"></i>
                        <div>
                            <div style="font-size: 12px; color: #aaa; margin-bottom: 3px;">Class Code:</div>
                            <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #ffffff;">
                                ${classCode}
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 5px; font-size: 12px; color: #aaa;">
                        Students can use this code to join your classroom
                    </div>
                </div>
            `;
            welcomeSection.appendChild(codeElement);
        }
    }
    
    // Update stats
    updateStats(classroom);
    
    // Initialize tabs
    initializeTabs();
    
    // Initialize charts
    initializeCharts(classroom);
    
    // Load activities for this classroom
    loadActivities(classroom.ID);
    
    // Hide/show elements based on user role
    const manageActivitiesBtn = document.getElementById('manageActivitiesBtn');
    if (manageActivitiesBtn) {
        // Hide manage activities button for students
        manageActivitiesBtn.style.display = isTeacher ? 'inline-flex' : 'none';
    }
    
    // Always hide join classroom container when viewing a specific classroom
    const studentJoinContainer = document.getElementById('student-join-container');
    if (studentJoinContainer) {
        studentJoinContainer.style.display = 'none';
    }
    
    // Hide any legacy join container that might be showing
    const joinContainer = document.querySelector('.join-container');
    if (joinContainer) {
        joinContainer.style.display = 'none';
    }
    
    // Hide debug button for non-teachers
    const debugBtn = document.getElementById('debugBtn');
    if (debugBtn) {
        debugBtn.style.display = isTeacher ? 'inline-block' : 'none';
    }
}

// Update the class statistics
function updateStats(classroom) {
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-item">
                <i class="fas fa-users"></i>
                <span>${classroom.participants || 0} Students</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-tasks"></i>
                <span>${classroom.activities || 0} Assignments</span>
            </div>
            <div class="stat-item">
                <i class="fas fa-chart-line"></i>
                <span>${classroom.score || 0}% Average</span>
            </div>
        `;
    }
}

// Initialize tabs functionality
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize charts - completely rewritten
function initializeCharts(classroom) {
    // Get the canvas element
    const canvasElement = document.getElementById('performanceChart');
    if (!canvasElement) return;
    
    // Clear any existing chart 
    // 1. Remove the canvas and recreate it
    const chartContainer = canvasElement.parentNode;
    chartContainer.removeChild(canvasElement);
    
    // Create a new canvas with the same ID
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'performanceChart';
    chartContainer.appendChild(newCanvas);
    
    // 2. Create a new chart on the fresh canvas
    const classroomId = classroom.ID || 'unknown';
    window.performanceChartInstance = new Chart(newCanvas, {
        type: 'line',
        data: {
            labels: ['Assignment 1', 'Quiz 1', 'Assignment 2', 'Quiz 2', 'Assignment 3'],
            datasets: [{
                label: `Class ${classroomId} Average (%)`,
                data: [85, 92, 87, 90, 88],
                borderColor: '#4a90e2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Load activities for a classroom
async function loadActivities(classroomId) {
    try {
        const response = await fetch(`/api/classrooms/${classroomId}/activities`);
        if (!response.ok) {
            console.error(`Error fetching activities: ${response.status}`);
            return;
        }
        
        const activities = await response.json();
        displayActivities(activities);
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// Display activities
function displayActivities(activities) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    // Apply dark theme to activity list
    activityList.style.backgroundColor = '#1e1e1e';
    activityList.style.border = '1px solid #333';
    
    // Clear existing activities
    activityList.innerHTML = '';
    
    // Check if there are any activities
    if (!activities || activities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px 20px; color: #aaa;">
                <i class="fas fa-clipboard-list" style="font-size: 48px; color: #444; margin-bottom: 20px;"></i>
                <h3 style="color: #e0e0e0;">No Activities</h3>
                <p style="color: #aaa;">There are no activities in this classroom yet.</p>
            </div>
        `;
        return;
    }
    
    // Display each activity
    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.style.backgroundColor = '#1e1e1e';
        activityItem.style.borderBottom = '1px solid #333';
        activityItem.style.color = '#e0e0e0';
        
        // Format due date
        let dueDateDisplay = 'No due date';
        if (activity.dueDate) {
            const dueDate = new Date(activity.dueDate);
            dueDateDisplay = `Due: ${dueDate.toLocaleDateString()}`;
        }
        
        // Create type badge class
        const typeClass = activity.type.toLowerCase();
        
        activityItem.innerHTML = `
            <h4 style="color: #e0e0e0;">${activity.title}</h4>
            <span class="activity-type-badge ${typeClass}" style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; margin-right: 8px; background-color: ${getBadgeColor(activity.type)}; color: white;">
                ${activity.type}
            </span>
            <p style="color: #aaa;">${dueDateDisplay}</p>
        `;
        
        activityList.appendChild(activityItem);
    });
}

// Get badge color based on activity type
function getBadgeColor(type) {
    switch (type.toLowerCase()) {
        case 'quiz':
            return '#8e44ad'; // Purple
        case 'assignment':
            return '#2ecc71'; // Green
        case 'discussion':
            return '#e74c3c'; // Red
        case 'form':
            return '#3498db'; // Blue
        default:
            return '#95a5a6'; // Grey
    }
}

// Show error message
function showError(message) {
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
        contentArea.innerHTML = `
            <div class="error-message" style="text-align: center; margin-top: 50px; color: #e74c3c;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px;"></i>
                <h2>Error</h2>
                <p>${message}</p>
                <a href="classroom.html" class="btn" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">
                    Return to Classrooms
                </a>
            </div>
        `;
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadClassroomData();
    
    // Update username from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        const usernameElement = document.querySelector('.username');
        if (usernameElement) {
            usernameElement.textContent = userData.name;
        }
        
        // Check if student, setup join class form for specific pages
        if (userData.role === 'student') {
            setupStudentJoinForm();
        }
    }
    
    // Set manage activities button URL
    const manageActivitiesBtn = document.getElementById('manageActivitiesBtn');
    if (manageActivitiesBtn) {
        const classId = getUrlParameter('id');
        if (classId) {
            manageActivitiesBtn.href = `manage-activities.html?id=${classId}`;
        }
    }
    
    // Debug button functionality
    const debugBtn = document.getElementById('debugBtn');
    if (debugBtn) {
        debugBtn.addEventListener('click', async () => {
            const debugOutput = document.getElementById('debugOutput');
            debugOutput.style.display = 'block';
            debugOutput.textContent = 'Testing API endpoints...';
            
            try {
                const classId = getUrlParameter('id');
                if (!classId) {
                    debugOutput.textContent = 'Error: No classroom ID found in URL';
                    return;
                }
                
                // Test activities endpoint
                const activitiesResponse = await fetch(`/api/classrooms/${classId}/activities`);
                const activitiesStatus = activitiesResponse.status;
                let activitiesText = '';
                
                try {
                    const activitiesJson = await activitiesResponse.json();
                    activitiesText = JSON.stringify(activitiesJson, null, 2);
                } catch (e) {
                    activitiesText = await activitiesResponse.text();
                }
                
                debugOutput.textContent = `GET /api/classrooms/${classId}/activities\n`;
                debugOutput.textContent += `Status: ${activitiesStatus}\n\n`;
                debugOutput.textContent += `Response:\n${activitiesText}`;
                
                // Also check the classroom data endpoint
                const classroomResponse = await fetch(`/api/classrooms/${classId}`);
                const classroomStatus = classroomResponse.status;
                
                debugOutput.textContent += `\n\nGET /api/classrooms/${classId}\n`;
                debugOutput.textContent += `Status: ${classroomStatus}\n`;
            } catch (error) {
                debugOutput.textContent = `Error: ${error.message}`;
            }
        });
    }
});

// Setup join form for students
function setupStudentJoinForm() {
    const joinContainer = document.getElementById('student-join-container');
    if (!joinContainer) return;
    
    // Only show join form when on the classroom landing page (no ID in URL)
    const classId = getUrlParameter('id');
    if (classId) {
        joinContainer.style.display = 'none';
        return;
    }
    
    // Get user role from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    const isStudent = userData && userData.role === 'student';
    
    // Only show for students
    if (!isStudent) {
        joinContainer.style.display = 'none';
        return;
    }
    
    // Show join form on the classroom home page for students
    joinContainer.style.display = 'block';
    
    // Setup join button functionality
    const joinButton = document.getElementById('join-class-btn');
    const codeInput = document.getElementById('join-code-input');
    const errorMessage = document.getElementById('join-error');
    
    if (joinButton && codeInput) {
        joinButton.addEventListener('click', async () => {
            const code = codeInput.value.trim();
            if (!code) {
                errorMessage.textContent = 'Please enter a classroom code';
                errorMessage.style.display = 'block';
                return;
            }
            
            try {
                // Get student ID from localStorage
                if (!userData || !userData.studentID) {
                    errorMessage.textContent = 'You must be logged in as a student to join a classroom';
                    errorMessage.style.display = 'block';
                    return;
                }
                
                // Preview classroom
                const previewResponse = await fetch(`/api/classrooms/preview?code=${code}`);
                if (!previewResponse.ok) {
                    throw new Error('Invalid classroom code');
                }
                
                const classroom = await previewResponse.json();
                
                // Join classroom
                const joinResponse = await fetch('/api/join-classroom', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        classroomId: classroom.ID,
                        studentId: userData.studentID
                    })
                });
                
                if (!joinResponse.ok) {
                    throw new Error('Failed to join classroom');
                }
                
                // Success - redirect to the classroom page
                window.location.href = `view-classroom.html?id=${classroom.ID}&joined=true`;
                
            } catch (error) {
                console.error('Error joining classroom:', error);
                errorMessage.textContent = error.message || 'Failed to join classroom';
                errorMessage.style.display = 'block';
            }
        });
    }
} 