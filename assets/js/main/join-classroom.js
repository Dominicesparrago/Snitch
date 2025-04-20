// Join Classroom Page Functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const classroomCodeInput = document.getElementById('classroomCode');
    const verifyBtn = document.getElementById('verifyBtn');
    const errorMessage = document.getElementById('errorMessage');
    const classroomDetails = document.getElementById('classroomDetails');
    const classroomName = document.getElementById('classroomName');
    const teacherName = document.getElementById('teacherName');
    const studentCount = document.getElementById('studentCount');
    const joinBtn = document.getElementById('joinBtn');
    const successMessage = document.getElementById('successMessage');
    
    // Store classroom data temporarily
    let currentClassroomData = null;
    
    // Get code from URL if provided
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    
    if (codeFromUrl) {
        classroomCodeInput.value = codeFromUrl;
        // Auto-verify if code is provided in URL
        setTimeout(() => verifyClassroomCode(), 500);
    }
    
    // Add event listeners
    verifyBtn.addEventListener('click', verifyClassroomCode);
    classroomCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyClassroomCode();
        }
    });
    
    joinBtn.addEventListener('click', joinClassroom);
    
    // Verify classroom code
    async function verifyClassroomCode() {
        const code = classroomCodeInput.value.trim();
        
        if (!code) {
            showError('Please enter a classroom code');
            return;
        }
        
        try {
            // Show loading state
            verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            verifyBtn.disabled = true;
            
            // Reset UI elements
            hideError();
            hideClassroomDetails();
            hideJoinButton();
            
            // Fetch classroom data by code
            const response = await fetch(`/api/classrooms/verify?code=${code}`);
            
            // Reset button state
            verifyBtn.innerHTML = 'Verify';
            verifyBtn.disabled = false;
            
            if (!response.ok) {
                if (response.status === 404) {
                    showError('Invalid classroom code. Please check and try again.');
                } else {
                    showError('An error occurred. Please try again later.');
                }
                return;
            }
            
            const classroom = await response.json();
            
            // Store classroom data for join action
            currentClassroomData = classroom;
            
            // Display classroom details
            classroomName.textContent = classroom.classroomName || 'Unnamed Class';
            teacherName.textContent = classroom.teacherName || 'Unknown Teacher';
            studentCount.textContent = `${classroom.participants || 0} Students`;
            
            // Check if user is already in this classroom
            const userData = getUserData();
            
            if (!userData || !userData.studentID) {
                showError('You must be logged in as a student to join a classroom.');
                return;
            }
            
            const joinStatus = await checkJoinStatus(classroom.ID, userData.studentID);
            
            if (joinStatus.alreadyJoined) {
                showError('You are already a member of this classroom.');
                return;
            }
            
            // Show classroom details and join button
            showClassroomDetails();
            showJoinButton();
            
        } catch (error) {
            console.error('Error verifying classroom code:', error);
            showError('Failed to verify classroom code. Please try again.');
            verifyBtn.innerHTML = 'Verify';
            verifyBtn.disabled = false;
        }
    }
    
    // Join the classroom
    async function joinClassroom() {
        if (!currentClassroomData) {
            showError('Please verify a classroom code first.');
            return;
        }
        
        const userData = getUserData();
        if (!userData || !userData.studentID) {
            showError('You must be logged in as a student to join a classroom.');
            return;
        }
        
        try {
            // Show loading state
            joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
            joinBtn.disabled = true;
            hideError();
            
            // Join the classroom
            const response = await fetch('/api/classrooms/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: currentClassroomData.ID,
                    studentID: userData.studentID
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Show success message
                showSuccessMessage();
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = 'student-classroom.html';
                }, 2000);
            } else {
                showError(data.error || 'Failed to join classroom. Please try again.');
                joinBtn.innerHTML = 'Join Classroom';
                joinBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error joining classroom:', error);
            showError('An error occurred. Please try again.');
            joinBtn.innerHTML = 'Join Classroom';
            joinBtn.disabled = false;
        }
    }
    
    // Helper function to check if student is already in the classroom
    async function checkJoinStatus(classroomId, studentId) {
        try {
            const response = await fetch(`/api/classrooms/${classroomId}/students/check/${studentId}`);
            if (!response.ok) {
                return { alreadyJoined: false, error: 'Failed to check join status' };
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error checking join status:', error);
            return { alreadyJoined: false, error: error.message };
        }
    }
    
    // Helper function to get user data from localStorage
    function getUserData() {
        try {
            return JSON.parse(localStorage.getItem('userData'));
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }
    
    // UI Helper Functions
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    function hideError() {
        errorMessage.style.display = 'none';
    }
    
    function showClassroomDetails() {
        classroomDetails.classList.add('active');
    }
    
    function hideClassroomDetails() {
        classroomDetails.classList.remove('active');
    }
    
    function showJoinButton() {
        joinBtn.classList.add('active');
    }
    
    function hideJoinButton() {
        joinBtn.classList.remove('active');
    }
    
    function showSuccessMessage() {
        successMessage.style.display = 'block';
        classroomDetails.style.display = 'none';
        joinBtn.style.display = 'none';
    }
}); 