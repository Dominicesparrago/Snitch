const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Define paths
const dbPath = path.join(__dirname, 'assets', 'files', 'database.sqlite');
const schemaPath = path.join(__dirname, 'assets', 'files', 'database-schema.sql');

// Check if database directory exists, create if not
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
  console.log(`Removing existing database at ${dbPath}`);
  fs.unlinkSync(dbPath);
}

console.log(`Creating new database at ${dbPath}`);

// Connect to database (creates it if it doesn't exist)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to SQLite database');
  
  // Read the schema file
  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found at ${schemaPath}`);
    process.exit(1);
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split the schema into individual statements
  const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
  
  // Execute each statement
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
    
    let success = true;
    statements.forEach(statement => {
      console.log(`Executing: ${statement.trim().substring(0, 60)}...`);
      
      db.run(statement, error => {
        if (error) {
          console.error('Error executing statement:', error);
          console.error('Failed statement:', statement);
          success = false;
        }
      });
    });
    
    if (success) {
      console.log('✅ Database initialized successfully');
    } else {
      console.error('❌ Database initialization had errors');
    }
    
    // Close the database connection
    db.close(err => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  });
}); 