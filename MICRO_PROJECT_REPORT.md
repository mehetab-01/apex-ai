# UG Program in Electronics and Computer Science

# Micro Project Report

## on

# APEX - AI-Powered E-Learning Content Recommendation System

**Course:** Skill-Based Laboratory - III (Python Programming) (Semester – IV)

**By**

| Name of the Student | Class | PRN No. |
|---|---|---|
| Rajat Adsule Maruti | SYECS-1 | 124BTEC1008 |
| Ali Mehetab Mojaffar | SYECS-1 | 124BTEC1010 |
| Badra Afroz Javed | SYECS-1 | 124BTEC1005 |

**Department of Electronics and Computer Science**

**Under the guidance of**
**Ms. Rupali Shinde**
Assistant Professor
Department of Electronics and Computer Science
Shah & Anchor Kutchhi Engineering College
Mumbai 400088

---

<div style="page-break-after: always;"></div>

## Certificate

This is to certify that the Micro Project titled **"APEX - AI-Powered E-Learning Content Recommendation System"** has been successfully completed by the following group of students under the course Skill Based Laboratory – III (Python) in partial fulfillment of Semester – IV requirements.

**Group Members**

1. Rajat Adsule Maruti (PRN No. 124BTEC1008)
2. Ali Mehetab Mojaffar (PRN No. 124BTEC1010)
3. Badra Afroz Javed (PRN No. 124BTEC1005)

**Faculty In-charge:**
Ms. Rupali Shinde
Assistant Professor,
Department of Electronics and Computer Science,
Shah & Anchor Kutchhi Engineering College,
Mumbai 400088

Signature: __________

---

<div style="page-break-after: always;"></div>

## Table of Contents

1. Introduction
2. Scope of Project
3. Project Overview
4. Website Pages (Screenshots)
5. Code Snippets (Important Sections Only)
6. Challenges Faced & Solutions
7. Learning Outcomes
8. Conclusion
9. References

---

<div style="page-break-after: always;"></div>

## 1. Introduction

The rapid growth of online education has created an overwhelming landscape for learners. With over 10,000 courses available across multiple platforms, students face choice overload, lack of personalized guidance, and disengagement during learning. Studies indicate that online course completion rates remain dismally low at 3-15%, highlighting a critical gap between course availability and effective learning outcomes.

APEX (AI-Powered E-Learning Content Recommendation System) is a full-stack web application designed to address these challenges by combining artificial intelligence with modern web technologies. The platform aggregates courses from 14+ educational platforms including YouTube, Coursera, Udemy, NPTEL, MIT OpenCourseWare, and freeCodeCamp into a single unified interface. It leverages machine learning algorithms — specifically TF-IDF (Term Frequency-Inverse Document Frequency) vectorization and Cosine Similarity — to deliver personalized course recommendations tailored to each student's interests and learning history.

Beyond course recommendations, APEX integrates real-time webcam-based attention tracking using MediaPipe and OpenCV to monitor student focus during study sessions. The platform also features collaborative study rooms with WebRTC-powered live video and audio communication, a Pomodoro timer for structured study, a 24/7 AI-powered chat tutor using Google Gemini, and career guidance with resume analysis capabilities. Together, these features create a comprehensive ecosystem where students can discover courses, learn effectively, stay focused, collaborate with peers, and plan their career — all within a single platform.

---

<div style="page-break-after: always;"></div>

## 2. Scope of Project

### SDG Goal Selected

This project supports **United Nations Sustainable Development Goal 4: Quality Education**, which aims to "ensure inclusive and equitable quality education and promote lifelong learning opportunities for all."

### Real-World Problems Addressed

APEX addresses the following real-world challenges in online education:

1. **Choice Overload and Fragmentation:** Students struggle to find relevant courses from thousands of options scattered across multiple platforms like YouTube, Coursera, Udemy, and edX. APEX aggregates courses from 14+ platforms and uses AI-powered recommendations to guide students to the most suitable learning resources based on their interests and skill level.

