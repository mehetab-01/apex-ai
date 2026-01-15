"""
Apex Learning Platform - DRF API Views
=======================================
This module implements the REST API endpoints using Django REST Framework.
# Trigger reload v4

Endpoints:
    - GET /api/courses/ - List all courses
    - GET /api/courses/<id>/ - Get course details
    - POST /api/recommend/ - Get course recommendations
    - POST /api/upload-resume/ - Upload resume for AI analysis
    - POST /api/chat-guide/ - AI study guide chat
    - GET /api/focus/stats/ - Get focus session stats
"""

import os
import logging
from typing import Optional

from rest_framework import status, generics, viewsets
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

from learning.models import Course, StudentProfile, LearningLog, FocusSession
from learning.recommender import get_recommender, CourseRecommender
from learning.focus_mode import get_current_focus_stats

from .serializers import (
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateSerializer,
    StudentProfileSerializer,
    LearningLogSerializer,
    RecommendationRequestSerializer,
    RecommendationResponseSerializer,
    ResumeUploadSerializer,
    ChatGuideRequestSerializer,
    ChatGuideResponseSerializer,
    CareerRoadmapSerializer,
)

logger = logging.getLogger(__name__)


# ============================================
# Course API Views
# ============================================

class CourseListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating courses.
    
    GET /api/courses/
        Returns a list of all published courses.
    
    POST /api/courses/
        Creates a new course.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Course.objects.filter(is_published=True)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CourseCreateSerializer
        return CourseListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty')
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # Filter by platform
        platform = self.request.query_params.get('platform')
        if platform:
            queryset = queryset.filter(platform=platform)
        
        # Filter by free courses only
        free_only = self.request.query_params.get('free')
        if free_only and free_only.lower() == 'true':
            queryset = queryset.filter(price=0)
        
        # Search by title or description
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                title__icontains=search
            ) | queryset.filter(
                description__icontains=search
            )
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        allowed_orderings = ['created_at', '-created_at', 'price', '-price', 'title', '-title', 'average_rating', '-average_rating']
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)
        
        return queryset


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a course.
    
    GET /api/courses/<id>/
    PUT /api/courses/<id>/
    DELETE /api/courses/<id>/
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Course.objects.all()
    serializer_class = CourseDetailSerializer


class CourseCategoriesView(APIView):
    """
    API endpoint to get available course categories.
    
    GET /api/courses/categories/
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        categories = [
            {'value': value, 'label': label}
            for value, label in Course.CATEGORY_CHOICES
        ]
        return Response(categories)


class CoursePlatformsView(APIView):
    """
    API endpoint to get available course platforms.
    
    GET /api/courses/platforms/
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request):
        platforms = [
            {'value': value, 'label': label}
            for value, label in Course.PLATFORM_CHOICES
        ]
        return Response(platforms)


# ============================================
# Recommendation API Views
# ============================================

