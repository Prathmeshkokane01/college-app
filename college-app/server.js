const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const initializeDatabase = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS Students (id SERIAL PRIMARY KEY, roll_no INTEGER NOT NULL, name TEXT NOT NULL, division TEXT NOT NULL, UNIQUE(roll_no, division));`);
        await pool.query(`CREATE TABLE IF NOT EXISTS Fines (id SERIAL PRIMARY KEY, student_roll_no INTEGER NOT NULL, student_division TEXT NOT NULL, date TEXT NOT NULL, amount REAL NOT NULL, lecture_name TEXT, topic TEXT);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS Submissions (id SERIAL PRIMARY KEY, date TEXT NOT NULL, teacher_name TEXT NOT NULL, lecture_name TEXT NOT NULL, lecture_type TEXT, lecture_time TEXT, division TEXT NOT NULL, topic TEXT NOT NULL, absent_students TEXT);`);
        console.log("--- Database tables checked/created successfully ---");
    } catch (err) {
        console.error("Error initializing database:", err);
    }
};
initializeDatabase();

const HOD_PASSWORD = "HOD@CSD2025";
const teachers = [
    { email: 'head.cs@college.edu', code: 'CSHOD2025' },
    { email: 'prof.sharma@college.edu', code: 'SHA_CS101' },
    { email: 'prof.patel@college.edu', code: 'PAT_CS202' },
];

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Endpoints
app.post('/api/hod-login', (req, res) => { /* ... */ });
app.post('/api/teacher-login', (req, res) => { /* ... */ });

app.post('/api/submit-attendance', async (req, res) => {
    const { date, lectureName, teacherName, division, topic, absentRollNos, lectureType, lectureTime } = req.body;
    try {
        const absent_students_text = absentRollNos.length > 0 ? absentRollNos.join(', ') : 'None';
        await pool.query(`INSERT INTO Submissions (date, teacher_name, lecture_name, lecture_type, lecture_time, division, topic, absent_students) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [date, teacherName, lectureName, lectureType, lectureTime, division, topic, absent_students_text]);
        if (absentRollNos && absentRollNos.length > 0) {
            const fineAmount = 100;
            for (const rollNo of absentRollNos) {
                await pool.query(`INSERT INTO Fines (student_roll_no, student_division, date, amount, lecture_name, topic) VALUES ($1, $2, $3, $4, $5, $6)`, [rollNo, division, date, fineAmount, lectureName, topic]);
            }
        }
        res.json({ success: true, message: 'Attendance recorded successfully.' });
    } catch (err) {
        console.error("Error submitting attendance:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

app.get('/api/students/:division', async (req, res) => {
    const { division } = req.params;
    try {
        const studentsResult = await pool.query(`SELECT roll_no, name FROM Students WHERE division = $1 ORDER BY roll_no`, [division]);
        const finesResult = await pool.query(`SELECT student_roll_no, date, amount FROM Fines WHERE student_division = $1`, [division]);
        res.json({ students: studentsResult.rows, fines: finesResult.rows });
    } catch (err) {
        console.error("Error fetching student data:", err);
        res.status(500).json({ error: "Server error." });
    }
});

app.get('/api/all-submissions', async (req, res) => { /* ... */ });
app.get('/api/export-csv', async (req, res) => { /* ... */ });

app.listen(PORT, () => {
    console.log(`--- ✅ SERVER IS LIVE and listening on port ${PORT} ---`);
});