2. **Low Course Completion Rates:** Online course completion rates are estimated at only 3-15%. APEX combats this through gamified focus tracking that awards points for sustained attention, a Pomodoro-based study system, and progress tracking across enrolled courses — keeping students motivated and accountable.

3. **Lack of Personalized Guidance:** Traditional platforms offer one-size-fits-all course listings with no adaptation to individual learning needs. APEX employs a TF-IDF and Cosine Similarity based recommendation engine that analyzes course content, categories, difficulty levels, and user preferences to suggest the most relevant learning paths.

4. **Student Distraction and Disengagement:** Without accountability mechanisms, students often lose focus during online study. APEX's Focus Mode uses real-time face detection and eye tracking through MediaPipe to calculate an attention score (0-100%), providing immediate feedback on engagement levels.

5. **Limited Access to Affordable Tutoring:** Private tutoring costs $50-200 per hour, making quality academic support inaccessible for many students. APEX provides a free, 24/7 AI Study Guide powered by Google Gemini that offers multi-turn conversational tutoring with code syntax highlighting and context preservation.

6. **Lack of Collaborative Learning in Online Settings:** Online learning is often an isolated experience. APEX's Study Rooms provide virtual peer-learning spaces with live video/audio via WebRTC, shared Pomodoro timers, in-room chat, and support for up to 8 participants per room.

---

<div style="page-break-after: always;"></div>

## 3. Project Overview

### Brief Description

APEX is a full-stack AI-powered e-learning platform that helps students discover, learn, focus, collaborate, and grow through intelligent educational tools. The system uses a client-server architecture where a Next.js frontend communicates with a Django REST backend through secure APIs using JWT authentication. The backend integrates with AI services (Google Gemini with Groq and Cohere fallbacks), computer vision libraries (MediaPipe, OpenCV), and machine learning algorithms (Scikit-Learn) to deliver a comprehensive learning experience.

### Number of Pages

The APEX platform comprises **21 unique web pages/routes**, organized as follows:

**Authentication and Onboarding (4 pages):**
- Login Page (Email, Phone, and Google OAuth)
- Register Page with OTP Verification
- Forgot Password Page
- Onboarding Page (Face Validation and Profile Completion)

**Core Learning Pages (4 pages):**
- Dashboard with AI-Powered Course Recommendations
- Course Details and Enrollment Page
- Learning Page with Embedded YouTube Player and Chapters
- My Courses (Enrolled Courses with Progress)

**Interactive Feature Pages (3 pages):**
- Focus Mode with Real-Time Attention Tracking
- Collaborative Study Rooms with Video/Audio and Pomodoro Timer
- AI Chat Tutor Interface with Conversation History

**User Management Pages (3 pages):**
- User Profile and Achievements
- Settings (AI Provider, Learning Difficulty, Theme Preferences)
- Career Guidance and Resume Analysis

**Information Pages (7 pages):**
- Landing/Home Page
- About Page
- Blog/Tutorials Page
- Careers Page
- Contact Page
- Privacy Policy
- Terms of Service

### Features Implemented

| Feature | Description |
|---|---|
| AI Course Recommendation Engine | TF-IDF + Cosine Similarity algorithm for personalized suggestions |
| Multi-Platform Course Aggregation | Courses from 14+ platforms (YouTube, Coursera, Udemy, NPTEL, MIT OCW, etc.) |
| Embedded YouTube Learning System | In-platform video playback with auto-parsed chapters and playlist support |
| Focus Mode with Attention Tracking | Webcam-based face detection and eye tracking using MediaPipe for real-time attention scoring |
| Collaborative Study Rooms | WebRTC-powered live video/audio, shared Pomodoro timer, and in-room chat (up to 8 participants) |
| AI Study Guide (24/7 Chat Tutor) | Multi-turn conversations powered by Google Gemini with Groq and Cohere fallbacks |
| Career Guidance and Resume Analysis | AI-driven skill gap analysis, career roadmap, and course recommendations based on uploaded resumes |
| Multi-Method Authentication | Email + Password, Phone + OTP (via Twilio), and Google OAuth 2.0 with JWT tokens |
| Gamified Learning | Focus points, attention scores, progress tracking, and course completion milestones |
| Responsive Design | Mobile-first, fully responsive UI built with Tailwind CSS and Framer Motion animations |

