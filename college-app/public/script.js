const API_URL = '';

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
    if (loginForm) { /* ... login logic ... */ }

    const attendanceForm = document.getElementById('attendance-form');
    if (attendanceForm) { /* ... attendance form logic ... */ }

    // --- HOD Page Logic ---
    let allSubmissions = [];
    const hodLoginForm = document.getElementById('hod-login-form');
    if (hodLoginForm) { /* ... HOD login logic ... */ }
    
    // --- HOD & Teacher Remove Fine Logic ---
    const removeFineForm = document.getElementById('remove-fine-form');
    if (removeFineForm) {
        removeFineForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageEl = document.getElementById('remove-fine-message');
            const fineDetails = {
                rollNo: document.getElementById('removeRollNo').value,
                division: document.getElementById('removeDivision').value,
                date: document.getElementById('removeDate').value,
                lectureTime: document.getElementById('removeLectureTime').value,
            };
            if (!fineDetails.lectureTime) { messageEl.textContent = 'Error: Please select the lecture time.'; messageEl.className = 'message error'; return; }
            if (!confirm(`Are you sure you want to remove this fine?`)) { return; }
            try {
                const response = await fetch(`${API_URL}/api/remove-fine`, {
                    method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fineDetails),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                messageEl.textContent = result.message;
                messageEl.className = 'message success';
                removeFineForm.reset();
                if (typeof loadMasterReport === 'function') { loadMasterReport(); }
            } catch (error) {
                messageEl.textContent = 'Error: ' + error.message;
                messageEl.className = 'message error';
            }
        });
    }

    // --- Animation Logic ---
    /* ... preloader and animation logic ... */
});

// All the collapsed /* ... */ code is exactly the same as the last version.
// The code above is the final, complete structure.