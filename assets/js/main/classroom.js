// Add this at the top of your file
// Log user role info as soon as the script loads
console.log("====== CLASSROOM PAGE ROLE DETECTION ======");
const userDataRaw = localStorage.getItem('userData');
console.log("Raw userData from localStorage:", userDataRaw);

if (userDataRaw) {
    try {
        const userData = JSON.parse(userDataRaw);
        console.log("✅ User role:", userData.role || "Not set");
        console.log("📝 User name:", userData.name || "Unknown");
        
        if (userData.studentID) {
            console.log("🧑‍🎓 User is a STUDENT - StudentID:", userData.studentID);
        }
        
        if (userData.teacherID) {
            console.log("👨‍🏫 User is a TEACHER - TeacherID:", userData.teacherID);
        }
        
        if (!userData.role) {
            console.warn("⚠️ WARNING: User role not explicitly set");
            if (userData.studentID && !userData.teacherID) {
                console.log("🔄 Will treat as STUDENT based on ID");
            } else if (userData.teacherID && !userData.studentID) {
                console.log("🔄 Will treat as TEACHER based on ID");
            } else {
                console.error("❌ Cannot determine role from available data");
            }
        }
    } catch (e) {
        console.error("❌ Error parsing userData:", e);
    }
} else {
    console.error("❌ No userData found in localStorage");
}
console.log("=========================================");

// Classroom specific functionality

// DOM Elements
const searchInput = document.getElementById('searchInput');
const classroomGrid = document.getElementById('classroomGrid');

// Function to enhance the role detection and UI setup
function enhanceRoleUI() {
    console.log("enhanceRoleUI - Ensuring UI matches user role");
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (userData) {
        const isTeacher = userData.role === 'teacher' || (userData.teacherID && !userData.studentID);
        const isStudent = userData.role === 'student' || (userData.studentID && !userData.teacherID);
        
        // Apply enhanced UI settings based on role
        const teacherElements = document.querySelectorAll('.teacher-only');
        const studentElements = document.querySelectorAll('.student-only');
        
        if (isTeacher) {
            console.log("Applying TEACHER UI enhancements");
            teacherElements.forEach(el => el.style.display = 'block');
            studentElements.forEach(el => el.style.display = 'none');
            
            // Show teacher classrooms
            loadClassrooms(userData.teacherID);
        } else if (isStudent) {
            console.log("Applying STUDENT UI enhancements");
            teacherElements.forEach(el => el.style.display = 'none');
            studentElements.forEach(el => el.style.display = 'block');
            
            // Load student's joined classrooms
            if (userData.studentID) {
                loadJoinedClassrooms(userData.studentID);
            } else {
                console.error("Student ID not found in user data");
                showNotification("Student ID not found. Please log out and log in again.", "error");
            }
        }
    }
}

// Document ready event - main entry point for the script
document.addEventListener('DOMContentLoaded', async () => {
    // Apply dark theme for consistency
    applyDarkTheme();
    
    // Make sure the UI is correctly set up for the current role
    enhanceRoleUI();
    
    // Set up search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            if (query) {
                // Handle search
                const results = searchClassrooms(query);
                displayClassrooms(results);
            } else {
                // Reload classrooms based on role when search is cleared
                enhanceRoleUI();
            }
        });
    }
});

// Function to handle login and load classrooms
async function handleLoginAndLoadClassrooms() {
    try {
        // Try to get userData from localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        console.log("Retrieved userData from localStorage:", userData);
        
        // Check if this is a student - if so, load joined classrooms instead
        if (userData && userData.role === 'student') {
            console.log("Loading joined classrooms for student:", userData.studentID);
            loadJoinedClassrooms(userData.studentID);
            return;
        }
        
        // First try to get teacherID from userData
        let teacherID = null;
        
        if (userData && userData.teacherID) {
            console.log("Found teacherID in userData:", userData.teacherID);
            teacherID = userData.teacherID;
        } else {
            // If not in userData, try the separate teacherID value
            teacherID = localStorage.getItem('teacherID');
            console.log("Retrieved teacherID directly from localStorage:", teacherID);
        }
        
        if (!teacherID) {
            console.error("No teacherID found in localStorage");
            // Check if we're logged in at all
            if (!userData || !userData.emailAddress) {
                console.error("User data not found or incomplete");
                window.location.href = 'login.html';
                return;
            }
            
            // If we have userData but no teacherID, try to fetch it
            console.log("Attempting to fetch teacherID for:", userData.emailAddress);
            
            // Display a message to the user
            alert("Teacher ID not found. Please log out and log in again.");
            return;
        }
        
        console.log("Using teacherID for loading classrooms:", teacherID);
        loadClassrooms(teacherID);
    } catch (error) {
        console.error("Error during login or classroom loading:", error);
        alert("An error occurred while loading your classrooms. Please try again.");
    }
}

