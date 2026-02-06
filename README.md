# 🎓 APEX AI - Intelligent E-Learning Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python)
![Django](https://img.shields.io/badge/Django-4.2-green?style=for-the-badge&logo=django)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

**A full-stack AI-powered e-learning platform addressing SDG 4 (Quality Education) with intelligent course recommendations, real-time attention tracking, collaborative study rooms, and 24/7 AI tutoring.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [API Docs](#-api-endpoints)

</div>

---

## 🎯 Project Overview

**APEX** solves the "overwhelming choice + zero accountability" problem in online education through:

| Pillar | Feature | Impact |
|--------|---------|--------|
| **DISCOVER** | AI Course Recommendations | Find the right course in seconds |
| **LEARN** | 24/7 AI Study Guide | Get help anytime, anywhere |
| **FOCUS** | Attention Tracking | Stay accountable for real learning |
| **COLLABORATE** | Study Rooms | Learn together with peers |
| **GROW** | Career Guidance | Know where to go next |

---

## ✨ Features

### 🤖 AI-Powered Learning
- **Smart Course Recommendations** - TF-IDF + Cosine Similarity engine suggests personalized courses from 14+ platforms
- **AI Chat Tutor** - Google Gemini-powered conversational study guide available 24/7
- **Resume Analysis** - Upload resume for AI-generated career roadmaps and skill gap analysis

### 📺 YouTube Embedded Learning
- **Watch Within APEX** - Embedded YouTube player for seamless learning experience
- **Chapter Navigation** - Auto-parsed chapters from video descriptions
- **Playlist Support** - Navigate through course playlists without leaving the platform
- **Progress Tracking** - Track time spent and enrollment progress

### 👥 Collaborative Study Rooms
- **Real-time Collaboration** - Join study rooms with peers via room codes
- **Pomodoro Timer** - Built-in focus timer with host controls
- **Live Video/Audio** - See and hear participants with webcam/mic support
- **Speaking Indicators** - Visual feedback when participants are speaking
- **Room Chat** - Text chat within study rooms

### 🎯 Focus Mode
- **Real-time Face Detection** - Tracks attention using webcam + OpenCV Haar Cascades
- **Session Analytics** - Monitors study time and focus percentage
- **Gamification** - Earn focus points for sustained attention
- **Distraction Alerts** - Visual feedback when looking away

### 👤 User Authentication
- **Multi-method Login** - Email, phone number, or Google OAuth
- **OTP Verification** - SMS (Twilio) and Email (Brevo) OTP support
- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Face Validation** - OpenCV-powered face detection for profile verification

### 📚 Course Aggregation
Courses from **14+ platforms**:
- YouTube, Udemy, Coursera, NPTEL
- freeCodeCamp, edX, MIT OpenCourseWare
- Cisco Networking Academy, Infosys Springboard
- Cyfrin Updraft, HackerRank, LeetCode, CodeChef

### 🎨 Modern UI/UX
- **Cyberpunk Design** - Dark mode with neon cyan/green/purple accents
- **Responsive Layout** - Mobile-first design with Tailwind CSS
- **Smooth Animations** - Framer Motion transitions
- **Complete Website** - About, Blog, Careers, Contact, and Legal pages

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
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   SQLite DB  │    │  Gemini API  │    │ YouTube API  │
│   (Users,    │    │  (AI Chat)   │    │  (Chapters)  │
│   Courses)   │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
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
| Twilio | SMS OTP |
| Brevo/Sendinblue | Email OTP |

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework (App Router) |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Axios | HTTP client |
| Lucide React | Icons |
| Web Audio API | Speaking detection |

---

## 📦 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git
- Webcam (for Focus Mode & Study Rooms)

### Quick Start (Windows)

```bash
# Clone the repository
git clone https://github.com/mehetab-01/apex-ai.git
cd apex-ai

# Run both servers
start.bat
```

### Manual Setup

#### Backend
```bash
cd apex_backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Linux/Mac: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py migrate

# Start server
python manage.py runserver
```

#### Frontend
```bash
cd apex_frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

**Backend** (`apex_backend/.env`):
```env
DJANGO_SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
YOUTUBE_API_KEY=your-youtube-api-key
GROQ_API_KEY=your-groq-api-key (optional)
COHERE_API_KEY=your-cohere-api-key (optional)
DEBUG=True
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | User registration |
| POST | `/api/auth/login/` | Email/phone login |
| POST | `/api/auth/send-otp/` | Send OTP (email/SMS) |
| POST | `/api/auth/verify-otp/` | Verify OTP |
| POST | `/api/auth/google/` | Google OAuth |
| POST | `/api/auth/validate-face/` | Face validation |

### Courses & Learning
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses/` | List all courses |
| GET | `/api/courses/{id}/` | Course details |
| POST | `/api/courses/{id}/enroll/` | Enroll in course |
| GET | `/api/enrollments/` | User's enrolled courses |
| POST | `/api/recommend/` | Get recommendations |
| GET | `/api/youtube/video-info/` | YouTube video details & chapters |

### Study Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms/` | List study rooms |
| POST | `/api/rooms/` | Create room |
| POST | `/api/rooms/join-by-code/` | Join via code |
| POST | `/api/rooms/{id}/join/` | Join room |
| POST | `/api/rooms/{id}/leave/` | Leave room |
| GET | `/api/rooms/{id}/messages/` | Room chat |
| POST | `/api/rooms/{id}/timer/` | Control Pomodoro timer |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat-guide/` | AI chat tutor |
| POST | `/api/upload-resume/` | Resume analysis |
| GET | `/api/focus/stats/` | Focus session stats |
| POST | `/api/focus/save-session/` | Save focus session |

---

## 📁 Project Structure

```
apex-ai/
├── apex_backend/           # Django backend
│   ├── accounts/           # User authentication
│   ├── learning/           # Core learning features
│   │   ├── api/            # REST API views & serializers
│   │   ├── models.py       # Course, Enrollment, StudyRoom models
│   │   ├── recommender.py  # ML recommendation engine
│   │   ├── ai_providers.py # Multi-AI support (Gemini, Groq, Cohere)
│   │   └── focus_mode.py   # Face detection logic
│   └── apex_backend/       # Django settings
│
├── apex_frontend/          # Next.js frontend
│   ├── app/                # App router pages
│   │   ├── dashboard/      # Course discovery
│   │   ├── learn/[id]/     # YouTube embedded learning
│   │   ├── my-courses/     # Enrolled courses
│   │   ├── study-room/     # Collaborative rooms
│   │   ├── focus-mode/     # Attention tracking
│   │   ├── chat/           # AI tutor
│   │   ├── career/         # Resume analysis
│   │   └── ...             # Static pages
│   ├── components/         # Reusable components
│   ├── contexts/           # Auth, Chat contexts
│   └── lib/                # API client & utilities
│
├── start.bat               # Windows quick start
├── stop.bat                # Stop servers
└── README.md
```

---

## 🚀 Feature Checklist

- [x] User authentication (email, phone, Google OAuth)
- [x] OTP verification (SMS + Email)
- [x] Course recommendation engine (TF-IDF + Cosine)
- [x] AI chat tutor (Gemini with Groq/Cohere fallbacks)
- [x] Face validation system
- [x] Focus mode with attention tracking
- [x] Course enrollment & progress tracking
- [x] YouTube embedded learning with chapters
- [x] Collaborative study rooms with Pomodoro
- [x] Live video/audio in study rooms
- [x] Speaking indicators (Web Audio API)
- [x] Career page with resume analysis
- [x] Complete static pages (About, Blog, Careers, Contact, Legal)
- [ ] Proctored assessments
- [ ] Learning badges & streaks
- [ ] Mobile app (React Native)

---

## 🎯 SDG 4 Alignment

This project directly supports **UN Sustainable Development Goal 4: Quality Education** by:

1. **Accessible Education** - Aggregates free courses from 14+ platforms
2. **Personalized Learning** - AI recommendations based on skills and goals
3. **Learning Support** - 24/7 AI tutor for instant doubt clearance
4. **Accountability** - Focus mode tracks actual attention, not just video completion
5. **Collaboration** - Study rooms enable peer learning

---

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

---

## 👨‍💻 Author

**Mehetab Shaaz**

- GitHub: [@mehetab-01](https://github.com/mehetab-01)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

*Built with ❤️ for quality education*

</div>
