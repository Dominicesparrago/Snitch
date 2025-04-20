const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Improved error handling for middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err.stack);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Middleware - Make sure these come BEFORE route definitions
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve index.html and static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// CORS headers for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Database setup - make sure DB path is correct
const dbPath = path.join(__dirname, 'assets', 'files', 'database.sqlite');
const schemaPath = path.join(__dirname, 'assets', 'files', 'database-schema.sql');

// Check if database directory exists, create if not
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

// Function to initialize the database with schema
function initializeDatabase() {
  console.log('Initializing database with schema...');
  
  // Check if schema file exists
  if (!fs.existsSync(schemaPath)) {
    console.error('Schema file not found at:', schemaPath);
    return;
  }
  
  // Read the schema file
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split the schema into individual statements
  const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
  
  // Execute each statement
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
    
    statements.forEach(statement => {
      db.run(statement, error => {
        if (error) {
          console.error('Error executing schema statement:', error);
          console.error('Failed statement:', statement);
        }
      });
    });
    
    console.log('Database schema initialized successfully');
  });
}

// Connect to database with better error handling
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    // Don't exit the process, but log the error
  } else {
    console.log('✅ Connected to SQLite database at:', dbPath);
    
    // Check if this is a new database
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='userAccountsTeacher'", (err, row) => {
      if (err) {
        console.error('Error checking for existing tables:', err);
      } else if (!row) {
        console.log('No existing tables found, initializing database...');
        initializeDatabase();
      } else {
        console.log('Database already initialized with tables');
      }
    });
  }
});

// Handle DB close on application shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  // Ensure the request has a body
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('Empty request body or invalid JSON');
    return res.status(400).json({ error: 'Invalid request - no JSON body' });
  }

  const { emailAddress, password } = req.body;
  console.log('Login attempt:', { emailAddress, password }); // Debugging line

  // Validate inputs
  if (!emailAddress || !password) {
    console.error('Missing credentials');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Check in student table first
  let query = 'SELECT * FROM "userAccountsStudent" WHERE "emailAddress" = ? AND password = ?';
  db.get(query, [emailAddress, password], (err, row) => {
    if (err) {
      console.error('❌ DB error (student):', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!row) {
      // If not found in student, check teacher
      query = 'SELECT * FROM "userAccountsTeacher" WHERE "emailAddress" = ? AND password = ?';
      db.get(query, [emailAddress, password], (err, row) => {
        if (err) {
          console.error('❌ DB error (teacher):', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!row) {
          console.log('Invalid credentials for:', emailAddress); // Debugging line
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Teacher login success - include all relevant fields
        console.log('Teacher login success. Row data:', row);
        
        // Create an object with all properties from the database row
        const userData = { role: 'teacher' };
        Object.keys(row).forEach(key => {
          userData[key] = row[key];
        });
        
        res.json(userData);
      });
      return;
    }

    // Student login success - include all relevant fields
    console.log('Student login success. Row data:', row);
    
    // Create an object with all properties from the database row
    const userData = { role: 'student' };
    Object.keys(row).forEach(key => {
      userData[key] = row[key];
    });
    
    res.json(userData);
  });
});

// Handle incorrect method for login endpoint
app.all('/api/login', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST for login requests.' });
  }
  next();
});

// Signup - Teacher
app.post('/api/signup/teacher', (req, res) => {
  const { name, emailAddress, teacherID, password } = req.body;

  const query = `
    INSERT INTO userAccountsTeacher (name, emailAddress, teacherID, password)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [name, emailAddress, teacherID, password], function (err) {
    if (err) {
      console.error('❌ Signup error (teacher):', err.message);
      return res.status(500).json({ error: 'Could not register teacher' });
    }

    res.status(200).json({ success: true });
  });
});

// Signup - Student
app.post('/api/signup/student', (req, res) => {
  const { name, emailAddress, studentID, password } = req.body;

  const query = `
    INSERT INTO userAccountsStudent (name, emailAddress, studentID, password)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [name, emailAddress, studentID, password], function (err) {
    if (err) {
      console.error('❌ Signup error (student):', err.message);
      return res.status(500).json({ error: 'Could not register student' });
    }

    res.status(200).json({ success: true });
  });
});

// Update profile endpoint (without image upload)
app.post('/api/updateProfile', (req, res) => {
  const {
    name, emailAddress, contactNumber,
    classesCreated, classActivities,
    course, section,
    role
  } = req.body;

  const table = role === 'teacher' ? 'userAccountsTeacher' : 'userAccountsStudent';

  let query;
  if (role === 'teacher') {
    query = `
      UPDATE ${table}
      SET name = ?, contactNumber = ?, classesCreated = ?, classActivities = ?
      WHERE emailAddress = ?
    `;
    db.run(query, [name, contactNumber, classesCreated, classActivities, emailAddress], function (err) {
      if (err) {
        console.error('❌ Profile update error:', err.message);
        return res.status(500).json({ success: false });
      }
      res.status(200).json({ success: true });
    });
  } else {
    query = `
      UPDATE ${table}
      SET name = ?, contactNumber = ?, course = ?, section = ?
      WHERE emailAddress = ?
    `;
    db.run(query, [name, contactNumber, course, section, emailAddress], function (err) {
      if (err) {
        console.error('❌ Profile update error:', err.message);
        return res.status(500).json({ success: false });
      }
      res.status(200).json({ success: true });
    });
  }
});

