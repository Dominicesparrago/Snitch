// Student View Class Page Functionality

// Get URL parameters
function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// DOM Elements
const classroomNameEl = document.getElementById('classroom-name');
const classroomSectionEl = document.getElementById('classroom-section');
const participantsCountEl = document.getElementById('participants-count');
const activitiesCountEl = document.getElementById('activities-count');
const classAverageEl = document.getElementById('class-average');
const teacherNameEl = document.getElementById('teacher-name');
const teacherEmailEl = document.getElementById('teacher-email');
const classmatesListEl = document.getElementById('classmates-list');
const assignmentsListEl = document.getElementById('assignments-list');
const gradesListEl = document.getElementById('grades-list');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    setupTabs();
    loadClassroomData();
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

// Load classroom data
async function loadClassroomData() {
    try {
        const classroomId = getUrlParameter('id');
        if (!classroomId) {
            showErrorPage('No classroom ID specified');
            return;
        }

        const response = await fetch(`/api/classrooms/${classroomId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const classroom = await response.json();
        displayClassroomData(classroom);
        
        // Load students in the classroom
        loadClassmates(classroomId);
        
        // For now, we'll use placeholder data for assignments and grades
        // In a real application, you would fetch these from the server
        displayPlaceholderAssignments();
        displayPlaceholderGrades();
        
        // Initialize progress chart
        initializeProgressChart();
    } catch (error) {
        console.error('Error loading classroom data:', error);
        showErrorPage(`Error loading classroom: ${error.message}`);
    }
}

// Display classroom data
function displayClassroomData(classroom) {
    document.title = `Snitch - ${classroom.classroomName || 'Class'}`;
    
    // Update header
    classroomNameEl.textContent = classroom.classroomName || 'Unnamed Class';
    classroomSectionEl.textContent = classroom.section || 'No Section';
    
    // Update stats
    participantsCountEl.textContent = `${classroom.participants || 0} Students`;
    activitiesCountEl.textContent = `${classroom.activities || 0} Assignments`;
    classAverageEl.textContent = `${classroom.score || 0}% Average`;
    
    // Update teacher info
    teacherNameEl.textContent = classroom.teacherName || 'Unknown Teacher';
    teacherEmailEl.textContent = classroom.teacherEmail || '';
}

// Load classmates
async function loadClassmates(classroomId) {
    try {
        const response = await fetch(`/api/classrooms/${classroomId}/students`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const students = await response.json();
        displayClassmates(students);
    } catch (error) {
        console.error('Error loading classmates:', error);
        classmatesListEl.innerHTML = `<p class="error-message">Error loading classmates: ${error.message}</p>`;
    }
}

// Display classmates
function displayClassmates(students) {
    if (!Array.isArray(students) || students.length === 0) {
        classmatesListEl.innerHTML = '<p>No other students in this class yet.</p>';
        return;
    }
    
    const studentID = getStudentID();
    
    classmatesListEl.innerHTML = '<div class="students-grid"></div>';
    const studentsGrid = classmatesListEl.querySelector('.students-grid');
    
    students.forEach(student => {
        const isCurrentUser = student.studentID == studentID;
        
        const studentEl = document.createElement('div');
        studentEl.className = 'student-card';
        if (isCurrentUser) studentEl.classList.add('current-user');
        
        studentEl.innerHTML = `
            <img src="../../files/images/default-imageprofile.jpg" alt="${student.name}" class="student-img">
            <div class="student-details">
                <h4>${student.name} ${isCurrentUser ? '(You)' : ''}</h4>
                <p>${student.course || ''} ${student.section || ''}</p>
                <p class="join-date">Joined: ${new Date(student.joinDate).toLocaleDateString()}</p>
            </div>
        `;
        
        studentsGrid.appendChild(studentEl);
    });
}

// Display placeholder assignments
function displayPlaceholderAssignments() {
    assignmentsListEl.innerHTML = `
        <div class="assignments-grid">
            <div class="assignment-card">
                <div class="assignment-header">
                    <h3>Assignment 1: Introduction</h3>
                    <span class="due-date">Due: May 15, 2023</span>
                </div>
                <div class="assignment-details">
                    <p>Complete the introductory exercises</p>
                </div>
                <div class="assignment-status completed">
                    <i class="fas fa-check-circle"></i> Completed
                </div>
            </div>
            
            <div class="assignment-card">
                <div class="assignment-header">
                    <h3>Assignment 2: Basic Concepts</h3>
                    <span class="due-date">Due: May 22, 2023</span>
                </div>
                <div class="assignment-details">
                    <p>Implement the basic concepts learned in class</p>
                </div>
                <div class="assignment-status pending">
                    <i class="fas fa-clock"></i> Pending
                </div>
            </div>
            
            <div class="assignment-card">
                <div class="assignment-header">
                    <h3>Quiz 1: Fundamentals</h3>
                    <span class="due-date">Due: May 29, 2023</span>
                </div>
                <div class="assignment-details">
                    <p>Online quiz covering the fundamental concepts</p>
                </div>
                <div class="assignment-status not-started">
                    <i class="fas fa-exclamation-circle"></i> Not Started
                </div>
            </div>
        </div>
    `;
}

// Display placeholder grades
function displayPlaceholderGrades() {
    gradesListEl.innerHTML = `
        <div class="grades-summary">
            <div class="overall-grade">
                <h3>Overall Grade</h3>
                <div class="grade-circle">
                    <span>88%</span>
                </div>
                <p>B+</p>
            </div>
            
            <div class="grade-breakdown">
                <h3>Grade Breakdown</h3>
                <table class="grades-table">
                    <thead>
                        <tr>
                            <th>Assignment</th>
                            <th>Score</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Assignment 1: Introduction</td>
                            <td>90/100</td>
                            <td>A-</td>
                        </tr>
                        <tr>
                            <td>Assignment 2: Basic Concepts</td>
                            <td>85/100</td>
                            <td>B</td>
                        </tr>
                        <tr>
                            <td>Quiz 1: Fundamentals</td>
                            <td>Not graded</td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Add styles for grades
    if (!document.getElementById('grades-styles')) {
        const style = document.createElement('style');
        style.id = 'grades-styles';
        style.textContent = `
            .grades-summary {
                display: flex;
                gap: 30px;
                margin-top: 20px;
            }
            .overall-grade {
                flex: 0 0 200px;
                text-align: center;
                background: #1a1a1a;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .grade-circle {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: linear-gradient(135deg, #3498db, #2980b9);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 20px auto;
            }
            .grade-circle span {
                font-size: 32px;
                font-weight: bold;
                color: white;
            }
            .grade-breakdown {
                flex: 1;
                background: #1a1a1a;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .grades-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .grades-table th, .grades-table td {
                padding: 10px 15px;
                text-align: left;
                border-bottom: 1px solid #333;
            }
            .grades-table th {
                background-color: #2a2a2a;
                color: #f0f0f0;
            }
            .assignment-card {
                background: #1a1a1a;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                padding: 20px;
                margin-bottom: 20px;
            }
            .assignment-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .due-date {
                color: #777;
            }
            .assignment-details {
                margin-bottom: 15px;
            }
            .assignment-status {
                font-weight: bold;
                padding: 5px 10px;
                border-radius: 4px;
                display: inline-block;
            }
            .completed {
                color: #2ecc71;
            }
            .pending {
                color: #f39c12;
            }
            .not-started {
                color: #e74c3c;
            }
            .students-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .student-card {
                display: flex;
                background: #1a1a1a;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                padding: 15px;
            }
            .student-card.current-user {
                border: 2px solid #3498db;
            }
            .student-img {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                margin-right: 15px;
            }
            .student-details h4 {
                margin: 0 0 5px;
            }
            .student-details p {
                margin: 0 0 5px;
                color: #777;
            }
            .join-date {
                font-size: 0.9em;
                color: #555 !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize progress chart
function initializeProgressChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    
    // Sample data
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            datasets: [{
                label: 'Your Progress (%)',
                data: [75, 82, 88, 85, 90],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }, {
                label: 'Class Average (%)',
                data: [70, 75, 78, 80, 82],
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
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

// Show error page
function showErrorPage(message) {
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
        contentArea.innerHTML = `
            <div class="error-message" style="text-align: center; margin-top: 50px; color: #e74c3c;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px;"></i>
                <h2>Error</h2>
                <p>${message}</p>
                <a href="student-classroom.html" class="btn" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">
                    Return to Classrooms
                </a>
            </div>
        `;
    }
} 