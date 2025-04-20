// Classroom History Functionality for Snitch
document.addEventListener('DOMContentLoaded', function() {
  loadClassroomJoinHistory();
  setupGenerateCode();
});

// Load classroom join history
async function loadClassroomJoinHistory() {
  // Only proceed if we're on the view-classroom page
  if (!window.location.href.includes('view-classroom.html')) return;
  
  // Get classroom ID from URL
  const classroomId = getUrlParameter('id');
  if (!classroomId) return;

  try {
    // Fetch classroom student history
    const response = await fetch(`/api/classrooms/${classroomId}/students/history`);
    if (!response.ok) {
      console.error(`Failed to fetch classroom history: ${response.status}`);
      return;
    }
    
    const historyData = await response.json();
    displayJoinHistory(historyData);
  } catch (error) {
    console.error('Error loading classroom join history:', error);
  }
}

// Display join history
function displayJoinHistory(historyData) {
  // Find the right tab to add the history to
  const studentsTab = document.getElementById('students');
  if (!studentsTab) return;
  
  // Create and append the history section
  const historySection = document.createElement('div');
  historySection.className = 'join-history-section';
  historySection.style.marginTop = '30px';
  
  // Create the table title
  const historyTitle = document.createElement('h3');
  historyTitle.textContent = 'Student Join History';
  historyTitle.style.marginBottom = '15px';
  historySection.appendChild(historyTitle);
  
  // Create table for join history
  const historyTable = document.createElement('table');
  historyTable.className = 'students-history-table';
  
  // Create table header
  const tableHeader = document.createElement('thead');
  tableHeader.innerHTML = `
    <tr>
      <th>Student</th>
      <th>Email</th>
      <th>Student ID</th>
      <th>Joined Date</th>
      <th>Status</th>
    </tr>
  `;
  historyTable.appendChild(tableHeader);
  
  // Create table body
  const tableBody = document.createElement('tbody');
  
  // Check if there's data
  if (historyData && historyData.length > 0) {
    // Add each student to the table
    historyData.forEach(student => {
      const row = document.createElement('tr');
      
      // Format date
      const joinDate = new Date(student.joinDate).toLocaleString();
      
      row.innerHTML = `
        <td>
          <div style="display: flex; align-items: center;">
            <img src="../../files/images/default-profile.png" alt="${student.name}" 
              style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;">
            ${student.name}
          </div>
        </td>
        <td>${student.emailAddress}</td>
        <td>${student.studentID}</td>
        <td>${joinDate}</td>
        <td>
          <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; 
            font-size: 12px; background-color: ${student.status === 'active' ? '#2ecc71' : '#e74c3c'};">
            ${student.status}
          </span>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
  } else {
    // No data
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="5" style="text-align: center; padding: 20px;">
        No students have joined this classroom yet.
      </td>
    `;
    tableBody.appendChild(emptyRow);
  }
  
  historyTable.appendChild(tableBody);
  historySection.appendChild(historyTable);
  
  // Add the history section to the students tab
  studentsTab.appendChild(historySection);
}

// Setup custom code generation for new classrooms
function setupGenerateCode() {
  // This will be used in create-classroom.js
  if (typeof window.generateCustomClassCode !== 'function') {
    window.generateCustomClassCode = async function(teacherID) {
      try {
        // Get the count of teacher's classrooms
        const response = await fetch(`/api/teachers/${teacherID}/classrooms/count`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const classroomCount = data.count + 1; // Add 1 for the new classroom
        
        // Generate code format: [YEAR][TEACHER_ID][CLASSROOM_COUNT]
        const year = new Date().getFullYear();
        
        // Format the classroom count as a 1-digit number (we add 1 for the new room)
        const formattedCount = classroomCount.toString();
        
        // Combine to create the code
        const code = `${year}${teacherID}${formattedCount}`;
        
        return code;
      } catch (error) {
        console.error('Error generating classroom code:', error);
        // Fallback to a simple code if there's an error
        const timestamp = Date.now().toString().slice(-6);
        return `${teacherID}${timestamp}`;
      }
    };
  }
}

// Helper function to get URL parameters
function getUrlParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
} 