// Load classrooms
function loadClassrooms(teacherID) {
    if (!teacherID) {
        console.error("No teacher ID provided");
        return;
    }

    console.log("Attempting to load classrooms for teacherID:", teacherID);
    fetch(`/api/classrooms?teacherID=${teacherID}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Classroom data received:", data);
            if (!Array.isArray(data)) {
                console.error("Expected array of classrooms, but got:", typeof data);
                return;
            }
            if (data.length === 0) {
                console.log("No classrooms found for teacher ID:", teacherID);
                // Show a message to the user
                if (classroomGrid) {
                    const addCard = classroomGrid.querySelector('.add-classroom');
                    classroomGrid.innerHTML = '<p class="no-classrooms-message">No classrooms found. Create a new classroom to get started.</p>';
                    if (addCard) classroomGrid.appendChild(addCard);
                }
            } else {
                console.log(`Found ${data.length} classrooms for teacher ${teacherID}`);
                console.log("First classroom data:", data[0]);
                
                // Sort and display the classrooms
                const sortedClassrooms = data.sort((a, b) => {
                    if (a.ID && b.ID) return a.ID - b.ID;
                    return 0;
                });
                displayClassrooms(sortedClassrooms);
            }
        })
        .catch(error => {
            console.error("Error loading classrooms:", error);
            // Show error message to user
            if (classroomGrid) {
                classroomGrid.innerHTML = `<p class="error-message">Error loading classrooms: ${error.message}</p>`;
            }
        });
}

// Display classrooms in the grid
function displayClassrooms(classrooms) {
    console.log("Displaying classrooms:", classrooms);
    
    if (!classroomGrid) {
        console.error("Classroom grid element not found");
        return;
    }

    // Find the add-classroom card if it exists
    const addCard = classroomGrid.querySelector('.add-classroom');
    classroomGrid.innerHTML = ''; // Clear existing content

    if (!Array.isArray(classrooms) || classrooms.length === 0) {
        const message = document.createElement('p');
        message.className = 'no-classrooms-message';
        message.textContent = 'No classrooms found. Create a new classroom to get started.';
        message.style.padding = '20px';
        message.style.textAlign = 'center';
        classroomGrid.appendChild(message);
        
        // Only add the "Create New Classroom" card for teachers
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData && userData.role === 'teacher' && addCard) {
            classroomGrid.appendChild(addCard);
        }
        return;
    }

    // Log each classroom to verify the data
    classrooms.forEach((classroom, index) => {
        console.log(`Classroom ${index + 1}:`, classroom);
        
        const card = document.createElement('div');
        card.classList.add('classroom-card');
        card.innerHTML = `
            <div class="classroom-image">
                <img src="../../files/images/default-imageprofile.jpg" alt="default-imageprofile">
            </div>
            <div class="classroom-header">
                <h3>${classroom.classroomName || classroom.className || 'Unnamed Class'}</h3>
                <span class="class-section">${classroom.section || 'No Section'}</span>
            </div>
            <div class="classroom-stats">
                <div class="stat">
                    <i class="fas fa-users"></i>
                    <span class="class-participants">${classroom.participants || 0} Students</span>
                </div>
                <div class="stat">
                    <i class="fas fa-tasks"></i>
                    <span class="class-activities">${classroom.activities || 0} Assignments</span>
                </div>
            </div>
            <div class="classroom-actions">
                <a href="view-classroom.html?id=${classroom.ID}" class="view-class-btn">View Class</a>
                <button class="delete-class-btn" data-id="${classroom.ID}" ${isStudent() ? 'style="display:none"' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        classroomGrid.appendChild(card);
    });

    // Re-append the "Create New Classroom" card at the end, but only for teachers
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData && userData.role === 'teacher' && addCard) {
        classroomGrid.appendChild(addCard);
    }
}

