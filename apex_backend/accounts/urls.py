"""
Apex Learning Platform - Accounts URL Configuration
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Registration
    path('register/', views.RegisterView.as_view(), name='register'),
    
    # Login endpoints
    path('login/email/', views.EmailLoginView.as_view(), name='login_email'),
    path('login/phone/', views.PhoneLoginView.as_view(), name='login_phone'),
    path('google/', views.GoogleAuthView.as_view(), name='google_auth'),
    
    # OTP verification
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify_otp'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend_otp'),
    
    # Face validation & onboarding
    path('validate-face/', views.FaceValidationView.as_view(), name='validate_face'),
    path('complete-onboarding/', views.CompleteOnboardingView.as_view(), name='complete_onboarding'),
    
    # Profile
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    
    # Token management
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
]
