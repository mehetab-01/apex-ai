"""
Apex Learning Platform - Authentication Views
==============================================
Handles user registration, login, and onboarding with face validation.
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
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'status': 'success',
                'message': 'Profile updated successfully',
                'user': serializer.data
            })
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


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