### Tools and Technologies Used

**Development Environment:** Visual Studio Code, GitHub (Version Control)

**Backend Technologies:**

| Tool/Library | Version | Purpose |
|---|---|---|
| Python | 3.12+ | Core programming language |
| Django | 4.2.27 | Web framework |
| Django REST Framework | 3.16.1 | REST API development |
| SimpleJWT | 5.5.1 | JWT authentication (access + refresh tokens) |
| Scikit-Learn | 1.8.0 | TF-IDF vectorization and cosine similarity |
| MediaPipe | 0.10+ | Face mesh and eye tracking (468 landmarks) |
| OpenCV | 4.12.0 | Computer vision and video processing |
| Google Generative AI | 0.8.6 | Gemini API for AI tutoring |
| PyPDF2 | 3.0.1 | Resume PDF parsing for career guidance |
| Pandas | 2.3.3 | Data manipulation for course processing |
| NumPy | 2.2.6 | Numerical computation |
| Twilio | — | SMS OTP delivery |
| Brevo (Sendinblue) | — | Email OTP delivery |
| SQLite | 3 | Development database |

**Frontend Technologies:**

| Tool/Library | Version | Purpose |
|---|---|---|
| Next.js | 14.2.0 | React framework with App Router |
| React | 18.3.0 | UI component library |
| TypeScript | 5.0 | Type-safe JavaScript |
| Tailwind CSS | 3.4.0 | Utility-first CSS framework |
| Framer Motion | 11.0.0 | Smooth page transitions and animations |
| Axios | 1.6.0 | HTTP client for API requests |
| PeerJS | 1.5.5 | WebRTC peer connections for study rooms |
| React Markdown | 10.1.0 | AI chat message rendering |
| Lucide React | 0.400.0 | Icon library |

**Deployment and Infrastructure:**

| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Containerized deployment |
| Nginx (Alpine) | Reverse proxy for frontend and backend |
| Gunicorn | WSGI server for Django |
| Cloudflare Tunnel | Secure exposure of services to the internet |

---

<div style="page-break-after: always;"></div>

## 4. Website Pages (Screenshots)

*[Insert screenshots of the following pages]*

### 4.1 Landing / Home Page
*Screenshot showing the APEX landing page with the hero section, feature highlights, and call-to-action buttons.*

### 4.2 Login and Registration Pages
*Screenshot showing the multi-method login page supporting Email, Phone OTP, and Google OAuth. Screenshot of the registration page with OTP verification.*

### 4.3 Dashboard and Course Discovery
*Screenshot of the main dashboard displaying AI-recommended courses, category filters, difficulty filters, and the course search functionality.*

### 4.4 Course Details and Enrollment
*Screenshot of a course detail page showing the course thumbnail, description, platform source, difficulty level, and enrollment button.*

### 4.5 Learning Page with YouTube Integration
*Screenshot of the embedded YouTube player with auto-parsed video chapters, progress tracking, and course notes section.*

### 4.6 Focus Mode Interface
*Screenshot of the Focus Mode page showing the webcam feed overlay, real-time attention score percentage, focus points earned, and session duration timer.*

### 4.7 Collaborative Study Room
*Screenshot of a study room showing live video tiles of participants, the shared Pomodoro timer (25/5/4 rounds), in-room text chat, and mic/camera toggle controls.*

### 4.8 AI Chat Tutor
*Screenshot of the AI Study Guide chat interface displaying a multi-turn conversation with code syntax highlighting and suggested follow-up questions.*

