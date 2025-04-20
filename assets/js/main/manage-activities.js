// Manage Activities page functionality

// DOM Elements
const activitiesList = document.getElementById('activitiesList');
const emptyState = document.getElementById('emptyState');
const addActivityBtn = document.getElementById('addActivityBtn');
const activityModal = document.getElementById('activityModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelActivityBtn = document.getElementById('cancelActivityBtn');
const saveActivityBtn = document.getElementById('saveActivityBtn');
const activityForm = document.getElementById('activityForm');
const activityTypeTabs = document.querySelectorAll('.activity-type-tab');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const questionsContainer = document.getElementById('questionsContainer');
const questionsSection = document.getElementById('questionsSection');
const backToClassroomLink = document.getElementById('backToClassroomLink');

// Get URL parameters
function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Get classroom ID from URL
const classroomId = getUrlParameter('id');

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

// Initialize page
function initPage() {
    // Apply dark theme immediately to prevent flashbang
    applyDarkTheme();
    
    // Set back link URL
    if (classroomId) {
        backToClassroomLink.href = `view-classroom.html?id=${classroomId}`;
    }
    
    // Load classroom data
    if (classroomId) {
        fetchClassroomData();
    } else {
        showError('No classroom ID specified');
    }
    
    // Load activities
    loadActivities();
    
    // Set up event listeners
    setupEventListeners();
}

// Apply dark theme to prevent "flashbang" effect
function applyDarkTheme() {
    // This function is a fallback in case the CSS doesn't apply immediately
    document.body.style.backgroundColor = '#121212';
    document.body.style.color = '#e0e0e0';
    
    // Apply to any elements that might load before CSS is fully applied
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.backgroundColor = '#121212';
    }
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.style.backgroundColor = '#1e1e1e';
        sidebar.style.borderRight = '1px solid #333';
    }
    
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
        topBar.style.backgroundColor = '#1e1e1e';
        topBar.style.borderBottom = '1px solid #333';
    }
}

// Fetch classroom data
async function fetchClassroomData() {
    try {
        const response = await fetch(`/api/classrooms/${classroomId}`);
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
    // Update page title and header
    document.title = `Snitch - Manage Activities - ${classroom.classroomName || 'Classroom'}`;
    
    // Update welcome section
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) {
        welcomeSection.innerHTML = `
            <h1>${classroom.classroomName || 'Unnamed Class'}</h1>
            <p>Manage Activities and Forms</p>
        `;
    }
    
    // Update username from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        const usernameElement = document.querySelector('.username');
        if (usernameElement) {
            usernameElement.textContent = userData.name;
        }
    }
}

