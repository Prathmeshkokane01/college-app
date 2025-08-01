// server.js (Final Version 2.0)

const fs = require('fs');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const dataDir = '/var/data';

const app = express();
const PORT = process.env.PORT || 3000;

const HOD_PASSWORD = "HOD@CSD2025";
const teachers = [
    { email: 'head.cs@college.edu', code: 'CSHOD2025' },
    { email: 'prof.sharma@college.edu', code: 'SHA_CS101' },
    { email: 'prof.patel@college.edu', code: 'PAT_CS202' },
];

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connect to the database
const db = new sqlite3.Database(`${dataDir}/database.sqlite`, (err) => {
    if (err) {
        console.error("DATABASE CONNECTION ERROR:", err.message);
    } else {
        console.log("--- Database connection successful ---");
        // Create tables and seed data ONLY after a successful connection
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS Students (roll_no INTEGER NOT NULL, name TEXT NOT NULL, division TEXT NOT NULL)`);
            // **FIX #1: Added 'student_division' column to the Fines table**
            db.run(`CREATE TABLE IF NOT EXISTS Fines (id INTEGER PRIMARY KEY AUTOINCREMENT, student_roll_no INTEGER NOT NULL, student_division TEXT NOT NULL, date TEXT NOT NULL, amount REAL NOT NULL, lecture_name TEXT, topic TEXT)`);
            db.run(`CREATE TABLE IF NOT EXISTS Submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, teacher_name TEXT NOT NULL, lecture_name TEXT NOT NULL, lecture_type TEXT, lecture_time TEXT, division TEXT NOT NULL, topic TEXT NOT NULL, absent_students TEXT)`);

            db.get("SELECT count(*) as count FROM Students", (err, row) => {
                if (row && row.count === 0) {
                    const students = [
                        { roll: 1, name: 'Aarav Gupta', div: 'A' }, { roll: 2, name: 'Vivaan Singh', div: 'A' },
                        { roll: 3, name: 'Aditya Sharma', div: 'A' }, { roll: 4, name: 'Vihaan Kumar', div: 'A' },
                        { roll: 5, name: 'Arjun Patel', div: 'A' }, { roll: 6, name: 'Sai Reddy', div: 'A' },
                        { roll: 7, name: 'Reyansh Joshi', div: 'A' }, { roll: 8, name: 'Krishna Mehta', div: 'A' },
                        { roll: 9, name: 'Ishaan Verma', div: 'A' }, { roll: 10, name: 'Advik Shah', div: 'A' },
                        { roll: 1, name: 'Ananya Roy', div: 'B' }, { roll: 2, name: 'Diya Das', div: 'B' },
                        { roll: 3, name: 'Pari Ghosh', div: 'B' }, { roll: 4, name: 'Myra Bose', div: 'B' },
                        { roll: 5, name: 'Aadhya Sen', div: 'B' }, { roll: 6, name: 'Kiara Dutta', div: 'B' },
                        { roll: 7, name: 'Saanvi Iyer', div: 'B' }, { roll: 8, name: 'Amaira Nair', div: 'B' },
                        { roll: 9, name: 'Anika Pillai', div: 'B' }, { roll: 10, name: 'Navya Menon', div: 'B' }
                    ];
                    const stmt = db.prepare("INSERT INTO Students (roll_no, name, division) VALUES (?, ?, ?)");
                    students.forEach(s => stmt.run(s.roll, s.name, s.div));
                    stmt.finalize();
                }
            });
        });
    }
});

// --- API Endpoints ---
app.post('/api/hod-login', (req, res) => { /* ... unchanged ... */ });
app.post('/api/teacher-login', (req, res) => { /* ... unchanged ... */ });

app.post('/api/submit-attendance', (req, res) => {
    const { date, lectureName, teacherName, division, topic, absentRollNos, lectureType, lectureTime } = req.body;
    // Log submission (unchanged)
    const absent_students_text = absentRollNos.length > 0 ? absentRollNos.join(', ') : 'None';
    db.run(`INSERT INTO Submissions (date, teacher_name, lecture_name, lecture_type, lecture_time, division, topic, absent_students) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [date, teacherName, lectureName, lectureType, lectureTime, division, topic, absent_students_text]);
    
    // Log individual fines
    if (absentRollNos && absentRollNos.length > 0) {
        const fineAmount = 100;
        // **FIX #2: Updated the INSERT statement to include the division**
        const sql = `INSERT INTO Fines (student_roll_no, student_division, date, amount, lecture_name, topic) VALUES (?, ?, ?, ?, ?, ?)`;
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            absentRollNos.forEach(rollNo => {
                db.run(sql, [rollNo, division, date, fineAmount, lectureName, topic]);
            });
            db.run("COMMIT");
        });
    }
    res.json({ success: true, message: 'Attendance recorded successfully.' });
});

app.get('/api/all-submissions', (req, res) => { /* ... unchanged ... */ });
app.get('/api/export-csv', (req, res) => { /* ... unchanged ... */ });

app.get('/api/students/:division', async (req, res) => {
    const { division } = req.params;
    const studentsSql = `SELECT roll_no, name FROM Students WHERE division = ? ORDER BY roll_no`;
    // **FIX #3: Simplified and corrected the Fines query**
    const finesSql = `SELECT student_roll_no, date, amount FROM Fines WHERE student_division = ?`;

    try {
        const students = await new Promise((resolve, reject) => db.all(studentsSql, [division], (err, rows) => err ? reject(err) : resolve(rows)));
        const fines = await new Promise((resolve, reject) => db.all(finesSql, [division], (err, rows) => err ? reject(err) : resolve(rows)));
        res.json({ students, fines });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`--- ✅ SERVER IS LIVE and listening on port ${PORT} ---`);
});