// Classroom Join Functionality for Students
document.addEventListener('DOMContentLoaded', function() {
  // Only apply this for student users
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  if (userData.role === 'student') {
    setupClassroomJoin();
  }
});

// Add classroom join functionality for students
function setupClassroomJoin() {
  // Create a join class button in the UI
  const contentArea = document.querySelector('.content-area');
  if (!contentArea) return;
  
  const joinClassSection = document.createElement('div');
  joinClassSection.className = 'join-class-section';
  joinClassSection.style.marginTop = '20px';
  joinClassSection.style.padding = '20px';
  joinClassSection.style.backgroundColor = '#1e1e1e';
  joinClassSection.style.borderRadius = '10px';
  joinClassSection.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
  
  joinClassSection.innerHTML = `
    <h2>Join a Classroom</h2>
    <p>Enter the classroom code provided by your teacher:</p>
    <div style="display: flex; margin-top: 15px;">
      <input type="text" id="classroomCode" placeholder="Enter classroom code" 
        style="flex: 1; padding: 10px; background: #333; border: 1px solid #444; color: #e0e0e0; border-radius: 5px;">
      <button id="joinClassBtn" 
        style="margin-left: 10px; padding: 10px 20px; background: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Join Class
      </button>
    </div>
    <div id="joinMessage" style="margin-top: 10px; color: #e74c3c; display: none;"></div>
  `;
  
  // Insert at the beginning of the content area
  contentArea.insertBefore(joinClassSection, contentArea.firstChild);
  
  // Add event listener to the join button
  document.getElementById('joinClassBtn').addEventListener('click', joinClassroom);
}

// Function to handle the classroom joining process
async function joinClassroom() {
  const code = document.getElementById('classroomCode').value.trim();
  const messageEl = document.getElementById('joinMessage');
  
  if (!code) {
    showJoinMessage('Please enter a classroom code', 'error');
    return;
  }
  
  // Get student ID from localStorage
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData || !userData.studentID) {
    showJoinMessage('You must be logged in as a student to join a class', 'error');
    return;
  }
  
  try {
    showJoinMessage('Verifying classroom code...', 'info');
    
    // First verify the classroom code
    const verifyResponse = await fetch(`/api/classrooms/verify?code=${code}`);
    
    if (!verifyResponse.ok) {
      showJoinMessage('Invalid classroom code. Please check and try again.', 'error');
      return;
    }
    
    const classroomData = await verifyResponse.json();
    
    // Check if student is already in this classroom
    const checkResponse = await fetch(`/api/classrooms/${classroomData.ID}/students/check/${userData.studentID}`);
    const checkData = await checkResponse.json();
    
    if (checkData.alreadyJoined) {
      showJoinMessage(`You are already enrolled in "${classroomData.classroomName}"`, 'error');
      return;
    }
    
    showJoinMessage(`Joining classroom "${classroomData.classroomName}"...`, 'info');
    
    // Join the classroom
    const joinResponse = await fetch('/api/classrooms/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: classroomData.ID, // Use the ID as the code for joining
        studentID: userData.studentID
      })
    });
    
    const joinData = await joinResponse.json();
    
    if (joinResponse.ok) {
      showJoinMessage(`Successfully joined "${classroomData.classroomName}"!`, 'success');
      
      // Reload after 2 seconds
      setTimeout(() => {
        window.location.href = 'classroom.html';
      }, 2000);
    } else {
      showJoinMessage(joinData.error || 'Failed to join classroom', 'error');
    }
  } catch (error) {
    console.error('Error joining classroom:', error);
    showJoinMessage('An error occurred. Please try again.', 'error');
  }
}

// Helper function to show join messages
function showJoinMessage(message, type) {
  const messageEl = document.getElementById('joinMessage');
  if (!messageEl) return;
  
  messageEl.textContent = message;
  
  // Set color based on message type
  if (type === 'success') {
    messageEl.style.color = '#2ecc71';
  } else if (type === 'error') {
    messageEl.style.color = '#e74c3c';
  } else if (type === 'info') {
    messageEl.style.color = '#3498db';
  }
  
  messageEl.style.display = 'block';
} 