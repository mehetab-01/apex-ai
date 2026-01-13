"""
Apex Learning Platform - DRF API Views
=======================================
This module implements the REST API endpoints using Django REST Framework.

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
from rest_framework.response import Response
from rest_framework.views import APIView
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
    queryset = Course.objects.all()
    serializer_class = CourseDetailSerializer


class CourseCategoriesView(APIView):
    """
    API endpoint to get available course categories.
    
    GET /api/courses/categories/
    """
    
    def get(self, request):
        categories = [
            {'value': value, 'label': label}
            for value, label in Course.CATEGORY_CHOICES
        ]
        return Response(categories)


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
        Output: AI-generated career roadmap and course suggestions
    """
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
            
            # Get course recommendations based on skills
            recommender = get_recommender()
            recommended_courses = recommender.get_recommendations_for_text(
                query_text=analysis.get('skills_text', resume_text),
                top_n=5
            )
            
            return Response({
                'status': 'success',
                'analysis': analysis,
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
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            prompt = f"""Analyze this resume and provide a structured response in JSON format with the following:

1. "extracted_skills": A list of technical and soft skills found in the resume
2. "experience_level": One of "entry", "mid", "senior", or "expert"
3. "suggested_categories": A list of relevant learning categories from: web_development, mobile_development, data_science, machine_learning, artificial_intelligence, cloud_computing, cybersecurity, devops, blockchain, game_development, ui_ux_design, database, programming_languages, software_engineering, networking
4. "career_paths": A list of 3 recommended career paths with "title" and "description"
5. "skills_gap": A list of skills the person should learn to advance their career
6. "skills_text": A comma-separated string of all skills for course matching

Resume:
{resume_text[:4000]}  

Respond only with valid JSON, no markdown formatting."""
            
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
            'git', 'agile', 'scrum', 'html', 'css', 'typescript'
        ]
        
        for skill in skill_keywords:
            if skill in text_lower:
                skills.append(skill.title())
        
        categories = []
        if any(s in text_lower for s in ['python', 'data', 'machine learning', 'pandas']):
            categories.append('data_science')
        if any(s in text_lower for s in ['react', 'javascript', 'html', 'css', 'frontend']):
            categories.append('web_development')
        if any(s in text_lower for s in ['aws', 'cloud', 'azure', 'gcp']):
            categories.append('cloud_computing')
        if any(s in text_lower for s in ['docker', 'kubernetes', 'ci/cd', 'devops']):
            categories.append('devops')
        
        if not categories:
            categories = ['programming_languages', 'software_engineering']
        
        return {
            'extracted_skills': skills if skills else ['Programming', 'Problem Solving'],
            'experience_level': 'mid',
            'suggested_categories': categories,
            'career_paths': [
                {
                    'title': 'Full Stack Developer',
                    'description': 'Build complete web applications from frontend to backend'
                },
                {
                    'title': 'Data Scientist',
                    'description': 'Analyze data and build machine learning models'
                },
                {
                    'title': 'DevOps Engineer',
                    'description': 'Manage infrastructure and deployment pipelines'
                }
            ],
            'skills_gap': ['Cloud Architecture', 'System Design', 'Leadership'],
            'skills_text': ', '.join(skills) if skills else 'programming, software development'
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
        
        user = request.user if request.user.is_authenticated else None
        
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
    
    def get(self, request, conversation_id=None):
        from learning.models import ChatConversation, ChatMessage
        
        if not request.user.is_authenticated:
            return Response(
                {'status': 'error', 'message': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if conversation_id:
            # Get specific conversation with messages
            try:
                conversation = ChatConversation.objects.get(
                    id=conversation_id,
                    user=request.user
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
                user=request.user,
                is_archived=False
            ).values('id', 'title', 'ai_provider', 'created_at', 'updated_at')
            
            return Response({
                'status': 'success',
                'conversations': list(conversations)
            })
    
    def delete(self, request, conversation_id=None):
        from learning.models import ChatConversation
        
        if not request.user.is_authenticated:
            return Response(
                {'status': 'error', 'message': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not conversation_id:
            return Response(
                {'status': 'error', 'message': 'Conversation ID required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            conversation = ChatConversation.objects.get(
                id=conversation_id,
                user=request.user
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
