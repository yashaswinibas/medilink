// Medical Records functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    loadMedicalRecords();
    setupRecordForm();
    setupSearch();
});

function loadMedicalRecords() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    fetch(`http://localhost:5000/api/medical-records?user_id=${currentUser.id}`)
        .then(response => response.json())
        .then(records => {
            displayRecords(records);
            // Store records for filtering
            window.allRecords = records;
        })
        .catch(error => {
            console.error('Error loading medical records:', error);
            document.getElementById('recordsList').innerHTML = `
                <div class="error-message">
                    <p>Error loading medical records. Please try again later.</p>
                </div>
            `;
        });
}

function displayRecords(records) {
    const recordsList = document.getElementById('recordsList');
    const noRecords = document.getElementById('noRecords');
    
    if (records.length === 0) {
        recordsList.style.display = 'none';
        noRecords.style.display = 'block';
        return;
    }
    
    noRecords.style.display = 'none';
    recordsList.style.display = 'block';
    
    // Sort records by date (newest first)
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const recordsHTML = records.map(record => `
        <div class="record-card" data-type="${record.record_type}">
            <div class="record-header">
                <h4>${record.record_type}</h4>
                <span class="record-date">${new Date(record.date).toLocaleDateString()}</span>
            </div>
            <div class="record-body">
                <p><strong>Description:</strong> ${record.description}</p>
                ${record.doctor ? `<p><strong>Doctor:</strong> ${record.doctor}</p>` : ''}
            </div>
            <div class="record-footer">
                <small>Added: ${new Date(record.created_at).toLocaleDateString()}</small>
                <button class="btn-delete" onclick="deleteRecord(${record.id})">Delete</button>
            </div>
        </div>
    `).join('');
    
    recordsList.innerHTML = recordsHTML;
}

function setupRecordForm() {
    const form = document.getElementById('newRecordForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const formData = new FormData(form);
            
            const recordData = {
                patient_id: currentUser.id,
                record_type: formData.get('record_type'),
                date: formData.get('date'),
                doctor: formData.get('doctor'),
                description: formData.get('description')
            };
            
            fetch('http://localhost:5000/api/medical-records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recordData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert('Medical record added successfully!');
                    form.reset();
                    hideAddRecordForm();
                    loadMedicalRecords();
                } else {
                    alert(data.error || 'Failed to add medical record');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to add medical record. Please try again.');
            });
        });
    }
    
    // Set default date to today
    document.getElementById('recordDate').valueAsDate = new Date();
}

function setupSearch() {
    const searchInput = document.getElementById('searchRecords');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterRecords();
        });
    }
}

function filterRecords() {
    const typeFilter = document.getElementById('typeFilter').value;
    const searchTerm = document.getElementById('searchRecords').value.toLowerCase();
    
    if (!window.allRecords) return;
    
    let filteredRecords = window.allRecords;
    
    // Filter by type
    if (typeFilter !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.record_type === typeFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
        filteredRecords = filteredRecords.filter(record => 
            record.description.toLowerCase().includes(searchTerm) ||
            record.record_type.toLowerCase().includes(searchTerm) ||
            (record.doctor && record.doctor.toLowerCase().includes(searchTerm))
        );
    }
    
    displayRecords(filteredRecords);
}

function showAddRecordForm() {
    document.getElementById('addRecordForm').style.display = 'block';
}

function hideAddRecordForm() {
    document.getElementById('addRecordForm').style.display = 'none';
}

function deleteRecord(recordId) {
    if (confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
        fetch(`http://localhost:5000/api/medical-records/${recordId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Medical record deleted successfully!');
                loadMedicalRecords();
            } else {
                alert(data.error || 'Failed to delete medical record');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete medical record. Please try again.');
        });
    }
}

// Export functions for global access
window.showAddRecordForm = showAddRecordForm;
window.hideAddRecordForm = hideAddRecordForm;
window.filterRecords = filterRecords;
window.deleteRecord = deleteRecord;