### 4.9 Career Guidance Page
*Screenshot of the career guidance page showing resume upload, AI-driven skill gap analysis results, and recommended learning paths.*

### 4.10 Settings Page
*Screenshot of the settings page showing options for AI provider selection, learning difficulty preference, theme toggle, and notification preferences.*

### 4.11 Responsive Layout View
*Screenshots showing the mobile-responsive layout of the dashboard and navigation menu on different screen sizes.*

---

<div style="page-break-after: always;"></div>

## 5. Code Snippets (Important Sections Only)

### 5.1 AI Course Recommendation Engine (Python — TF-IDF + Cosine Similarity)

```python
# recommender.py — Core Recommendation Algorithm

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

class CourseRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words='english',
            sublinear_tf=True
        )
        self.similarity_matrix = None
        self.courses_df = None

    def fit(self, courses_queryset):
        """Build TF-IDF matrix from all published courses."""
        self.courses_df = pd.DataFrame(list(
            courses_queryset.values('id', 'title', 'description',
                                     'category', 'tags', 'difficulty',
                                     'instructor')
        ))
        # Weight title 3x for higher importance
        self.courses_df['combined'] = (
            self.courses_df['title'] + ' ' +
            self.courses_df['title'] + ' ' +
            self.courses_df['title'] + ' ' +
            self.courses_df['description'].fillna('') + ' ' +
            self.courses_df['category'].fillna('') + ' ' +
            self.courses_df['tags'].fillna('')
        )
        tfidf_matrix = self.vectorizer.fit_transform(
            self.courses_df['combined']
        )
        self.similarity_matrix = cosine_similarity(tfidf_matrix)

    def recommend(self, course_id, top_n=10):
        """Return top-N similar courses based on cosine similarity."""
        idx = self.courses_df[
            self.courses_df['id'] == course_id
        ].index[0]
        sim_scores = list(enumerate(self.similarity_matrix[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1],
                           reverse=True)
        sim_scores = sim_scores[1:top_n + 1]
        course_indices = [i[0] for i in sim_scores]
        return self.courses_df.iloc[course_indices]
```

### 5.2 Focus Mode — Real-Time Attention Tracking (Python — MediaPipe + OpenCV)

```python
# focus_mode.py — Eye Aspect Ratio and Face Detection

import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh

# Eye landmark indices for MediaPipe Face Mesh
LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]

def calculate_ear(eye_landmarks):
    """Calculate Eye Aspect Ratio (EAR) to detect eye open/close."""
    p2_p6 = np.linalg.norm(
        np.array(eye_landmarks[1]) - np.array(eye_landmarks[5])
    )
    p3_p5 = np.linalg.norm(
        np.array(eye_landmarks[2]) - np.array(eye_landmarks[4])
    )
    p1_p4 = np.linalg.norm(
        np.array(eye_landmarks[0]) - np.array(eye_landmarks[3])
    )
    ear = (p2_p6 + p3_p5) / (2.0 * p1_p4)
    return ear

EAR_THRESHOLD = 0.21  # Below this = eyes closed

def process_frame(frame):
    """Process a single video frame for attention detection."""
    with mp_face_mesh.FaceMesh(
        max_num_faces=1,
        min_detection_confidence=0.5
    ) as face_mesh:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        if results.multi_face_landmarks:
            face_detected = True
            landmarks = results.multi_face_landmarks[0]
            h, w = frame.shape[:2]

            left_eye_pts = [
                (landmarks.landmark[i].x * w,
                 landmarks.landmark[i].y * h)
                for i in LEFT_EYE
            ]
            right_eye_pts = [
                (landmarks.landmark[i].x * w,
                 landmarks.landmark[i].y * h)
                for i in RIGHT_EYE
            ]

            left_ear = calculate_ear(left_eye_pts)
            right_ear = calculate_ear(right_eye_pts)
            avg_ear = (left_ear + right_ear) / 2.0
            eyes_open = avg_ear > EAR_THRESHOLD

            return face_detected, eyes_open, avg_ear
        return False, False, 0.0
```