// Function to help diagnose user role issues
function debugUserRole() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    console.log("======= USER ROLE DEBUG =======");
    console.log("Raw userData:", userData);
    
    if (userData) {
        console.log("User name:", userData.name);
        console.log("User role:", userData.role);
        console.log("Student ID:", userData.studentID);
        console.log("Teacher ID:", userData.teacherID);
        
        // Check if role is explicitly set
        if (!userData.role) {
            console.log("Role is not explicitly set!");
            // Try to infer role
            if (userData.studentID) {
                console.log("Has studentID, likely a student");
            } else if (userData.teacherID) {
                console.log("Has teacherID, likely a teacher");
            } else {
                console.log("Cannot infer role from IDs");
            }
        }
    } else {
        console.log("No user data found in localStorage!");
    }
    console.log("==============================");
}

// Run role debug on page load
document.addEventListener('DOMContentLoaded', () => {
    debugUserRole();
    
    // Check if the URL contains a joined parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('joined') === 'true') {
        // Show a success message
        showNotification("Successfully joined the classroom!", "success");
    }
});

// Helper function to check if the current user is a student
function isStudent() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    // First check explicit role
    if (userData && userData.role === 'student') {
        return true;
    }
    
    // Then check for studentID as a fallback
    if (userData && userData.studentID && !userData.teacherID) {
        console.log("User has studentID but no explicit role, treating as student");
        // Fix the user data by adding the role
        userData.role = 'student';
        localStorage.setItem('userData', JSON.stringify(userData));
        return true;
    }
    
    return false;
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

// View classroom details
function viewClassroom(classroomId) {
    window.location.href = `classroom-details.html?id=${classroomId}`;
}

// Delete classroom
function deleteClass(classroomId) {
    if (confirm('Are you sure you want to delete this classroom?')) {
        deleteClassroom(classroomId);
        loadClassrooms();
    }
}

// Create classroom card
function createClassroomCard(classroom) {
    const div = document.createElement('div');
    div.className = 'classroom-card';
    div.innerHTML = `
        <div class="classroom-header">
            <h3>${classroom.name}</h3>
            <button class="more-options" data-classroom-id="${classroom.id}">
                <i class="fas fa-ellipsis-v"></i>
            </button>
        </div>
        <div class="classroom-info">
            <p><i class="fas fa-user"></i> ${classroom.instructor}</p>
            <p><i class="fas fa-users"></i> ${classroom.students} students</p>
            <div class="progress-bar">
                <div class="progress" style="width: ${classroom.progress}%"></div>
            </div>
            <p class="next-class">
                <i class="fas fa-calendar"></i> Next Class: ${formatDateTime(classroom.nextClass)}
            </p>
        </div>
        <div class="classroom-actions">
            <button class="enter-btn" onclick="enterClassroom(${classroom.id})">
                Enter Classroom
            </button>
        </div>
    `;

    // Setup more options menu
    const moreOptions = div.querySelector('.more-options');
    moreOptions.addEventListener('click', (e) => {
        e.stopPropagation();
        showClassroomOptions(classroom.id, e.target);
    });

    return div;
}

