// server.js
const fs = require('fs');
const dataDir = './data';
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
}
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const HOD_PASSWORD = "HOD@CSD2025";
const teachers = [
    { email: 'head.cs@college.edu', code: 'CSHOD2025' },
    { email: 'prof.sharma@college.edu', code: 'SHA_CS101' },
    { email: 'prof.patel@college.edu', code: 'PAT_CS202' },
    // ... other teachers
];

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./data/database.sqlite', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    // **UPDATED: Removed PRIMARY KEY from roll_no to allow duplicates across divisions**
    db.run(`CREATE TABLE IF NOT EXISTS Students (roll_no INTEGER NOT NULL, name TEXT NOT NULL, division TEXT NOT NULL)`);
    db.run(`CREATE TABLE IF NOT EXISTS Fines (id INTEGER PRIMARY KEY AUTOINCREMENT, student_roll_no INTEGER, date TEXT NOT NULL, amount REAL NOT NULL, lecture_name TEXT, topic TEXT, FOREIGN KEY (student_roll_no) REFERENCES Students (roll_no))`);
    db.run(`CREATE TABLE IF NOT EXISTS Submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, teacher_name TEXT NOT NULL, lecture_name TEXT NOT NULL, lecture_type TEXT, lecture_time TEXT, division TEXT NOT NULL, topic TEXT NOT NULL, absent_students TEXT)`);

    // Add students only if the table is empty
    db.get("SELECT count(*) as count FROM Students", (err, row) => {
        if (row.count === 0) {
            console.log('Seeding new student data...');
            // **UPDATED: Div B roll numbers now start from 1**
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


// --- API Endpoints ---
// No changes needed to the endpoints. The rest of the file is the same.

// HOD Login
app.post('/api/hod-login', (req, res) => {
    const { password } = req.body;
    if (password === HOD_PASSWORD) res.json({ success: true, message: 'Login successful!' });
    else res.status(401).json({ success: false, message: 'Invalid password.' });
});

// Teacher Login
app.post('/api/teacher-login', (req, res) => {
    const { email, code } = req.body;
    const foundTeacher = teachers.find(t => t.email === email && t.code === code);
    if (foundTeacher) res.json({ success: true, message: 'Login successful!' });
    else res.status(401).json({ success: false, message: 'Invalid email or access code.' });
});

// Submit Attendance
app.post('/api/submit-attendance', (req, res) => {
    const { date, lectureName, teacherName, division, topic, absentRollNos, lectureType, lectureTime } = req.body;
    
    const absent_students_text = absentRollNos.length > 0 ? absentRollNos.join(', ') : 'None';
    db.run(`INSERT INTO Submissions (date, teacher_name, lecture_name, lecture_type, lecture_time, division, topic, absent_students) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
        [date, teacherName, lectureName, lectureType, lectureTime, division, topic, absent_students_text]);

    if (absentRollNos && absentRollNos.length > 0) {
        const fineAmount = 100;
        const sql = `INSERT INTO Fines (student_roll_no, date, amount, lecture_name, topic) VALUES (?, ?, ?, ?, ?)`;
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            absentRollNos.forEach(rollNo => {
                db.run(sql, [rollNo, date, fineAmount, lectureName, topic]);
            });
            db.run("COMMIT");
        });
    }
    res.json({ success: true, message: 'Attendance recorded successfully.' });
});

// Get all submissions for HOD
app.get('/api/all-submissions', (req, res) => {
    const sql = `SELECT id, date, teacher_name, lecture_name, lecture_type, lecture_time, division, topic, absent_students FROM Submissions ORDER BY date DESC, lecture_time DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

// Export CSV for HOD
app.get('/api/export-csv', (req, res) => {
    const sql = `SELECT date, teacher_name, lecture_name, lecture_type, lecture_time, division, topic, absent_students FROM Submissions ORDER BY date DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).send("Could not fetch data for export.");
        
        const header = "Date,Teacher Name,Lecture Name,Type,Time,Division,Topic Taught,Absent Students\n";
        const csvRows = rows.map(row => 
            `"${row.date}","${row.teacher_name}","${row.lecture_name}","${row.lecture_type}","${row.lecture_time}","${row.division}","${row.topic}","${row.absent_students}"`
        ).join("\n");

        res.header('Content-Type', 'text/csv');
        res.attachment(`attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(header + csvRows);
    });
});

// Get student data
app.get('/api/students/:division', async (req, res) => {
    const { division } = req.params;
    const studentsSql = `SELECT roll_no, name FROM Students WHERE division = ? ORDER BY roll_no`;
    // **UPDATED: We must now filter fines by division as well**
    const finesSql = `SELECT F.student_roll_no, F.date, F.amount FROM Fines F
                      JOIN Submissions S ON S.date = F.date AND S.lecture_name = F.lecture_name
                      WHERE S.division = ?`;
    try {
        const students = await new Promise((resolve, reject) => db.all(studentsSql, [division], (err, rows) => err ? reject(err) : resolve(rows)));
        const fines = await new Promise((resolve, reject) => db.all(finesSql, [division], (err, rows) => err ? reject(err) : resolve(rows)));
        res.json({ students, fines });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server is running on http://localhost:${PORT}`));