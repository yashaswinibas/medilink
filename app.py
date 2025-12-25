from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# In a real application, you would use a proper database
# For this demo, we'll use JSON files to simulate a database

DATA_DIR = 'data'
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
APPOINTMENTS_FILE = os.path.join(DATA_DIR, 'appointments.json')
MEDICAL_RECORDS_FILE = os.path.join(DATA_DIR, 'medical_records.json')
PERIOD_TRACKER_FILE = os.path.join(DATA_DIR, 'period_tracker.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize data files if they don't exist
def init_data_files():
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump([], f)
    
    if not os.path.exists(APPOINTMENTS_FILE):
        with open(APPOINTMENTS_FILE, 'w') as f:
            json.dump([], f)
    
    if not os.path.exists(MEDICAL_RECORDS_FILE):
        with open(MEDICAL_RECORDS_FILE, 'w') as f:
            json.dump([], f)
    
    if not os.path.exists(PERIOD_TRACKER_FILE):
        with open(PERIOD_TRACKER_FILE, 'w') as f:
            json.dump([], f)

init_data_files()

# Helper functions to read/write data
def read_json(file_path):
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def write_json(file_path, data):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

# Predefined doctors list
DOCTORS = [
    {"id": 1, "name": "Dr. Sarah Johnson", "specialization": "Cardiology", "experience": "15 years", "rating": 4.8},
    {"id": 2, "name": "Dr. Michael Chen", "specialization": "Dermatology", "experience": "12 years", "rating": 4.7},
    {"id": 3, "name": "Dr. Emily Williams", "specialization": "Pediatrics", "experience": "10 years", "rating": 4.9},
    {"id": 4, "name": "Dr. Robert Davis", "specialization": "Orthopedics", "experience": "18 years", "rating": 4.6},
    {"id": 5, "name": "Dr. Lisa Patel", "specialization": "Gynecology", "experience": "14 years", "rating": 4.8},
    {"id": 6, "name": "Dr. James Wilson", "specialization": "Neurology", "experience": "16 years", "rating": 4.7},
    {"id": 7, "name": "Dr. Maria Garcia", "specialization": "Psychiatry", "experience": "11 years", "rating": 4.9},
    {"id": 8, "name": "Dr. David Brown", "specialization": "Endocrinology", "experience": "13 years", "rating": 4.5}
]

# Routes
@app.route('/')
def home():
    return jsonify({"message": "MedilinkPro API is running"})

# Authentication routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'email', 'password', 'dob', 'gender', 'phone']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    users = read_json(USERS_FILE)
    
    # Check if user already exists
    if any(user['email'] == data['email'] for user in users):
        return jsonify({"error": "User with this email already exists"}), 400
    
    # Create new user
    new_user = {
        "id": len(users) + 1,
        "name": data['name'],
        "email": data['email'],
        "password": data['password'],  # In a real app, hash the password
        "dob": data['dob'],
        "gender": data['gender'],
        "phone": data['phone'],
        "address": data.get('address', ''),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    users.append(new_user)
    write_json(USERS_FILE, users)
    
    return jsonify({
        "message": "User registered successfully", 
        "user_id": new_user['id'],
        "user": {
            "id": new_user['id'],
            "name": new_user['name'],
            "email": new_user['email'],
            "dob": new_user['dob'],
            "gender": new_user['gender'],
            "phone": new_user['phone'],
            "address": new_user['address']
        }
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    
    # Validate required fields
    if not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
    
    users = read_json(USERS_FILE)
    
    user = next((u for u in users if u['email'] == data['email'] and u['password'] == data['password']), None)
    
    if user:
        # Update last login
        user['last_login'] = datetime.now().isoformat()
        write_json(USERS_FILE, users)
        
        # In a real app, you would generate a JWT token here
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "dob": user['dob'],
                "gender": user['gender'],
                "phone": user['phone'],
                "address": user.get('address', ''),
                "created_at": user['created_at']
            }
        })
    else:
        return jsonify({"error": "Invalid email or password"}), 401

# Profile routes
@app.route('/api/profile', methods=['PUT'])
def update_profile():
    data = request.json
    
    if not data.get('user_id'):
        return jsonify({"error": "User ID is required"}), 400
    
    users = read_json(USERS_FILE)
    user = next((u for u in users if u['id'] == data['user_id']), None)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Update user data
    update_fields = ['name', 'email', 'phone', 'dob', 'gender', 'address']
    for field in update_fields:
        if field in data:
            user[field] = data[field]
    
    user['updated_at'] = datetime.now().isoformat()
    
    write_json(USERS_FILE, users)
    
    return jsonify({
        "message": "Profile updated successfully",
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "phone": user['phone'],
            "dob": user['dob'],
            "gender": user['gender'],
            "address": user.get('address', ''),
            "created_at": user['created_at']
        }
    })