// Show classroom options menu
function showClassroomOptions(classroomId, target) {
    const existingMenu = document.querySelector('.classroom-options-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'classroom-options-menu';
    menu.innerHTML = `
        <ul>
            <li onclick="editClassroom(${classroomId})">
                <i class="fas fa-edit"></i> Edit Classroom
            </li>
            <li onclick="manageStudents(${classroomId})">
                <i class="fas fa-users-cog"></i> Manage Students
            </li>
            <li onclick="archiveClassroom(${classroomId})">
                <i class="fas fa-archive"></i> Archive Classroom
            </li>
            <li class="delete" onclick="deleteClassroom(${classroomId})">
                <i class="fas fa-trash"></i> Delete Classroom
            </li>
        </ul>
    `;

    // Position menu near the more options button
    const rect = target.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left}px`;

    document.body.appendChild(menu);

    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== target) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Setup classroom filters
function setupClassroomFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterClassrooms(button.dataset.filter);
        });
    });
}

// Filter classrooms
function filterClassrooms(filter) {
    const classrooms = document.querySelectorAll('.classroom-card');
    classrooms.forEach(classroom => {
        switch(filter) {
            case 'active':
                classroom.style.display = 'block';
                break;
            case 'archived':
                // Implement archived filter logic
                break;
            case 'teaching':
                // Implement teaching filter logic
                break;
            case 'enrolled':
                // Implement enrolled filter logic
                break;
            default:
                classroom.style.display = 'block';
        }
    });
}

// Setup classroom actions
function setupClassroomActions() {
    const createBtn = document.querySelector('.create-classroom-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            window.location.href = 'create-classroom.html';
        });
    }
}

// Enter classroom
function enterClassroom(classroomId) {
    window.location.href = `class-detail.html?id=${classroomId}`;
}

// Edit classroom
function editClassroom(classroomId) {
    // Implement edit classroom logic
    showNotification('Edit classroom functionality coming soon');
}

// Manage students
function manageStudents(classroomId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Manage Students</h2>
            <div class="student-list">
                <!-- Placeholder for student list -->
                <div class="student-item">
                    <img src="../../images/default-profile.jpg" alt="Student">
                    <span>Alice Johnson</span>
                    <button class="remove-student">Remove</button>
                </div>
            </div>
            <div class="modal-buttons">
                <button onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Archive classroom
function archiveClassroom(classroomId) {
    if (confirm('Are you sure you want to archive this classroom?')) {
        // Implement archive logic
        showNotification('Classroom archived successfully');
    }
}

// Delete classroom
function deleteClassroom(classroomId) {
    if (!classroomId) {
        console.error("No classroom ID provided for deletion");
        return;
    }

    if (confirm('Are you sure you want to delete this classroom?')) {
        fetch(`/api/classrooms/${classroomId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(() => {
            // Reload the classrooms after deletion
            const teacherID = getTeacherID();
            if (teacherID) {
                loadClassrooms(teacherID);
                showNotification('Classroom deleted successfully');
            } else {
                console.error("No teacherID found after deletion");
                showNotification('Classroom deleted but could not reload classrooms', 'warning');
            }
        })
        .catch(error => {
            console.error('Error deleting classroom:', error);
            showNotification('Failed to delete classroom', 'error');
        });
    }
}

// Function to search classrooms
function searchClassrooms(query) {
    const classrooms = Array.from(document.querySelectorAll('.classroom-card'));
    return classrooms.filter(classroom => {
        const text = classroom.textContent.toLowerCase();
        return text.includes(query.toLowerCase());
    });
}

