// main.js - MedilinkPro/PASHENT Main JavaScript File

// Global variables
let currentUser = null;
let doctors = [];

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    checkLoginStatus();
});

// Initialize application
function initializeApp() {
    console.log('MedilinkPro App Initialized');
    
    // Load doctors data
    loadDoctors();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if user is logged in
    checkAuthentication();
}

// Setup global event listeners
function setupEventListeners() {
    // Navigation logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Mobile menu toggle (if needed)
    setupMobileMenu();
    
    // Global search functionality
    setupGlobalSearch();
}

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const patientId = sessionStorage.getItem('patient_id');
    
    if (token || patientId) {
        currentUser = {
            id: patientId,
            token: token
        };
        updateUIForLoggedInUser();
    } else {
        updateUIForLoggedOutUser();
    }
}

// Check login status and redirect if needed
function checkLoginStatus() {
    const protectedPages = ['dashboard', 'appointments', 'medical-records', 'profile'];
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    if (protectedPages.includes(currentPage) && !currentUser) {
        window.location.href = 'login.html';
    }
}

// Handle user logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all storage
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        
        // Call logout API
        fetch('/logout', {
            method: 'GET',
            credentials: 'same-origin'
        })
        .then(() => {
            currentUser = null;
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Logout error:', error);
            window.location.href = 'index.html';
        });
    }
}

// Load doctors data
function loadDoctors() {
    fetch('/api/doctors')
        .then(response => response.json())
        .then(data => {
            doctors = data;
            console.log('Doctors loaded:', doctors.length);
        })
        .catch(error => {
            console.error('Error loading doctors:', error);
        });
}

// Setup mobile menu functionality
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }
}

// Setup global search functionality
function setupGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm.length > 2) {
                performGlobalSearch(searchTerm);
            }
        });
    }
}

// Perform global search
function performGlobalSearch(searchTerm) {
    const results = {
        doctors: doctors.filter(doctor => 
            doctor.name.toLowerCase().includes(searchTerm) ||
            doctor.specialty.toLowerCase().includes(searchTerm)
        ),
        // Add search for other entities as needed
    };
    
    displaySearchResults(results);
}

// Display search results
function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;
    
    if (results.doctors.length > 0) {
        searchResults.innerHTML = `
            <div class="search-section">
                <h4>Doctors</h4>
                ${results.doctors.map(doctor => `
                    <div class="search-result-item" onclick="redirectToDoctor(${doctor.id})">
                        <strong>Dr. ${doctor.name}</strong> - ${doctor.specialty}
                    </div>
                `).join('')}
            </div>
        `;
        searchResults.style.display = 'block';
    } else {
        searchResults.innerHTML = '<p>No results found</p>';
        searchResults.style.display = 'block';
    }
}

// Redirect to doctor page
function redirectToDoctor(doctorId) {
    window.location.href = `appointments.html?doctor=${doctorId}`;
}

// Update UI for logged-in user
function updateUIForLoggedInUser() {
    // Update navigation
    const authLinks = document.querySelectorAll('.auth-links');
    authLinks.forEach(link => {
        link.style.display = 'none';
    });
    
    const userLinks = document.querySelectorAll('.user-links');
    userLinks.forEach(link => {
        link.style.display = 'block';
    });
    
    // Load user data if on dashboard
    if (window.location.pathname.includes('dashboard')) {
        loadUserData();
    }
}

// Update UI for logged-out user
function updateUIForLoggedOutUser() {
    const authLinks = document.querySelectorAll('.auth-links');
    authLinks.forEach(link => {
        link.style.display = 'block';
    });
    
    const userLinks = document.querySelectorAll('.user-links');
    userLinks.forEach(link => {
        link.style.display = 'none';
    });
}

// Load user data for dashboard
function loadUserData() {
    fetch('/api/patient-data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Not authenticated');
            }
            return response.json();
        })
        .then(data => {
            updateDashboard(data);
        })
        .catch(error => {
            console.error('Error loading user data:', error);
            window.location.href = 'login.html';
        });
}

// Update dashboard with user data
function updateDashboard(data) {
    // Update welcome message
    const welcomeElement = document.getElementById('patient-name');
    if (welcomeElement && data.patient) {
        welcomeElement.textContent = data.patient.fullname;
    }
    
    // Update appointments
    updateAppointmentsList(data.appointments);
    
    // Update medical records
    updateMedicalRecords(data.records);
    
    // Update AI recommendations
    updateAIRecommendations(data.recommendations);
}

// Update appointments list
function updateAppointmentsList(appointments) {
    const container = document.getElementById('appointmentsList');
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = '<p>No upcoming appointments</p>';
        return;
    }
    
    container.innerHTML = appointments.slice(0, 3).map(appt => `
        <div class="appointment-item">
            <strong>${appt.doctor}</strong><br>
            ${appt.date} at ${appt.time}<br>
            <small>${appt.reason || 'No reason provided'}</small>
        </div>
    `).join('');
}

// Update medical records
function updateMedicalRecords(records) {
    const container = document.getElementById('recordsSummary');
    if (!container) return;
    
    if (records.length === 0) {
        container.innerHTML = '<p>No medical records</p>';
        return;
    }
    
    container.innerHTML = records.slice(0, 3).map(record => `
        <div class="record-item">
            <strong>${record.type}</strong><br>
            ${record.date} - ${record.doctor}<br>
            <small>${record.description}</small>
        </div>
    `).join('');
}

// Update AI recommendations
function updateAIRecommendations(recommendations) {
    const container = document.getElementById('doctorRecommendations');
    if (!container) return;
    
    if (recommendations.length === 0) {
        container.innerHTML = '<p>No recommendations available</p>';
        return;
    }
    
    container.innerHTML = recommendations.map(doc => `
        <div class="doctor-card">
            <strong>${doc.name}</strong><br>
            ${doc.specialty}<br>
            <small>⭐ ${doc.rating} | ${doc.experience} years experience</small>
        </div>
    `).join('');
}

// Utility function: Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Utility function: Format time
function formatTime(timeString) {
    return timeString; // Add time formatting logic if needed
}

// Utility function: Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        background: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460'};
        border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#bee5eb'};
        border-radius: 5px;
        z-index: 1000;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Utility function: Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Utility function: Validate phone number
function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// AI Doctor Recommendation Function (from previous)
function getAIRecommendations() {
    const symptoms = document.getElementById('symptoms').value.split(',').map(s => s.trim()).filter(s => s);
    
    if (symptoms.length === 0) {
        alert('Please enter some symptoms (e.g., chest pain, fever, skin rash)');
        return;
    }
    
    const recommendationsContainer = document.getElementById('aiRecommendations');
    recommendationsContainer.innerHTML = '<p>🔍 Analyzing symptoms and finding best doctors...</p>';
    
    fetch('/api/ai/recommend-doctors', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms: symptoms })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(doctors => {
        if (doctors.error) {
            recommendationsContainer.innerHTML = `<p style="color: red;">Error: ${doctors.error}</p>`;
            return;
        }
        
        if (doctors.length === 0) {
            recommendationsContainer.innerHTML = '<p>No specific doctors found for your symptoms.</p>';
            return;
        }
        
        recommendationsContainer.innerHTML = `
            <h4>🏥 Recommended Doctors for: "${symptoms.join(', ')}"</h4>
            <div class="recommendations-list">
                ${doctors.map(doctor => `
                    <div class="doctor-card" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background: white;">
                        <h5>Dr. ${doctor.name}</h5>
                        <p><strong>Specialization:</strong> ${doctor.specialization}</p>
                        <p><strong>Experience:</strong> ${doctor.experience} years</p>
                        <p><strong>Rating:</strong> ⭐ ${doctor.rating}/5</p>
                        <p><strong>Contact:</strong> ${doctor.contact}</p>
                        ${doctor.score > 0 ? `<p><small>Match score: ${doctor.score.toFixed(1)}</small></p>` : ''}
                        <button onclick="selectDoctor(${doctor.id}, '${doctor.name}')" class="btn btn-primary">
                            Select Doctor
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    })
    .catch(error => {
        console.error('Error:', error);
        recommendationsContainer.innerHTML = '<p style="color: red;">❌ Failed to get recommendations. Please try again.</p>';
    });
}

function selectDoctor(doctorId, doctorName) {
    document.getElementById('doctor').value = doctorId;
    document.getElementById('aiRecommendations').innerHTML = `
        <p style="color: green;">✅ Selected: Dr. ${doctorName}</p>
    `;
}

// Export functions for global access
window.getAIRecommendations = getAIRecommendations;
window.selectDoctor = selectDoctor;
window.showNotification = showNotification;