@app.route('/api/profile/medical', methods=['POST'])
def save_medical_info():
    data = request.json
    
    if not data.get('user_id'):
        return jsonify({"error": "User ID is required"}), 400
    
    # In a real app, you would save this to a proper database
    # For now, we'll just return success
    return jsonify({
        "message": "Medical information saved successfully",
        "medical_info": data
    })

@app.route('/api/profile/change-password', methods=['POST'])
def change_password():
    data = request.json
    
    if not data.get('user_id') or not data.get('current_password') or not data.get('new_password'):
        return jsonify({"error": "User ID, current password and new password are required"}), 400
    
    users = read_json(USERS_FILE)
    user = next((u for u in users if u['id'] == data['user_id']), None)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user['password'] != data['current_password']:
        return jsonify({"error": "Current password is incorrect"}), 400
    
    # Update password
    user['password'] = data['new_password']
    user['updated_at'] = datetime.now().isoformat()
    
    write_json(USERS_FILE, users)
    
    return jsonify({"message": "Password changed successfully"})

# Appointments routes
@app.route('/api/appointments', methods=['GET'])
def get_appointments():
    user_id = request.args.get('user_id')
    
    appointments = read_json(APPOINTMENTS_FILE)
    
    if user_id:
        try:
            user_appointments = [apt for apt in appointments if apt['patient_id'] == int(user_id)]
            return jsonify(user_appointments)
        except ValueError:
            return jsonify({"error": "Invalid user ID"}), 400
    
    return jsonify(appointments)

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    data = request.json
    
    # Validate required fields
    required_fields = ['patient_id', 'doctor_id', 'date', 'time', 'reason']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    appointments = read_json(APPOINTMENTS_FILE)
    
    # Find doctor details
    doctor = next((d for d in DOCTORS if d['id'] == data['doctor_id']), None)
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404
    
    # Check if appointment time is available
    existing_appointment = next((apt for apt in appointments 
                               if apt['doctor_id'] == data['doctor_id'] 
                               and apt['date'] == data['date'] 
                               and apt['time'] == data['time']), None)
    
    if existing_appointment:
        return jsonify({"error": "This time slot is already booked. Please choose another time."}), 400
    
    new_appointment = {
        "id": len(appointments) + 1,
        "patient_id": data['patient_id'],
        "doctor_id": data['doctor_id'],
        "doctor_name": doctor['name'],
        "specialization": doctor['specialization'],
        "date": data['date'],
        "time": data['time'],
        "reason": data['reason'],
        "status": "Scheduled",
        "created_at": datetime.now().isoformat()
    }
    
    appointments.append(new_appointment)
    write_json(APPOINTMENTS_FILE, appointments)
    
    return jsonify({
        "message": "Appointment created successfully", 
        "appointment": new_appointment
    }), 201

@app.route('/api/appointments/<int:appointment_id>', methods=['PUT'])
def update_appointment(appointment_id):
    data = request.json
    
    appointments = read_json(APPOINTMENTS_FILE)
    
    appointment = next((apt for apt in appointments if apt['id'] == appointment_id), None)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404
    
    # Update appointment
    allowed_fields = ['date', 'time', 'reason', 'status']
    for field in allowed_fields:
        if field in data:
            appointment[field] = data[field]
    
    write_json(APPOINTMENTS_FILE, appointments)
    
    return jsonify({
        "message": "Appointment updated successfully", 
        "appointment": appointment
    })

