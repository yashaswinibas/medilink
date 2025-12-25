// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display user name
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
    }
    
    // Load dashboard data
    loadUpcomingAppointments();
    loadHealthSummary();
    
    // Setup AI chat preview
    setupAIChatPreview();
});

function loadUpcomingAppointments() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    fetch(`http://localhost:5000/api/appointments?user_id=${currentUser.id}`)
        .then(response => response.json())
        .then(appointments => {
            const upcomingAppointments = appointments
                .filter(apt => new Date(apt.date) >= new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 3);

            const appointmentsContainer = document.getElementById('upcomingAppointments');
            
            if (upcomingAppointments.length === 0) {
                appointmentsContainer.innerHTML = '<p>No upcoming appointments</p>';
                return;
            }
            
            let html = '';
            upcomingAppointments.forEach(apt => {
                const date = new Date(apt.date).toLocaleDateString();
                html += `
                    <div class="appointment-item" style="border-left: 4px solid #3498db; padding-left: 10px; margin-bottom: 10px;">
                        <p><strong>Dr. ${apt.doctor_name}</strong> (${apt.specialization})</p>
                        <p>${date} at ${apt.time}</p>
                        <p style="color: #666;">${apt.reason}</p>
                    </div>
                `;
            });
            
            appointmentsContainer.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading appointments:', error);
            document.getElementById('upcomingAppointments').innerHTML = '<p>Error loading appointments</p>';
        });
}

function loadHealthSummary() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    fetch(`http://localhost:5000/api/medical-records?user_id=${currentUser.id}`)
        .then(response => response.json())
        .then(records => {
            const healthSummary = document.getElementById('healthSummary');
            
            if (records.length === 0) {
                healthSummary.innerHTML = '<p>No medical records found</p>';
                return;
            }
            
            // Get latest record
            const latestRecord = records.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            
            healthSummary.innerHTML = `
                <p><strong>Last Visit:</strong> ${new Date(latestRecord.date).toLocaleDateString()}</p>
                <p><strong>Type:</strong> ${latestRecord.record_type}</p>
                <p><strong>Doctor:</strong> ${latestRecord.doctor || 'Not specified'}</p>
            `;
        })
        .catch(error => {
            console.error('Error loading health summary:', error);
            document.getElementById('healthSummary').innerHTML = '<p>Error loading health summary</p>';
        });
}

function setupAIChatPreview() {
    const sendBtn = document.getElementById('sendMessagePreview');
    const chatInput = document.getElementById('chatInputPreview');
    const chatMessages = document.getElementById('chatMessagesPreview');

    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', function() {
            const message = chatInput.value.trim();
            if (message) {
                // Add user message
                if (chatMessages) {
                    chatMessages.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
                }
                
                // Send to AI
                fetch('http://localhost:5000/api/ai/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message })
                })
                .then(response => response.json())
                .then(data => {
                    if (chatMessages) {
                        chatMessages.innerHTML += `<p><strong>AI:</strong> ${data.response}</p>`;
                    }
                    chatInput.value = '';
                })
                .catch(error => {
                    console.error('Error:', error);
                    if (chatMessages) {
                        chatMessages.innerHTML += `<p><strong>AI:</strong> Sorry, I'm having trouble responding right now.</p>`;
                    }
                });
            }
        });

        // Allow Enter key to send message
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendBtn.click();
            }
        });
    }
}