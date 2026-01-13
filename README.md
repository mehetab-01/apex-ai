# 🎓 APEX AI - Intelligent E-Learning Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python)
![Django](https://img.shields.io/badge/Django-4.2-green?style=for-the-badge&logo=django)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

**A full-stack AI-powered e-learning platform with intelligent course recommendations, real-time face detection, and conversational AI tutoring.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [API Docs](#-api-endpoints) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 🤖 AI-Powered Learning
- **Smart Course Recommendations** - TF-IDF + Cosine Similarity engine suggests personalized courses
- **AI Chat Tutor** - Google Gemini-powered conversational study guide
- **Resume Analysis** - Upload resume for AI-generated career roadmaps

### 👤 User Authentication
- **Multi-method Login** - Email, phone number, or Google OAuth
- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Face Validation** - OpenCV-powered face detection for profile verification

### 🎯 Focus Mode
- **Real-time Face Detection** - Tracks attention using webcam + Haar Cascades
- **Session Analytics** - Monitors study time and focus percentage
- **Distraction Alerts** - Visual feedback when looking away

### 🎨 Modern UI/UX
- **Cyberpunk Design** - Dark mode with neon cyan/pink/purple accents
- **Responsive Layout** - Mobile-first design with Tailwind CSS
- **Smooth Animations** - Framer Motion transitions and micro-interactions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 Frontend                       │
│            (React, TypeScript, Tailwind CSS)                 │
│                   http://localhost:3000                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Django REST Backend                      │
│        (DRF, OpenCV, Scikit-Learn, Google Gemini)           │
│                   http://localhost:8000                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SQLite Database                         │
│         (Users, Courses, Chat History, Sessions)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Django 4.2 | Web framework |
| Django REST Framework | API endpoints |
| SimpleJWT | JWT authentication |
| OpenCV | Face detection |
| Scikit-Learn | ML recommendations |
| Google Gemini | AI chat responses |

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Axios | HTTP client |
| Lucide React | Icons |

---

## 📦 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/mehetab-01/apex-ai.git
cd apex-ai
```

### 2. Backend Setup
```bash
cd apex_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate

# Load sample courses (optional)
python manage.py populate_courses

# Start server
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd apex_frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Environment Variables

**Backend** (`apex_backend/.env`):
```env
DJANGO_SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
DEBUG=True
```

**Frontend** (`apex_frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | User registration |
| POST | `/api/auth/login/` | Email/phone login |
| POST | `/api/auth/google/` | Google OAuth |
| POST | `/api/auth/token/refresh/` | Refresh JWT |
| POST | `/api/auth/validate-face/` | Face validation |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/` | List all courses |
| GET | `/api/courses/{id}/` | Course details |
| POST | `/api/recommend/` | Get recommendations |
| POST | `/api/recommend/text/` | Text-based recommendations |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat-guide/` | AI chat tutor |
| POST | `/api/upload-resume/` | Resume analysis |
| GET | `/api/focus/stats/` | Focus session stats |

---

## 📁 Project Structure

```
apex-ai/
├── apex_backend/           # Django backend
│   ├── accounts/           # User authentication
│   │   ├── models.py       # ApexUser model
│   │   ├── views.py        # Auth views
│   │   └── serializers.py  # DRF serializers
│   ├── learning/           # Core learning features
│   │   ├── api/            # REST API
│   │   ├── models.py       # Course, Profile models
│   │   ├── recommender.py  # ML recommendation engine
│   │   ├── ai_providers.py # Multi-AI support
│   │   └── focus_mode.py   # Face detection logic
│   └── apex_backend/       # Django settings
│
├── apex_frontend/          # Next.js frontend
│   ├── app/                # App router pages
│   │   ├── login/          # Auth pages
│   │   ├── dashboard/      # Main dashboard
│   │   ├── chat/           # AI chat interface
│   │   └── focus-mode/     # Focus tracking
│   ├── components/         # Reusable components
│   ├── contexts/           # React contexts
│   └── lib/                # Utilities & API client
│
└── README.md
```

---

## 🚀 Roadmap

- [x] User authentication (email, phone, Google)
- [x] Course recommendation engine
- [x] AI chat tutor integration
- [x] Face validation system
- [x] Focus mode tracking
- [ ] Course progress tracking
- [ ] Certificates generation
- [ ] Payment integration
- [ ] Mobile app (React Native)

---

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

---

## 👨‍💻 Author

**mehetab-01**

- GitHub: [@mehetab-01](https://github.com/mehetab-01)
- Email: shaaz.mehetab@gmail.com

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

</div>
