"""
Apex Learning Platform - Custom User Model
==========================================
Custom user model supporting email, phone, and Google OAuth authentication
with OpenCV face-validated profile pictures.
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
import uuid


class ApexUserManager(BaseUserManager):
    """Custom manager for ApexUser model."""
    
    def create_user(self, email=None, phone_number=None, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email and not phone_number:
            raise ValueError('User must have either email or phone number')
        
        if email:
            email = self.normalize_email(email)
        
        user = self.model(
            email=email,
            phone_number=phone_number,
            **extra_fields
        )
        
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email=email, password=password, **extra_fields)


class ApexUser(AbstractBaseUser, PermissionsMixin):
    """
    Custom User Model for Apex Platform.
    
    Supports authentication via:
    - Email + Password
    - Phone Number + OTP
    - Google OAuth
    
    Requires face-validated profile picture during onboarding.
    """
    
    # Phone number validator
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    
    # Primary identifier
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    # Authentication fields
    email = models.EmailField(
        max_length=255,
        unique=True,
        blank=True,
        null=True,
        help_text="User's email address"
    )
    
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        unique=True,
        blank=True,
        null=True,
        help_text="User's phone number with country code"
    )
    
    # Profile information
    full_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="User's full name"
    )
    
    # Education details
    college = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="User's college/university name"
    )
    
    branch = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="User's branch/department of study"
    )
    
    interests = models.JSONField(
        default=list,
        blank=True,
        help_text="User's learning interests as a list"
    )
    
    bio = models.TextField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Short bio about the user"
    )
    
    # Face-validated profile picture (required for onboarding/verification)
    profile_picture = models.ImageField(
        upload_to='profile_pics/',
        blank=True,
        null=True,
        help_text="Face-validated profile picture for verification"
    )
    
    # Display picture (user's chosen avatar/profile pic)
    display_picture = models.ImageField(
        upload_to='display_pics/',
        blank=True,
        null=True,
        help_text="User's display picture for their profile"
    )
    
    # Face validation status
    face_validated = models.BooleanField(
        default=False,
        help_text="Whether the profile picture has passed face validation"
    )
    
    # OAuth fields
    google_id = models.CharField(
        max_length=255,
        unique=True,
        blank=True,
        null=True,
        help_text="Google OAuth ID"
    )
    
    auth_provider = models.CharField(
        max_length=50,
        default='email',
        choices=[
            ('email', 'Email'),
            ('phone', 'Phone'),
            ('google', 'Google'),
        ],
        help_text="Primary authentication provider"
    )
    
    # Verification status
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether the user has verified their email/phone"
    )
    
    email_verified = models.BooleanField(
        default=False,
        help_text="Whether email is verified"
    )
    
    phone_verified = models.BooleanField(
        default=False,
        help_text="Whether phone is verified"
    )
    
    # Onboarding completion
    onboarding_completed = models.BooleanField(
        default=False,
        help_text="Whether user has completed onboarding (including face validation)"
    )
    
    # Account status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(blank=True, null=True)
    
    # Learning stats (moved from StudentProfile for unified model)
    focus_points = models.PositiveIntegerField(default=0)
    total_focus_time_minutes = models.PositiveIntegerField(default=0)
    courses_completed = models.PositiveIntegerField(default=0)
    
    objects = ApexUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'apex_users'
        verbose_name = 'Apex User'
        verbose_name_plural = 'Apex Users'
    
    def __str__(self):
        return self.email or self.phone_number or str(self.id)
    
    def get_display_name(self):
        """Get user's display name."""
        if self.full_name:
            return self.full_name
        if self.email:
            return self.email.split('@')[0]
        if self.phone_number:
            return f"User {self.phone_number[-4:]}"
        return "Apex User"
    
    @property
    def is_onboarding_complete(self):
        """Check if onboarding is complete."""
        return self.face_validated and self.is_verified


class OTPVerification(models.Model):
    """Model for storing OTP verification codes."""
    
    VERIFICATION_TYPE_CHOICES = [
        ('email', 'Email Verification'),
        ('phone', 'Phone Verification'),
        ('password_reset', 'Password Reset'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(ApexUser, on_delete=models.CASCADE, related_name='otp_verifications')
    
    verification_type = models.CharField(max_length=20, choices=VERIFICATION_TYPE_CHOICES)
    otp_code = models.CharField(max_length=6)
    
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'apex_otp_verifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OTP for {self.user} - {self.verification_type}"


class LoginHistory(models.Model):
    """Track user login history for security."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(ApexUser, on_delete=models.CASCADE, related_name='login_history')
    
    login_method = models.CharField(max_length=20)  # email, phone, google
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    success = models.BooleanField(default=True)
    failure_reason = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'apex_login_history'
        ordering = ['-created_at']
        verbose_name_plural = 'Login histories'
