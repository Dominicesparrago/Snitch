// Notes management
let currentNote = null;
const notes = JSON.parse(localStorage.getItem('notes') || '[]');

// DOM Elements
const notesContainer = document.querySelector('.notes-container');
const notesList = document.querySelector('.notes-list');
const addNoteBtn = document.querySelector('.add-note-btn');
const saveNoteBtn = document.querySelector('.save-note-btn');
const deleteNoteBtn = document.querySelector('.delete-note-btn');
const noteTitleInput = document.querySelector('.note-title-input');
const noteContentArea = document.querySelector('.note-content-area');

// Initialize notes
function initNotes() {
    updateNotesList();
    if (notes.length > 0) {
        displayNote(notes[0]);
    }
}

// Create a new note
function addNewNote() {
    const newNote = {
        id: Date.now(),
        title: 'New Note',
        content: '',
        date: new Date().toISOString()
    };
    notes.unshift(newNote);
    updateNotesList();
    displayNote(newNote);
    noteTitleInput.focus();
    saveToLocalStorage();
}

// Save current note
function saveCurrentNote() {
    if (!currentNote) return;

    const noteIndex = notes.findIndex(note => note.id === currentNote.id);
    if (noteIndex === -1) return;

    notes[noteIndex] = {
        ...currentNote,
        title: noteTitleInput.value,
        content: noteContentArea.value,
        date: new Date().toISOString()
    };

    updateNotesList();
    saveToLocalStorage();
    
    // Show save animation
    saveNoteBtn.classList.add('saved');
    setTimeout(() => saveNoteBtn.classList.remove('saved'), 1000);
}

// Delete current note
function deleteCurrentNote() {
    if (!currentNote) return;

    const noteIndex = notes.findIndex(note => note.id === currentNote.id);
    if (noteIndex === -1) return;

    if (confirm('Are you sure you want to delete this note?')) {
        notes.splice(noteIndex, 1);
        updateNotesList();
        saveToLocalStorage();
        
        if (notes.length > 0) {
            displayNote(notes[0]);
        } else {
            clearNoteDisplay();
        }
    }
}

// Display a note in the editor
function displayNote(note) {
    currentNote = note;
    noteTitleInput.value = note.title;
    noteContentArea.value = note.content;
    
    // Update active state in sidebar
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.toggle('active', item.dataset.noteId === String(note.id));
    });
}

// Clear note display
function clearNoteDisplay() {
    currentNote = null;
    noteTitleInput.value = '';
    noteContentArea.value = '';
}

// Update the notes list in the sidebar
function updateNotesList() {
    notesList.innerHTML = notes.map(note => `
        <div class="note-item ${currentNote && note.id === currentNote.id ? 'active' : ''}" 
             data-note-id="${note.id}">
            <div class="note-item-title">${note.title}</div>
            <div class="note-item-date">${formatDate(note.date)}</div>
        </div>
    `).join('');

    // Add click handlers to note items
    document.querySelectorAll('.note-item').forEach(item => {
        item.addEventListener('click', () => {
            const noteId = parseInt(item.dataset.noteId);
            const note = notes.find(n => n.id === noteId);
            if (note) displayNote(note);
        });
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

// Save notes to localStorage
function saveToLocalStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Auto-save functionality
let autoSaveTimeout;
function setupAutoSave() {
    const autoSave = () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(saveCurrentNote, 1000);
    };

    noteTitleInput.addEventListener('input', autoSave);
    noteContentArea.addEventListener('input', autoSave);
}

// Event listeners
addNoteBtn.addEventListener('click', addNewNote);
saveNoteBtn.addEventListener('click', saveCurrentNote);
deleteNoteBtn.addEventListener('click', deleteCurrentNote);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNotes();
    setupAutoSave();
}); 