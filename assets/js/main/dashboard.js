window.addEventListener('DOMContentLoaded', function () {
    const userData = JSON.parse(localStorage.getItem('userData'));
  
    if (userData) {
      const usernameElement = document.querySelector('.username');
      const welcomeElement = document.querySelector('.username-placeholder');
      const profileImg = document.querySelector('.profile-img');
  
      if (usernameElement) usernameElement.textContent = userData.name;
      if (welcomeElement) welcomeElement.textContent = userData.name;
      if (profileImg) profileImg.src = userData.profileImage || '../../files/images/default-profile.png';
    } else {
      // If no user data, redirect to login
      window.location.href = 'login.html';
    }
  
    // Logout button logic
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        localStorage.removeItem('userData');
        window.location.href = 'login.html';
      });
    }
  });
  
document.addEventListener('DOMContentLoaded', async () => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Update username display
        const usernameElement = document.querySelector('.username');
        if (usernameElement && userData.name) {
            usernameElement.textContent = userData.name;
        }
        
        // For teachers
        if (userData.teacherID) {
            const teacherId = userData.teacherID;
            
            // Fetch classroom count
            const classroomsResponse = await fetch(`/api/teachers/${teacherId}/classrooms`);
            if (classroomsResponse.ok) {
                const classroomsData = await classroomsResponse.json();
                document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = 
                    classroomsData.length || '0';
            }
            
            // Fetch activities count
            const activitiesResponse = await fetch(`/api/teachers/${teacherId}/activities`);
            if (activitiesResponse.ok) {
                const activitiesData = await activitiesResponse.json();
                document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = 
                    activitiesData.length || '0';
            }
        }
        
        // For students
        if (userData.studentID) {
            const studentId = userData.studentID;
            
            // Fetch enrolled classrooms count
            const classroomsResponse = await fetch(`/api/students/${studentId}/classrooms?dashboard=true`);
            if (classroomsResponse.ok) {
                const classroomsData = await classroomsResponse.json();
                document.querySelector('.stat-card:nth-child(1) .stat-number').textContent = 
                    classroomsData.length || '0';
            }
            
            // Fetch assigned activities count
            const activitiesResponse = await fetch(`/api/students/${studentId}/activities`);
            if (activitiesResponse.ok) {
                const activitiesData = await activitiesResponse.json();
                document.querySelector('.stat-card:nth-child(2) .stat-number').textContent = 
                    activitiesData.length || '0';
            }
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
});
  