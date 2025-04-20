// Classroom Manager - Shared functionality for classroom management

// Store classrooms in localStorage
const STORAGE_KEY = 'classrooms';

// Initialize classroom manager
function initializeClassroomManager() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
}

// Get all classrooms
function getAllClassrooms() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

// Add a new classroom
function addClassroom(classroom) {
    const classrooms = getAllClassrooms();
    classroom.id = Date.now().toString(); // Generate unique ID
    classroom.createdAt = new Date().toISOString();
    classroom.students = [];
    classroom.assignments = [];
    classrooms.push(classroom);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classrooms));
    return classroom;
}

// Delete a classroom
function deleteClassroom(classroomId) {
    const classrooms = getAllClassrooms();
    const updatedClassrooms = classrooms.filter(c => c.id !== classroomId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedClassrooms));
}

// Search classrooms
function searchClassrooms(query) {
    const classrooms = getAllClassrooms();
    const searchTerm = query.toLowerCase();
    return classrooms.filter(classroom => 
        classroom.name.toLowerCase().includes(searchTerm) ||
        classroom.code.toLowerCase().includes(searchTerm) ||
        classroom.subject.toLowerCase().includes(searchTerm)
    );
}

// Get classroom by ID
function getClassroomById(classroomId) {
    const classrooms = getAllClassrooms();
    return classrooms.find(c => c.id === classroomId);
}

// Update classroom
function updateClassroom(classroomId, updates) {
    const classrooms = getAllClassrooms();
    const index = classrooms.findIndex(c => c.id === classroomId);
    if (index !== -1) {
        classrooms[index] = { ...classrooms[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(classrooms));
        return classrooms[index];
    }
    return null;
}

// Export functions
window.initializeClassroomManager = initializeClassroomManager;
window.getAllClassrooms = getAllClassrooms;
window.addClassroom = addClassroom;
window.deleteClassroom = deleteClassroom;
window.searchClassrooms = searchClassrooms;
window.getClassroomById = getClassroomById;
window.updateClassroom = updateClassroom; 