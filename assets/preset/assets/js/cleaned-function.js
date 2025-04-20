document.addEventListener('DOMContentLoaded', () => {
    // Navigation functionality
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPageId = this.getAttribute('data-target');

            // Hide all pages
            pages.forEach(page => {
                page.style.display = 'none';
            });

            // Show only the selected page
            const selectedPage = document.getElementById(targetPageId);
            if (selectedPage) {
                selectedPage.style.display = 'block';
            }

            // Remove 'active' class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add 'active' class to the clicked item
            this.classList.add('active');
        });
    });

    // Class cards functionality
    const classCards = document.querySelectorAll('.class-card');
    
    classCards.forEach(card => {
        card.addEventListener('click', function() {
            const subject = this.getAttribute('data-subject');
            const section = this.getAttribute('data-section');

            // Hide all pages
            pages.forEach(page => {
                page.style.display = 'none';
            });

            // Show classroom page
            const classroomPage = document.getElementById('classroom-page');
            classroomPage.style.display = 'block';

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            const classroomNav = document.querySelector('.nav-item[data-target="classroom-page"]');
            classroomNav.classList.add('active');

            // Show the corresponding subject scores
            const allScores = document.querySelectorAll('.scores');
            allScores.forEach(score => score.classList.add('hidden'));
            
            const selectedScore = document.getElementById(subject + '-scores');
            if (selectedScore) {
                selectedScore.classList.remove('hidden');
            }

            // Update classroom title with section
            const classroomTitle = document.querySelector('.classroom-title');
            if (classroomTitle) {
                classroomTitle.textContent = section;
            }
        });
    });

    // Subject toggle functionality
    const subjectItems = document.querySelectorAll('.subject-item');
    
    subjectItems.forEach(item => {
        item.addEventListener('click', function() {
            const subject = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            toggleScores(subject);
        });
    });

    // Notes functionality
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    let currentNoteId = null;

    // Initialize notes if they exist
    if (notes.length > 0) {
        displayNote(notes[0]);
        updateNotesList();
    }

    // Loading screen functionality
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.querySelector('.main-content');
    
    // Hide loading screen and show main content
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        mainContent.style.display = 'block';
        setTimeout(() => {
            mainContent.style.opacity = '1';
        }, 100);
    }, 1000);
});

// Helper functions
function toggleScores(subject) {
    const allScores = document.querySelectorAll('.scores');
    allScores.forEach(score => score.classList.add('hidden'));
    
    const selectedScore = document.getElementById(subject + '-scores');
    if (selectedScore) {
        selectedScore.classList.remove('hidden');
    }
}

function addNewNote() {
    const note = {
        id: Date.now(),
        title: 'Untitled Note',
        content: '',
        lastModified: new Date().toISOString()
    };
    notes.unshift(note);
    currentNoteId = note.id;
    saveNotes();
    updateNotesList();
    displayNote(note);
}

function saveCurrentNote() {
    if (!currentNoteId) return;
    
    const title = document.getElementById('current-note-title').value;
    const content = document.getElementById('note-content').value;
    const noteIndex = notes.findIndex(note => note.id === currentNoteId);
    
    if (noteIndex !== -1) {
        notes[noteIndex] = {
            ...notes[noteIndex],
            title: title || 'Untitled Note',
            content: content,
            lastModified: new Date().toISOString()
        };
        saveNotes();
        updateNotesList();
    }
}

function deleteCurrentNote() {
    if (!currentNoteId) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(note => note.id !== currentNoteId);
        saveNotes();
        updateNotesList();
        currentNoteId = notes.length > 0 ? notes[0].id : null;
        if (currentNoteId) {
            displayNote(notes[0]);
        } else {
            clearNoteDisplay();
        }
    }
}

function displayNote(note) {
    currentNoteId = note.id;
    document.getElementById('current-note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
}

function clearNoteDisplay() {
    currentNoteId = null;
    document.getElementById('current-note-title').value = '';
    document.getElementById('note-content').value = '';
}

function updateNotesList() {
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = notes.map(note => `
        <div class="note-item ${note.id === currentNoteId ? 'active' : ''}" 
             onclick="displayNote(${JSON.stringify(note).replace(/"/g, '&quot;')})">
            <div class="note-item-title">${note.title}</div>
            <div class="note-item-date">${new Date(note.lastModified).toLocaleDateString()}</div>
        </div>
    `).join('');
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}
