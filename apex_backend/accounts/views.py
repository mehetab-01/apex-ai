"""
Apex Learning Platform - Authentication Views
==============================================
Handles user registration, login, and onboarding with face validation.
# Trigger reload - v2
"""

import os
import random
import string
import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from rest_framework_simplejwt.tokens import RefreshToken

from .models import ApexUser, OTPVerification, LoginHistory
from .serializers import (
    UserRegistrationSerializer,
    EmailLoginSerializer,
    PhoneLoginSerializer,
    OTPVerifySerializer,
    GoogleAuthSerializer,
    FaceValidationSerializer,
    CompleteOnboardingSerializer,
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

logger = logging.getLogger(__name__)


def get_tokens_for_user(user):
    """Generate JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def generate_otp():
    """Generate a 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=6))


def get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class RegisterView(APIView):
    """
    User registration endpoint.
    
    POST /api/auth/register/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate verification OTP
            otp = generate_otp()
            OTPVerification.objects.create(
                user=user,
                verification_type='email' if user.email else 'phone',
                otp_code=otp,
                expires_at=timezone.now() + timedelta(minutes=10)
            )
            
            # In production, send OTP via email/SMS
            # For demo, return it in response
            tokens = get_tokens_for_user(user)
            
            return Response({
                'status': 'success',
                'message': 'Registration successful. Please verify your account.',
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'tokens': tokens,
                'otp_code': otp,  # Remove in production - send via email/SMS instead
                'next_step': 'verify_account'
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class EmailLoginView(APIView):
    """
    Email + Password login.
    
    POST /api/auth/login/email/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = EmailLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Update last login
            user.last_login_at = timezone.now()
            user.save(update_fields=['last_login_at'])
            
            # Log login
            LoginHistory.objects.create(
                user=user,
                login_method='email',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=True
            )
            
            tokens = get_tokens_for_user(user)
            
            return Response({
                'status': 'success',
                'message': 'Login successful',
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'tokens': tokens,
                'onboarding_completed': user.onboarding_completed
            })
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class PhoneLoginView(APIView):
    """
    Phone number login - sends OTP.
    
    POST /api/auth/login/phone/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PhoneLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            user = ApexUser.objects.get(phone_number=phone_number)
            
            # Generate OTP
            otp = generate_otp()
            OTPVerification.objects.create(
                user=user,
                verification_type='phone',
                otp_code=otp,
                expires_at=timezone.now() + timedelta(minutes=5)
            )
            
            # In production, send via SMS
            return Response({
                'status': 'success',
                'message': 'OTP sent to your phone number',
                'otp_code': otp,  # Remove in production
            })
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    """
    Verify OTP for phone login or account verification.
    
    POST /api/auth/verify-otp/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        
        if serializer.is_valid():
            phone_number = serializer.validated_data.get('phone_number')
            email = serializer.validated_data.get('email')
            otp_code = serializer.validated_data['otp_code']
            
            # Find user
            try:
                if phone_number:
                    user = ApexUser.objects.get(phone_number=phone_number)
                else:
                    user = ApexUser.objects.get(email=email)
            except ApexUser.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Verify OTP
            otp_record = OTPVerification.objects.filter(
                user=user,
                otp_code=otp_code,
                is_used=False,
                expires_at__gt=timezone.now()
            ).first()
            
            if not otp_record:
                return Response({
                    'status': 'error',
                    'message': 'Invalid or expired OTP'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mark OTP as used
            otp_record.is_used = True
            otp_record.save()
            
            # Update user verification status
            if phone_number:
                user.phone_verified = True
            if email:
                user.email_verified = True
            user.is_verified = True
            user.last_login_at = timezone.now()
            user.save()
            
            # Log login
            LoginHistory.objects.create(
                user=user,
                login_method='phone' if phone_number else 'email',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=True
            )
            
            tokens = get_tokens_for_user(user)
            
            return Response({
                'status': 'success',
                'message': 'Verification successful',
                'user': UserProfileSerializer(user, context={'request': request}).data,
                'tokens': tokens,
                'onboarding_completed': user.onboarding_completed
            })
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class GoogleAuthView(APIView):
    """
    Google OAuth authentication.
    
    POST /api/auth/google/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        
        if serializer.is_valid():
            token = serializer.validated_data['token']
            
            try:
                # Verify Google token
                from google.oauth2 import id_token
                from google.auth.transport import requests as google_requests
                
                # Get Google Client ID from settings
                google_client_id = os.getenv('GOOGLE_CLIENT_ID', '')
                
                if not google_client_id:
                    return Response({
                        'status': 'error',
                        'message': 'Google authentication not configured'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Verify the token
                idinfo = id_token.verify_oauth2_token(
                    token,
                    google_requests.Request(),
                    google_client_id
                )
                
                google_id = idinfo['sub']
                email = idinfo.get('email')
                name = idinfo.get('name', '')
                picture = idinfo.get('picture', '')
                
                # Check if user exists
                user = ApexUser.objects.filter(google_id=google_id).first()
                
                if not user and email:
                    user = ApexUser.objects.filter(email=email).first()
                
                is_new_user = False
                
                if user:
                    # Update Google ID if not set
                    if not user.google_id:
                        user.google_id = google_id
                        user.save(update_fields=['google_id'])
                else:
                    # Create new user
                    is_new_user = True
                    user = ApexUser.objects.create_user(
                        email=email,
                        google_id=google_id,
                        full_name=name,
                        auth_provider='google',
                        is_verified=True,
                        email_verified=True
                    )
                
                # Update last login
                user.last_login_at = timezone.now()
                user.save(update_fields=['last_login_at'])
                
                # Log login
                LoginHistory.objects.create(
                    user=user,
                    login_method='google',
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    success=True
                )
                
                tokens = get_tokens_for_user(user)
                
                return Response({
                    'status': 'success',
                    'message': 'Google login successful',
                    'is_new_user': is_new_user,
                    'user': UserProfileSerializer(user, context={'request': request}).data,
                    'tokens': tokens,
                    'onboarding_completed': user.onboarding_completed
                })
                
            except ValueError as e:
                logger.error(f"Google token verification failed: {e}")
                return Response({
                    'status': 'error',
                    'message': 'Invalid Google token'
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Google auth error: {e}")
                return Response({
                    'status': 'error',
                    'message': 'Google authentication failed'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class FaceValidationView(APIView):
    """
    Validate face in profile picture during onboarding.
    Uses OpenCV to ensure exactly one face is detected.
    
    POST /api/auth/validate-face/
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        import cv2
        import numpy as np
        import base64
        
        if 'image' not in request.FILES:
            return Response({
                'status': 'error',
                'message': 'No image file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response({
                'status': 'error',
                'message': 'Invalid file type. Use JPEG, PNG, or WebP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response({
                'status': 'error',
                'message': 'File too large. Maximum 5MB allowed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Read image
            file_bytes = np.frombuffer(image_file.read(), np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            
            if image is None:
                return Response({
                    'status': 'error',
                    'message': 'Could not read image file'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Load face cascade
            face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(face_cascade_path)
            
            # Detect faces
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
                message = 'Face validated successfully!'
                is_valid = True
            else:
                validation_status = 'multiple_faces'
                message = f'{face_count} faces detected. Please upload a photo with only your face.'
                is_valid = False
            
            # Draw rectangles on preview
            preview_image = image.copy()
            for (x, y, w, h) in faces:
                color = (0, 255, 0) if face_count == 1 else (0, 0, 255)
                cv2.rectangle(preview_image, (x, y), (x+w, y+h), color, 3)
            
            # Encode preview
            _, buffer = cv2.imencode('.jpg', preview_image, [cv2.IMWRITE_JPEG_QUALITY, 85])
            preview_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Crop face if valid
            cropped_face_base64 = None
            if is_valid and len(faces) == 1:
                x, y, w, h = faces[0]
                padding = int(min(w, h) * 0.3)
                x1 = max(0, x - padding)
                y1 = max(0, y - padding)
                x2 = min(image.shape[1], x + w + padding)
                y2 = min(image.shape[0], y + h + padding)
                
                cropped = image[y1:y2, x1:x2]
                cropped = cv2.resize(cropped, (256, 256))
                _, crop_buffer = cv2.imencode('.jpg', cropped, [cv2.IMWRITE_JPEG_QUALITY, 90])
                cropped_face_base64 = base64.b64encode(crop_buffer).decode('utf-8')
            
            # Quality metrics
            quality_metrics = {}
            if face_count == 1:
                x, y, w, h = faces[0]
                face_region = gray[y:y+h, x:x+w]
                
                brightness = np.mean(face_region)
                quality_metrics['brightness'] = 'good' if 60 < brightness < 200 else 'poor'
                
                laplacian = cv2.Laplacian(face_region, cv2.CV_64F)
                sharpness = laplacian.var()
                quality_metrics['sharpness'] = 'good' if sharpness > 100 else 'blurry'
                
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
            return Response({
                'status': 'error',
                'message': f'Face validation failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CompleteOnboardingView(APIView):
    """
    Complete user onboarding by saving face-validated profile picture.
    
    POST /api/auth/complete-onboarding/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def post(self, request):
        import base64
        
        serializer = CompleteOnboardingSerializer(data=request.data)
        
        if serializer.is_valid():
            cropped_face = serializer.validated_data['cropped_face']
            full_name = serializer.validated_data.get('full_name')
            
            try:
                # Remove data URL prefix if present
                if 'base64,' in cropped_face:
                    cropped_face = cropped_face.split('base64,')[1]
                
                # Decode base64
                image_data = base64.b64decode(cropped_face)
                
                user = request.user
                
                # Save profile picture
                user.profile_picture.save(
                    f'profile_{user.id}.jpg',
                    ContentFile(image_data),
                    save=False
                )
                
                # Update user
                user.face_validated = True
                user.onboarding_completed = True
                
                if full_name:
                    user.full_name = full_name
                
                user.save()
                
                return Response({
                    'status': 'success',
                    'message': 'Onboarding completed successfully!',
                    'user': UserProfileSerializer(user, context={'request': request}).data
                })
                
            except Exception as e:
                logger.error(f"Complete onboarding error: {e}")
                return Response({
                    'status': 'error',
                    'message': f'Failed to complete onboarding: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class DisplayPictureUploadView(APIView):
    """
    Upload or update user's display picture (avatar).
    This is separate from the face-validated profile picture.
    
    POST /api/auth/display-picture/
    DELETE /api/auth/display-picture/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        user = request.user
        
        if 'image' not in request.FILES:
            return Response({
                'status': 'error',
                'message': 'No image provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response({
                'status': 'error',
                'message': 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response({
                'status': 'error',
                'message': 'File too large. Maximum size is 5MB.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete old display picture if exists
        if user.display_picture:
            user.display_picture.delete(save=False)
        
        # Save new display picture
        user.display_picture = image_file
        user.save()
        
        # Get the URL of the new picture
        display_picture_url = request.build_absolute_uri(user.display_picture.url)
        
        return Response({
            'status': 'success',
            'message': 'Display picture uploaded successfully',
            'display_picture_url': display_picture_url
        })
    
    def delete(self, request):
        user = request.user
        
        if user.display_picture:
            user.display_picture.delete(save=True)
            return Response({
                'status': 'success',
                'message': 'Display picture removed'
            })
        
        return Response({
            'status': 'error',
            'message': 'No display picture to remove'
        }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """
    Get or update user profile.
    
    GET /api/auth/profile/
    PUT /api/auth/profile/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'status': 'success',
            'user': UserProfileSerializer(user, context={'request': request}).data
        })
    
    def put(self, request):
        from .serializers import UserProfileUpdateSerializer
        user = request.user
        serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'status': 'success',
                'message': 'Profile updated successfully',
                'user': UserProfileSerializer(user, context={'request': request}).data
            })
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class CollegeAutocompleteView(APIView):
    """
    Get list of colleges in Mumbai for autocomplete.
    
    GET /api/auth/colleges/?q=<search_term>
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    # Comprehensive list of Mumbai colleges
    MUMBAI_COLLEGES = [
        # IIT and Premier Institutes
        "Indian Institute of Technology Bombay (IIT Bombay)",
        "Veermata Jijabai Technological Institute (VJTI)",
        "Institute of Chemical Technology (ICT Mumbai)",
        "Tata Institute of Fundamental Research (TIFR)",
        
        # University of Mumbai affiliated
        "University of Mumbai",
        "SPIT - Sardar Patel Institute of Technology",
        "DJ Sanghvi College of Engineering",
        "Dwarkadas J. Sanghvi College of Engineering",
        "K.J. Somaiya College of Engineering",
        "K.J. Somaiya Institute of Engineering and IT",
        "Thadomal Shahani Engineering College",
        "Fr. Conceicao Rodrigues College of Engineering",
        "Vidyalankar Institute of Technology",
        "Vivekanand Education Society's Institute of Technology (VESIT)",
        "Atharva College of Engineering",
        "Shah & Anchor Kutchhi Engineering College",
        "Rizvi College of Engineering",
        "M.H. Saboo Siddik College of Engineering",
        "Xavier Institute of Engineering",
        "St. Francis Institute of Technology",
        "Rajiv Gandhi Institute of Technology",
        "Pillai College of Engineering",
        "Terna Engineering College",
        "Datta Meghe College of Engineering",
        "Bharati Vidyapeeth College of Engineering",
        "Lokmanya Tilak College of Engineering",
        "Thakur College of Engineering and Technology",
        "A.C. Patil College of Engineering",
        "Alamuri Ratnamala Institute of Engineering and Technology",
        "Anjuman-I-Islam's Kalsekar Technical Campus",
        "Watumull Institute of Electronics Engineering and Computer Technology",
        "Usha Mittal Institute of Technology",
        "Yadavrao Tasgaonkar College of Engineering",
        
        # Autonomous Institutes
        "NMIMS University - Mukesh Patel School of Technology Management & Engineering",
        "Narsee Monjee Institute of Management Studies",
        "MIT World Peace University (Mumbai Campus)",
        
        # Arts, Science & Commerce
        "St. Xavier's College, Mumbai",
        "Jai Hind College",
        "H.R. College of Commerce and Economics",
        "Mithibai College",
        "N.M. College of Commerce and Economics",
        "Ruia College",
        "Wilson College",
        "Sophia College for Women",
        "K.C. College",
        "Lala Lajpat Rai College of Commerce and Economics",
        "Poddar College",
        "R.A. Podar College of Commerce and Economics",
        "Sydenham College of Commerce and Economics",
        "Sathaye College",
        "M.D. College",
        
        # Medical Colleges
        "Grant Medical College and Sir J.J. Group of Hospitals",
        "Seth G.S. Medical College and KEM Hospital",
        "Topiwala National Medical College and B.Y.L. Nair Hospital",
        "Lokmanya Tilak Municipal Medical College",
        
        # Management Institutes
        "S.P. Jain Institute of Management and Research",
        "Jamnalal Bajaj Institute of Management Studies",
        "Welingkar Institute of Management",
        "K.J. Somaiya Institute of Management",
        "NMIMS School of Business Management",
        
        # Other Notable Colleges
        "SNDT Women's University",
        "Nirmala Niketan College of Home Science",
        "College of Social Work, Nirmala Niketan",
        "Indian Institute of Art and Design (IIAD Mumbai)",
        "Sir J.J. Institute of Applied Art",
        "Sir J.J. School of Art",
    ]
    
    def get(self, request):
        query = request.query_params.get('q', '').lower().strip()
        
        if not query:
            return Response({
                'status': 'success',
                'colleges': self.MUMBAI_COLLEGES[:20]
            })
        
        # Filter colleges matching the query
        filtered = [
            college for college in self.MUMBAI_COLLEGES
            if query in college.lower()
        ]
        
        return Response({
            'status': 'success',
            'colleges': filtered[:20]
        })


class BranchAutocompleteView(APIView):
    """
    Get list of engineering branches for autocomplete.
    
    GET /api/auth/branches/?q=<search_term>
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    # Comprehensive list of engineering and other branches
    ENGINEERING_BRANCHES = [
        # Core Engineering
        "Computer Engineering",
        "Computer Science and Engineering",
        "Information Technology",
        "Electronics Engineering",
        "Electronics and Telecommunication Engineering",
        "Electronics and Communication Engineering",
        "Electrical Engineering",
        "Mechanical Engineering",
        "Civil Engineering",
        "Chemical Engineering",
        "Production Engineering",
        "Instrumentation Engineering",
        "Biomedical Engineering",
        "Biotechnology Engineering",
        
        # Specialized Engineering
        "Artificial Intelligence and Machine Learning",
        "AI & ML",
        "Data Science",
        "Data Science and Engineering",
        "Cyber Security",
        "Internet of Things (IoT)",
        "Robotics and Automation",
        "Mechatronics Engineering",
        "Aerospace Engineering",
        "Automobile Engineering",
        "Marine Engineering",
        "Petroleum Engineering",
        "Mining Engineering",
        "Textile Engineering",
        "Agricultural Engineering",
        "Environmental Engineering",
        "Food Technology",
        "Pharmaceutical Engineering",
        
        # Computer Related
        "Software Engineering",
        "Cloud Computing",
        "Computer Science with AI",
        "Computer Science with Data Science",
        "Information Science",
        
        # Science Branches
        "B.Sc. Computer Science",
        "B.Sc. Information Technology",
        "B.Sc. Physics",
        "B.Sc. Chemistry",
        "B.Sc. Mathematics",
        "B.Sc. Electronics",
        "B.Sc. Biotechnology",
        "B.Sc. Data Science",
        
        # Commerce & Management
        "B.Com",
        "BBA",
        "BMS - Bachelor of Management Studies",
        "BAF - Bachelor of Accounting and Finance",
        "BBI - Bachelor of Banking and Insurance",
        "BFM - Bachelor of Financial Markets",
        "BMM - Bachelor of Mass Media",
        
        # Other Professional
        "B.Arch - Architecture",
        "B.Des - Design",
        "BCA - Bachelor of Computer Applications",
        "MCA - Master of Computer Applications",
        "MBA",
        "M.Tech",
        "M.E.",
        "M.Sc. Computer Science",
        "M.Sc. Information Technology",
    ]
    
    def get(self, request):
        query = request.query_params.get('q', '').lower().strip()
        
        if not query:
            return Response({
                'status': 'success',
                'branches': self.ENGINEERING_BRANCHES[:20]
            })
        
        # Filter branches matching the query
        filtered = [
            branch for branch in self.ENGINEERING_BRANCHES
            if query in branch.lower()
        ]
        
        return Response({
            'status': 'success',
            'branches': filtered[:20]
        })


class InterestsListView(APIView):
    """
    Get list of suggested interests for autocomplete.
    
    GET /api/auth/interests/
    """
    permission_classes = [AllowAny]
    
    SUGGESTED_INTERESTS = [
        # Programming Languages
        "Python", "JavaScript", "Java", "C++", "C", "Rust", "Go", "TypeScript",
        "Kotlin", "Swift", "Ruby", "PHP", "R", "Scala", "Dart",
        
        # Web Development
        "Web Development", "Frontend Development", "Backend Development",
        "Full Stack Development", "React", "Angular", "Vue.js", "Next.js",
        "Node.js", "Django", "Flask", "Spring Boot", "Express.js",
        
        # Data & AI
        "Machine Learning", "Deep Learning", "Artificial Intelligence",
        "Data Science", "Data Analytics", "Data Engineering",
        "Natural Language Processing", "Computer Vision",
        "TensorFlow", "PyTorch", "Pandas", "NumPy",
        
        # Cloud & DevOps
        "Cloud Computing", "AWS", "Azure", "Google Cloud", "DevOps",
        "Docker", "Kubernetes", "CI/CD", "Terraform", "Jenkins",
        
        # Mobile Development
        "Mobile Development", "Android Development", "iOS Development",
        "React Native", "Flutter", "Xamarin",
        
        # Database
        "Databases", "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis",
        
        # Security
        "Cybersecurity", "Ethical Hacking", "Network Security",
        "Penetration Testing", "Cryptography",
        
        # Other Tech
        "Blockchain", "Web3", "Cryptocurrency", "Smart Contracts",
        "Game Development", "Unity", "Unreal Engine",
        "AR/VR", "Embedded Systems", "IoT",
        
        # Soft Skills
        "System Design", "Software Architecture", "Problem Solving",
        "Data Structures", "Algorithms", "Competitive Programming",
        "Open Source", "Technical Writing", "UI/UX Design",
    ]
    
    def get(self, request):
        query = request.query_params.get('q', '').lower().strip()
        
        if not query:
            return Response({
                'status': 'success',
                'interests': self.SUGGESTED_INTERESTS
            })
        
        # Filter interests matching the query
        filtered = [
            interest for interest in self.SUGGESTED_INTERESTS
            if query in interest.lower()
        ]
        
        return Response({
            'status': 'success',
            'interests': filtered
        })


class LogoutView(APIView):
    """
    Logout user (blacklist refresh token).
    
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'status': 'success',
                'message': 'Logged out successfully'
            })
        except Exception as e:
            return Response({
                'status': 'success',
                'message': 'Logged out'
            })


class ResendOTPView(APIView):
    """
    Resend OTP verification code.
    
    POST /api/auth/resend-otp/
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')
        
        if not email and not phone_number:
            return Response({
                'status': 'error',
                'message': 'Email or phone number required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if email:
                user = ApexUser.objects.get(email=email)
            else:
                user = ApexUser.objects.get(phone_number=phone_number)
        except ApexUser.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Generate new OTP
        otp = generate_otp()
        OTPVerification.objects.create(
            user=user,
            verification_type='email' if email else 'phone',
            otp_code=otp,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        return Response({
            'status': 'success',
            'message': 'OTP sent successfully',
            'otp_code': otp  # Remove in production
        })