@app.route('/api/appointments/<int:appointment_id>', methods=['DELETE'])
def delete_appointment(appointment_id):
    appointments = read_json(APPOINTMENTS_FILE)
    
    appointment = next((apt for apt in appointments if apt['id'] == appointment_id), None)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404
    
    appointments.remove(appointment)
    write_json(APPOINTMENTS_FILE, appointments)
    
    return jsonify({"message": "Appointment deleted successfully"})

# Medical records routes
@app.route('/api/medical-records', methods=['GET'])
def get_medical_records():
    user_id = request.args.get('user_id')
    
    records = read_json(MEDICAL_RECORDS_FILE)
    
    if user_id:
        try:
            user_records = [record for record in records if record['patient_id'] == int(user_id)]
            return jsonify(user_records)
        except ValueError:
            return jsonify({"error": "Invalid user ID"}), 400
    
    return jsonify(records)

@app.route('/api/medical-records', methods=['POST'])
def create_medical_record():
    data = request.json
    
    # Validate required fields
    required_fields = ['patient_id', 'record_type', 'description', 'date']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    records = read_json(MEDICAL_RECORDS_FILE)
    
    new_record = {
        "id": len(records) + 1,
        "patient_id": data['patient_id'],
        "record_type": data['record_type'],
        "description": data['description'],
        "date": data['date'],
        "doctor": data.get('doctor', ''),
        "created_at": datetime.now().isoformat()
    }
    
    records.append(new_record)
    write_json(MEDICAL_RECORDS_FILE, records)
    
    return jsonify({
        "message": "Medical record created successfully", 
        "record": new_record
    }), 201

@app.route('/api/medical-records/<int:record_id>', methods=['PUT'])
def update_medical_record(record_id):
    data = request.json
    
    records = read_json(MEDICAL_RECORDS_FILE)
    
    record = next((rec for rec in records if rec['id'] == record_id), None)
    if not record:
        return jsonify({"error": "Medical record not found"}), 404
    
    # Update record
    allowed_fields = ['record_type', 'description', 'date', 'doctor']
    for field in allowed_fields:
        if field in data:
            record[field] = data[field]
    
    write_json(MEDICAL_RECORDS_FILE, records)
    
    return jsonify({
        "message": "Medical record updated successfully", 
        "record": record
    })

@app.route('/api/medical-records/<int:record_id>', methods=['DELETE'])
def delete_medical_record(record_id):
    records = read_json(MEDICAL_RECORDS_FILE)
    
    record = next((rec for rec in records if rec['id'] == record_id), None)
    if not record:
        return jsonify({"error": "Medical record not found"}), 404
    
    records.remove(record)
    write_json(MEDICAL_RECORDS_FILE, records)
    
    return jsonify({"message": "Medical record deleted successfully"})

# Period tracker routes
@app.route('/api/period-tracker', methods=['GET'])
def get_period_data():
    user_id = request.args.get('user_id')
    
    period_data = read_json(PERIOD_TRACKER_FILE)
    
    if user_id:
        try:
            user_data = [data for data in period_data if data['user_id'] == int(user_id)]
            return jsonify(user_data)
        except ValueError:
            return jsonify({"error": "Invalid user ID"}), 400
    
    return jsonify(period_data)

@app.route('/api/period-tracker', methods=['POST'])
def add_period_data():
    data = request.json
    
    # Validate required fields
    required_fields = ['user_id', 'start_date', 'end_date']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    period_data = read_json(PERIOD_TRACKER_FILE)
    
    new_entry = {
        "id": len(period_data) + 1,
        "user_id": data['user_id'],
        "start_date": data['start_date'],
        "end_date": data['end_date'],
        "symptoms": data.get('symptoms', []),
        "notes": data.get('notes', ''),
        "created_at": datetime.now().isoformat()
    }
    
    period_data.append(new_entry)
    write_json(PERIOD_TRACKER_FILE, period_data)
    
    return jsonify({
        "message": "Period data added successfully", 
        "entry": new_entry
    }), 201