### 5.3 JWT Authentication and User Registration (Python — Django REST Framework)

```python
# views.py — User Registration with OTP Verification

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Generate 6-digit OTP
            otp_code = str(random.randint(100000, 999999))
            OTPVerification.objects.create(
                user=user,
                otp_code=otp_code,
                purpose='registration',
                expires_at=timezone.now() + timedelta(minutes=10)
            )

            # Send OTP via email or SMS
            if user.email:
                send_email_otp(user.email, otp_code)
            elif user.phone:
                send_sms_otp(user.phone, otp_code)

            return Response({
                'message': 'Registration successful. Verify OTP.',
                'user_id': str(user.id)
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
```

### 5.4 Study Room with WebRTC (TypeScript — Next.js Frontend)

```typescript
// study-room/page.tsx — WebRTC Peer Connection Setup

import Peer from 'peerjs';

const initializePeer = () => {
  const peer = new Peer();

  peer.on('open', (peerId: string) => {
    // Register peer ID with the backend
    api.post(`/api/rooms/${roomId}/join/`, {
      peer_id: peerId
    });
  });

  peer.on('call', (call) => {
    // Answer incoming calls with local stream
    call.answer(localStream);
    call.on('stream', (remoteStream) => {
      addRemoteVideo(call.peer, remoteStream);
    });
  });

  // Call all existing participants
  participants.forEach((participant) => {
    if (participant.peer_id) {
      const call = peer.call(participant.peer_id, localStream);
      call.on('stream', (remoteStream) => {
        addRemoteVideo(participant.peer_id, remoteStream);
      });
    }
  });
};
```

### 5.5 AI Chat Tutor — Multi-Provider Architecture (Python)

```python
# ai_providers.py — Google Gemini with Fallback Providers

import google.generativeai as genai

class AIProviderManager:
    def __init__(self):
        self.providers = {
            'gemini': self._call_gemini,
            'groq': self._call_groq,
            'cohere': self._call_cohere,
        }

    def get_response(self, messages, provider='gemini'):
        """Get AI response with automatic fallback."""
        try:
            return self.providers[provider](messages)
        except Exception:
            # Fallback chain: Gemini → Groq → Cohere
            for fallback in ['groq', 'cohere']:
                if fallback != provider:
                    try:
                        return self.providers[fallback](messages)
                    except Exception:
                        continue
            raise Exception("All AI providers failed")

    def _call_gemini(self, messages):
        """Call Google Gemini API."""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            messages,
            generation_config={
                'max_output_tokens': 2000,
                'temperature': 0.7,
            }
        )
        return response.text
```

### 5.6 Responsive Navigation and Dashboard (TypeScript/React — Frontend)

```typescript
// components/Navbar.tsx — Responsive Navigation

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md
                    border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold
                           bg-gradient-to-r from-blue-600
                           to-purple-600 bg-clip-text
                           text-transparent">
              APEX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink href="/dashboard" icon={<Home />}>
              Dashboard
            </NavLink>
            <NavLink href="/my-courses" icon={<BookOpen />}>
              My Courses
            </NavLink>
            <NavLink href="/focus-mode" icon={<Eye />}>
              Focus Mode
            </NavLink>
            <NavLink href="/study-room" icon={<Users />}>
              Study Rooms
            </NavLink>
            <NavLink href="/chat" icon={<MessageSquare />}>
              AI Tutor
            </NavLink>
          </div>

          {/* Mobile Hamburger Menu */}
          <button className="md:hidden" onClick={toggleMobileMenu}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};
```

*Full source code is available in the project repository on GitHub.*

---

<div style="page-break-after: always;"></div>

## 6. Challenges Faced & Solutions

