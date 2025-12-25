// Appointments functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    loadAppointments();
    loadDoctors();
    setupAppointmentForm();

    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-tab');
            switchTab(target);
        });
    });
});

function loadAppointments() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    fetch(`http://localhost:5000/api/appointments?user_id=${currentUser.id}`)
        .then(response => response.json())
        .then(appointments => {
            displayAppointments(appointments);
        })
        .catch(error => {
            console.error('Error loading appointments:', error);
            document.getElementById('appointmentsList').innerHTML = '<p>Error loading appointments</p>';
        });
}

function displayAppointments(appointments) {
    const upcomingContainer = document.getElementById('upcomingAppointmentsList');
    const pastContainer = document.getElementById('pastAppointmentsList');
    
    const now = new Date();
    const upcoming = appointments.filter(apt => new Date(apt.date) >= now);
    const past = appointments.filter(apt => new Date(apt.date) < now);
    
    // Display upcoming appointments
    if (upcoming.length === 0) {
        upcomingContainer.innerHTML = '<p>No upcoming appointments</p>';
    } else {
        upcomingContainer.innerHTML = upcoming.map(apt => `
            <div class="appointment-card">
                <h4>Dr. ${apt.doctor_name}</h4>
                <p><strong>Specialization:</strong> ${apt.specialization}</p>
                <p><strong>Date:</strong> ${new Date(apt.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${apt.time}</p>
                <p><strong>Reason:</strong> ${apt.reason}</p>
                <p><strong>Status:</strong> ${apt.status}</p>
                <button onclick="cancelAppointment(${apt.id})" class="btn btn-secondary">Cancel</button>
            </div>
        `).join('');
    }
    
    // Display past appointments
    if (past.length === 0) {
        pastContainer.innerHTML = '<p>No past appointments</p>';
    } else {
        pastContainer.innerHTML = past.map(apt => `
            <div class="appointment-card">
                <h4>Dr. ${apt.doctor_name}</h4>
                <p><strong>Specialization:</strong> ${apt.specialization}</p>
                <p><strong>Date:</strong> ${new Date(apt.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${apt.time}</p>
                <p><strong>Reason:</strong> ${apt.reason}</p>
                <p><strong>Status:</strong> ${apt.status}</p>
            </div>
        `).join('');
    }
}

function loadDoctors() {
    fetch('http://localhost:5000/api/doctors')
        .then(response => response.json())
        .then(doctors => {
            const doctorSelect = document.getElementById('doctor');
            doctorSelect.innerHTML = '<option value="">Select a doctor</option>' +
                doctors.map(doctor => 
                    `<option value="${doctor.id}">Dr. ${doctor.name} - ${doctor.specialization}</option>`
                ).join('');
        })
        .catch(error => {
            console.error('Error loading doctors:', error);
        });
}

function setupAppointmentForm() {
    const form = document.getElementById('appointmentForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const formData = new FormData(form);
            
            const appointmentData = {
                patient_id: currentUser.id,
                doctor_id: parseInt(formData.get('doctor')),
                date: formData.get('date'),
                time: formData.get('time'),
                reason: formData.get('reason')
            };
            
            fetch('http://localhost:5000/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointmentData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert('Appointment scheduled successfully!');
                    form.reset();
                    loadAppointments();
                    switchTab('upcoming');
                } else {
                    alert(data.error || 'Failed to schedule appointment');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to schedule appointment. Please try again.');
            });
        });
    }
}

function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Appointment cancelled successfully!');
                loadAppointments();
            } else {
                alert(data.error || 'Failed to cancel appointment');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to cancel appointment. Please try again.');
        });
    }
}

function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Show selected tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function getAIRecommendations() {
    const symptoms = document.getElementById('symptoms').value.split(',').map(s => s.trim()).filter(s => s);
    
    if (symptoms.length === 0) {
        alert('Please enter some symptoms');
        return;
    }
    
    fetch('http://localhost:5000/api/ai/recommend-doctors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms })
    })
    .then(response => response.json())
    .then(doctors => {
        const recommendationsContainer = document.getElementById('aiRecommendations');
        recommendationsContainer.innerHTML = '<h4>Recommended Doctors:</h4>' +
            doctors.map(doctor => `
                <div class="doctor-card">
                    <h5>Dr. ${doctor.name}</h5>
                    <p><strong>Specialization:</strong> ${doctor.specialization}</p>
                    <p><strong>Experience:</strong> ${doctor.experience}</p>
                    <p><strong>Rating:</strong> ${doctor.rating}/5</p>
                    <button onclick="selectDoctor(${doctor.id})" class="btn btn-primary">Select</button>
                </div>
            `).join('');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to get recommendations');
    });
}

function selectDoctor(doctorId) {
    document.getElementById('doctor').value = doctorId;
    document.getElementById('aiRecommendations').innerHTML = '';
}