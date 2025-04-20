// Profile specific functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeProfile();
});

function initializeProfile() {
    loadUserProfile();
    setupProfileActions();
    loadUserStats();
    loadRecentActivity();
}

// Load user profile data
function loadUserProfile() {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) return;

    // Update profile information
    document.querySelector('.profile-name').textContent = userData.name || 'N/A';
    document.getElementById('displayEmailAddress').textContent = userData.emailAddress || 'none';
    document.getElementById('displayContactNumber').textContent = userData.contactNumber || 'none';
    document.getElementById('displayRole').textContent = userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'N/A';
    document.querySelector('.profile-picture-preview').src = userData.profilePicture || '../../files/images/default-profile.png';

    // Conditional content based on role
    const showTeacher = userData.role === 'teacher';
    document.getElementById('classesCreatedGroup').style.display = showTeacher ? 'block' : 'none';
    document.getElementById('classActivitiesGroup').style.display = showTeacher ? 'block' : 'none';
    document.getElementById('classesJoinedGroup').style.display = showTeacher ? 'none' : 'block';
    document.getElementById('answeredActivitiesGroup').style.display = showTeacher ? 'none' : 'block';

    // Update teacher-specific content
    if (showTeacher) {
        document.getElementById('displayClassesCreated').textContent = userData.classesCreated || 'none';
        document.getElementById('displayClassActivities').textContent = userData.classActivities || 'none';
    } else {
        document.getElementById('displayClassesJoined').textContent = userData.classesJoined || 'none';
        document.getElementById('displayAnsweredActivities').textContent = userData.answeredActivities || 'none';
    }
}


// Setup profile actions
function setupProfileActions() {
    // Edit profile button
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', showEditProfileModal);
    }

    // Change avatar button
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            document.getElementById('avatar-upload').click();
        });
    }

    // Avatar upload handler
    const avatarUpload = document.getElementById('avatar-upload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', handleAvatarUpload);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupProfileActions();
});

function setupProfileActions() {
    // Open the Edit Profile Modal
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', showEditProfileModal);
    }

    // Close the Modal
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Handle the form submission
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateProfile();
        });
    }

    // Handle file upload
    const profilePictureUpload = document.getElementById('profilePictureUpload');
    if (profilePictureUpload) {
        profilePictureUpload.addEventListener('change', previewProfilePicture);
    }

    // Remove Profile Picture
    const removePictureBtn = document.getElementById('removePictureBtn');
    if (removePictureBtn) {
        removePictureBtn.addEventListener('click', removeProfilePicture);
    }
}

// Show the Edit Profile Modal
function showEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'block'; // Show the modal
    }

    // Populate the form with current profile info from localStorage or default values
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (userData) {
        document.getElementById('profileName').value = userData.name || '';
        document.getElementById('profileContactNumber').value = userData.contactNumber || '';
        document.getElementById('picturePreview').src = userData.profilePicture || '../../files/images/default-profile.png';
    }
}

// Close the Modal
function closeModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'none'; // Hide the modal
    }
}

// Update profile data
function updateProfile() {
    const name = document.getElementById('profileName').value;
    const contactNumber = document.getElementById('profileContactNumber').value;
    const profilePicture = document.getElementById('picturePreview').src;
    const classesCreated = document.getElementById('classesCreated').value;  // Make sure the form has this field
    const classActivities = document.getElementById('classActivities').value; // Similarly for class activities

    // Create an object to store the updated data
    const updatedUserData = {
        name,
        contactNumber,
        profilePicture,
        classesCreated, // Add this to updated data
        classActivities // Add this to updated data
    };

    // Update the profile data in localStorage
    localStorage.setItem('userData', JSON.stringify(updatedUserData));

    // Close the modal
    closeModal();

    // Optionally, send the updated data to the server
    // Example: 
    // fetch('/api/updateProfile', { method: 'POST', body: JSON.stringify(updatedUserData), headers: { 'Content-Type': 'application/json' } });

    alert('Profile updated successfully!');
}


// Preview profile picture
function previewProfilePicture(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('picturePreview');
            preview.src = e.target.result; // Update the profile picture preview
        };
        reader.readAsDataURL(file);
    }
}

// Remove profile picture
function removeProfilePicture() {
    const preview = document.getElementById('picturePreview');
    preview.src = '../../files/images/default-profile.png'; // Reset to default image
    document.getElementById('profilePictureUpload').value = ''; // Reset file input
}