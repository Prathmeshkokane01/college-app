require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const initializeDatabase = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS "Students" (id SERIAL PRIMARY KEY, roll_no INTEGER NOT NULL, name TEXT NOT NULL, division TEXT NOT NULL, UNIQUE(roll_no, division));`);
        await pool.query(`CREATE TABLE IF NOT EXISTS "Fines" (id SERIAL PRIMARY KEY, student_roll_no INTEGER NOT NULL, student_division TEXT NOT NULL, date TEXT NOT NULL, lecture_time TEXT, amount REAL NOT NULL, lecture_name TEXT, topic TEXT);`);
        await pool.query(`CREATE TABLE IF NOT EXISTS "Submissions" (id SERIAL PRIMARY KEY, date TEXT NOT NULL, teacher_name TEXT NOT NULL, lecture_name TEXT NOT NULL, lecture_type TEXT, lecture_time TEXT, division TEXT NOT NULL, topic TEXT NOT NULL, absent_students TEXT);`);
        
        const studentCount = await pool.query(`SELECT COUNT(*) FROM "Students"`);
        if (studentCount.rows[0].count === '0') {
            console.log('--- Students table is empty. Seeding initial data... ---');
            const students = [
                { roll: 1, name: 'Aarav Gupta', div: 'A' }, { roll: 2, name: 'Vivaan Singh', div: 'A' }, { roll: 3, name: 'Aditya Sharma', div: 'A' }, { roll: 4, name: 'Vihaan Kumar', div: 'A' }, { roll: 5, name: 'Arjun Patel', div: 'A' }, { roll: 6, name: 'Sai Reddy', div: 'A' }, { roll: 7, name: 'Reyansh Joshi', div: 'A' }, { roll: 8, name: 'Krishna Mehta', div: 'A' }, { roll: 9, name: 'Ishaan Verma', div: 'A' }, { roll: 10, name: 'Advik Shah', div: 'A' },
                { roll: 1, name: 'Ananya Roy', div: 'B' }, { roll: 2, name: 'Diya Das', div: 'B' }, { roll: 3, name: 'Pari Ghosh', div: 'B' }, { roll: 4, name: 'Myra Bose', div: 'B' }, { roll: 5, name: 'Aadhya Sen', div: 'B' }, { roll: 6, name: 'Kiara Dutta', div: 'B' }, { roll: 7, name: 'Saanvi Iyer', div: 'B' }, { roll: 8, name: 'Amaira Nair', div: 'B' }, { roll: 9, name: 'Anika Pillai', div: 'B' }, { roll: 10, name: 'Navya Menon', div: 'B' }
            ];
            for (const s of students) { await pool.query(`INSERT INTO "Students" (roll_no, name, division) VALUES ($1, $2, $3)`, [s.roll, s.name, s.div]); }
        }
    } catch (err) { console.error("Error initializing database:", err); }
};
initializeDatabase();

const HOD_PASSWORD = "HOD@CSD2025";
const teachers = [ { email: 'head.cs@college.edu', code: 'CSHOD2025' }, { email: 'prof.sharma@college.edu', code: 'SHA_CS101' }, { email: 'prof.patel@college.edu', code: 'PAT_CS202' }, ];

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/hod-login', (req, res) => { const { password } = req.body; if (password === HOD_PASSWORD) { res.json({ success: true, message: 'Login successful!' }); } else { res.status(401).json({ success: false, message: 'Invalid password.' }); } });
app.post('/api/teacher-login', (req, res) => { const { email, code } = req.body; const foundTeacher = teachers.find(t => t.email === email && t.code === code); if (foundTeacher) { res.json({ success: true, message: 'Login successful!' }); } else { res.status(401).json({ success: false, message: 'Invalid email or access code.' }); } });

app.post('/api/submit-attendance', async (req, res) => {
    const { date, lectureName, teacherName, division, topic, absentRollNos, lectureType, lectureTime } = req.body;
    try {
        await pool.query(`INSERT INTO "Submissions" (date, teacher_name, lecture_name, lecture_type, lecture_time, division, topic, absent_students) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [date, teacherName, lectureName, lectureType, lectureTime, division, topic, absentRollNos.join(', ') || 'None']);
        if (absentRollNos && absentRollNos.length > 0) {
            const fineAmount = 100;
            const sql = `INSERT INTO "Fines" (student_roll_no, student_division, date, lecture_time, amount, lecture_name, topic) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
            for (const rollNo of absentRollNos) { await pool.query(sql, [rollNo, division, date, lectureTime, fineAmount, lectureName, topic]); }
        }
        res.json({ success: true, message: 'Attendance recorded successfully.' });
    } catch (err) { res.status(500).json({ success: false, message: "Server error." }); }
});

app.get('/api/students/:division', async (req, res) => {
    const { division } = req.params;
    try {
        const studentsResult = await pool.query(`SELECT roll_no, name FROM "Students" WHERE division = $1 ORDER BY roll_no`, [division]);
        const finesResult = await pool.query(`SELECT student_roll_no, date, amount FROM "Fines" WHERE student_division = $1`, [division]);
        res.json({ students: studentsResult.rows, fines: finesResult.rows });
    } catch (err) { res.status(500).json({ error: "Server error." }); }
});

app.get('/api/all-submissions', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM "Submissions" ORDER BY date DESC, lecture_time DESC`);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Server error." }); }
});

app.listen(PORT, () => {
    console.log(`--- ✅ SERVER IS LIVE and listening on port ${PORT} ---`);
});