@app.route('/api/period-tracker/<int:entry_id>', methods=['DELETE'])
def delete_period_entry(entry_id):
    period_data = read_json(PERIOD_TRACKER_FILE)
    
    entry = next((data for data in period_data if data['id'] == entry_id), None)
    if not entry:
        return jsonify({"error": "Period entry not found"}), 404
    
    period_data.remove(entry)
    write_json(PERIOD_TRACKER_FILE, period_data)
    
    return jsonify({"message": "Period entry deleted successfully"})

# AI Doctor Recommendations
@app.route('/api/ai/recommend-doctors', methods=['POST'])
def recommend_doctors():
    data = request.json
    
    symptoms = data.get('symptoms', [])
    specialization = data.get('specialization', '')
    
    # Simple AI logic to recommend doctors
    recommended_doctors = []
    
    if specialization:
        # Filter by requested specialization
        recommended_doctors = [doc for doc in DOCTORS if doc['specialization'].lower() == specialization.lower()]
    elif symptoms:
        # Simple symptom-based recommendation
        symptom_specialization_map = {
            'chest pain': 'Cardiology',
            'heart': 'Cardiology',
            'blood pressure': 'Cardiology',
            'skin rash': 'Dermatology',
            'acne': 'Dermatology',
            'eczema': 'Dermatology',
            'fever': 'Pediatrics',
            'child': 'Pediatrics',
            'pediatric': 'Pediatrics',
            'joint pain': 'Orthopedics',
            'bone': 'Orthopedics',
            'fracture': 'Orthopedics',
            'menstrual': 'Gynecology',
            'period': 'Gynecology',
            'pregnancy': 'Gynecology',
            'headache': 'Neurology',
            'migraine': 'Neurology',
            'seizure': 'Neurology',
            'anxiety': 'Psychiatry',
            'depression': 'Psychiatry',
            'mental health': 'Psychiatry',
            'weight': 'Endocrinology',
            'diabetes': 'Endocrinology',
            'thyroid': 'Endocrinology',
            'hormone': 'Endocrinology'
        }
        
        for symptom in symptoms:
            symptom_lower = symptom.lower()
            for key, spec in symptom_specialization_map.items():
                if key in symptom_lower:
                    recommended_doctors.extend([doc for doc in DOCTORS if doc['specialization'] == spec])
                    break
    
    # Remove duplicates and limit to top 3
    if not recommended_doctors:
        recommended_doctors = DOCTORS[:3]  # Default to first 3 doctors
    
    # Remove duplicates by doctor id
    seen = set()
    unique_doctors = []
    for doc in recommended_doctors:
        if doc['id'] not in seen:
            seen.add(doc['id'])
            unique_doctors.append(doc)
    
    return jsonify(unique_doctors[:3])  # Return top 3 recommendations

# AI Chat
@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    data = request.json
    
    user_message = data.get('message', '').lower()
    
    # Simple AI response logic
    responses = {
        'hello': 'Hello! How can I assist you with your health concerns today?',
        'hi': 'Hi there! I\'m here to help with your medical questions.',
        'appointment': 'You can schedule an appointment by going to the Appointments section and selecting a doctor.',
        'book appointment': 'To book an appointment, visit the Appointments page and choose your preferred doctor and time slot.',
        'symptoms': 'If you\'re experiencing symptoms, I can help recommend a specialist. Please describe your symptoms in detail.',
        'pain': 'I\'m sorry to hear you\'re in pain. Can you describe the location and type of pain? For serious pain, please seek immediate medical attention.',
        'fever': 'Fever can be a sign of infection. Please monitor your temperature and consult a doctor if it persists for more than 48 hours or is very high.',
        'headache': 'Headaches can have various causes. If it\'s severe or persistent, I recommend consulting with Dr. James Wilson (Neurology).',
        'records': 'You can view your medical records in the Medical Records section of your dashboard.',
        'medical records': 'Your medical history is available in the Medical Records section. You can also add new records there.',
        'prescription': 'For prescription refills, please contact your doctor directly or schedule an appointment.',
        'medicine': 'Please consult with your doctor for medication-related questions. Never self-medicate without professional advice.',
        'emergency': 'If this is a medical emergency, please call emergency services immediately or go to the nearest hospital.',
        'help': 'I can help you with: booking appointments, finding doctors based on symptoms, accessing medical records, and answering general health questions.',
        'thank': 'You\'re welcome! Is there anything else I can help you with?',
        'bye': 'Goodbye! Take care of your health and don\'t hesitate to reach out if you need assistance.'
    }
    
    # Find the best matching response
    response = "I'm here to help with your health questions. You can ask me about appointments, symptoms, medical records, or general health concerns."
    
    for key in responses:
        if key in user_message:
            response = responses[key]
            break
    
    # If no specific match found, provide general guidance
    if response == "I'm here to help with your health questions. You can ask me about appointments, symptoms, medical records, or general health concerns.":
        if any(word in user_message for word in ['doctor', 'specialist', 'expert']):
            response = "I can help you find the right specialist based on your symptoms. Try using our AI doctor recommendation feature in the Appointments section."
        elif any(word in user_message for word in ['period', 'menstrual', 'cycle']):
            response = "For menstrual cycle tracking and related concerns, please use our Period Tracker feature or consult with Dr. Lisa Patel (Gynecology)."
        elif any(word in user_message for word in ['test', 'lab', 'result']):
            response = "You can view your lab test results in the Medical Records section. For new tests, please schedule an appointment with your doctor."
    
    return jsonify({"response": response})