| Sr. No. | Challenge Faced | Solution Implemented |
|---|---|---|
| 1 | **Integrating the TF-IDF recommendation algorithm with real course data** — Processing thousands of courses with multiple text fields caused slow vectorization and inaccurate recommendations. | Optimized TF-IDF processing by using sublinear TF scaling, limiting to 5000 features, using bigrams (ngram_range 1-2), and weighting the course title 3x higher than other fields to improve recommendation relevance. |
| 2 | **Real-time face detection performance issues** — Running MediaPipe Face Mesh on every webcam frame caused high CPU usage and frame drops in the browser. | Implemented efficient frame processing with reduced detection confidence thresholds and optimized the backend streaming endpoint to deliver JPEG frames efficiently via multipart HTTP streaming. |
| 3 | **Backend-Frontend communication and CORS issues** — Connecting the Next.js frontend (port 3000) with the Django backend (port 8000) caused frequent CORS errors and authentication token handling issues. | Configured Django CORS middleware with proper allowed origins, implemented JWT access and refresh token handling with Axios interceptors for automatic token refresh on 401 responses. |
| 4 | **WebRTC peer-to-peer video connectivity in Study Rooms** — Establishing reliable video/audio connections between multiple participants across different networks and NAT configurations was unreliable. | Used PeerJS library to simplify WebRTC signaling, implemented proper peer connection lifecycle management, added heartbeat mechanisms for participant tracking, and handled edge cases like peer disconnection gracefully. |
| 5 | **Multi-provider AI fallback handling** — Google Gemini API rate limits and occasional downtime caused chat failures, breaking the user experience. | Built a multi-provider architecture with automatic fallback chain (Gemini → Groq → Cohere). Each provider is wrapped in try-catch blocks, and the system transparently switches to the next available provider without user intervention. |
| 6 | **Responsive UI design across devices** — Making complex pages like Study Rooms (with video tiles, chat, and timer) and Focus Mode (with webcam overlay) responsive on mobile devices was challenging. | Used Tailwind CSS responsive breakpoints (sm, md, lg, xl), CSS Grid for video tile layouts that adapt to participant count, and conditional rendering for mobile-specific navigation components. |
| 7 | **Docker deployment and service orchestration** — Coordinating the startup of Django backend, Next.js frontend, and Nginx reverse proxy with proper health checks and volume mounting. | Created a Docker Compose configuration with service dependencies, health check endpoints, shared volumes for static files and media, and Nginx configuration for proper routing of API and frontend requests. |

---

<div style="page-break-after: always;"></div>

## 7. Learning Outcomes

By completing this Micro Project, we learned to:

1. **Full-Stack Web Development:** Design and develop a complete web application using Django REST Framework for the backend and Next.js with React and TypeScript for the frontend, understanding the end-to-end flow from database to user interface.

2. **Machine Learning for Recommendations:** Implement a content-based recommendation system using TF-IDF vectorization and Cosine Similarity from the Scikit-Learn library, understanding how text features can be transformed into numerical vectors for similarity computation.

3. **Computer Vision and Real-Time Processing:** Use MediaPipe Face Mesh and OpenCV for real-time face detection and eye tracking, learning about facial landmark detection (468 landmarks), Eye Aspect Ratio (EAR) calculation, and efficient video frame processing.

4. **AI API Integration:** Integrate large language model APIs (Google Gemini, Groq, Cohere) into a web application for conversational AI, learning about prompt engineering, multi-turn context management, token usage optimization, and building resilient fallback architectures.

5. **RESTful API Design:** Design and implement 40+ REST API endpoints following best practices for URL structure, HTTP methods, request validation, pagination, filtering, and proper error handling using Django REST Framework serializers and viewsets.

6. **Authentication and Security:** Implement a multi-method authentication system supporting Email + Password, Phone + OTP, and Google OAuth 2.0 with JWT (JSON Web Tokens) for stateless session management, understanding token refresh mechanisms and secure password handling.

