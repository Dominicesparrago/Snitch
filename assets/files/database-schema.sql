-- Database schema for Snitch application

-- Teacher accounts table
CREATE TABLE IF NOT EXISTS userAccountsTeacher (
    teacherID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emailAddress TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    contactNumber TEXT,
    classesCreated INTEGER DEFAULT 0,
    classActivities INTEGER DEFAULT 0
);

-- Student accounts table
CREATE TABLE IF NOT EXISTS userAccountsStudent (
    studentID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emailAddress TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    contactNumber TEXT,
    course TEXT,
    section TEXT
);

-- Classrooms table
CREATE TABLE IF NOT EXISTS classroomDatabase (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    classroomName TEXT NOT NULL,
    section TEXT,
    activities INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    participants INTEGER DEFAULT 0,
    teacherID INTEGER,
    customCode TEXT,
    FOREIGN KEY (teacherID) REFERENCES userAccountsTeacher(teacherID)
);

-- Junction table for student-classroom relationships
CREATE TABLE IF NOT EXISTS classroomStudents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    classroomID INTEGER,
    studentID INTEGER,
    joinDate TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (classroomID) REFERENCES classroomDatabase(ID),
    FOREIGN KEY (studentID) REFERENCES userAccountsStudent(studentID),
    UNIQUE(classroomID, studentID)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    classroomID INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    dueDate TEXT,
    maxScore INTEGER DEFAULT 100,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (classroomID) REFERENCES classroomDatabase(ID)
);

-- Questions table for activities
CREATE TABLE IF NOT EXISTS activityQuestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activityID INTEGER,
    questionText TEXT NOT NULL,
    questionType TEXT NOT NULL,
    options TEXT,
    required INTEGER DEFAULT 1,
    orderIndex INTEGER,
    FOREIGN KEY (activityID) REFERENCES activities(id)
);

-- Submissions table
CREATE TABLE IF NOT EXISTS activitySubmissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activityID INTEGER,
    studentID INTEGER,
    submissionData TEXT,
    score INTEGER,
    feedback TEXT,
    submittedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'submitted',
    FOREIGN KEY (activityID) REFERENCES activities(id),
    FOREIGN KEY (studentID) REFERENCES userAccountsStudent(studentID)
);

-- Admin accounts table
CREATE TABLE IF NOT EXISTS adminAccounts (
    adminID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emailAddress TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Insert test data
-- Test teacher account
INSERT INTO userAccountsTeacher (name, emailAddress, password)
VALUES ('John Smith', 'teacher@test.com', 'password123');

-- Test student account
INSERT INTO userAccountsStudent (name, emailAddress, password, course, section)
VALUES ('Jane Doe', 'student@test.com', 'password123', 'Computer Science', 'CS101'); 