// Load activities
async function loadActivities() {
    if (!classroomId) return;
    
    try {
        const response = await fetch(`/api/classrooms/${classroomId}/activities`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const activities = await response.json();
        displayActivities(activities);
    } catch (error) {
        console.error('Error loading activities:', error);
        showError(`Error loading activities: ${error.message}`);
    }
}

// Display activities
function displayActivities(activities) {
    // Clear activities list
    activitiesList.innerHTML = '';
    
    // Show empty state if no activities
    if (!activities || activities.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    // Hide empty state
    emptyState.style.display = 'none';
    
    // Display each activity
    activities.forEach(activity => {
        const activityCard = createActivityCard(activity);
        activitiesList.appendChild(activityCard);
    });
}

// Create activity card
function createActivityCard(activity) {
    const card = document.createElement('div');
    card.className = `activity-card ${activity.type.toLowerCase()}`;
    card.dataset.id = activity.id;
    
    // Format the due date
    let dueDateDisplay = 'No Due Date';
    if (activity.dueDate) {
        const dueDate = new Date(activity.dueDate);
        dueDateDisplay = dueDate.toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }
    
    // Get badge class based on activity type
    const badgeClass = getBadgeClass(activity.type);
    
    // Create card HTML
    card.innerHTML = `
        <div class="activity-actions">
            <button type="button" class="activity-action-btn edit-activity-btn" title="Edit Activity">
                <i class="fas fa-edit"></i>
            </button>
            <button type="button" class="activity-action-btn delete-activity-btn" title="Delete Activity">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <h3>${activity.title}</h3>
        <span class="activity-type-badge ${badgeClass}">${activity.type}</span>
        ${activity.status !== 'active' ? `<span class="activity-status">${activity.status}</span>` : ''}
        <p>${activity.description || 'No description provided.'}</p>
        <div class="activity-due-date">
            <i class="fas fa-calendar-alt"></i> ${dueDateDisplay}
        </div>
        <div class="activity-meta">
            <span>${activity.maxScore} points</span>
            <span>Created: ${new Date(activity.createdAt).toLocaleDateString()}</span>
        </div>
    `;
    
    // Add event listeners for card buttons
    const editBtn = card.querySelector('.edit-activity-btn');
    const deleteBtn = card.querySelector('.delete-activity-btn');
    
    editBtn.addEventListener('click', () => {
        editActivity(activity.id);
    });
    
    deleteBtn.addEventListener('click', () => {
        confirmDeleteActivity(activity.id, activity.title);
    });
    
    return card;
}

// Get badge class based on activity type
function getBadgeClass(type) {
    switch (type.toLowerCase()) {
        case 'quiz':
            return 'quiz';
        case 'assignment':
            return 'assignment';
        case 'discussion':
            return 'discussion';
        case 'form':
            return 'form';
        default:
            return '';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add activity button
    addActivityBtn.addEventListener('click', openAddActivityModal);
    
    // Close modal buttons
    closeModalBtn.addEventListener('click', closeModal);
    cancelActivityBtn.addEventListener('click', closeModal);
    
    // Save activity button
    saveActivityBtn.addEventListener('click', saveActivity);
    
    // Activity type tabs
    activityTypeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            setActiveActivityType(tab);
        });
    });
    
    // Add question button
    addQuestionBtn.addEventListener('click', addNewQuestion);
}

// Set active activity type
function setActiveActivityType(selectedTab) {
    // Remove active class from all tabs
    activityTypeTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to selected tab
    selectedTab.classList.add('active');
    
    // Show/hide questions section based on activity type
    const activityType = selectedTab.dataset.type;
    questionsSection.style.display = 
        (activityType === 'quiz' || activityType === 'form') ? 'block' : 'none';
}

// Open add activity modal
function openAddActivityModal() {
    // Reset form
    resetActivityForm();
    
    // Set modal title
    document.getElementById('modalTitle').textContent = 'Add New Activity';
    
    // Show modal
    activityModal.style.display = 'block';
}

// Close modal
function closeModal() {
    activityModal.style.display = 'none';
}

// Reset activity form
function resetActivityForm() {
    // Clear form fields
    activityForm.reset();
    
    // Clear questions container
    questionsContainer.innerHTML = '';
    
    // Set default activity type
    activityTypeTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.type === 'quiz') {
            tab.classList.add('active');
        }
    });
    
    // Show questions section by default (for quiz)
    questionsSection.style.display = 'block';
}

