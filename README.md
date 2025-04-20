# Snitch - Educational Platform

Snitch is an educational web application that facilitates teacher-student interaction through virtual classrooms. The platform allows teachers to create classrooms and manage activities, while students can join classrooms and submit their work.

## Features

- User authentication (Teacher/Student accounts)
- Classroom management
- Role-based UI (Teacher/Student views)
- Activity tracking
- Real-time notifications

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: SQLite

## Installation

1. Clone the repository:
```
git clone https://github.com/Dominicesparrago/Snitch.git
```

2. Install dependencies:
```
npm install
```

3. Initialize the database (optional - a default database is already included):
```
npm run initdb
```

4. Run the application:
```
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Default Test Accounts

The database comes with pre-configured test accounts:

### Teacher Account
- Email: teacher@test.com
- Password: password123

### Student Account
- Email: student@test.com
- Password: password123

## Project Structure

- `assets/` - Contains CSS, JS, and HTML files
- `assets/files/database.sqlite` - SQLite database file
- `assets/files/database-schema.sql` - Database schema
- `index.js` - Main server file
- `initdb.js` - Database initialization script

## Troubleshooting

If you encounter issues with the database:

1. Run the database initialization script:
```
npm run initdb
```

2. Make sure the database file is accessible and not locked by another process

3. Check the server logs for specific database errors

## Contributors

- Dominic Esparrago 