7. **Real-Time Communication:** Implement WebRTC-based peer-to-peer video and audio communication using PeerJS for collaborative study rooms, learning about signaling, peer connections, media streams, and NAT traversal.

8. **Database Modeling:** Design a relational database schema with 13 interconnected models, understanding foreign key relationships, unique constraints, UUID primary keys, and efficient query patterns using Django ORM.

9. **Containerization and Deployment:** Deploy a multi-service application using Docker and Docker Compose with Nginx as a reverse proxy, learning about container orchestration, volume management, environment variables, and health checks.

10. **Team Collaboration and Version Control:** Collaborate effectively using Git and GitHub for version control, managing branches, resolving merge conflicts, and following a structured development workflow with clear commit conventions.

---

<div style="page-break-after: always;"></div>

## 8. Conclusion

APEX demonstrates how artificial intelligence and modern web technologies can be effectively combined to transform the online education experience. The platform successfully addresses critical challenges in e-learning — including choice overload, low engagement, lack of personalization, and limited access to tutoring — by providing an integrated ecosystem of intelligent tools.

The AI-powered recommendation engine, built using TF-IDF and Cosine Similarity, effectively matches students with relevant courses from 14+ educational platforms, eliminating the fragmentation problem. The Focus Mode with real-time attention tracking using MediaPipe provides an accountability mechanism that encourages sustained engagement during study sessions. The collaborative study rooms with WebRTC video/audio and Pomodoro timers bring the benefits of peer learning to the online environment. The 24/7 AI Study Guide powered by Google Gemini with multi-provider fallback ensures students always have access to quality tutoring assistance.

The project has provided us with hands-on experience in full-stack development, machine learning algorithm implementation, computer vision, real-time communication systems, and AI API integration. These skills are directly applicable to real-world software engineering roles and research in educational technology.

APEX supports UN Sustainable Development Goal 4 (Quality Education) by making personalized, AI-enhanced education accessible and affordable. The platform's modular architecture and containerized deployment make it scalable for future enhancements such as advanced analytics dashboards, natural language course search, and integration with additional learning management systems.

---

<div style="page-break-after: always;"></div>

## 9. References

1. Django Documentation — https://docs.djangoproject.com/en/4.2/
2. Django REST Framework Documentation — https://www.django-rest-framework.org/
3. Next.js Documentation — https://nextjs.org/docs
4. React Documentation — https://react.dev/
5. Tailwind CSS Documentation — https://tailwindcss.com/docs
6. Scikit-Learn: TF-IDF Vectorizer — https://scikit-learn.org/stable/modules/generated/sklearn.feature_extraction.text.TfidfVectorizer.html
7. Scikit-Learn: Cosine Similarity — https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.cosine_similarity.html
8. MediaPipe Face Mesh — https://developers.google.com/mediapipe/solutions/vision/face_landmarker
9. OpenCV Documentation — https://docs.opencv.org/4.x/
10. Google Gemini API Documentation — https://ai.google.dev/docs
11. PeerJS (WebRTC) Documentation — https://peerjs.com/docs/
12. Docker Documentation — https://docs.docker.com/
13. SimpleJWT Documentation — https://django-rest-framework-simplejwt.readthedocs.io/
14. Framer Motion Documentation — https://www.framer.com/motion/
15. United Nations SDG 4: Quality Education — https://sdgs.un.org/goals/goal4
16. Salton, G., & Buckley, C. (1988). "Term-weighting approaches in automatic text retrieval." *Information Processing & Management*, 24(5), 513-523.
17. Soboroff, I., Nicholas, C., & Cahan, P. (2001). "Ranking retrieval systems without relevance judgments." *Proceedings of the 24th ACM SIGIR Conference*.

---

*This report was prepared as part of the Micro Project for Skill-Based Laboratory – III (Python Programming), Semester IV, Department of Electronics and Computer Science, Shah & Anchor Kutchhi Engineering College, Mumbai.*