// Add new question
function addNewQuestion() {
    const questionIndex = document.querySelectorAll('.question-container').length;
    const questionContainer = document.createElement('div');
    questionContainer.className = 'question-container';
    questionContainer.dataset.index = questionIndex;
    
    questionContainer.innerHTML = `
        <div class="question-actions">
            <button type="button" class="btn btn-danger remove-question-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="form-group">
            <label for="questionText${questionIndex}">Question Text</label>
            <input type="text" id="questionText${questionIndex}" class="form-control question-text" placeholder="Enter your question" required>
        </div>
        <div class="form-group">
            <label>Question Type</label>
            <select class="form-control question-type" id="questionType${questionIndex}">
                <option value="multiple_choice">Multiple Choice</option>
                <option value="checkbox">Checkbox (Multiple Answers)</option>
                <option value="short_answer">Short Answer</option>
                <option value="text">Paragraph</option>
            </select>
        </div>
        <div class="form-group question-options-group">
            <label>Options</label>
            <div class="options-container" id="optionsContainer${questionIndex}">
                <div class="option-item">
                    <input type="text" class="form-control option-text" placeholder="Option 1" required>
                    <button type="button" class="btn btn-secondary remove-option-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="option-item">
                    <input type="text" class="form-control option-text" placeholder="Option 2" required>
                    <button type="button" class="btn btn-secondary remove-option-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <button type="button" class="btn btn-secondary add-option-btn">
                <i class="fas fa-plus"></i> Add Option
            </button>
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" class="question-required" id="questionRequired${questionIndex}" checked>
                Required
            </label>
        </div>
    `;
    
    questionsContainer.appendChild(questionContainer);
    
    // Add event listeners for the question
    const removeQuestionBtn = questionContainer.querySelector('.remove-question-btn');
    removeQuestionBtn.addEventListener('click', () => {
        questionContainer.remove();
    });
    
    const questionType = questionContainer.querySelector('.question-type');
    const optionsGroup = questionContainer.querySelector('.question-options-group');
    
    questionType.addEventListener('change', () => {
        optionsGroup.style.display = 
            (questionType.value === 'multiple_choice' || questionType.value === 'checkbox') 
                ? 'block' 
                : 'none';
    });
    
    const addOptionBtn = questionContainer.querySelector('.add-option-btn');
    addOptionBtn.addEventListener('click', () => {
        addOption(questionContainer);
    });
    
    // Add event listeners for existing option removal buttons
    const removeOptionBtns = questionContainer.querySelectorAll('.remove-option-btn');
    removeOptionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Ensure we keep at least 2 options
            const optionItems = questionContainer.querySelectorAll('.option-item');
            if (optionItems.length > 2) {
                btn.closest('.option-item').remove();
            } else {
                alert('Multiple choice questions must have at least 2 options.');
            }
        });
    });
}

// Add option to a question
function addOption(questionContainer) {
    const optionsContainer = questionContainer.querySelector('.options-container');
    const optionCount = optionsContainer.querySelectorAll('.option-item').length;
    
    const optionItem = document.createElement('div');
    optionItem.className = 'option-item';
    
    optionItem.innerHTML = `
        <input type="text" class="form-control option-text" placeholder="Option ${optionCount + 1}" required>
        <button type="button" class="btn btn-secondary remove-option-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    optionsContainer.appendChild(optionItem);
    
    // Add event listener for option removal
    const removeOptionBtn = optionItem.querySelector('.remove-option-btn');
    removeOptionBtn.addEventListener('click', () => {
        // Ensure we keep at least 2 options
        const optionItems = questionContainer.querySelectorAll('.option-item');
        if (optionItems.length > 2) {
            optionItem.remove();
        } else {
            alert('Multiple choice questions must have at least 2 options.');
        }
    });
}

// Save activity
async function saveActivity() {
    try {
        // Get form data
        const title = document.getElementById('activityTitle').value.trim();
        const description = document.getElementById('activityDescription').value.trim();
        const activeTab = document.querySelector('.activity-type-tab.active');
        const type = activeTab ? activeTab.dataset.type : 'quiz';
        const dueDate = document.getElementById('activityDueDate').value;
        const maxScore = document.getElementById('activityMaxScore').value;
        
        // Validate form
        if (!title) {
            alert('Please enter an activity title');
            return;
        }
        
        // Prepare questions data if applicable
        let questions = [];
        if (type === 'quiz' || type === 'form') {
            const questionContainers = document.querySelectorAll('.question-container');
            if (questionContainers.length === 0) {
                alert('Please add at least one question');
                return;
            }
            
            questionContainers.forEach(container => {
                const questionText = container.querySelector('.question-text').value.trim();
                const questionType = container.querySelector('.question-type').value;
                const required = container.querySelector('.question-required').checked;
                
                if (!questionText) {
                    alert('Please enter text for all questions');
                    return;
                }
                
                let options = null;
                if (questionType === 'multiple_choice' || questionType === 'checkbox') {
                    options = [];
                    const optionInputs = container.querySelectorAll('.option-text');
                    optionInputs.forEach(input => {
                        const optionText = input.value.trim();
                        if (optionText) {
                            options.push(optionText);
                        }
                    });
                    
                    if (options.length < 2) {
                        alert('Please enter at least 2 options for multiple choice questions');
                        return;
                    }
                }
                
                questions.push({
                    questionText,
                    questionType,
                    options,
                    required
                });
            });
        }
        
        // Prepare activity data
        const activityData = {
            title,
            description,
            type,
            maxScore: parseInt(maxScore, 10),
            questions
        };
        
        if (dueDate) {
            activityData.dueDate = dueDate;
        }
        
        // Send request to create activity
        const response = await fetch(`/api/classrooms/${classroomId}/activities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(activityData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create activity');
        }
        
        // Close modal and reload activities
        closeModal();
        loadActivities();
        
    } catch (error) {
        console.error('Error creating activity:', error);
        alert(`Error creating activity: ${error.message}`);
    }
}

// Edit activity
async function editActivity(activityId) {
    try {
        // Fetch activity details
        const response = await fetch(`/api/activities/${activityId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const activity = await response.json();
        
        // Reset form
        resetActivityForm();
        
        // Fill form with activity data
        document.getElementById('activityTitle').value = activity.title;
        document.getElementById('activityDescription').value = activity.description || '';
        document.getElementById('activityMaxScore').value = activity.maxScore;
        
        if (activity.dueDate) {
            // Convert to format expected by datetime-local input
            const dueDate = new Date(activity.dueDate);
            const formattedDate = dueDate.toISOString().slice(0, 16);
            document.getElementById('activityDueDate').value = formattedDate;
        }
        
        // Set activity type
        activityTypeTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type.toLowerCase() === activity.type.toLowerCase()) {
                tab.classList.add('active');
            }
        });
        
        // Show/hide questions section based on activity type
        questionsSection.style.display = 
            (activity.type.toLowerCase() === 'quiz' || activity.type.toLowerCase() === 'form') 
                ? 'block' 
                : 'none';
        
        // Add questions if available
        if (activity.questions && activity.questions.length > 0) {
            questionsContainer.innerHTML = '';
            
            activity.questions.forEach(question => {
                const questionContainer = document.createElement('div');
                questionContainer.className = 'question-container';
                
                const questionIndex = document.querySelectorAll('.question-container').length;
                questionContainer.dataset.index = questionIndex;
                
                // Parse options from JSON if needed
                let options = [];
                if (question.options) {
                    try {
                        options = typeof question.options === 'string' 
                            ? JSON.parse(question.options) 
                            : question.options;
                    } catch (e) {
                        console.error('Error parsing options:', e);
                    }
                }
                
                questionContainer.innerHTML = `
                    <div class="question-actions">
                        <button type="button" class="btn btn-danger remove-question-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label for="questionText${questionIndex}">Question Text</label>
                        <input type="text" id="questionText${questionIndex}" class="form-control question-text" 
                            placeholder="Enter your question" value="${question.questionText}" required>
                    </div>
                    <div class="form-group">
                        <label>Question Type</label>
                        <select class="form-control question-type" id="questionType${questionIndex}">
                            <option value="multiple_choice" ${question.questionType === 'multiple_choice' ? 'selected' : ''}>Multiple Choice</option>
                            <option value="checkbox" ${question.questionType === 'checkbox' ? 'selected' : ''}>Checkbox (Multiple Answers)</option>
                            <option value="short_answer" ${question.questionType === 'short_answer' ? 'selected' : ''}>Short Answer</option>
                            <option value="text" ${question.questionType === 'text' ? 'selected' : ''}>Paragraph</option>
                        </select>
                    </div>
                    <div class="form-group question-options-group" 
                        style="display: ${(['multiple_choice', 'checkbox'].includes(question.questionType)) ? 'block' : 'none'}">
                        <label>Options</label>
                        <div class="options-container" id="optionsContainer${questionIndex}">
                            ${options.length > 0 ? options.map((option, i) => `
                                <div class="option-item">
                                    <input type="text" class="form-control option-text" 
                                        placeholder="Option ${i + 1}" value="${option}" required>
                                    <button type="button" class="btn btn-secondary remove-option-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('') : `
                                <div class="option-item">
                                    <input type="text" class="form-control option-text" placeholder="Option 1" required>
                                    <button type="button" class="btn btn-secondary remove-option-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="option-item">
                                    <input type="text" class="form-control option-text" placeholder="Option 2" required>
                                    <button type="button" class="btn btn-secondary remove-option-btn">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `}
                        </div>
                        <button type="button" class="btn btn-secondary add-option-btn">
                            <i class="fas fa-plus"></i> Add Option
                        </button>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" class="question-required" id="questionRequired${questionIndex}" 
                                ${question.required === 1 ? 'checked' : ''}>
                            Required
                        </label>
                    </div>
                `;
                
                questionsContainer.appendChild(questionContainer);
                
                // Add event listeners for the question
                const removeQuestionBtn = questionContainer.querySelector('.remove-question-btn');
                removeQuestionBtn.addEventListener('click', () => {
                    questionContainer.remove();
                });
                
                const questionType = questionContainer.querySelector('.question-type');
                const optionsGroup = questionContainer.querySelector('.question-options-group');
                
                questionType.addEventListener('change', () => {
                    optionsGroup.style.display = 
                        (questionType.value === 'multiple_choice' || questionType.value === 'checkbox') 
                            ? 'block' 
                            : 'none';
                });
                
                const addOptionBtn = questionContainer.querySelector('.add-option-btn');
                addOptionBtn.addEventListener('click', () => {
                    addOption(questionContainer);
                });
                
                // Add event listeners for option removal buttons
                const removeOptionBtns = questionContainer.querySelectorAll('.remove-option-btn');
                removeOptionBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        // Ensure we keep at least 2 options
                        const optionItems = questionContainer.querySelectorAll('.option-item');
                        if (optionItems.length > 2) {
                            btn.closest('.option-item').remove();
                        } else {
                            alert('Multiple choice questions must have at least 2 options.');
                        }
                    });
                });
            });
        }
        
        // Set modal title and data
        document.getElementById('modalTitle').textContent = 'Edit Activity';
        saveActivityBtn.dataset.activityId = activityId;
        saveActivityBtn.textContent = 'Update Activity';
        
        // Change save function to update
        saveActivityBtn.onclick = () => updateActivity(activityId);
        
        // Show modal
        activityModal.style.display = 'block';
        
    } catch (error) {
        console.error('Error editing activity:', error);
        alert(`Error editing activity: ${error.message}`);
    }
}

// Update activity
async function updateActivity(activityId) {
    try {
        // Get form data
        const title = document.getElementById('activityTitle').value.trim();
        const description = document.getElementById('activityDescription').value.trim();
        const activeTab = document.querySelector('.activity-type-tab.active');
        const type = activeTab ? activeTab.dataset.type : 'quiz';
        const dueDate = document.getElementById('activityDueDate').value;
        const maxScore = document.getElementById('activityMaxScore').value;
        
        // Validate form
        if (!title) {
            alert('Please enter an activity title');
            return;
        }
        
        // Prepare activity data for update
        const activityData = {
            title,
            description,
            type,
            maxScore: parseInt(maxScore, 10)
        };
        
        if (dueDate) {
            activityData.dueDate = dueDate;
        }
        
        // Send request to update activity
        const response = await fetch(`/api/activities/${activityId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(activityData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update activity');
        }
        
        // Handle questions separately
        if (type === 'quiz' || type === 'form') {
            // For now, we'd need to implement separate API endpoints to manage questions
            // This would be a more complex operation requiring deleting existing questions and adding new ones
            console.log('Question updates not implemented in this version');
        }
        
        // Close modal and reload activities
        closeModal();
        loadActivities();
        
        // Reset save button to default
        saveActivityBtn.onclick = saveActivity;
        saveActivityBtn.textContent = 'Save Activity';
        
    } catch (error) {
        console.error('Error updating activity:', error);
        alert(`Error updating activity: ${error.message}`);
    }
}

// Confirm delete activity
function confirmDeleteActivity(activityId, activityTitle) {
    if (confirm(`Are you sure you want to delete the activity "${activityTitle}"? This cannot be undone.`)) {
        deleteActivity(activityId);
    }
}

// Delete activity
async function deleteActivity(activityId) {
    try {
        const response = await fetch(`/api/activities/${activityId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete activity');
        }
        
        // Reload activities
        loadActivities();
        
    } catch (error) {
        console.error('Error deleting activity:', error);
        alert(`Error deleting activity: ${error.message}`);
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

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage); 