// Activity Form functionality

// Get URL parameters
function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Get student ID from localStorage
function getStudentID() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData && userData.studentID) {
        return userData.studentID;
    }
    return localStorage.getItem('studentID');
}

// Update progress bar
function updateProgress() {
    const questions = document.querySelectorAll('.question');
    const progressBar = document.getElementById('formProgress');
    let answeredQuestions = 0;
    
    questions.forEach(question => {
        const inputs = question.querySelectorAll('input, textarea');
        let isAnswered = false;
        
        inputs.forEach(input => {
            if ((input.type === 'radio' || input.type === 'checkbox') && input.checked) {
                isAnswered = true;
            } else if ((input.type === 'text' || input.tagName === 'TEXTAREA') && input.value.trim() !== '') {
                isAnswered = true;
            }
        });
        
        if (isAnswered) {
            answeredQuestions++;
            question.classList.add('answered');
        } else {
            question.classList.remove('answered');
        }
    });
    
    const progressPercent = questions.length > 0 ? (answeredQuestions / questions.length) * 100 : 0;
    progressBar.style.width = `${progressPercent}%`;
}

// Load activity data
async function loadActivity() {
    try {
        const activityId = getUrlParameter('id');
        if (!activityId) {
            showError('Activity ID missing from URL');
            return;
        }
        
        // Update back link
        const classroomId = getUrlParameter('classroom');
        if (classroomId) {
            const backLink = document.getElementById('backToClassLink');
            if (backLink) {
                backLink.href = `student-view-class.html?id=${classroomId}`;
            }
        }
        
        // Fetch activity data
        const response = await fetch(`/api/activities/${activityId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const activity = await response.json();
        displayActivity(activity);
    } catch (error) {
        console.error('Error loading activity:', error);
        showError(`Error: ${error.message}`);
    }
}

// Display activity data
function displayActivity(activity) {
    // Set activity details
    document.getElementById('activityTitle').textContent = activity.title;
    document.getElementById('activityDescription').textContent = activity.description || 'No description provided.';
    
    // Format and set due date
    if (activity.dueDate) {
        const dueDate = new Date(activity.dueDate);
        document.getElementById('activityDueDate').textContent = `Due: ${dueDate.toLocaleString()}`;
    } else {
        document.getElementById('activityDueDate').textContent = 'Due: No due date set';
    }
    
    // Set max score
    document.getElementById('activityMaxScore').textContent = `Points: ${activity.maxScore || 100}`;
    
    // Get the questions container
    const questionsContainer = document.getElementById('activityForm');
    questionsContainer.innerHTML = '';
    
    // Check if there are questions
    if (!activity.questions || activity.questions.length === 0) {
        questionsContainer.innerHTML = '<p class="no-questions">This activity has no questions.</p>';
        return;
    }
    
    // Generate form from questions
    activity.questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question';
        questionElement.dataset.id = question.id;
        
        // Question text
        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.innerHTML = `${index + 1}. ${question.questionText}`;
        
        if (question.required) {
            const requiredSpan = document.createElement('span');
            requiredSpan.className = 'question-required';
            requiredSpan.innerHTML = '(Required)';
            questionText.appendChild(requiredSpan);
        }
        
        questionElement.appendChild(questionText);
        
        // Options based on question type
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        
        // Parse options if they're a string
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
        
        if (question.questionType === 'multiple_choice') {
            if (options && options.length > 0) {
                options.forEach((option, optionIndex) => {
                    const optionElement = document.createElement('label');
                    optionElement.className = 'radio-option';
                    
                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = `question_${question.id}`;
                    input.value = optionIndex;
                    
                    optionElement.appendChild(input);
                    optionElement.appendChild(document.createTextNode(option));
                    optionsContainer.appendChild(optionElement);
                });
            }
        } else if (question.questionType === 'checkbox') {
            if (options && options.length > 0) {
                options.forEach((option, optionIndex) => {
                    const optionElement = document.createElement('label');
                    optionElement.className = 'checkbox-option';
                    
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.name = `question_${question.id}_option_${optionIndex}`;
                    input.value = optionIndex;
                    
                    optionElement.appendChild(input);
                    optionElement.appendChild(document.createTextNode(option));
                    optionsContainer.appendChild(optionElement);
                });
            }
        } else if (question.questionType === 'text') {
            const textarea = document.createElement('textarea');
            textarea.className = 'text-answer';
            textarea.name = `question_${question.id}`;
            textarea.placeholder = 'Type your answer here...';
            optionsContainer.appendChild(textarea);
        } else if (question.questionType === 'short_answer') {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'short-answer';
            input.name = `question_${question.id}`;
            input.placeholder = 'Type your answer here...';
            optionsContainer.appendChild(input);
        }
        
        questionElement.appendChild(optionsContainer);
        questionsContainer.appendChild(questionElement);
    });
    
    // Add event listeners to inputs to update progress
    const form = document.getElementById('activityForm');
    form.addEventListener('input', updateProgress);
    
    // Initial progress update
    updateProgress();
}

// Submit form
async function submitForm() {
    try {
        const activityId = getUrlParameter('id');
        const studentId = getStudentID();
        
        if (!activityId || !studentId) {
            alert('Missing activity ID or student ID');
            return;
        }
        
        // Gather form data
        const formData = {};
        const questions = document.querySelectorAll('.question');
        
        questions.forEach(question => {
            const questionId = question.dataset.id;
            const inputs = question.querySelectorAll('input, textarea');
            
            if (inputs.length === 0) return;
            
            // Handle different question types
            if (inputs[0].type === 'radio') {
                // Multiple choice - find selected option
                const selectedOption = Array.from(inputs).find(input => input.checked);
                formData[questionId] = selectedOption ? selectedOption.value : null;
            } else if (inputs[0].type === 'checkbox') {
                // Checkbox - collect all selected options
                const selectedOptions = Array.from(inputs)
                    .filter(input => input.checked)
                    .map(input => input.value);
                formData[questionId] = selectedOptions;
            } else if (inputs[0].type === 'text' || inputs[0].tagName === 'TEXTAREA') {
                // Text input or textarea
                formData[questionId] = inputs[0].value.trim();
            }
        });
        
        // Submit data
        const response = await fetch(`/api/activities/${activityId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentID: studentId,
                submissionData: formData
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit activity');
        }
        
        // Show success message
        document.getElementById('formContainer').style.display = 'none';
        document.getElementById('submittedContainer').style.display = 'block';
        
    } catch (error) {
        console.error('Error submitting form:', error);
        alert(`Error submitting form: ${error.message}`);
    }
}

// Save progress
function saveProgress() {
    const formData = {};
    const questions = document.querySelectorAll('.question');
    
    questions.forEach(question => {
        const questionId = question.dataset.id;
        const inputs = question.querySelectorAll('input, textarea');
        
        if (inputs.length === 0) return;
        
        // Handle different question types
        if (inputs[0].type === 'radio') {
            // Multiple choice - find selected option
            const selectedOption = Array.from(inputs).find(input => input.checked);
            formData[questionId] = selectedOption ? selectedOption.value : null;
        } else if (inputs[0].type === 'checkbox') {
            // Checkbox - collect all selected options
            const selectedOptions = Array.from(inputs)
                .filter(input => input.checked)
                .map(input => input.value);
            formData[questionId] = selectedOptions;
        } else if (inputs[0].type === 'text' || inputs[0].tagName === 'TEXTAREA') {
            // Text input or textarea
            formData[questionId] = inputs[0].value.trim();
        }
    });
    
    // Save to localStorage
    const activityId = getUrlParameter('id');
    localStorage.setItem(`activity_progress_${activityId}`, JSON.stringify(formData));
    
    alert('Progress saved successfully!');
}

// Show error message
function showError(message) {
    const container = document.querySelector('.main-content');
    const formContainer = document.getElementById('formContainer');
    
    if (container && formContainer) {
        formContainer.style.display = 'none';
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.textAlign = 'center';
        errorElement.style.padding = '50px 20px';
        
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #ff7675; margin-bottom: 20px;"></i>
            <h2>Error</h2>
            <p>${message}</p>
            <button class="btn btn-primary" style="margin-top: 20px;" onclick="history.back()">
                Go Back
            </button>
        `;
        
        // Insert after the back link
        const backLink = document.querySelector('.back-link');
        if (backLink) {
            backLink.after(errorElement);
        } else {
            container.appendChild(errorElement);
        }
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load activity data
    loadActivity();
    
    // Set up event listeners
    const submitBtn = document.getElementById('submitFormBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitForm);
    }
    
    const saveBtn = document.getElementById('saveProgressBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProgress);
    }
    
    // Update username from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        const usernameElement = document.querySelector('.username');
        if (usernameElement) {
            usernameElement.textContent = userData.name;
        }
    }
}); 