// Helper function to format date and time
function formatDateTime(dateTimeString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleString(undefined, options);
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    // Manual close
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

// Export classroom-specific functions
window.searchClassrooms = searchClassrooms; 

const userData = JSON.parse(localStorage.getItem('userData'));
  
if (userData) {
    const usernameElement = document.querySelector('.username');
    const welcomeElement = document.querySelector('.username-placeholder');
    const classroomName = document.querySelector('.classroom-name');
    const classroomSection = document.querySelector('.classroom-section');
    const classroomParticipants = document.querySelector('.classroom-participants');
    const classroomActivities = document.querySelector('.classroom-activities');

    if (usernameElement) usernameElement.textContent = userData.name;
    if (welcomeElement) welcomeElement.textContent = userData.name;
    if (classroomName) classroomName.textContent = userData.className;
    if (classroomSection) classroomSection.textContent = userData.section;
    if (classroomParticipants) classroomParticipants.textContent = userData.participants;
    if (classroomActivities) classroomActivities.textContent = userData.activities;
}

document.addEventListener('DOMContentLoaded', () => {
    // Get teacherID using the same strategy as handleLoginAndLoadClassrooms
    let teacherID = null;
    
    // Try to get userData from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    // First try to get teacherID from userData
    if (userData && userData.teacherID) {
        teacherID = userData.teacherID;
    } else {
        // If not in userData, try the separate teacherID value
        teacherID = localStorage.getItem('teacherID');
    }
    
    if (!teacherID && userData && userData.role === 'teacher') {
        console.error("No teacherID found in localStorage");
        const message = document.createElement('p');
        message.className = 'error-message';
        message.textContent = 'Teacher ID not found. Please log out and log in again.';
        message.style.padding = '20px';
        message.style.color = 'red';
        message.style.textAlign = 'center';
        
        if (classroomGrid) {
            classroomGrid.innerHTML = '';
            classroomGrid.appendChild(message);
        }
        return;
    }

    // For students, we'll load student classrooms separately
    // This helps prevent duplicate classroom loading logic
    if (userData && userData.role === 'student') {
        // Student-specific loading will be handled by other functions
        return;
    }

    // Only proceed with teacher classroom loading if we have a teacher ID
    if (teacherID) {
        // Fetch classrooms
        fetch(`/api/classrooms?teacherID=${teacherID}`)
            .then(res => res.json())
            .then(classrooms => {
                // We'll let the displayClassrooms function handle this
                displayClassrooms(classrooms);
            })
            .catch(error => {
                console.error("Error loading classrooms:", error);
                const message = document.createElement('p');
                message.className = 'error-message';
                message.textContent = `Error loading classrooms: ${error.message}`;
                message.style.padding = '20px';
                message.style.color = 'red';
                message.style.textAlign = 'center';
                
                if (classroomGrid) {
                    classroomGrid.innerHTML = '';
                    classroomGrid.appendChild(message);
                }
            });
    }

    // Attach delete event listener
    classroomGrid?.addEventListener('click', (e) => {
        if (e.target.closest('.delete-class-btn')) {
            const btn = e.target.closest('.delete-class-btn');
            const classroomId = btn.dataset.id;
            deleteClassroom(classroomId);
        }
    });
});

// DEBUG: Add Test Classroom button
function addTestClassroomButton() {
    // If we already have a debug button, return
    if (document.getElementById('create-test-classroom-btn')) {
        return;
    }

    const button = document.createElement('button');
    button.id = 'create-test-classroom-btn';
    button.textContent = 'Create Test Classroom';
    button.style.position = 'fixed';
    button.style.right = '20px';
    button.style.bottom = '20px';
    button.style.padding = '10px';
    button.style.backgroundColor = '#e74c3c';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.zIndex = '9999';

    button.addEventListener('click', async () => {
        try {
            const teacherID = getTeacherID();
            if (!teacherID) {
                alert('Teacher ID not found. Please log in again.');
                return;
            }

            const response = await fetch(`/api/test/insert-classroom?teacherID=${teacherID}`);
            const data = await response.json();
            
            if (data.success) {
                alert(`Test classroom created successfully with ID ${data.classroomID}`);
                // Reload classrooms
                loadClassrooms(teacherID);
            } else {
                alert(`Failed to create test classroom: ${data.error}`);
            }
        } catch (error) {
            console.error('Error creating test classroom:', error);
            alert('Error creating test classroom');
        }
    });

    document.body.appendChild(button);
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only add debug button in development and when explicitly requested
    const debugMode = localStorage.getItem('debugMode') === 'true';
    if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && debugMode) {
        addTestClassroomButton();
    }
});

// Function to add the Create Class button for teachers
function addCreateClassButton() {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    // Check if a create button already exists
    if (document.querySelector('.create-class-btn')) return;
    
    const createButton = document.createElement('a');
    createButton.href = 'create-classroom.html';
    createButton.className = 'create-class-btn';
    createButton.textContent = '+ Create New Classroom';
    createButton.style.display = 'inline-block';
    createButton.style.padding = '12px 24px';
    createButton.style.backgroundColor = '#4a90e2';
    createButton.style.color = 'white';
    createButton.style.borderRadius = '5px';
    createButton.style.textDecoration = 'none';
    createButton.style.marginBottom = '20px';
    createButton.style.fontWeight = 'bold';
    
    // Insert at the beginning of the content area
    contentArea.insertBefore(createButton, contentArea.firstChild);
}

