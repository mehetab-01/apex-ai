"""
Apex Learning Platform - Authentication Serializers
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import ApexUser, OTPVerification
import re


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = ApexUser
        fields = [
            'email', 'phone_number', 'full_name',
            'password', 'password_confirm', 'auth_provider'
        ]
        extra_kwargs = {
            'email': {'required': False},
            'phone_number': {'required': False},
        }
    
    def validate(self, attrs):
        email = attrs.get('email')
        phone_number = attrs.get('phone_number')
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        auth_provider = attrs.get('auth_provider', 'email')
        
        # Must have either email or phone
        if not email and not phone_number:
            raise serializers.ValidationError(
                "Either email or phone number is required."
            )
        
        # Password validation for email/phone auth
        if auth_provider in ['email', 'phone']:
            if not password:
                raise serializers.ValidationError(
                    {"password": "Password is required."}
                )
            if password != password_confirm:
                raise serializers.ValidationError(
                    {"password_confirm": "Passwords do not match."}
                )
        
        # Check for existing users
        if email and ApexUser.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                {"email": "A user with this email already exists."}
            )
        
        if phone_number and ApexUser.objects.filter(phone_number=phone_number).exists():
            raise serializers.ValidationError(
                {"phone_number": "A user with this phone number already exists."}
            )
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password', None)
        
        user = ApexUser.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class EmailLoginSerializer(serializers.Serializer):
    """Serializer for email/password login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        try:
            user = ApexUser.objects.get(email=email)
        except ApexUser.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")
        
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")
        
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        
        attrs['user'] = user
        return attrs


class PhoneLoginSerializer(serializers.Serializer):
    """Serializer for phone number login (sends OTP)."""
    
    phone_number = serializers.CharField()
    
    def validate_phone_number(self, value):
        # Basic phone validation
        if not re.match(r'^\+?1?\d{9,15}$', value):
            raise serializers.ValidationError("Invalid phone number format.")
        
        try:
            user = ApexUser.objects.get(phone_number=value)
        except ApexUser.DoesNotExist:
            raise serializers.ValidationError("No account found with this phone number.")
        
        return value


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for OTP verification."""
    
    phone_number = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    otp_code = serializers.CharField(max_length=6, min_length=6)
    
    def validate(self, attrs):
        if not attrs.get('phone_number') and not attrs.get('email'):
            raise serializers.ValidationError(
                "Either phone_number or email is required."
            )
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth authentication."""
    
    token = serializers.CharField(help_text="Google ID token")
    
    def validate_token(self, value):
        # Token validation will be done in the view
        if not value:
            raise serializers.ValidationError("Token is required.")
        return value


class FaceValidationSerializer(serializers.Serializer):
    """Serializer for face validation during onboarding."""
    
    image = serializers.ImageField(help_text="Profile picture to validate")
    
    def validate_image(self, value):
        # Check file size (max 5MB)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image size must be less than 5MB.")
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Invalid image format. Use JPEG, PNG, or WebP."
            )
        
        return value


class CompleteOnboardingSerializer(serializers.Serializer):
    """Serializer for completing onboarding with face-validated profile pic."""
    
    cropped_face = serializers.CharField(
        help_text="Base64 encoded cropped face image"
    )
    full_name = serializers.CharField(
        max_length=255,
        required=False,
        help_text="User's full name"
    )


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile display."""
    
    display_name = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    display_picture_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ApexUser
        fields = [
            'id', 'email', 'phone_number', 'full_name',
            'display_name', 'profile_picture_url', 'display_picture_url',
            'college', 'branch', 'interests', 'bio',
            'face_validated', 'is_verified', 'onboarding_completed',
            'auth_provider', 'focus_points', 'total_focus_time_minutes',
            'courses_completed', 'created_at'
        ]
        read_only_fields = ['id', 'face_validated', 'is_verified', 'created_at']
    
    def get_display_name(self, obj):
        return obj.get_display_name()
    
    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None
    
    def get_display_picture_url(self, obj):
        """Get the display picture URL. Falls back to profile picture if not set."""
        if obj.display_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.display_picture.url)
            return obj.display_picture.url
        # Fall back to profile picture if display picture not set
        return self.get_profile_picture_url(obj)


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    interests = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = ApexUser
        fields = ['full_name', 'college', 'branch', 'interests', 'bio']
    
    def update(self, instance, validated_data):
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.college = validated_data.get('college', instance.college)
        instance.branch = validated_data.get('branch', instance.branch)
        instance.interests = validated_data.get('interests', instance.interests)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.save()
        return instance


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            ApexUser.objects.get(email=value)
        except ApexUser.DoesNotExist:
            raise serializers.ValidationError("No account found with this email.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs
