// Profile functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    loadProfileData();
    setupTabNavigation();
    setupForms();
    loadProfileStats();
});

function loadProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Load personal info
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('avatarInitials').textContent = getInitials(currentUser.name);
    
    // Load form data
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('editDob').value = currentUser.dob || '';
    document.getElementById('editGender').value = currentUser.gender || '';
    document.getElementById('editAddress').value = currentUser.address || '';
    
    // Load medical info from localStorage
    const medicalInfo = JSON.parse(localStorage.getItem('medicalInfo') || '{}');
    document.getElementById('bloodType').value = medicalInfo.blood_type || '';
    document.getElementById('allergies').value = medicalInfo.allergies || '';
    document.getElementById('medications').value = medicalInfo.medications || '';
    document.getElementById('conditions').value = medicalInfo.conditions || '';
    document.getElementById('emergencyContact').value = medicalInfo.emergency_contact || '';
    
    // Set member since
    if (currentUser.created_at) {
        const memberSince = new Date(currentUser.created_at).getFullYear();
        document.getElementById('memberSince').textContent = memberSince;
    }
}

function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

function setupTabNavigation() {
    const tabs = document.querySelectorAll('.profile-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show target content
            contents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${targetTab}Tab`).classList.add('active');
        });
    });
}

function setupForms() {
    // Personal Info Form
    const personalForm = document.getElementById('personalInfoForm');
    if (personalForm) {
        personalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updatePersonalInfo();
        });
    }
    
    // Medical Info Form
    const medicalForm = document.getElementById('medicalInfoForm');
    if (medicalForm) {
        medicalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateMedicalInfo();
        });
    }
    
    // Password Form
    const passwordForm = document.getElementById('changePasswordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
}

function updatePersonalInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const formData = new FormData(document.getElementById('personalInfoForm'));
    
    const updatedUser = {
        ...currentUser,
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        dob: formData.get('dob'),
        gender: formData.get('gender'),
        address: formData.get('address'),
        updated_at: new Date().toISOString()
    };
    
    // Update localStorage
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Update profile display
    document.getElementById('profileName').textContent = updatedUser.name;
    document.getElementById('avatarInitials').textContent = getInitials(updatedUser.name);
    
    // In a real app, you would send this to the backend
    alert('Personal information updated successfully!');
}

function updateMedicalInfo() {
    const formData = new FormData(document.getElementById('medicalInfoForm'));
    
    const medicalInfo = {
        blood_type: formData.get('blood_type'),
        allergies: formData.get('allergies'),
        medications: formData.get('medications'),
        conditions: formData.get('conditions'),
        emergency_contact: formData.get('emergency_contact'),
        updated_at: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('medicalInfo', JSON.stringify(medicalInfo));
    
    alert('Medical information updated successfully!');
}

function changePassword() {
    const formData = new FormData(document.getElementById('changePasswordForm'));
    const currentPassword = formData.get('current_password');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_new_password');
    
    // Basic validation
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    // In a real app, you would verify current password with backend
    // and then update the password
    
    alert('Password changed successfully!');
    document.getElementById('changePasswordForm').reset();
}

function resetForm() {
    if (confirm('Are you sure you want to reset all changes?')) {
        loadProfileData();
    }
}

function loadProfileStats() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Load appointments count
    fetch(`http://localhost:5000/api/appointments?user_id=${currentUser.id}`)
        .then(response => response.json())
        .then(appointments => {
            document.getElementById('totalAppointments').textContent = appointments.length;
        })
        .catch(error => {
            console.error('Error loading appointments:', error);
        });
    
    // Load medical records count
    fetch(`http://localhost:5000/api/medical-records?user_id=${currentUser.id}`)
        .then(response => response.json())
        .then(records => {
            document.getElementById('totalRecords').textContent = records.length;
        })
        .catch(error => {
            console.error('Error loading records:', error);
        });
    
    // Set last active
    document.getElementById('lastActive').textContent = 'Today';
}

function exportData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const medicalInfo = JSON.parse(localStorage.getItem('medicalInfo') || '{}');
    
    // In a real app, you would fetch all user data from the backend
    const userData = {
        personal_info: currentUser,
        medical_info: medicalInfo,
        export_date: new Date().toISOString()
    };
    
    // Create and download JSON file
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medilinkpro-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Your data has been exported successfully!');
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.')) {
        if (confirm('This is your final warning. Click OK to permanently delete your account.')) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            // In a real app, you would call the backend to delete the account
            // For now, we'll just log out and clear data
            localStorage.removeItem('currentUser');
            localStorage.removeItem('medicalInfo');
            
            alert('Account deleted successfully. Thank you for using MedilinkPro.');
            window.location.href = 'index.html';
        }
    }
}

// Make functions globally available
window.resetForm = resetForm;
window.exportData = exportData;
window.deleteAccount = deleteAccount;