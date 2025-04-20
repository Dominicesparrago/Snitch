document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    const studentBtn = document.querySelector('#student-btn');
    const teacherBtn = document.querySelector('#teacher-btn');
    const teacherForm = document.querySelector('.teacher-form');
    const studentForm = document.querySelector('.student-form');
    const teacherPanel = document.querySelector('.teacher-panel');
    const studentPanel = document.querySelector('.student-panel');
    const inputFields = document.querySelectorAll('.input-field input');
    
    // Add focus effects to input fields
    inputFields.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentNode.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (input.value === '') {
                input.parentNode.classList.remove('focused');
            }
        });
    });
    
    // Button click handlers for switching between teacher and student
    studentBtn.addEventListener('click', () => {
        container.classList.add('student-mode');
        
        // Use a slight delay for form transition to match the circle animation
        setTimeout(() => {
            teacherForm.classList.remove('active');
            studentForm.classList.add('active');
            teacherPanel.classList.remove('active');
            studentPanel.classList.add('active');
        }, 400);
    });
    
    teacherBtn.addEventListener('click', () => {
        container.classList.remove('student-mode');
        
        // Use a slight delay for form transition to match the circle animation
        setTimeout(() => {
            studentForm.classList.remove('active');
            teacherForm.classList.add('active');
            studentPanel.classList.remove('active');
            teacherPanel.classList.add('active');
        }, 400);
    });
    
    // Toggle password visibility
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
    
    // Validate inputs before submission
    function validateInputs(inputs) {
        let isValid = true;
        
        inputs.forEach(input => {
            if (input.value.trim() === '') {
                highlightError(input);
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    function highlightError(input) {
        const inputField = input.closest('.input-field');
        inputField.classList.add('error');
        
        setTimeout(() => {
            inputField.classList.remove('error');
        }, 3000);
    }
    
    // Sign up functionality
    const teacherSignupBtn = document.querySelector('.teacher-signup-btn');
    const studentSignupBtn = document.querySelector('.student-signup-btn');
    
    teacherSignupBtn.addEventListener('click', async function () {
        const inputs = Array.from(teacherForm.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]'));
    
        if (!validateInputs(inputs)) {
            document.getElementById('teacher-error').textContent = 'Please fill out all fields';
            document.getElementById('teacher-error').style.color = '#ff3333';
            return;
        }
    
        const name = inputs[0].value;
        const email = inputs[1].value;
        const teacherID = parseInt(inputs[2].value); // assuming 3rd input is ID
        const password = inputs[3].value;
    
        const button = this.closest('.button');
        button.classList.add('loading');
    
        try {
            const response = await fetch('/api/signup/teacher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, emailAddress: email, teacherID, password })
            });
    
            const data = await response.json();
    
            button.classList.remove('loading');
            if (response.ok) {
                button.classList.add('success');
                document.getElementById('teacher-error').style.color = '#4CAF50';
                document.getElementById('teacher-error').textContent = 'Sign up successful! Redirecting...';
    
                setTimeout(() => window.location.href = 'login.html', 1500);
            } else {
                document.getElementById('teacher-error').textContent = data.error || 'Signup failed';
                document.getElementById('teacher-error').style.color = '#ff3333';
            }
        } catch (error) {
            console.error('Signup error:', error);
            document.getElementById('teacher-error').textContent = 'Something went wrong';
            button.classList.remove('loading');
        }
    });
    
    // === Student Signup Handler ===
    studentSignupBtn.addEventListener('click', async function () {
        const inputs = Array.from(studentForm.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]'));
    
        if (!validateInputs(inputs)) {
            document.getElementById('student-error').textContent = 'Please fill out all fields';
            document.getElementById('student-error').style.color = '#ff3333';
            return;
        }
    
        const name = inputs[0].value;
        const email = inputs[1].value;
        const studentID = parseInt(inputs[2].value); // assuming 3rd input is ID
        const password = inputs[3].value;
    
        const button = this.closest('.button');
        button.classList.add('loading');
    
        try {
            const response = await fetch('/api/signup/student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, emailAddress: email, studentID, password })
            });
    
            const data = await response.json();
    
            button.classList.remove('loading');
            if (response.ok) {
                button.classList.add('success');
                document.getElementById('student-error').style.color = '#4CAF50';
                document.getElementById('student-error').textContent = 'Sign up successful! Redirecting...';
    
                setTimeout(() => window.location.href = 'login.html', 1500);
            } else {
                document.getElementById('student-error').textContent = data.error || 'Signup failed';
                document.getElementById('student-error').style.color = '#ff3333';
            }
        } catch (error) {
            console.error('Signup error:', error);
            document.getElementById('student-error').textContent = 'Something went wrong';
            button.classList.remove('loading');
        }
    });
    
    // Enable Enter key submission
    inputFields.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (container.classList.contains('student-mode')) {
                    studentSignupBtn.click();
                } else {
                    teacherSignupBtn.click();
                }
            }
        });
    });
    
    // Password strength indicator
    const passwordInput = document.getElementById('password');
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.querySelector('.password-strength-text');
    
    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            
            if (password.length >= 8) strength++;
            if (password.match(/[a-z]/)) strength++;
            if (password.match(/[A-Z]/)) strength++;
            if (password.match(/[0-9]/)) strength++;
            if (password.match(/[^a-zA-Z0-9]/)) strength++;
            
            const width = (strength / 5) * 100;
            strengthBar.style.width = width + '%';
            
            switch(strength) {
                case 0:
                case 1:
                    strengthBar.style.background = '#ff3333';
                    strengthText.textContent = 'Very Weak';
                    break;
                case 2:
                    strengthBar.style.background = '#ffcc00';
                    strengthText.textContent = 'Weak';
                    break;
                case 3:
                    strengthBar.style.background = '#ffcc00';
                    strengthText.textContent = 'Medium';
                    break;
                case 4:
                    strengthBar.style.background = '#4CAF50';
                    strengthText.textContent = 'Strong';
                    break;
                case 5:
                    strengthBar.style.background = '#4CAF50';
                    strengthText.textContent = 'Very Strong';
                    break;
            }
        });
    }
    
    // Add CSS for animations and error states
    const style = document.createElement('style');
    style.textContent = `
        .input-field.error {
            border-color: #ff3333;
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        .checkbox-content.error {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        .checkbox-content.error label {
            color: #ff3333;
        }
        
        .input-field.focused {
            border-color: #4d4d4d;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes loading {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .input-field.button.loading:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 1;
            background: linear-gradient(90deg, #333, #555, #333);
            background-size: 200% 200%;
            animation: loading 1.5s ease infinite;
            border-radius: 49px;
            z-index: 1;
        }
        
        .input-field.button.loading input {
            opacity: 0.8;
            position: relative;
            z-index: 2;
        }
    `;
    document.head.appendChild(style);

    // Add vertical slide hover effects for the login buttons
    const teacherLoginButton = document.querySelector('.teacher-login-btn');
    const studentLoginButton = document.querySelector('.student-login-btn');

    teacherLoginButton.addEventListener('mouseenter', () => {
        if (container.classList.contains('student-mode')) {
            // Create a vertical sliding animation from student to teacher
            container.classList.add('hover-transition');
            setTimeout(() => {
                teacherBtn.click();
                setTimeout(() => {
                    container.classList.remove('hover-transition');
                }, 400);
            }, 200);
        }
    });

    studentLoginButton.addEventListener('mouseenter', () => {
        if (!container.classList.contains('student-mode')) {
            // Create a vertical sliding animation from teacher to student
            container.classList.add('hover-transition');
            setTimeout(() => {
                studentBtn.click();
                setTimeout(() => {
                    container.classList.remove('hover-transition');
                }, 400);
            }, 200);
        }
    });

    // Add hover effect for the student login button
    studentLoginButton.addEventListener('mouseenter', () => {
        studentLoginButton.classList.add('student-btn');
    });

    studentLoginButton.addEventListener('mouseleave', () => {
        studentLoginButton.classList.remove('student-btn');
    });

    // Add hover effect for the teacher login button
    teacherLoginButton.addEventListener('mouseenter', () => {
        teacherLoginButton.classList.add('teacher-btn');
    });

    teacherLoginButton.addEventListener('mouseleave', () => {
        teacherLoginButton.classList.remove('teacher-btn');
    });
}); 