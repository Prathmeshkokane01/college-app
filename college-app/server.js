// server.js (Definitive Final Version)

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser'); // IMPORT THE NEW PACKAGE

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const initializeDatabase = async () => { /* ... This function is unchanged ... */ };
initializeDatabase();

const HOD_PASSWORD = "HOD1234";
const teachers = [ { email: 'prathmeshkokane0@gmail.com', code: '1230' }, { email: 'prof.sharma@college.edu', code: 'SHA_CS101' }, { email: 'prof.patel@college.edu', code: 'PAT_CS202' }, ];

app.use(cors());
// USE THE NEW BODY-PARSER INSTEAD OF express.json()
app.use(bodyParser.json());
app.use(express.static('public'));

// --- API Endpoints ---
app.post('/api/hod-login', (req, res) => {
    const { password } = req.body;
    if (password === HOD_PASSWORD) {
        res.json({ success: true, message: 'Login successful!' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password.' });
    }
});
app.post('/api/teacher-login', (req, res) => {
    const { email, code } = req.body;
    const foundTeacher = teachers.find(t => t.email === email && t.code === code);
    if (foundTeacher) {
        res.json({ success: true, message: 'Login successful!' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid email or access code.' });
    }
});

app.post('/api/submit-attendance', async (req, res) => {
    const { date, lectureName, teacherName, division, topic, absentRollNos, lectureType, lectureTime } = req.body;
    try {
        const absent_students_text = absentRollNos.length > 0 ? absentRollNos.join(', ') : 'None';
        await pool.query(`INSERT INTO "Submissions" (date, teacher_name, lecture_name, lecture_type, lecture_time, division, topic, absent_students) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [date, teacherName, lectureName, lectureType, lectureTime, division, topic, absent_students_text]);
        if (absentRollNos && absentRollNos.length > 0) {
            const fineAmount = 100;
            for (const rollNo of absentRollNos) {
                await pool.query(`INSERT INTO "Fines" (student_roll_no, student_division, date, amount, lecture_name, topic) VALUES ($1, $2, $3, $4, $5, $6)`, [rollNo, division, date, fineAmount, lectureName, topic]);
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
        const studentsResult = await pool.query(`SELECT roll_no, name FROM "Students" WHERE division = $1 ORDER BY roll_no`, [division]);
        const finesResult = await pool.query(`SELECT student_roll_no, date, amount FROM "Fines" WHERE student_division = $1`, [division]);
        res.json({ students: studentsResult.rows, fines: finesResult.rows });
    } catch (err) {
        console.error("Error fetching student data:", err);
        res.status(500).json({ error: "Server error." });
    }
});
    
app.get('/api/all-submissions', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM "Submissions" ORDER BY date DESC, lecture_time DESC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server error." });
    }
});

app.get('/api/export-csv', async (req, res) => {
    try {
        const result = await pool.query(`SELECT date, teacher_name, lecture_name, lecture_type, lecture_time, division, topic, absent_students FROM "Submissions" ORDER BY date DESC`);
        const rows = result.rows;
        const header = "Date,Teacher Name,Lecture Name,Type,Time,Division,Topic Taught,Absent Students\n";
        const csvRows = rows.map(row => `"${row.date}","${row.teacher_name}","${row.lecture_name}","${row.lecture_type}","${row.lecture_time}","${row.division}","${row.topic}","${row.absent_students}"`).join("\n");
        res.header('Content-Type', 'text/csv');
        res.attachment(`attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(header + csvRows);
    } catch (err) {
        res.status(500).send("Could not fetch data for export.");
    }
});

app.listen(PORT, () => {
    console.log(`--- ✅ SERVER IS LIVE and listening on port ${PORT} ---`);
});