document.addEventListener('DOMContentLoaded', function () {
    // Handle login for teacher
    document.querySelector('.teacher-login-btn').addEventListener('click', function () {
      const email = document.getElementById('teacher-emailAddress').value;
      const password = document.getElementById('teacher-password').value;
  
      fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailAddress: email, password: password }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Login response data:', data); // Log the full response
          
          // Explicitly set the role to teacher for this login path
          if (data.teacherID) {
            // Make sure role is set to teacher
            data.role = 'teacher';
            
            // Store entire user data object with role set
            localStorage.setItem('userData', JSON.stringify(data));
            
            // Also store teacherID separately for easy access
            localStorage.setItem('teacherID', data.teacherID);
            console.log('Stored teacherID:', data.teacherID);
            console.log('User role set to:', data.role);
            
            window.location.href = 'dashboard.html';
          } else {
            document.getElementById('teacher-error').innerText = data.error || 'Login failed - account not found or not a teacher account';
          }
        })
        .catch(error => {
          console.error('Error:', error);
          document.getElementById('teacher-error').innerText = 'An error occurred. Please try again.';
        });
    });
  
    // Handle login for student
    document.querySelector('.student-login-btn').addEventListener('click', function () {
      const email = document.getElementById('student-emailAddress').value;
      const password = document.getElementById('student-password').value;
  
      fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailAddress: email, password: password }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Login response data:', data); // Log the full response
          
          // Explicitly set the role to student for this login path
          if (data.studentID) {
            // Make sure role is set to student
            data.role = 'student';
            
            // Store entire user data object with role set
            localStorage.setItem('userData', JSON.stringify(data));
            
            // Also store studentID separately for easy access
            localStorage.setItem('studentID', data.studentID);
            console.log('Stored studentID:', data.studentID);
            console.log('User role set to:', data.role);
            
            window.location.href = 'dashboard.html';
          } else {
            document.getElementById('student-error').innerText = data.error || 'Login failed - account not found or not a student account';
          }
        })
        .catch(error => {
          console.error('Error:', error);
          document.getElementById('student-error').innerText = 'An error occurred. Please try again.';
        });
    });

    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                // First try to login as a teacher
                const teacherResponse = await fetch('/api/auth/login-teacher', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                if (teacherResponse.ok) {
                    const teacherData = await teacherResponse.json();
                    
                    // Save teacher data to localStorage
                    localStorage.setItem('userData', JSON.stringify({
                        name: teacherData.name,
                        teacherID: teacherData.teacherID,
                        email: teacherData.emailAddress,
                        role: 'teacher'
                    }));
                    
                    // Redirect to teacher dashboard
                    window.location.href = 'dashboard.html';
                    return;
                }
                
                // If not a teacher, try as a student
                const studentResponse = await fetch('/api/auth/login-student', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                if (studentResponse.ok) {
                    const studentData = await studentResponse.json();
                    
                    // Save student data to localStorage
                    localStorage.setItem('userData', JSON.stringify({
                        name: studentData.name,
                        studentID: studentData.studentID,
                        email: studentData.emailAddress,
                        role: 'student'
                    }));
                    
                    // Redirect to student dashboard
                    window.location.href = 'dashboard.html';
                    return;
                }
                
                // If both fail, show error
                document.getElementById('loginError').textContent = 'Invalid email or password';
                document.getElementById('loginError').style.display = 'block';
                
            } catch (error) {
                console.error('Login error:', error);
                document.getElementById('loginError').textContent = 'An error occurred during login';
                document.getElementById('loginError').style.display = 'block';
            }
        });
    }
  });  