app.get('/api/view-all', (req, res) => {
  const adminQuery = 'SELECT * FROM adminAccounts';
  const classroomQuery = 'SELECT * FROM classroomDatabase';
  const studentQuery = 'SELECT * FROM userAccountsStudent';
  const teacherQuery = 'SELECT * FROM userAccountsTeacher';

  // Fetch data from the adminAccounts table
  db.all(adminQuery, [], (err, adminData) => {
    if (err) {
      console.error('❌ Error fetching admin accounts:', err.message);
      return res.status(500).json({ error: 'Error fetching admin accounts' });
    }

    // Fetch data from the classroomDatabase table
    db.all(classroomQuery, [], (err, classroomData) => {
      if (err) {
        console.error('❌ Error fetching classroom data:', err.message);
        return res.status(500).json({ error: 'Error fetching classroom data' });
      }

      // Fetch data from the userAccountsStudent table
      db.all(studentQuery, [], (err, studentData) => {
        if (err) {
          console.error('❌ Error fetching student accounts:', err.message);
          return res.status(500).json({ error: 'Error fetching student accounts' });
        }

        // Fetch data from the userAccountsTeacher table
        db.all(teacherQuery, [], (err, teacherData) => {
          if (err) {
            console.error('❌ Error fetching teacher accounts:', err.message);
            return res.status(500).json({ error: 'Error fetching teacher accounts' });
          }

          // Combine all data into one object and send it to the client
          const allData = {
            adminAccounts: adminData,
            classroomDatabase: classroomData,
            userAccountsStudent: studentData,
            userAccountsTeacher: teacherData
          };

          // Send the combined data as JSON
          res.json(allData);
        });
      });
    });
  });
});

// Fetch classrooms for a specific teacher
app.get('/api/classrooms', (req, res) => {
  const teacherID = req.query.teacherID;
  console.log('API Request - Fetching classrooms for teacherID:', teacherID);
  
  if (!teacherID) {
    return res.status(400).json({ error: "teacherID parameter is required" });
  }

  // First, check if the classroomDatabase table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='classroomDatabase'", [], (err, table) => {
    if (err) {
      console.error('Error checking for classroomDatabase table:', err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!table) {
      console.error('classroomDatabase table does not exist');
      return res.json([]); // Return empty array if table doesn't exist
    }
    
    // Get information about the columns in the classroomDatabase table
    db.all("PRAGMA table_info(classroomDatabase)", [], (err, columnInfo) => {
      if (err) {
        console.error('Error getting column info:', err);
        return res.status(500).json({ error: "Database error" });
      }
      
      console.log('classroomDatabase columns:', columnInfo);
      
      // Check if required columns exist and build query dynamically
      const hasID = columnInfo.some(col => col.name === 'ID');
      const hasClassroomName = columnInfo.some(col => col.name === 'classroomName');
      const hasClassName = columnInfo.some(col => col.name === 'className');
      const hasSection = columnInfo.some(col => col.name === 'section');
      const hasParticipants = columnInfo.some(col => col.name === 'participants');
      const hasActivities = columnInfo.some(col => col.name === 'activities');
      const hasScore = columnInfo.some(col => col.name === 'score');
      const hasTeacherID = columnInfo.some(col => col.name === 'teacherID');
      
      // If teacherID column doesn't exist, we can't filter
      if (!hasTeacherID) {
        console.error('teacherID column not found in classroomDatabase');
        return res.json([]); // Return empty array
      }
      
      // Build column selection part of query
      let selectColumns = [];
      
      if (hasID) selectColumns.push('c.ID');
      else selectColumns.push('c.rowid as ID'); // Use rowid as fallback
      
      if (hasClassroomName) selectColumns.push('c.classroomName');
      else if (hasClassName) selectColumns.push('c.className as classroomName');
      else selectColumns.push('\'Unnamed Class\' as classroomName');
      
      if (hasSection) selectColumns.push('c.section');
      else selectColumns.push('\'No Section\' as section');
      
      if (hasParticipants) selectColumns.push('c.participants');
      else selectColumns.push('0 as participants');
      
      if (hasActivities) selectColumns.push('c.activities');
      else selectColumns.push('0 as activities');
      
      if (hasScore) selectColumns.push('c.score');
      else selectColumns.push('0 as score');
      
      selectColumns.push('t.name as teacherName');
      selectColumns.push('t.emailAddress as teacherEmail');
      
      const selectClause = 'SELECT ' + selectColumns.join(', ');
      
      const query = `
        ${selectClause}
        FROM classroomDatabase c
        INNER JOIN userAccountsTeacher t ON c.teacherID = t.teacherID
        WHERE c.teacherID = ?
      `;
      
      console.log('Executing query:', query);
      
      db.all(query, [teacherID], (err, rows) => {
        if (err) {
          console.error('Database error fetching classrooms:', err);
          res.status(500).json({ error: "Failed to retrieve classrooms." });
        } else {
          console.log('Classrooms found:', rows.length);
          console.log('Classroom data sample:', rows.slice(0, 2));
          res.json(rows);
        }
      });
    });
  });
});

app.delete('/api/classrooms/:id', (req, res) => {
    const classroomId = req.params.id;
    const query = 'DELETE FROM classroomDatabase WHERE ID = ?';

    db.run(query, [classroomId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to delete classroom' });
        }
        res.status(204).send(); // No content
    });
});

