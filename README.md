# GaoGamer - แอปพลิเคชันฝึกสมองสำหรับผู้สูงอายุ

## 📋 คำอธิบายโปรเจค
GaoGamer เป็น Web Application ที่ออกแบบมาสำหรับผู้สูงอายุในการเล่นเกมเพื่อฝึกสมอง รวมถึงงานวิจัย โดยมี Admin เพื่อจัดการข้อมูลผู้เล่นและดูรายงานการใช้งาน

## ✨ ฟีเจอร์หลัก
- **Admin Panel**: สร้าง แก้ไข ลบ ผู้เล่น และดูสถิติการใช้งาน
- **Senior User Login**: ผู้สูงอายุสามารถเข้าสู่ระบบและเล่นเกม
- **Game System**: บันทึกคะแนนและประวัติการเล่นแต่ละครั้ง
- **JSON Database**: ใช้ JSON แทน MongoDB เพื่อความง่าย

---

## 🛠️ ส่วนประกอบหลัก

### Backend (Python + Flask)
```
backend/
├── app.py              - Main Flask application
├── config.py           - Configuration settings
├── requirements.txt    - Python dependencies
├── models/
│   ├── admin.py
│   ├── senior_user.py
│   ├── game_session.py
│   └── game_score.py
├── routes/
│   ├── auth.py         - Login endpoints
│   ├── admin.py        - Admin CRUD operations
│   └── game.py         - Game operations
├── middleware/
│   └── auth_middleware.py - JWT authentication
├── utils/
│   ├── json_db.py      - JSON database operations
│   └── auth.py         - Authentication utilities
└── data/
    ├── admins.json
    ├── senior_users.json
    ├── game_sessions.json
    └── game_scores.json
```

### Frontend (React.js)
```
frontend/
├── package.json
├── public/
│   └── index.html
└── src/
    ├── App.js
    ├── index.js
    ├── index.css
    ├── pages/
    │   ├── Login.js
    │   ├── AdminDashboard.js
    │   └── SeniorGameBoard.js
    ├── services/
    │   └── api.js
    └── styles/
        ├── Login.css
        ├── AdminDashboard.css
        └── SeniorGameBoard.css
```

---

## 🚀 วิธีการเริ่มต้น

### Prerequisites
- Python 3.9+
- Node.js 14+
- npm

### 1. ตั้งค่า Backend

```bash
cd backend

# สร้าง virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# ติดตั้ง dependencies
pip install -r requirements.txt

# รัน Flask server
python app.py
```

# Server จะทำงานที่ 'https://songkrandev.pythonanywhere.com/api';

### 2. ตั้งค่า Frontend

```bash
cd frontend

# ติดตั้ง dependencies
npm install

# รัน development server
npm start
```

Frontend จะเปิดที่ `http://localhost:3000`

---

## 🔐 Credentials ทดสอบ

### Admin Login
- **Email**: admin@gaogamer.com
- **Password**: admin123

### User Login
- **Email**: user01@gaogamer.com
- **Password**: 000
---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/admin-login` - Admin login
- `POST /api/auth/senior-login` - Senior user login
- `POST /api/auth/verify-token` - Verify token

### Admin Operations
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/<user_id>` - Get user by ID
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/<user_id>` - Update user
- `DELETE /api/admin/users/<user_id>` - Delete user
- `GET /api/admin/stats` - Get statistics

### Game Operations
- `POST /api/game/start-session` - Start game session
- `POST /api/game/end-session` - End game session
- `POST /api/game/save-score` - Save game score
- `GET /api/game/user-scores` - Get user's scores

---

## 📊 Database Schema (JSON)

### admins.json
```json
{
  "admins": [
    {
      "admin_id": "ADM001",
      "email": "admin@gaogamer.com",
      "password": "hashed_password",
      "full_name": "Admin User",
      "created_at": "2026-02-23"
    }
  ]
}
```

### senior_users.json
```json
{
  "senior_users": [
    {
      "user_id": "SU001",
      "full_name": "สมชาย ใจดี",
      "address": "123 ซ.xxx เซนต์ ย.zzz",
      "phone": "0812345678",
      "password": "hashed_password",
      "created_at": "2026-02-23",
      "created_by": "ADM001"
    }
  ]
}
```

### game_scores.json
```json
{
  "game_scores": [
    {
      "score_id": "uuid",
      "user_id": "SU001",
      "session_id": "uuid",
      "game_type": "memory",
      "score": 100,
      "level": 1,
      "created_at": "2026-02-23T10:30:00"
    }
  ]
}
```

---

## 🎮 เกมประเภท
1. **Memory Game** (เกมจำเลขลำดับ)
2. **Puzzle Game** (เกมต่อภาพ)
3. **Brain Teaser** (เกมแก้โจทย์)

---

## 📝 หมายเหตุ
- ระบบใช้ JWT (JSON Web Token) สำหรับ authentication
- รหัสผ่านเข้ารหัสด้วย bcrypt
- ข้อมูลเก็บไว้ใน JSON files ตามพาธ `backend/data/`

---

## 👨‍💻 Developer
สร้างขึ้นสำหรับงานวิจัยเกี่ยวกับการช่วยฝึกสมองของผู้สูงอายุ

---

**Happy Gaming! 🎮**