# Get all doctors
@app.route('/api/doctors', methods=['GET'])
def get_doctors():
    return jsonify(DOCTORS)

# Get user statistics
@app.route('/api/user-stats/<int:user_id>', methods=['GET'])
def get_user_stats(user_id):
    appointments = read_json(APPOINTMENTS_FILE)
    medical_records = read_json(MEDICAL_RECORDS_FILE)
    period_data = read_json(PERIOD_TRACKER_FILE)
    
    user_appointments = [apt for apt in appointments if apt['patient_id'] == user_id]
    user_records = [record for record in medical_records if record['patient_id'] == user_id]
    user_period_data = [data for data in period_data if data['user_id'] == user_id]
    
    stats = {
        "total_appointments": len(user_appointments),
        "upcoming_appointments": len([apt for apt in user_appointments if apt['status'] == 'Scheduled' and datetime.strptime(apt['date'], '%Y-%m-%d') >= datetime.now()]),
        "total_records": len(user_records),
        "total_cycles": len(user_period_data)
    }
    
    return jsonify(stats)

# Health tips
@app.route('/api/health-tips', methods=['GET'])
def get_health_tips():
    tips = [
        "Stay hydrated by drinking at least 8 glasses of water daily.",
        "Aim for 7-9 hours of quality sleep each night.",
        "Include at least 30 minutes of physical activity in your daily routine.",
        "Eat a balanced diet rich in fruits, vegetables, and whole grains.",
        "Practice stress-reduction techniques like meditation or deep breathing.",
        "Don't skip regular health check-ups and preventive screenings.",
        "Wash your hands frequently to prevent the spread of germs.",
        "Limit processed foods and added sugars in your diet.",
        "Wear sunscreen daily to protect your skin from UV damage.",
        "Take regular breaks from screens to protect your eye health."
    ]
    
    import random
    selected_tips = random.sample(tips, 3)
    
    return jsonify({"tips": selected_tips})

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405

if __name__ == '__main__':
    print("Starting MedilinkPro Server...")
    print("Available endpoints:")
    print("  GET  /api/doctors - Get all doctors")
    print("  POST /api/register - User registration")
    print("  POST /api/login - User login")
    print("  PUT  /api/profile - Update profile")
    print("  GET  /api/appointments?user_id=<id> - Get user appointments")
    print("  POST /api/appointments - Create appointment")
    print("  GET  /api/medical-records?user_id=<id> - Get medical records")
    print("  POST /api/medical-records - Create medical record")
    print("  GET  /api/period-tracker?user_id=<id> - Get period data")
    print("  POST /api/period-tracker - Add period data")
    print("  POST /api/ai/recommend-doctors - Get doctor recommendations")
    print("  POST /api/ai/chat - AI health assistant")
    print("\nServer running on http://localhost:5000")
    
    app.run(debug=True, port=5000)