// Test endpoint to insert classroom data
app.get('/api/test/insert-classroom', (req, res) => {
  const teacherID = req.query.teacherID;
  
  if (!teacherID) {
    return res.status(400).json({ error: "teacherID parameter is required" });
  }
  
  console.log('Inserting test classroom for teacherID:', teacherID);
  
  const query = `
    INSERT INTO classroomDatabase (classroomName, section, activities, score, participants, teacherID)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, ["Test Classroom", "Test Section", 5, 90, 20, teacherID], function(err) {
    if (err) {
      console.error('Error inserting test classroom:', err);
      return res.status(500).json({ error: "Failed to insert test classroom" });
    }
    
    res.json({ 
      success: true, 
      message: "Test classroom inserted successfully", 
      classroomID: this.lastID
    });
  });
});

// Test endpoint to check database tables
app.get('/api/test/db-tables', (req, res) => {
  const query = "SELECT name FROM sqlite_master WHERE type='table'";
  
  db.all(query, [], (err, tables) => {
    if (err) {
      console.error('Error checking database tables:', err);
      return res.status(500).json({ error: "Failed to check database tables" });
    }
    
    const tablePromises = tables.map(table => {
      return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
          if (err) {
            reject(err);
          } else {
            resolve({ table: table.name, columns });
          }
        });
      });
    });
    
    Promise.all(tablePromises)
      .then(tableInfo => {
        res.json({ tables: tableInfo });
      })
      .catch(err => {
        console.error('Error getting table info:', err);
        res.status(500).json({ error: "Failed to get table info" });
      });
  });
});

// Create a new classroom
app.post('/api/classrooms', (req, res) => {
  const { classroomName, section, activities, score, participants, teacherID, customCode } = req.body;
  
  if (!teacherID || !classroomName) {
    return res.status(400).json({ error: "Teacher ID and classroom name are required" });
  }

  console.log('Creating new classroom for teacherID:', teacherID);
  
  // First check if customCode column exists
  db.all("PRAGMA table_info(classroomDatabase)", [], (err, columns) => {
    if (err) {
      console.error('Error checking table structure:', err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Check if customCode column exists
    let hasCustomCodeColumn = columns.some(col => col.name === 'customCode');
    
    if (!hasCustomCodeColumn) {
      // Add the column if it doesn't exist
      db.run("ALTER TABLE classroomDatabase ADD COLUMN customCode TEXT", [], (err) => {
        if (err) {
          console.error('Error adding customCode column:', err);
          // Continue without customCode
          insertClassroom(false);
        } else {
          // Successfully added column
          insertClassroom(true);
        }
      });
    } else {
      // Column already exists
      insertClassroom(true);
    }
  });
  
  // Function to insert classroom data
  function insertClassroom(includeCustomCode) {
    let query, params;
    
    if (includeCustomCode && customCode) {
      query = `
        INSERT INTO classroomDatabase (classroomName, section, activities, score, participants, teacherID, customCode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      params = [classroomName, section, activities || 0, score || 0, participants || 0, teacherID, customCode];
    } else {
      query = `
    INSERT INTO classroomDatabase (classroomName, section, activities, score, participants, teacherID)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
      params = [classroomName, section, activities || 0, score || 0, participants || 0, teacherID];
    }
  
    db.run(query, params, function(err) {
    if (err) {
      console.error('Error creating classroom:', err);
      return res.status(500).json({ error: "Failed to create classroom" });
    }
    
    const newClassroomId = this.lastID;
    
    // Fetch the created classroom to return complete data
    db.get(`SELECT * FROM classroomDatabase WHERE ID = ?`, [newClassroomId], (err, classroom) => {
      if (err) {
        console.error('Error fetching created classroom:', err);
        return res.status(500).json({ error: "Classroom created but failed to retrieve data" });
      }
      
      res.status(201).json({ 
        success: true, 
        message: "Classroom created successfully", 
        classroom
      });
    });
  });
  }
});

// Get a single classroom by ID
app.get('/api/classrooms/:id', (req, res) => {
  const classroomId = req.params.id;
  
  if (!classroomId) {
    return res.status(400).json({ error: "Classroom ID is required" });
  }

  console.log('Fetching classroom by ID:', classroomId);
  
  const query = `
    SELECT 
      c.ID,
      c.classroomName,
      c.section,
      c.participants,
      c.activities,
      c.score,
      t.name as teacherName,
      t.emailAddress as teacherEmail
    FROM classroomDatabase c
    INNER JOIN userAccountsTeacher t ON c.teacherID = t.teacherID
    WHERE c.ID = ?
  `;
  
  db.get(query, [classroomId], (err, classroom) => {
    if (err) {
      console.error('Error fetching classroom:', err);
      return res.status(500).json({ error: "Failed to fetch classroom" });
    }
    
    if (!classroom) {
      return res.status(404).json({ error: "Classroom not found" });
    }
    
    res.json(classroom);
  });
});

// Get students in a classroom
app.get('/api/classrooms/:id/students', (req, res) => {
  const classroomId = req.params.id;
  
  if (!classroomId) {
    return res.status(400).json({ error: "Classroom ID is required" });
  }

  console.log('Fetching students for classroom ID:', classroomId);
  
  const query = `
    SELECT 
      s.studentID,
      s.name,
      s.emailAddress,
      s.course,
      s.section,
      cs.joinDate,
      cs.status
    FROM classroomStudents cs
    JOIN userAccountsStudent s ON cs.studentID = s.studentID
    WHERE cs.classroomID = ?
  `;
  
  db.all(query, [classroomId], (err, students) => {
    if (err) {
      console.error('Error fetching students:', err);
      return res.status(500).json({ error: "Failed to fetch students" });
    }
    
    res.json(students);
  });
});

// Add a student to a classroom
app.post('/api/classrooms/:id/students', (req, res) => {
  const classroomId = req.params.id;
  const { studentID } = req.body;
  
  if (!classroomId || !studentID) {
    return res.status(400).json({ error: "Classroom ID and Student ID are required" });
  }

  console.log(`Adding student ${studentID} to classroom ${classroomId}`);
  
  // First, check if the relationship already exists
  db.get('SELECT * FROM classroomStudents WHERE classroomID = ? AND studentID = ?', 
    [classroomId, studentID], (err, existingRelation) => {
    
    if (err) {
      console.error('Error checking classroom-student relationship:', err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (existingRelation) {
      return res.status(409).json({ error: "Student is already in this classroom" });
    }
    
    // If not exists, insert new relationship
    const joinDate = new Date().toISOString();
    db.run('INSERT INTO classroomStudents (classroomID, studentID, joinDate, status) VALUES (?, ?, ?, ?)',
      [classroomId, studentID, joinDate, 'active'], function(err) {
      
      if (err) {
        console.error('Error adding student to classroom:', err);
        return res.status(500).json({ error: "Failed to add student to classroom" });
      }
      
      // Update the participants count in the classroom
      db.run('UPDATE classroomDatabase SET participants = participants + 1 WHERE ID = ?', 
        [classroomId], function(err) {
        
        if (err) {
          console.error('Error updating classroom participants:', err);
          // Not returning error as the student was added successfully
        }
        
        res.status(201).json({ 
          success: true, 
          message: "Student added to classroom successfully", 
          id: this.lastID
        });
      });
    });
  });
});

// Remove a student from a classroom
app.delete('/api/classrooms/:classroomId/students/:studentId', (req, res) => {
  const { classroomId, studentId } = req.params;
  
  if (!classroomId || !studentId) {
    return res.status(400).json({ error: "Classroom ID and Student ID are required" });
  }

  console.log(`Removing student ${studentId} from classroom ${classroomId}`);
  
  db.run('DELETE FROM classroomStudents WHERE classroomID = ? AND studentID = ?', 
    [classroomId, studentId], function(err) {
    
    if (err) {
      console.error('Error removing student from classroom:', err);
      return res.status(500).json({ error: "Failed to remove student" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Student not found in this classroom" });
    }
    
    // Update the participants count in the classroom
    db.run('UPDATE classroomDatabase SET participants = participants - 1 WHERE ID = ? AND participants > 0', 
      [classroomId], function(err) {
      
      if (err) {
        console.error('Error updating classroom participants:', err);
        // Not returning error as the student was removed successfully
      }
      
      res.status(200).json({ 
        success: true, 
        message: "Student removed from classroom successfully"
      });
    });
  });
});

// Get classrooms that a student has joined
app.get('/api/students/:studentId/classrooms', (req, res) => {
  const studentId = req.params.studentId;
  const dashboard = req.query.dashboard === 'true';
  
  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  console.log(`Fetching classrooms for student ${studentId}${dashboard ? ' (dashboard view)' : ''}`);
  
  let query;
  
  if (dashboard) {
    // Simple query for dashboard stats
    query = `
      SELECT c.* FROM classroomDatabase c
      JOIN classroomStudents cs ON c.ID = cs.classroomID
      WHERE cs.studentID = ? AND cs.status = 'active'
    `;
  } else {
    // Detailed query for classroom listing
    query = `
    SELECT 
      c.ID,
      c.classroomName,
      c.section,
      c.activities,
      c.score,
      t.name as teacherName,
      cs.joinDate,
        cs.status,
        (SELECT COUNT(*) FROM classroomStudents WHERE classroomID = c.ID AND status = 'active') as participants
    FROM classroomStudents cs
    JOIN classroomDatabase c ON cs.classroomID = c.ID
    JOIN userAccountsTeacher t ON c.teacherID = t.teacherID
    WHERE cs.studentID = ? AND cs.status = 'active'
  `;
  }
  
  db.all(query, [studentId], (err, classrooms) => {
    if (err) {
      console.error('Error fetching student classrooms:', err);
      return res.status(500).json({ error: "Failed to fetch classrooms" });
    }
    
    res.json(classrooms);
  });
});

// Activity Management APIs

// Get all activities for a classroom
app.get('/api/classrooms/:id/activities', (req, res) => {
  const classroomId = req.params.id;
  
  if (!classroomId) {
    return res.status(400).json({ error: "Classroom ID is required" });
  }

  console.log(`Fetching activities for classroom ${classroomId}`);
  
  const query = `
    SELECT * FROM activities
    WHERE classroomID = ?
    ORDER BY createdAt DESC
  `;
  
  db.all(query, [classroomId], (err, activities) => {
    if (err) {
      console.error('Error fetching activities:', err);
      return res.status(500).json({ error: "Failed to fetch activities" });
    }
    
    res.json(activities);
  });
});

// Get a single activity by ID
app.get('/api/activities/:id', (req, res) => {
  const activityId = req.params.id;
  
  if (!activityId) {
    return res.status(400).json({ error: "Activity ID is required" });
  }

  console.log(`Fetching activity ${activityId}`);
  
  // First get the activity details
  const activityQuery = `SELECT * FROM activities WHERE id = ?`;
  
  db.get(activityQuery, [activityId], (err, activity) => {
    if (err) {
      console.error('Error fetching activity:', err);
      return res.status(500).json({ error: "Failed to fetch activity" });
    }
    
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    // Now get the questions if this is a quiz/form activity
    const questionsQuery = `
      SELECT * FROM activityQuestions 
      WHERE activityID = ? 
      ORDER BY orderIndex ASC
    `;
    
    db.all(questionsQuery, [activityId], (err, questions) => {
      if (err) {
        console.error('Error fetching activity questions:', err);
        return res.status(500).json({ error: "Failed to fetch activity questions" });
      }
      
      // Return both the activity and its questions
      res.json({
        ...activity,
        questions: questions
      });
    });
  });
});

// Create a new activity
app.post('/api/classrooms/:id/activities', (req, res) => {
  const classroomId = req.params.id;
  const { title, description, type, dueDate, maxScore, questions } = req.body;
  
  if (!classroomId || !title || !type) {
    return res.status(400).json({ 
      error: "Classroom ID, activity title and type are required" 
    });
  }

  console.log(`Creating new activity for classroom ${classroomId}`);
  
  const query = `
    INSERT INTO activities (
      classroomID, title, description, type, dueDate, maxScore
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    classroomId, 
    title, 
    description || '', 
    type, 
    dueDate || null, 
    maxScore || 100
  ], function(err) {
    if (err) {
      console.error('Error creating activity:', err);
      return res.status(500).json({ error: "Failed to create activity" });
    }
    
    const activityId = this.lastID;
    
    // If this is a quiz/form with questions, add them
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const insertQuestions = () => {
        const promises = questions.map((question, index) => {
          return new Promise((resolve, reject) => {
            const { questionText, questionType, options, required } = question;
            
            if (!questionText || !questionType) {
              reject(new Error("Question text and type are required"));
              return;
            }
            
            const questionQuery = `
              INSERT INTO activityQuestions (
                activityID, questionText, questionType, options, required, orderIndex
              ) VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const optionsJson = options ? JSON.stringify(options) : null;
            
            db.run(questionQuery, [
              activityId,
              questionText,
              questionType,
              optionsJson,
              required === false ? 0 : 1,
              index
            ], function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(this.lastID);
              }
            });
          });
        });
        
        return Promise.all(promises);
      };
      
      insertQuestions()
        .then(() => {
          // Update the classroom activities count
          const updateQuery = `
            UPDATE classroomDatabase 
            SET activities = activities + 1 
            WHERE ID = ?
          `;
          
          db.run(updateQuery, [classroomId], function(err) {
            if (err) {
              console.error('Error updating classroom activities count:', err);
            }
            
            // Fetch the created activity with questions to return
            db.get(`SELECT * FROM activities WHERE id = ?`, [activityId], (err, activity) => {
              if (err) {
                console.error('Error fetching created activity:', err);
                return res.status(500).json({ 
                  error: "Activity created but failed to retrieve data" 
                });
              }
              
              db.all(`
                SELECT * FROM activityQuestions 
                WHERE activityID = ? 
                ORDER BY orderIndex ASC
              `, [activityId], (err, questions) => {
                if (err) {
                  console.error('Error fetching created questions:', err);
                  return res.status(500).json({ 
                    error: "Activity created but failed to retrieve questions" 
                  });
                }
                
                res.status(201).json({
                  success: true,
                  message: "Activity created successfully",
                  activity: {
                    ...activity,
                    questions: questions
                  }
                });
              });
            });
          });
        })
        .catch(err => {
          console.error('Error inserting questions:', err);
          return res.status(500).json({ 
            error: "Activity created but failed to add questions",
            activityId: activityId 
          });
        });
    } else {
      // No questions to add, just update classroom activities count
      const updateQuery = `
        UPDATE classroomDatabase 
        SET activities = activities + 1 
        WHERE ID = ?
      `;
      
      db.run(updateQuery, [classroomId], function(err) {
        if (err) {
          console.error('Error updating classroom activities count:', err);
        }
        
        // Return the created activity
        db.get(`SELECT * FROM activities WHERE id = ?`, [activityId], (err, activity) => {
          if (err) {
            console.error('Error fetching created activity:', err);
            return res.status(500).json({ 
              error: "Activity created but failed to retrieve data" 
            });
          }
          
          res.status(201).json({
            success: true,
            message: "Activity created successfully",
            activity: activity
          });
        });
      });
    }
  });
});

// Update an activity
app.put('/api/activities/:id', (req, res) => {
  const activityId = req.params.id;
  const { title, description, type, dueDate, maxScore, status } = req.body;
  
  if (!activityId) {
    return res.status(400).json({ error: "Activity ID is required" });
  }

  console.log(`Updating activity ${activityId}`);
  
  // First check if the activity exists
  db.get('SELECT * FROM activities WHERE id = ?', [activityId], (err, activity) => {
    if (err) {
      console.error('Error checking activity:', err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    // Build the update query dynamically based on provided fields
    let updateFields = [];
    let updateValues = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    
    if (dueDate !== undefined) {
      updateFields.push('dueDate = ?');
      updateValues.push(dueDate);
    }
    
    if (maxScore !== undefined) {
      updateFields.push('maxScore = ?');
      updateValues.push(maxScore);
    }
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    // Add activity ID to values
    updateValues.push(activityId);
    
    const query = `
      UPDATE activities 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    db.run(query, updateValues, function(err) {
      if (err) {
        console.error('Error updating activity:', err);
        return res.status(500).json({ error: "Failed to update activity" });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: "Activity not found or no changes made" });
      }
      
      // Return the updated activity
      db.get('SELECT * FROM activities WHERE id = ?', [activityId], (err, updatedActivity) => {
        if (err) {
          console.error('Error fetching updated activity:', err);
          return res.status(500).json({ 
            success: true, 
            message: "Activity updated but failed to retrieve updated data" 
          });
        }
        
        res.json({
          success: true,
          message: "Activity updated successfully",
          activity: updatedActivity
        });
      });
    });
  });
});

// Delete an activity
app.delete('/api/activities/:id', (req, res) => {
  const activityId = req.params.id;
  
  if (!activityId) {
    return res.status(400).json({ error: "Activity ID is required" });
  }

  console.log(`Deleting activity ${activityId}`);
  
  // First get the activity to check classroom ID
  db.get('SELECT * FROM activities WHERE id = ?', [activityId], (err, activity) => {
    if (err) {
      console.error('Error checking activity:', err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    const classroomId = activity.classroomID;
    
    // Begin a transaction for deletion
    db.run('BEGIN TRANSACTION', err => {
      if (err) {
        console.error('Error beginning transaction:', err);
        return res.status(500).json({ error: "Database error" });
      }
      
      // Delete activity questions first (foreign key constraint)
      db.run('DELETE FROM activityQuestions WHERE activityID = ?', [activityId], err => {
        if (err) {
          db.run('ROLLBACK');
          console.error('Error deleting activity questions:', err);
          return res.status(500).json({ error: "Failed to delete activity questions" });
        }
        
        // Delete activity submissions (foreign key constraint)
        db.run('DELETE FROM activitySubmissions WHERE activityID = ?', [activityId], err => {
          if (err) {
            db.run('ROLLBACK');
            console.error('Error deleting activity submissions:', err);
            return res.status(500).json({ error: "Failed to delete activity submissions" });
          }
          
          // Delete the activity
          db.run('DELETE FROM activities WHERE id = ?', [activityId], function(err) {
            if (err) {
              db.run('ROLLBACK');
              console.error('Error deleting activity:', err);
              return res.status(500).json({ error: "Failed to delete activity" });
            }
            
            if (this.changes === 0) {
              db.run('ROLLBACK');
              return res.status(404).json({ error: "Activity not found" });
            }
            
            // Update the classroom activities count
            db.run(`
              UPDATE classroomDatabase 
              SET activities = CASE WHEN activities > 0 THEN activities - 1 ELSE 0 END 
              WHERE ID = ?
            `, [classroomId], function(err) {
              if (err) {
                db.run('ROLLBACK');
                console.error('Error updating classroom activities count:', err);
                return res.status(500).json({ error: "Failed to update classroom activity count" });
              }
              
              // Commit the transaction
              db.run('COMMIT', err => {
                if (err) {
                  db.run('ROLLBACK');
                  console.error('Error committing transaction:', err);
                  return res.status(500).json({ error: "Failed to commit changes" });
                }
                
                res.json({
                  success: true,
                  message: "Activity deleted successfully"
                });
              });
            });
          });
        });
      });
    });
  });
});

// Student submission endpoints

// Submit an activity
app.post('/api/activities/:id/submit', (req, res) => {
  const activityId = req.params.id;
  const { studentID, submissionData } = req.body;
  
  if (!activityId || !studentID || !submissionData) {
    return res.status(400).json({ 
      error: "Activity ID, student ID and submission data are required" 
    });
  }

  console.log(`Recording submission for activity ${activityId} from student ${studentID}`);
  
  // Check if student has already submitted this activity
  db.get('SELECT * FROM activitySubmissions WHERE activityID = ? AND studentID = ?', 
    [activityId, studentID], (err, existingSubmission) => {
    
    if (err) {
      console.error('Error checking existing submission:', err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // If there's an existing submission, update it
    if (existingSubmission) {
      const query = `
        UPDATE activitySubmissions 
        SET submissionData = ?, submittedAt = CURRENT_TIMESTAMP, status = 'resubmitted'
        WHERE activityID = ? AND studentID = ?
      `;
      
      db.run(query, [
        JSON.stringify(submissionData),
        activityId,
        studentID
      ], function(err) {
        if (err) {
          console.error('Error updating submission:', err);
          return res.status(500).json({ error: "Failed to update submission" });
        }
        
        res.json({
          success: true,
          message: "Submission updated successfully",
          submissionId: existingSubmission.id
        });
      });
    } else {
      // Insert new submission
      const query = `
        INSERT INTO activitySubmissions (
          activityID, studentID, submissionData, status
        ) VALUES (?, ?, ?, ?)
      `;
      
      db.run(query, [
        activityId,
        studentID,
        JSON.stringify(submissionData),
        'submitted'
      ], function(err) {
        if (err) {
          console.error('Error creating submission:', err);
          return res.status(500).json({ error: "Failed to create submission" });
        }
        
        res.status(201).json({
          success: true,
          message: "Submission recorded successfully",
          submissionId: this.lastID
        });
      });
    }
  });
});

// Get all submissions for an activity
app.get('/api/activities/:id/submissions', (req, res) => {
  const activityId = req.params.id;
  
  if (!activityId) {
    return res.status(400).json({ error: "Activity ID is required" });
  }

  console.log(`Fetching submissions for activity ${activityId}`);
  
  const query = `
    SELECT 
      s.id, s.activityID, s.studentID, s.submissionData, s.score, 
      s.feedback, s.submittedAt, s.status,
      u.name as studentName, u.emailAddress as studentEmail
    FROM activitySubmissions s
    JOIN userAccountsStudent u ON s.studentID = u.studentID
    WHERE s.activityID = ?
    ORDER BY s.submittedAt DESC
  `;
  
  db.all(query, [activityId], (err, submissions) => {
    if (err) {
      console.error('Error fetching submissions:', err);
      return res.status(500).json({ error: "Failed to fetch submissions" });
    }
    
    // Parse the submission data JSON for each submission
    const processedSubmissions = submissions.map(sub => {
      try {
        if (sub.submissionData) {
          sub.submissionData = JSON.parse(sub.submissionData);
        }
      } catch (e) {
        console.error('Error parsing submission data:', e);
      }
      return sub;
    });
    
    res.json(processedSubmissions);
  });
});

// Grade a submission
app.post('/api/submissions/:id/grade', (req, res) => {
  const submissionId = req.params.id;
  const { score, feedback } = req.body;
  
  if (!submissionId || score === undefined) {
    return res.status(400).json({ 
      error: "Submission ID and score are required" 
    });
  }

  console.log(`Grading submission ${submissionId} with score ${score}`);
  
  const query = `
    UPDATE activitySubmissions 
    SET score = ?, feedback = ?, status = 'graded'
    WHERE id = ?
  `;
  
  db.run(query, [
    score,
    feedback || '',
    submissionId
  ], function(err) {
    if (err) {
      console.error('Error grading submission:', err);
      return res.status(500).json({ error: "Failed to grade submission" });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }
    
    res.json({
      success: true,
      message: "Submission graded successfully"
    });
  });
});

// Get a student's submissions
app.get('/api/students/:studentId/submissions', (req, res) => {
  const studentId = req.params.studentId;
  
  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  console.log(`Fetching submissions for student ${studentId}`);
  
  const query = `
    SELECT 
      s.id, s.activityID, s.studentID, s.score, s.feedback, 
      s.submittedAt, s.status,
      a.title as activityTitle, a.type as activityType,
      a.dueDate, a.maxScore,
      c.classroomName, c.ID as classroomID
    FROM activitySubmissions s
    JOIN activities a ON s.activityID = a.id
    JOIN classroomDatabase c ON a.classroomID = c.ID
    WHERE s.studentID = ?
    ORDER BY s.submittedAt DESC
  `;
  
  db.all(query, [studentId], (err, submissions) => {
    if (err) {
      console.error('Error fetching student submissions:', err);
      return res.status(500).json({ error: "Failed to fetch submissions" });
    }
    
    res.json(submissions);
  });
});

// Teacher login
app.post('/api/auth/login-teacher', (req, res) => {
  const { email, password } = req.body;
  
  // Query teacher by email
  db.get('SELECT * FROM userAccountsTeacher WHERE emailAddress = ?', [email], (err, teacher) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!teacher || teacher.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return teacher data
    res.json({
      name: teacher.name,
      teacherID: teacher.teacherID,
      emailAddress: teacher.emailAddress
    });
  });
});

// Student login
app.post('/api/auth/login-student', (req, res) => {
  const { email, password } = req.body;
  
  // Query student by email
  db.get('SELECT * FROM userAccountsStudent WHERE emailAddress = ?', [email], (err, student) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!student || student.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return student data
    res.json({
      name: student.name,
      studentID: student.studentID,
      emailAddress: student.emailAddress
    });
  });
});

// For dashboard stats - Teacher's classrooms
app.get('/api/teachers/:id/classrooms', (req, res) => {
  const teacherId = req.params.id;
  
  db.all('SELECT * FROM classroomDatabase WHERE teacherID = ?', [teacherId], (err, classrooms) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.json(classrooms);
  });
});

// For dashboard stats - Teacher's activities
app.get('/api/teachers/:id/activities', (req, res) => {
  const teacherId = req.params.id;
  
  db.all(`
    SELECT a.* FROM activities a
    JOIN classroomDatabase c ON a.classroomID = c.ID
    WHERE c.teacherID = ?
  `, [teacherId], (err, activities) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.json(activities);
  });
});

// For dashboard stats - Student's activities
app.get('/api/students/:id/activities', (req, res) => {
  const studentId = req.params.id;
  
  db.all(`
    SELECT a.* FROM activities a
    JOIN classroomDatabase c ON a.classroomID = c.ID
    JOIN classroomStudents cs ON c.ID = cs.classroomID
    WHERE cs.studentID = ?
  `, [studentId], (err, activities) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.json(activities);
  });
});

// Join a classroom using a code
app.post('/api/classrooms/join', (req, res) => {
  const { code, studentID } = req.body;
  
  if (!code || !studentID) {
    return res.status(400).json({ error: "Classroom code and student ID are required" });
  }

  console.log(`Student ${studentID} attempting to join classroom with code ${code}`);
  
  // Find classroom by code
  db.get('SELECT * FROM classroomDatabase WHERE ID = ?', [code], (err, classroom) => {
    if (err) {
      console.error('Error checking classroom code:', err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (!classroom) {
      return res.status(404).json({ error: "Invalid classroom code" });
    }
    
    // Check if student is already in this classroom
    db.get('SELECT * FROM classroomStudents WHERE classroomID = ? AND studentID = ?', 
      [classroom.ID, studentID], (err, existingRelation) => {
      
      if (err) {
        console.error('Error checking classroom-student relationship:', err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (existingRelation) {
        return res.status(409).json({ error: "You are already a member of this classroom" });
      }
      
      // Join the classroom
      const joinDate = new Date().toISOString();
      db.run('INSERT INTO classroomStudents (classroomID, studentID, joinDate, status) VALUES (?, ?, ?, ?)',
        [classroom.ID, studentID, joinDate, 'active'], function(err) {
        
        if (err) {
          console.error('Error adding student to classroom:', err);
          return res.status(500).json({ error: "Failed to join classroom" });
        }
        
        // Update the participants count in the classroom
        db.run('UPDATE classroomDatabase SET participants = participants + 1 WHERE ID = ?', 
          [classroom.ID], function(err) {
          
          if (err) {
            console.error('Error updating classroom participants:', err);
            // Not returning error as the student was added successfully
          }
          
          res.status(201).json({ 
            success: true, 
            message: "Successfully joined the classroom", 
            classroomName: classroom.classroomName
          });
        });
      });
    });
  });
});

// Get classrooms count for a teacher
app.get('/api/teachers/:id/classrooms/count', (req, res) => {
  const teacherId = req.params.id;
  
  if (!teacherId) {
    return res.status(400).json({ error: "Teacher ID is required" });
  }

  console.log(`Counting classrooms for teacher ${teacherId}`);
  
  db.get('SELECT COUNT(*) as count FROM classroomDatabase WHERE teacherID = ?', [teacherId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.json({ count: result.count || 0 });
  });
});

// Get classroom student join history
app.get('/api/classrooms/:id/students/history', (req, res) => {
  const classroomId = req.params.id;
  
  if (!classroomId) {
    return res.status(400).json({ error: "Classroom ID is required" });
  }

  console.log(`Fetching student join history for classroom ${classroomId}`);
  
  const query = `
    SELECT 
      cs.classroomID,
      cs.studentID, 
      cs.joinDate,
      cs.status,
      s.name,
      s.emailAddress
    FROM classroomStudents cs
    JOIN userAccountsStudent s ON cs.studentID = s.studentID
    WHERE cs.classroomID = ?
    ORDER BY cs.joinDate DESC
  `;
  
  db.all(query, [classroomId], (err, history) => {
    if (err) {
      console.error('Error fetching student join history:', err);
      return res.status(500).json({ error: "Failed to fetch history" });
    }
    
    res.json(history);
  });
});

// Verify a classroom code without joining
app.get('/api/classrooms/verify', (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).json({ error: "Classroom code is required" });
  }

  console.log(`Verifying classroom code: ${code}`);
  
  // First try to look up by customCode
  let query = `
    SELECT 
      c.ID,
      c.classroomName,
      c.section,
      c.participants,
      c.activities,
      c.customCode,
      t.name as teacherName,
      t.emailAddress as teacherEmail
    FROM classroomDatabase c
    INNER JOIN userAccountsTeacher t ON c.teacherID = t.teacherID
    WHERE c.customCode = ?
  `;
  
  db.get(query, [code], (err, classroom) => {
    if (err) {
      console.error('Error verifying classroom code:', err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (classroom) {
      return res.json(classroom);
    }
    
    // If not found by customCode, try by ID (as fallback)
    query = `
      SELECT 
        c.ID,
        c.classroomName,
        c.section,
        c.participants,
        c.activities,
        c.customCode,
        t.name as teacherName,
        t.emailAddress as teacherEmail
      FROM classroomDatabase c
      INNER JOIN userAccountsTeacher t ON c.teacherID = t.teacherID
      WHERE c.ID = ?
    `;
    
    db.get(query, [code], (err, classroom) => {
      if (err) {
        console.error('Error verifying classroom code:', err);
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!classroom) {
        return res.status(404).json({ error: "Invalid classroom code" });
      }
      
      res.json(classroom);
    });
  });
});

// Check if a student is already in a classroom
app.get('/api/classrooms/:classroomId/students/check/:studentId', (req, res) => {
  const { classroomId, studentId } = req.params;
  
  if (!classroomId || !studentId) {
    return res.status(400).json({ error: "Classroom ID and Student ID are required" });
  }

  console.log(`Checking if student ${studentId} is in classroom ${classroomId}`);
  
  db.get('SELECT * FROM classroomStudents WHERE classroomID = ? AND studentID = ?', 
    [classroomId, studentId], (err, existingRelation) => {
    
    if (err) {
      console.error('Error checking classroom-student relationship:', err);
      return res.status(500).json({ error: "Database error" });
    }
    
    res.json({ 
      alreadyJoined: !!existingRelation,
      status: existingRelation ? existingRelation.status : null
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
