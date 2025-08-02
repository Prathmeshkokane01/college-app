// public/script.js (Definitive Final Version)

const API_URL = '';

// This function needs to be global for the onclick attribute to find it.
async function fetchStudentData(division) {
    const reportContainer = document.getElementById('student-report');
    reportContainer.innerHTML = `<p>Loading data for Division ${division}...</p>`;
    try {
        const response = await fetch(`${API_URL}/api/students/${division}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const dates = [];
        for (let i = 0; i < 7; i++) { const date = new Date(); date.setDate(date.getDate() + i); dates.push(date); }
        const finesByStudentAndDate = {};
        data.fines.forEach(fine => { if (!finesByStudentAndDate[fine.student_roll_no]) finesByStudentAndDate[fine.student_roll_no] = {}; finesByStudentAndDate[fine.student_roll_no][fine.date] = fine.amount; });
        let tableHTML = `<h2>Fine Report - Division ${division}</h2><table><thead><tr><th>Roll No</th><th>Name</th>`;
        dates.forEach(dateObj => { const day = String(dateObj.getDate()).padStart(2, '0'); const month = String(dateObj.getMonth() + 1).padStart(2, '0'); const year = dateObj.getFullYear(); tableHTML += `<th>${day}-${month}-${year}</th>`; });
        tableHTML += `<th>Total Fine</th></tr></thead><tbody>`;
        data.students.forEach(student => {
            let totalFine = 0;
            tableHTML += `<tr><td>${student.roll_no}</td><td>${student.name}</td>`;
            dates.forEach(dateObj => {
                const year = dateObj.getFullYear(); const month = String(dateObj.getMonth() + 1).padStart(2, '0'); const day = String(dateObj.getDate()).padStart(2, '0'); const dateKey = `${year}-${month}-${day}`;
                const fineAmount = finesByStudentAndDate[student.roll_no]?.[dateKey];
                if (fineAmount) { tableHTML += `<td class="fine">₹${fineAmount}</td>`; totalFine += fineAmount; } else { tableHTML += `<td>-</td>`; }
            });
            tableHTML += `<td><strong>₹${totalFine.toFixed(2)}</strong></td></tr>`;
        });
        tableHTML += `</tbody></table>`;
        reportContainer.innerHTML = tableHTML;
    } catch (error) {
        console.error('Failed to fetch student data:', error);
        reportContainer.innerHTML = `<p class="message error">Error loading data. Please check the console or restart the server.</p>`;
    }
}

// ** THE FIX IS WRAPPING THE CODE IN THIS LISTENER **
document.addEventListener('DOMContentLoaded', () => {

    function getDisplayDate() {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function getDatabaseDate() {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }

    // --- Teacher Page Logic ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageEl = document.getElementById('login-message');
            try {
                const email = document.getElementById('email').value;
                const code = document.getElementById('code').value;
                const response = await fetch(`${API_URL}/api/teacher-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }), });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('attendance-section').style.display = 'block';
                document.getElementById('date').value = getDisplayDate();
            } catch (error) {
                messageEl.textContent = 'Error: ' + error.message;
                messageEl.className = 'message error';
            }
        });
    }

    const attendanceForm = document.getElementById('attendance-form');
    if (attendanceForm) {
        document.getElementById('lectureTime').addEventListener('change', (e) => {
            const lectureTypeEl = document.getElementById('lectureType');
            if (e.target.value === '11:30 AM - 1:20 PM') { lectureTypeEl.value = 'Practical'; } else { lectureTypeEl.value = 'Theory'; }
        });
        attendanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageEl = document.getElementById('form-message');
            try {
                const absentRollNos = document.getElementById('absentRollNos').value.split(',').map(s => s.trim()).filter(s => s !== '').map(n => parseInt(n));
                const formData = {
                    date: getDatabaseDate(),
                    lectureName: document.getElementById('lectureName').value,
                    teacherName: document.getElementById('teacherName').value,
                    division: document.getElementById('division').value,
                    lectureTime: document.getElementById('lectureTime').value,
                    lectureType: document.getElementById('lectureType').value,
                    topic: document.getElementById('topic').value,
                    absentRollNos: absentRollNos
                };
                if (!formData.lectureTime) throw new Error('Please select a lecture time.');
                const response = await fetch(`${API_URL}/api/submit-attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData), });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                messageEl.textContent = result.message;
                messageEl.className = 'message success';
                attendanceForm.reset();
                document.getElementById('date').value = getDisplayDate();
            } catch (error) {
                messageEl.textContent = 'Error: ' + error.message;
                messageEl.className = 'message error';
            }
        });
    }

    // --- HOD Page Logic ---
    let allSubmissions = [];
    const hodLoginForm = document.getElementById('hod-login-form');
    if (hodLoginForm) {
        hodLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageEl = document.getElementById('hod-login-message');
            try {
                const password = document.getElementById('hod-password').value;
                const response = await fetch(`${API_URL}/api/hod-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }), });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                document.getElementById('hod-login-section').style.display = 'none';
                document.getElementById('hod-dashboard-section').style.display = 'block';
                loadMasterReport();
            } catch (error) {
                messageEl.textContent = 'Error: ' + error.message;
                messageEl.className = 'message error';
            }
        });
        document.getElementById('applyFilterBtn')?.addEventListener('click', applyFilters);
        document.getElementById('clearFilterBtn')?.addEventListener('click', clearFilters);
        document.getElementById('downloadPdfBtn')?.addEventListener('click', downloadAsPDF);
    }
    
    async function loadMasterReport() {
        const reportContainer = document.getElementById('master-report');
        reportContainer.innerHTML = `<p>Loading report...</p>`;
        try {
            const response = await fetch(`${API_URL}/api/all-submissions`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allSubmissions = await response.json();
            renderMasterReport(allSubmissions);
        } catch (error) {
            console.error('Failed to load master report:', error);
            reportContainer.innerHTML = `<p class="message error">Error loading report. Please try again later.</p>`;
        }
    }
    
    function renderMasterReport(submissions) {
        const reportContainer = document.getElementById('master-report');
        if (!submissions || submissions.length === 0) { reportContainer.innerHTML = `<p>No records match the current filter.</p>`; return; }
        let tableHTML = `<table><thead><tr><th>Date</th><th>Teacher</th><th>Lecture</th><th>Type</th><th>Time</th><th>Div</th><th>Topic</th><th>Absent Students</th></tr></thead><tbody>`;
        submissions.forEach(record => { tableHTML += `<tr><td>${record.date}</td><td>${record.teacher_name}</td><td>${record.lecture_name}</td><td>${record.lecture_type}</td><td>${record.lecture_time}</td><td>${record.division}</td><td>${record.topic}</td><td>${record.absent_students || 'None'}</td></tr>`; });
        tableHTML += `</tbody></table>`;
        reportContainer.innerHTML = tableHTML;
    }
    
    function applyFilters() {
        const division = document.getElementById('filterDivision').value;
        const teacher = document.getElementById('filterTeacher').value.toLowerCase();
        const date = document.getElementById('filterDate').value;
        let filteredSubmissions = allSubmissions;
        if (division) filteredSubmissions = filteredSubmissions.filter(s => s.division === division);
        if (teacher) filteredSubmissions = filteredSubmissions.filter(s => s.teacher_name.toLowerCase().includes(teacher));
        if (date) filteredSubmissions = filteredSubmissions.filter(s => s.date === date);
        renderMasterReport(filteredSubmissions);
    }
    
    function clearFilters() {
        document.getElementById('filterDivision').value = '';
        document.getElementById('filterTeacher').value = '';
        document.getElementById('filterDate').value = '';
        renderMasterReport(allSubmissions);
    }
    
    function downloadAsPDF() {
        // ... (PDF logic is unchanged)
    }

    // --- Animation Logic ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            preloader.style.opacity = '0';
            setTimeout(() => { preloader.style.display = 'none'; }, 500);
        });
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) { entry.target.classList.add('visible'); }
        });
    }, { threshold: 0.1 });
    const hiddenElements = document.querySelectorAll('.container');
    hiddenElements.forEach((el) => observer.observe(el));
});