class RecommendationView(APIView):
    """
    API endpoint for course recommendations.
    
    POST /api/recommend/
        Input: course_id (UUID)
        Output: List of recommended courses with similarity scores
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RecommendationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        course_id = str(serializer.validated_data['course_id'])
        top_n = serializer.validated_data.get('top_n', 10)
        exclude_same_category = serializer.validated_data.get('exclude_same_category', False)
        
        try:
            recommender = get_recommender()
            recommendations = recommender.get_recommendations(
                course_id=course_id,
                top_n=top_n,
                exclude_same_category=exclude_same_category
            )
            
            response_serializer = RecommendationResponseSerializer(
                recommendations,
                many=True
            )
            
            return Response({
                'status': 'success',
                'course_id': course_id,
                'count': len(recommendations),
                'recommendations': response_serializer.data
            })
            
        except ValueError as e:
            return Response(
                {'status': 'error', 'message': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Recommendation error: {e}")
            return Response(
                {'status': 'error', 'message': 'Failed to generate recommendations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TextRecommendationView(APIView):
    """
    API endpoint for text-based course recommendations.
    
    POST /api/recommend/text/
        Input: query (string)
        Output: List of relevant courses
    """
    
    def post(self, request):
        query = request.data.get('query', '')
        top_n = request.data.get('top_n', 10)
        
        if not query:
            return Response(
                {'status': 'error', 'message': 'Query text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            recommender = get_recommender()
            recommendations = recommender.get_recommendations_for_text(
                query_text=query,
                top_n=top_n
            )
            
            return Response({
                'status': 'success',
                'query': query,
                'count': len(recommendations),
                'recommendations': recommendations
            })
            
        except Exception as e:
            logger.error(f"Text recommendation error: {e}")
            return Response(
                {'status': 'error', 'message': 'Failed to generate recommendations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============================================
# Resume Upload & AI Analysis
# ============================================

class ResumeUploadView(APIView):
    """
    API endpoint for resume upload and AI analysis.
    
    POST /api/upload-resume/
        Input: PDF file
        Output: AI-generated career roadmap, course suggestions, and skill trends
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        resume_file = serializer.validated_data['resume']
        
        try:
            # Extract text from PDF
            resume_text = self._extract_pdf_text(resume_file)
            
            if not resume_text.strip():
                return Response(
                    {'status': 'error', 'message': 'Could not extract text from PDF'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Analyze with Gemini AI
            analysis = self._analyze_resume_with_gemini(resume_text)
            
            # Get skill trends analysis
            skill_trends = self._get_skill_trends(analysis.get('extracted_skills', []))
            
            # Get course recommendations based on skills
            recommender = get_recommender()
            recommended_courses = recommender.get_recommendations_for_text(
                query_text=analysis.get('skills_text', resume_text),
                top_n=6
            )
            
            return Response({
                'status': 'success',
                'analysis': analysis,
                'skill_trends': skill_trends,
                'recommended_courses': recommended_courses
            })
            
        except Exception as e:
            logger.error(f"Resume analysis error: {e}")
            return Response(
                {'status': 'error', 'message': f'Failed to analyze resume: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _extract_pdf_text(self, pdf_file) -> str:
        """Extract text from uploaded PDF file."""
        try:
            from pypdf import PdfReader
            
            reader = PdfReader(pdf_file)
            text_parts = []
            
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            
            return '\n'.join(text_parts)
            
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            raise ValueError(f"Failed to extract text from PDF: {e}")
    
    def _analyze_resume_with_gemini(self, resume_text: str) -> dict:
        """Analyze resume text using Google Gemini AI."""
        try:
            import google.generativeai as genai
            
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                # Return mock analysis if no API key
                return self._mock_resume_analysis(resume_text)
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            prompt = f"""Analyze this resume comprehensively and provide a structured response in JSON format with the following:

1. "extracted_skills": A list of all technical and soft skills found in the resume (be comprehensive)

2. "experience_level": One of "entry", "mid", "senior", or "expert" based on years of experience and role complexity

3. "suggested_categories": A list of relevant learning categories from: web_development, mobile_development, data_science, machine_learning, artificial_intelligence, cloud_computing, cybersecurity, devops, blockchain, game_development, ui_ux_design, database, programming_languages, software_engineering, networking

4. "career_paths": A list of 4-5 recommended job roles based on their skills, each with:
   - "title": Job title (e.g., "Senior Full Stack Developer", "ML Engineer", "Data Scientist")
   - "description": Brief description of the role
   - "salary_range": Estimated salary range (e.g., "$80,000 - $120,000")
   - "match_score": Percentage match based on current skills (0-100)
   - "required_skills": List of key skills needed for this role
   - "growth_potential": Brief note on career growth

5. "skills_gap": A list of skills the person is MISSING that they should learn, each with:
   - "skill": Name of the skill
   - "importance": "critical", "important", or "nice_to_have"
   - "reason": Why this skill is needed for their career growth
   - "related_roles": Which job roles benefit from this skill

6. "profile_summary": A brief 2-3 sentence summary of the candidate's profile

7. "strengths": List of 3-4 key strengths based on resume

8. "skills_text": A comma-separated string of all skills for course matching

Resume:
{resume_text[:6000]}  

Respond only with valid JSON, no markdown formatting or code blocks."""
            
            response = model.generate_content(prompt)
            
            # Parse JSON response
            import json
            try:
                # Clean the response text
                response_text = response.text.strip()
                if response_text.startswith('```'):
                    response_text = response_text.split('```')[1]
                    if response_text.startswith('json'):
                        response_text = response_text[4:]
                
                analysis = json.loads(response_text)
                return analysis
            except json.JSONDecodeError:
                logger.warning("Failed to parse Gemini response as JSON")
                return self._mock_resume_analysis(resume_text)
                
        except ImportError:
            logger.warning("google-generativeai not installed")
            return self._mock_resume_analysis(resume_text)
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._mock_resume_analysis(resume_text)
    
    def _mock_resume_analysis(self, resume_text: str) -> dict:
        """Provide mock analysis when Gemini API is unavailable."""
        # Extract some basic keywords
        text_lower = resume_text.lower()
        
        skills = []
        skill_keywords = [
            'python', 'javascript', 'java', 'react', 'node', 'sql',
            'machine learning', 'data science', 'aws', 'docker', 'kubernetes',
            'git', 'agile', 'scrum', 'html', 'css', 'typescript', 'mongodb',
            'postgresql', 'redis', 'graphql', 'rest api', 'ci/cd', 'linux',
            'tensorflow', 'pytorch', 'pandas', 'numpy', 'django', 'flask',
            'express', 'vue', 'angular', 'c++', 'go', 'rust', 'kotlin', 'swift'
        ]
        
        for skill in skill_keywords:
            if skill in text_lower:
                skills.append(skill.title())
        
        categories = []
        if any(s in text_lower for s in ['python', 'data', 'machine learning', 'pandas', 'numpy']):
            categories.append('data_science')
        if any(s in text_lower for s in ['react', 'javascript', 'html', 'css', 'frontend', 'vue', 'angular']):
            categories.append('web_development')
        if any(s in text_lower for s in ['aws', 'cloud', 'azure', 'gcp']):
            categories.append('cloud_computing')
        if any(s in text_lower for s in ['docker', 'kubernetes', 'ci/cd', 'devops']):
            categories.append('devops')
        if any(s in text_lower for s in ['machine learning', 'deep learning', 'neural', 'tensorflow', 'pytorch']):
            categories.append('machine_learning')
        
        if not categories:
            categories = ['programming_languages', 'software_engineering']
        
        # Determine experience level based on keywords
        experience_level = 'mid'
        if any(s in text_lower for s in ['senior', 'lead', 'principal', 'architect', 'manager', '8+ years', '10+ years']):
            experience_level = 'senior'
        elif any(s in text_lower for s in ['junior', 'intern', 'entry', 'fresher', 'graduate', '0-2 years']):
            experience_level = 'entry'
        elif any(s in text_lower for s in ['expert', 'director', 'head of', 'vp', 'chief', '15+ years']):
            experience_level = 'expert'
        
        return {
            'extracted_skills': skills if skills else ['Programming', 'Problem Solving', 'Communication'],
            'experience_level': experience_level,
            'suggested_categories': categories,
            'profile_summary': 'A skilled professional with experience in software development. Shows proficiency in multiple programming languages and frameworks.',
            'strengths': [
                'Strong technical foundation',
                'Experience with modern frameworks',
                'Problem-solving abilities',
                'Continuous learning mindset'
            ],
            'career_paths': [
                {
                    'title': 'Full Stack Developer',
                    'description': 'Build complete web applications from frontend to backend',
                    'salary_range': '$70,000 - $130,000',
                    'match_score': 75,
                    'required_skills': ['JavaScript', 'React', 'Node.js', 'SQL', 'REST APIs'],
                    'growth_potential': 'Can advance to Tech Lead or Software Architect'
                },
                {
                    'title': 'Data Scientist',
                    'description': 'Analyze data and build machine learning models to drive business decisions',
                    'salary_range': '$85,000 - $150,000',
                    'match_score': 65,
                    'required_skills': ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Data Visualization'],
                    'growth_potential': 'Can advance to ML Engineer or Chief Data Officer'
                },
                {
                    'title': 'DevOps Engineer',
                    'description': 'Manage infrastructure, CI/CD pipelines, and deployment automation',
                    'salary_range': '$80,000 - $140,000',
                    'match_score': 60,
                    'required_skills': ['Docker', 'Kubernetes', 'AWS/GCP', 'CI/CD', 'Linux'],
                    'growth_potential': 'Can advance to Platform Engineer or SRE Lead'
                },
                {
                    'title': 'Backend Engineer',
                    'description': 'Design and implement scalable server-side applications and APIs',
                    'salary_range': '$75,000 - $135,000',
                    'match_score': 70,
                    'required_skills': ['Python/Java/Go', 'Databases', 'System Design', 'APIs', 'Microservices'],
                    'growth_potential': 'Can advance to Staff Engineer or Engineering Manager'
                }
            ],
            'skills_gap': [
                {
                    'skill': 'System Design',
                    'importance': 'critical',
                    'reason': 'Essential for senior roles and building scalable applications',
                    'related_roles': ['Senior Developer', 'Tech Lead', 'Solutions Architect']
                },
                {
                    'skill': 'Cloud Architecture',
                    'importance': 'critical',
                    'reason': 'Modern applications require cloud deployment knowledge',
                    'related_roles': ['DevOps Engineer', 'Cloud Architect', 'Platform Engineer']
                },
                {
                    'skill': 'Leadership & Mentoring',
                    'importance': 'important',
                    'reason': 'Required for career progression to lead/management roles',
                    'related_roles': ['Tech Lead', 'Engineering Manager', 'CTO']
                },
                {
                    'skill': 'Machine Learning Fundamentals',
                    'importance': 'important',
                    'reason': 'AI/ML skills are increasingly valuable across all tech roles',
                    'related_roles': ['ML Engineer', 'Data Scientist', 'AI Developer']
                },
                {
                    'skill': 'Communication & Presentation',
                    'importance': 'nice_to_have',
                    'reason': 'Important for stakeholder management and career growth',
                    'related_roles': ['Technical PM', 'Solutions Architect', 'Team Lead']
                }
            ],
            'skills_text': ', '.join(skills) if skills else 'programming, software development, problem solving'
        }

    def _get_skill_trends(self, skills: list) -> dict:
        """Get real-time market trends for the user's skills using AI."""
        if not skills:
            return self._mock_skill_trends([])
        
        try:
            import google.generativeai as genai
            
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                return self._mock_skill_trends(skills)
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            skills_str = ', '.join(skills[:15])  # Limit to top 15 skills
            
            prompt = f"""Analyze the current job market trends for these technical skills: {skills_str}

Provide a detailed real-time market analysis in JSON format with:

1. "market_overview": A brief 2-3 sentence overview of the current tech job market and how these skills fit

2. "skill_analysis": An array of skill trend objects, each containing:
   - "skill": The skill name
   - "demand_level": One of "very_high", "high", "medium", "low" based on current job postings
   - "demand_score": A number from 0-100 representing current market demand
   - "trend": One of "rising", "stable", "declining" based on year-over-year changes
   - "growth_rate": Percentage growth/decline (e.g., "+25%", "-5%", "+10%")
   - "avg_salary_impact": How this skill impacts salary (e.g., "+$15,000", "+$25,000")
   - "job_openings": Estimated number of job openings mentioning this skill (e.g., "50,000+", "10,000-20,000")
   - "top_companies": List of 3-4 top companies hiring for this skill
   - "related_roles": List of 2-3 job titles that commonly require this skill

3. "hot_skills": Array of 3-4 skills from the list that are currently most in-demand

4. "emerging_combinations": Array of 2-3 skill combinations that are particularly valuable together

5. "market_insights": Array of 3-4 key insights about the job market for these skills

6. "recommendations": Array of 3-4 actionable recommendations for the user based on trends

7. "industry_demand": Object showing demand by industry:
   - "tech": percentage (e.g., 45)
   - "finance": percentage
   - "healthcare": percentage
   - "retail": percentage
   - "other": percentage

Respond only with valid JSON, no markdown formatting or code blocks. Base your analysis on current 2024-2025 job market data and trends."""
            
            response = model.generate_content(prompt)
            
            import json
            try:
                response_text = response.text.strip()
                if response_text.startswith('```'):
                    response_text = response_text.split('```')[1]
                    if response_text.startswith('json'):
                        response_text = response_text[4:]
                
                trends = json.loads(response_text)
                return trends
            except json.JSONDecodeError:
                logger.warning("Failed to parse skill trends response as JSON")
                return self._mock_skill_trends(skills)
                
        except ImportError:
            logger.warning("google-generativeai not installed")
            return self._mock_skill_trends(skills)
        except Exception as e:
            logger.error(f"Skill trends API error: {e}")
            return self._mock_skill_trends(skills)
    
    def _mock_skill_trends(self, skills: list) -> dict:
        """Provide mock skill trends when API is unavailable."""
        # Default skill trends based on common tech skills
        skill_trends_data = {
            'python': {'demand': 95, 'trend': 'rising', 'growth': '+18%', 'salary': '+$20,000'},
            'javascript': {'demand': 92, 'trend': 'stable', 'growth': '+8%', 'salary': '+$15,000'},
            'react': {'demand': 88, 'trend': 'rising', 'growth': '+22%', 'salary': '+$18,000'},
            'aws': {'demand': 90, 'trend': 'rising', 'growth': '+25%', 'salary': '+$25,000'},
            'docker': {'demand': 85, 'trend': 'rising', 'growth': '+20%', 'salary': '+$15,000'},
            'kubernetes': {'demand': 82, 'trend': 'rising', 'growth': '+30%', 'salary': '+$22,000'},
            'machine learning': {'demand': 88, 'trend': 'rising', 'growth': '+35%', 'salary': '+$30,000'},
            'sql': {'demand': 85, 'trend': 'stable', 'growth': '+5%', 'salary': '+$10,000'},
            'java': {'demand': 80, 'trend': 'stable', 'growth': '+3%', 'salary': '+$12,000'},
            'typescript': {'demand': 86, 'trend': 'rising', 'growth': '+28%', 'salary': '+$16,000'},
            'node': {'demand': 82, 'trend': 'stable', 'growth': '+10%', 'salary': '+$14,000'},
            'git': {'demand': 90, 'trend': 'stable', 'growth': '+5%', 'salary': '+$8,000'},
            'mongodb': {'demand': 75, 'trend': 'stable', 'growth': '+12%', 'salary': '+$12,000'},
            'postgresql': {'demand': 78, 'trend': 'rising', 'growth': '+15%', 'salary': '+$14,000'},
            'redis': {'demand': 72, 'trend': 'rising', 'growth': '+18%', 'salary': '+$13,000'},
            'graphql': {'demand': 70, 'trend': 'rising', 'growth': '+25%', 'salary': '+$15,000'},
            'tensorflow': {'demand': 75, 'trend': 'rising', 'growth': '+20%', 'salary': '+$25,000'},
            'pytorch': {'demand': 78, 'trend': 'rising', 'growth': '+32%', 'salary': '+$28,000'},
            'django': {'demand': 72, 'trend': 'stable', 'growth': '+8%', 'salary': '+$12,000'},
            'flask': {'demand': 68, 'trend': 'stable', 'growth': '+5%', 'salary': '+$10,000'},
            'vue': {'demand': 70, 'trend': 'stable', 'growth': '+12%', 'salary': '+$14,000'},
            'angular': {'demand': 72, 'trend': 'declining', 'growth': '-5%', 'salary': '+$12,000'},
            'rust': {'demand': 65, 'trend': 'rising', 'growth': '+45%', 'salary': '+$20,000'},
            'go': {'demand': 75, 'trend': 'rising', 'growth': '+28%', 'salary': '+$18,000'},
        }
        
        skill_analysis = []
        for skill in skills[:12]:
            skill_lower = skill.lower()
            if skill_lower in skill_trends_data:
                data = skill_trends_data[skill_lower]
                demand_level = 'very_high' if data['demand'] >= 85 else 'high' if data['demand'] >= 70 else 'medium'
                skill_analysis.append({
                    'skill': skill,
                    'demand_level': demand_level,
                    'demand_score': data['demand'],
                    'trend': data['trend'],
                    'growth_rate': data['growth'],
                    'avg_salary_impact': data['salary'],
                    'job_openings': f"{data['demand'] * 500:,}+",
                    'top_companies': ['Google', 'Amazon', 'Microsoft', 'Meta'],
                    'related_roles': ['Software Engineer', 'Full Stack Developer', 'Backend Developer']
                })
            else:
                skill_analysis.append({
                    'skill': skill,
                    'demand_level': 'medium',
                    'demand_score': 65,
                    'trend': 'stable',
                    'growth_rate': '+10%',
                    'avg_salary_impact': '+$10,000',
                    'job_openings': '10,000+',
                    'top_companies': ['Various Tech Companies'],
                    'related_roles': ['Software Developer', 'Engineer']
                })
        
        # Sort by demand score
        skill_analysis.sort(key=lambda x: x['demand_score'], reverse=True)
        hot_skills = [s['skill'] for s in skill_analysis[:4] if s['demand_score'] >= 80]
        
        return {
            'market_overview': 'The tech job market remains strong with high demand for cloud, AI/ML, and full-stack development skills. Companies are actively hiring for roles that combine multiple technologies.',
            'skill_analysis': skill_analysis,
            'hot_skills': hot_skills if hot_skills else skills[:3],
            'emerging_combinations': [
                {'skills': ['Python', 'Machine Learning', 'AWS'], 'value': 'ML Engineering roles paying $150k+'},
                {'skills': ['React', 'TypeScript', 'Node.js'], 'value': 'Full-stack positions in high demand'},
                {'skills': ['Kubernetes', 'Docker', 'AWS'], 'value': 'DevOps roles with 30% YoY growth'}
            ],
            'market_insights': [
                'AI/ML skills command 25-40% higher salaries than traditional development roles',
                'Cloud certification holders see 15% faster job placement rates',
                'Full-stack developers with DevOps knowledge are most sought after',
                'Remote-first companies have increased tech hiring by 35%'
            ],
            'recommendations': [
                'Focus on cloud platforms (AWS/GCP/Azure) to increase marketability',
                'Add AI/ML fundamentals to your skill set for future-proofing',
                'Consider containerization skills (Docker/K8s) for DevOps roles',
                'Build portfolio projects showcasing skill combinations'
            ],
            'industry_demand': {
                'tech': 45,
                'finance': 20,
                'healthcare': 15,
                'retail': 12,
                'other': 8
            }
        }


# ============================================
# AI Chat Guide
# ============================================

class ChatGuideView(APIView):
    """
    API endpoint for AI-powered study guide chat.
    
    POST /api/chat-guide/
        Input: User question, optional conversation_id and provider
        Output: AI-generated study advice with chat history
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        from learning.ai_providers import get_ai_manager
        from learning.models import ChatConversation, ChatMessage, UserPreference
        
        serializer = ChatGuideRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question = serializer.validated_data['question']
        context = serializer.validated_data.get('context', '')
        conversation_id = request.data.get('conversation_id')
        preferred_provider = request.data.get('provider', 'auto')
        
        user = request.user if request.user and request.user.is_authenticated else None
        
        try:
            # Get or create conversation for authenticated users
            conversation = None
            if user:
                if conversation_id:
                    try:
                        conversation = ChatConversation.objects.get(id=conversation_id, user=user)
                    except ChatConversation.DoesNotExist:
                        pass
                
                if not conversation:
                    # Create new conversation
                    title = question[:50] + ('...' if len(question) > 50 else '')
                    conversation = ChatConversation.objects.create(
                        user=user,
                        title=title,
                        ai_provider=preferred_provider if preferred_provider != 'auto' else 'gemini',
                        context=context
                    )
                
                # Check user preferences
                try:
                    prefs = UserPreference.objects.get(user=user)
                    if preferred_provider == 'auto':
                        preferred_provider = prefs.preferred_ai_provider
                except UserPreference.DoesNotExist:
                    pass
                
                # Save user message
                ChatMessage.objects.create(
                    conversation=conversation,
                    role='user',
                    content=question
                )
            
            # Get AI response using provider manager
            ai_manager = get_ai_manager()
            ai_response = ai_manager.generate(
                prompt=question,
                context=context,
                preferred_provider=preferred_provider
            )
            
            # Save AI response if conversation exists
            if conversation:
                ChatMessage.objects.create(
                    conversation=conversation,
                    role='assistant',
                    content=ai_response.content,
                    model_used=ai_response.model,
                    tokens_used=ai_response.tokens_used,
                    response_time_ms=ai_response.response_time_ms
                )
                conversation.save()  # Update updated_at timestamp
            
            response_data = {
                'status': 'success',
                'question': question,
                'response': ai_response.content,
                'provider': ai_response.provider,
                'model': ai_response.model,
                'response_time_ms': ai_response.response_time_ms,
                'suggestions': [
                    'Explore related courses on this topic',
                    'Try practicing with hands-on exercises',
                    'Consider joining study groups for accountability'
                ]
            }
            
            if conversation:
                response_data['conversation_id'] = str(conversation.id)
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Chat guide error: {e}")
            return Response(
                {'status': 'error', 'message': 'Failed to generate response'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatHistoryView(APIView):
    """
    API endpoint for retrieving chat history.
    
    GET /api/chat-history/
        Returns all conversations for the authenticated user
    
    GET /api/chat-history/<conversation_id>/
        Returns messages for a specific conversation
    """
    # No authentication classes - we'll handle it manually to avoid 401 before view runs
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def _get_user_from_token(self, request):
        """Manually authenticate user from JWT token."""
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
        
        auth = JWTAuthentication()
        try:
            # Try to authenticate
            result = auth.authenticate(request)
            if result:
                return result[0]  # Return user
        except (InvalidToken, TokenError) as e:
            logger.warning(f"Token validation failed: {e}")
        except Exception as e:
            logger.warning(f"Auth error: {e}")
        return None
    
    def get(self, request, conversation_id=None):
        from learning.models import ChatConversation, ChatMessage
        
        # Get user from token manually
        user = self._get_user_from_token(request)
        
        if not user:
            return Response({
                'status': 'error',
                'message': 'Authentication required to view chat history'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if conversation_id:
            # Get specific conversation with messages
            try:
                conversation = ChatConversation.objects.get(
                    id=conversation_id,
                    user=user
                )
                messages = conversation.messages.all().values(
                    'id', 'role', 'content', 'model_used', 
                    'tokens_used', 'response_time_ms', 'created_at', 'is_helpful'
                )
                
                return Response({
                    'status': 'success',
                    'conversation': {
                        'id': str(conversation.id),
                        'title': conversation.title,
                        'ai_provider': conversation.ai_provider,
                        'created_at': conversation.created_at,
                        'updated_at': conversation.updated_at,
                    },
                    'messages': list(messages)
                })
            except ChatConversation.DoesNotExist:
                return Response(
                    {'status': 'error', 'message': 'Conversation not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Get all conversations
            conversations = ChatConversation.objects.filter(
                user=user,
                is_archived=False
            ).values('id', 'title', 'ai_provider', 'created_at', 'updated_at')
            
            return Response({
                'status': 'success',
                'conversations': list(conversations)
            })
    
    def delete(self, request, conversation_id=None):
        from learning.models import ChatConversation
        
        # Get user from token manually
        user = self._get_user_from_token(request)
        
        if not user:
            return Response({
                'status': 'error',
                'message': 'Authentication required to delete conversations'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not conversation_id:
            return Response(
                {'status': 'error', 'message': 'Conversation ID required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            conversation = ChatConversation.objects.get(
                id=conversation_id,
                user=user
            )
            conversation.is_archived = True
            conversation.save()
            
            return Response({
                'status': 'success',
                'message': 'Conversation archived'
            })
        except ChatConversation.DoesNotExist:
            return Response(
                {'status': 'error', 'message': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class UserPreferenceView(APIView):
    """
    API endpoint for user preferences.
    
    GET /api/preferences/
        Returns user preferences
    
    PUT /api/preferences/
        Updates user preferences
    """
    
    def get(self, request):
        from learning.models import UserPreference
        
        if not request.user.is_authenticated:
            return Response(
                {'status': 'error', 'message': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        prefs, created = UserPreference.objects.get_or_create(user=request.user)
        
        return Response({
            'status': 'success',
            'preferences': {
                'preferred_ai_provider': prefs.preferred_ai_provider,
                'ai_response_style': prefs.ai_response_style,
                'preferred_difficulty': prefs.preferred_difficulty,
                'preferred_categories': prefs.preferred_categories,
                'learning_goals': prefs.learning_goals,
                'current_role': prefs.current_role,
                'target_role': prefs.target_role,
                'skills': prefs.skills,
                'theme': prefs.theme,
                'email_notifications': prefs.email_notifications,
            }
        })
    
    def put(self, request):
        from learning.models import UserPreference
        
        if not request.user.is_authenticated:
            return Response(
                {'status': 'error', 'message': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        prefs, created = UserPreference.objects.get_or_create(user=request.user)
        
        # Update fields that are provided
        updatable_fields = [
            'preferred_ai_provider', 'ai_response_style', 'preferred_difficulty',
            'preferred_categories', 'learning_goals', 'current_role',
            'target_role', 'skills', 'theme', 'email_notifications'
        ]
        
        for field in updatable_fields:
            if field in request.data:
                setattr(prefs, field, request.data[field])
        
        prefs.save()
        
        return Response({
            'status': 'success',
            'message': 'Preferences updated'
        })


class AIProvidersView(APIView):
    """
    API endpoint for getting available AI providers.
    
    GET /api/ai-providers/
        Returns list of available AI providers
    """
    
    def get(self, request):
        from learning.ai_providers import get_ai_manager
        
        ai_manager = get_ai_manager()
        available = ai_manager.get_available_providers()
        
        providers = [
            {
                'id': 'gemini',
                'name': 'Google Gemini',
                'description': 'Google\'s most capable AI model',
                'available': 'gemini' in available
            },
            {
                'id': 'groq',
                'name': 'Groq (Llama)',
                'description': 'Fast inference with Llama 3.3 70B',
                'available': 'groq' in available
            },
            {
                'id': 'cohere',
                'name': 'Cohere',
                'description': 'Enterprise-grade language AI',
                'available': 'cohere' in available
            },
            {
                'id': 'auto',
                'name': 'Auto (Best Available)',
                'description': 'Automatically use the best available provider',
                'available': len(available) > 0
            }
        ]
        
        return Response({
            'status': 'success',
            'providers': providers,
            'available_count': len(available)
        })


# ============================================
# Focus Mode API Views
# ============================================

class FocusStatsAPIView(APIView):
    """
    API endpoint for focus session statistics.
    
    GET /api/focus/stats/
        Returns current focus session statistics
    """
    
    def get(self, request):
        stats = get_current_focus_stats()
        return Response({
            'status': 'success',
            'stats': stats
        })


# ============================================
# Student Profile Views
# ============================================

class StudentProfileView(APIView):
    """
    API endpoint for student profile management.
    """
    
    def get(self, request):
        """Get current user's profile."""
        if not request.user.is_authenticated:
            return Response(
                {'status': 'error', 'message': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            profile = StudentProfile.objects.get(user=request.user)
            serializer = StudentProfileSerializer(profile, context={'request': request})
            return Response(serializer.data)
        except StudentProfile.DoesNotExist:
            return Response(
                {'status': 'error', 'message': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# ============================================
# Health Check
# ============================================

@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint for monitoring.
    
    GET /api/health/
    """
    return Response({
        'status': 'healthy',
        'service': 'Apex Learning Platform API',
        'version': '1.0.0'
    })


@api_view(['GET'])
def api_root(request):
    """
    API root endpoint with available endpoints listing.
    
    GET /api/
    """
    return Response({
        'status': 'success',
        'message': 'Welcome to Apex Learning Platform API',
        'version': '1.0.0',
        'endpoints': {
            'courses': '/api/courses/',
            'course_detail': '/api/courses/<uuid:id>/',
            'categories': '/api/courses/categories/',
            'recommend': '/api/recommend/',
            'recommend_text': '/api/recommend/text/',
            'upload_resume': '/api/upload-resume/',
            'chat_guide': '/api/chat-guide/',
            'focus_stats': '/api/focus/stats/',
            'validate_face': '/api/validate-face/',
            'health': '/api/health/',
        }
    })


# ============================================
# Face Validation for Profile Picture
# ============================================

class FaceValidationView(APIView):
    """
    API endpoint for validating profile picture with face detection.
    Uses OpenCV to ensure exactly one face is detected (anti-bot measure).
    
    POST /api/validate-face/
        Input: image file
        Output: validation result, face count, processed image
    """
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        import cv2
        import numpy as np
        import base64
        from io import BytesIO
        
        # Check if image is provided
        if 'image' not in request.FILES:
            return Response(
                {'status': 'error', 'message': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response(
                {'status': 'error', 'message': 'Invalid file type. Use JPEG, PNG, or WebP'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'status': 'error', 'message': 'File too large. Maximum 5MB allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Read image file into numpy array
            file_bytes = np.frombuffer(image_file.read(), np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            
            if image is None:
                return Response(
                    {'status': 'error', 'message': 'Could not read image file'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Load Haar Cascade for face detection
            face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(face_cascade_path)
            
            # Detect faces with multiple parameters for accuracy
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(80, 80),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            face_count = len(faces)
            
            # Determine validation result
            if face_count == 0:
                validation_status = 'no_face'
                message = 'No face detected. Please upload a clear photo of your face.'
                is_valid = False
            elif face_count == 1:
                validation_status = 'valid'
                message = 'Face validated successfully! Your profile picture is approved.'
                is_valid = True
            else:
                validation_status = 'multiple_faces'
                message = f'{face_count} faces detected. Please upload a photo with only your face.'
                is_valid = False
            
            # Draw rectangles around detected faces for preview
            preview_image = image.copy()
            for (x, y, w, h) in faces:
                color = (0, 255, 0) if face_count == 1 else (0, 0, 255)  # Green for valid, red for invalid
                cv2.rectangle(preview_image, (x, y), (x+w, y+h), color, 3)
                
                # Add label
                label = "Valid" if face_count == 1 else f"Face {faces.tolist().index([x,y,w,h]) + 1}"
                cv2.putText(preview_image, label, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            
            # Convert preview image to base64
            _, buffer = cv2.imencode('.jpg', preview_image, [cv2.IMWRITE_JPEG_QUALITY, 85])
            preview_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # If valid, also prepare the cropped face for storage
            cropped_face_base64 = None
            if is_valid and len(faces) == 1:
                x, y, w, h = faces[0]
                # Add some padding around the face
                padding = int(min(w, h) * 0.3)
                x1 = max(0, x - padding)
                y1 = max(0, y - padding)
                x2 = min(image.shape[1], x + w + padding)
                y2 = min(image.shape[0], y + h + padding)
                
                cropped = image[y1:y2, x1:x2]
                # Resize to standard profile size
                cropped = cv2.resize(cropped, (256, 256))
                _, crop_buffer = cv2.imencode('.jpg', cropped, [cv2.IMWRITE_JPEG_QUALITY, 90])
                cropped_face_base64 = base64.b64encode(crop_buffer).decode('utf-8')
            
            # Calculate face quality metrics
            quality_metrics = {}
            if face_count == 1:
                x, y, w, h = faces[0]
                face_region = gray[y:y+h, x:x+w]
                
                # Brightness check
                brightness = np.mean(face_region)
                quality_metrics['brightness'] = 'good' if 60 < brightness < 200 else 'poor'
                
                # Sharpness check (Laplacian variance)
                laplacian = cv2.Laplacian(face_region, cv2.CV_64F)
                sharpness = laplacian.var()
                quality_metrics['sharpness'] = 'good' if sharpness > 100 else 'blurry'
                
                # Face size relative to image
                face_area_ratio = (w * h) / (image.shape[0] * image.shape[1])
                quality_metrics['size'] = 'good' if 0.1 < face_area_ratio < 0.8 else 'adjust'
            
            return Response({
                'status': 'success',
                'validation': {
                    'is_valid': is_valid,
                    'status': validation_status,
                    'message': message,
                    'face_count': face_count,
                },
                'quality': quality_metrics,
                'preview_image': f'data:image/jpeg;base64,{preview_base64}',
                'cropped_face': f'data:image/jpeg;base64,{cropped_face_base64}' if cropped_face_base64 else None
            })
            
        except Exception as e:
            logger.error(f"Face validation error: {e}")
            return Response(
                {'status': 'error', 'message': f'Face validation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SaveProfilePictureView(APIView):
    """
    Save the validated profile picture.
    
    POST /api/save-profile-pic/
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def post(self, request):
        import base64
        from django.core.files.base import ContentFile
        
        # Get the cropped face image (base64)
        cropped_face = request.data.get('cropped_face')
        
        if not cropped_face:
            return Response(
                {'status': 'error', 'message': 'No cropped face image provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Remove data URL prefix if present
            if 'base64,' in cropped_face:
                cropped_face = cropped_face.split('base64,')[1]
            
            # Decode base64
            image_data = base64.b64decode(cropped_face)
            
            # For demo: create or get a student profile
            # In production, this would use the authenticated user
            from django.contrib.auth.models import User
            user, created = User.objects.get_or_create(
                username='demo_user',
                defaults={'email': 'demo@apex.com'}
            )
            
            profile, created = StudentProfile.objects.get_or_create(user=user)
            
            # Save the profile picture
            profile.profile_pic.save(
                f'profile_{user.id}.jpg',
                ContentFile(image_data),
                save=True
            )
            
            # Get the URL
            pic_url = request.build_absolute_uri(profile.profile_pic.url) if profile.profile_pic else None
            
            return Response({
                'status': 'success',
                'message': 'Profile picture saved successfully',
                'profile_pic_url': pic_url
            })
            
        except Exception as e:
            logger.error(f"Save profile pic error: {e}")
            return Response(
                {'status': 'error', 'message': f'Failed to save profile picture: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