// Function to show the Join Class button for students
function showJoinClassButton() {
    const studentActionButton = document.getElementById('student-action-button');
    if (studentActionButton) {
        console.log("Showing student join button");
        studentActionButton.style.display = 'block';
        
        // Make sure we have the welcome section updated
        const welcomeSection = document.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.innerHTML = `
                <h1>My Classes</h1>
                <p>Join or view your enrolled classes</p>
            `;
        }
        
        // Move the Join button to a more prominent position
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            // Move the student action button to the top of the content area
            const classroomGrid = document.getElementById('classroomGrid');
            if (classroomGrid) {
                // Insert before the grid
                contentArea.insertBefore(studentActionButton, classroomGrid);
            } else {
                // Or just append to the content area if grid doesn't exist
                contentArea.insertBefore(studentActionButton, contentArea.firstChild);
            }
            
            // Update the button styling to be more prominent
            studentActionButton.style.margin = '20px 0';
            studentActionButton.style.maxWidth = '500px';
            
            const joinButton = studentActionButton.querySelector('.join-class-btn');
            if (joinButton) {
                joinButton.style.display = 'flex';
                joinButton.style.flexDirection = 'column';
                joinButton.style.alignItems = 'center';
                joinButton.style.justifyContent = 'center';
                joinButton.style.textDecoration = 'none';
                joinButton.style.color = 'white';
                joinButton.style.padding = '20px';
                joinButton.style.transition = 'all 0.3s ease';
                
                // Add hover effect
                joinButton.addEventListener('mouseover', () => {
                    studentActionButton.style.transform = 'translateY(-5px)';
                    studentActionButton.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.3)';
                });
                
                joinButton.addEventListener('mouseout', () => {
                    studentActionButton.style.transform = 'translateY(0)';
                    studentActionButton.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
                });
            }
        }
    } else {
        console.error("Student action button not found in the DOM");
    }
}

// Import dark theme functionality if not already defined
if (typeof applyDarkTheme !== 'function') {
    function applyDarkTheme() {
        // Add dark theme styles to the head section
        const styleTag = document.createElement('style');
        styleTag.textContent = `
            /* Dark Theme Styles */
            body, .dashboard-container {
              background-color: #121212;
              color: #e0e0e0;
            }
            
            .sidebar {
              background-color: #1e1e1e;
              border-right: 1px solid #333;
            }
            
            .main-content {
              background-color: #121212;
            }
            
            .top-bar {
              background-color: #1e1e1e;
              border-bottom: 1px solid #333;
            }
            
            .search-bar {
              background-color: #333;
            }
            
            .search-bar input {
              background-color: #333;
              color: #e0e0e0;
            }
            
            .classroom-card {
              background-color: #1e1e1e !important;
              border: 1px solid #333;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
            
            /* Additional Dark Theme Elements */
            h1, h2, h3, h4, p {
              color: #e0e0e0;
            }
            
            .btn {
              background-color: #333;
            }
            
            a {
              color: #4a90e2;
            }
            
            .classroom-card h3, .classroom-card p, .classroom-card span {
              color: #e0e0e0;
            }
            
            /* Error and empty state messages */
            .error-message, .no-classrooms-message {
              color: #e0e0e0;
              background-color: #1e1e1e;
              border: 1px solid #333;
              padding: 15px;
              border-radius: 5px;
            }
        `;
        document.head.appendChild(styleTag);
    }
}

// Load joined classrooms for students
function loadJoinedClassrooms(studentID) {
    if (!studentID) {
        console.error("No student ID provided");
        return;
    }

    console.log("Attempting to load joined classrooms for studentID:", studentID);
    fetch(`/api/students/${studentID}/classrooms`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Joined classrooms data received:", data);
            if (!Array.isArray(data)) {
                console.error("Expected array of classrooms, but got:", typeof data);
                return;
            }
            
            if (data.length === 0) {
                console.log("No joined classrooms found for student ID:", studentID);
                // Show a message for the student
                if (classroomGrid) {
                    classroomGrid.innerHTML = `
                        <div class="no-classrooms-message" style="background-color: #1e1e1e; padding: 30px; text-align: center; border-radius: 10px; max-width: 600px; margin: 40px auto; border: 1px solid #333;">
                            <i class="fas fa-chalkboard-teacher" style="font-size: 48px; color: #444; margin-bottom: 20px;"></i>
                            <h3 style="color: #e0e0e0; margin-bottom: 15px;">No Classrooms Joined</h3>
                            <p style="color: #aaa; margin-bottom: 25px;">You haven't joined any classrooms yet. Use the button above to join a classroom.</p>
                        </div>
                    `;
                }
            } else {
                console.log(`Found ${data.length} joined classrooms for student ${studentID}`);
                
                // Sort and display the classrooms
                const sortedClassrooms = data.sort((a, b) => {
                    if (a.ID && b.ID) return a.ID - b.ID;
                    return 0;
                });
                displayClassrooms(sortedClassrooms);
            }
        })
        .catch(error => {
            console.error("Error loading joined classrooms:", error);
            // Show error message to user
            if (classroomGrid) {
                classroomGrid.innerHTML = `<p class="error-message">Error loading classrooms: ${error.message}</p>`;
            }
        });
}