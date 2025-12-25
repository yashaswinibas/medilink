// Period Tracker functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Check if user is female for period tracker
    if (currentUser.gender !== 'Female') {
        document.querySelector('.period-tracker-section').innerHTML = `
            <div class="container">
                <div class="not-available">
                    <h2>Period Tracker</h2>
                    <p>This feature is available for female users only.</p>
                    <a href="dashboard.html" class="btn btn-primary">Back to Dashboard</a>
                </div>
            </div>
        `;
        return;
    }

    initializeTracker();
    loadCycleData();
    setupCalendar();
    setupEventListeners();
});

let currentDate = new Date();
let cycleData = [];

function initializeTracker() {
    // Set default dates for period form
    const today = new Date();
    document.getElementById('periodStart').valueAsDate = today;
    document.getElementById('periodEnd').valueAsDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000); // +5 days
}

function loadCycleData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    fetch(`http://localhost:5000/api/period-tracker?user_id=${currentUser.id}`)
        .then(response => response.json())
        .then(data => {
            cycleData = data;
            updateTrackerDisplay();
            updateCalendar();
            displayCycleHistory();
        })
        .catch(error => {
            console.error('Error loading cycle data:', error);
            // Load from localStorage as fallback
            const localData = JSON.parse(localStorage.getItem('periodData') || '[]');
            cycleData = localData;
            updateTrackerDisplay();
            updateCalendar();
            displayCycleHistory();
        });
}

function updateTrackerDisplay() {
    const noDataElement = document.getElementById('noCycleData');
    const trackerContent = document.querySelector('.tracker-overview');
    
    if (cycleData.length === 0) {
        noDataElement.style.display = 'block';
        trackerContent.style.display = 'none';
        document.querySelector('.calendar-section').style.display = 'none';
        document.querySelector('.history-section').style.display = 'none';
        document.querySelector('.quick-actions-tracker').style.display = 'none';
        return;
    }
    
    noDataElement.style.display = 'none';
    trackerContent.style.display = 'grid';
    document.querySelector('.calendar-section').style.display = 'block';
    document.querySelector('.history-section').style.display = 'block';
    document.querySelector('.quick-actions-tracker').style.display = 'flex';
    
    calculatePredictions();
    calculateAverages();
}

function calculatePredictions() {
    if (cycleData.length < 1) return;
    
    // Sort cycles by start date (newest first)
    const sortedCycles = [...cycleData].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    const lastCycle = sortedCycles[0];
    
    // Calculate average cycle length
    const cycleLengths = [];
    for (let i = 0; i < sortedCycles.length - 1; i++) {
        const currentStart = new Date(sortedCycles[i].start_date);
        const nextStart = new Date(sortedCycles[i + 1].start_date);
        const length = Math.round((currentStart - nextStart) / (1000 * 60 * 60 * 24));
        cycleLengths.push(length);
    }
    
    const avgCycleLength = cycleLengths.length > 0 ? 
        Math.round(cycleLengths.reduce((a, b) => a + b) / cycleLengths.length) : 28;
    
    // Calculate predictions
    const lastStartDate = new Date(lastCycle.start_date);
    const nextPeriodDate = new Date(lastStartDate.getTime() + avgCycleLength * 24 * 60 * 60 * 1000);
    const ovulationDate = new Date(lastStartDate.getTime() + (avgCycleLength - 14) * 24 * 60 * 60 * 1000);
    const fertileStart = new Date(ovulationDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fertileEnd = new Date(ovulationDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    // Update display
    document.getElementById('averageCycleLength').textContent = `${avgCycleLength} days`;
    document.getElementById('nextPeriodDate').textContent = nextPeriodDate.toLocaleDateString();
    document.getElementById('ovulationDate').textContent = ovulationDate.toLocaleDateString();
    document.getElementById('fertileWindow').textContent = 
        `${fertileStart.toLocaleDateString()} - ${fertileEnd.toLocaleDateString()}`;
    
    // Calculate current cycle day
    const today = new Date();
    const daysSinceLastPeriod = Math.round((today - lastStartDate) / (1000 * 60 * 60 * 24));
    document.getElementById('currentCycleDay').textContent = daysSinceLastPeriod + 1;
}

function calculateAverages() {
    if (cycleData.length === 0) return;
    
    // Calculate average period length
    const periodLengths = cycleData.map(cycle => {
        const start = new Date(cycle.start_date);
        const end = new Date(cycle.end_date);
        return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    });
    
    const avgPeriodLength = Math.round(periodLengths.reduce((a, b) => a + b) / periodLengths.length);
    document.getElementById('averagePeriodLength').textContent = `${avgPeriodLength} days`;
}

function setupCalendar() {
    updateCalendarHeader();
    generateCalendar();
    
    // Event listeners for calendar navigation
    document.getElementById('prevMonth').addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });
}

function updateCalendarHeader() {
    const options = { year: 'numeric', month: 'long' };
    document.getElementById('currentMonth').textContent = currentDate.toLocaleDateString('en-US', options);
}

function generateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // Create calendar header (days of week)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendar.appendChild(dayHeader);
    });
    
    // Get first day of month and total days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendar.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        const currentDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        
        // Check if this day is in any period
        cycleData.forEach(cycle => {
            const startDate = new Date(cycle.start_date);
            const endDate = new Date(cycle.end_date);
            
            if (currentDateObj >= startDate && currentDateObj <= endDate) {
                dayCell.classList.add('period-day');
            }
        });
        
        // Check if today
        const today = new Date();
        if (currentDateObj.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }
        
        calendar.appendChild(dayCell);
    }
}

function updateCalendar() {
    updateCalendarHeader();
    generateCalendar();
}

function displayCycleHistory() {
    const historyContainer = document.getElementById('cycleHistory');
    
    if (cycleData.length === 0) {
        historyContainer.innerHTML = '<p>No cycle history available.</p>';
        return;
    }
    
    // Sort cycles by start date (newest first)
    const sortedCycles = [...cycleData].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    
    const historyHTML = sortedCycles.map(cycle => {
        const startDate = new Date(cycle.start_date);
        const endDate = new Date(cycle.end_date);
        const cycleLength = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        return `
            <div class="cycle-history-item">
                <div class="cycle-date">
                    <strong>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</strong>
                    <span class="cycle-length">${cycleLength} days</span>
                </div>
                <div class="cycle-symptoms">
                    ${cycle.symptoms && cycle.symptoms.length > 0 ? 
                        `Symptoms: ${cycle.symptoms.join(', ')}` : 
                        'No symptoms recorded'}
                </div>
                ${cycle.notes ? `<div class="cycle-notes">Notes: ${cycle.notes}</div>` : ''}
            </div>
        `;
    }).join('');
    
    historyContainer.innerHTML = historyHTML;
}

function setupEventListeners() {
    // Period form submission
    const periodForm = document.getElementById('periodForm');
    if (periodForm) {
        periodForm.addEventListener('submit', function(e) {
            e.preventDefault();
            savePeriodData();
        });
    }
}

function savePeriodData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const formData = new FormData(document.getElementById('periodForm'));
    
    // Get checked symptoms
    const symptoms = [];
    document.querySelectorAll('input[name="symptoms"]:checked').forEach(checkbox => {
        symptoms.push(checkbox.value);
    });
    
    const periodData = {
        user_id: currentUser.id,
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        symptoms: symptoms,
        notes: formData.get('notes')
    };
    
    // Save to backend
    fetch('http://localhost:5000/api/period-tracker', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(periodData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Period logged successfully!');
            hideLogPeriodForm();
            loadCycleData(); // Reload data
        } else {
            alert(data.error || 'Failed to log period');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Fallback to localStorage
        const localData = JSON.parse(localStorage.getItem('periodData') || '[]');
        periodData.id = Date.now();
        localData.push(periodData);
        localStorage.setItem('periodData', JSON.stringify(localData));
        
        alert('Period logged successfully! (Saved locally)');
        hideLogPeriodForm();
        loadCycleData();
    });
}

function showLogPeriodForm() {
    document.getElementById('logPeriodForm').style.display = 'block';
}

function hideLogPeriodForm() {
    document.getElementById('logPeriodForm').style.display = 'none';
    document.getElementById('periodForm').reset();
}

function showSymptomsForm() {
    alert('Symptoms logging feature coming soon!');
    // You can expand this to show a dedicated symptoms form
}

function generateReport() {
    if (cycleData.length === 0) {
        alert('No cycle data available to generate report.');
        return;
    }
    
    const reportData = {
        total_cycles: cycleData.length,
        average_cycle_length: document.getElementById('averageCycleLength').textContent,
        average_period_length: document.getElementById('averagePeriodLength').textContent,
        common_symptoms: getCommonSymptoms(),
        cycle_history: cycleData
    };
    
    // Create and download report
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `period-tracker-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Cycle report generated successfully!');
}

function getCommonSymptoms() {
    const allSymptoms = cycleData.flatMap(cycle => cycle.symptoms || []);
    const symptomCount = {};
    
    allSymptoms.forEach(symptom => {
        symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
    });
    
    return Object.entries(symptomCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([symptom, count]) => ({ symptom, count }));
}

// Make functions globally available
window.showLogPeriodForm = showLogPeriodForm;
window.hideLogPeriodForm = hideLogPeriodForm;
window.showSymptomsForm = showSymptomsForm;
window.generateReport = generateReport;