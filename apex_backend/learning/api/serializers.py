"""
Apex Learning Platform - DRF Serializers
==========================================
This module defines the serializers for converting Django models
to JSON and vice versa for the REST API.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from learning.models import Course, StudentProfile, LearningLog, FocusSession


class UserSerializer(serializers.ModelSerializer):
    """Serializer for Django User model."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class CourseListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for course listings.
    Used for list views where full details aren't needed.
    """
    
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    difficulty_display = serializers.CharField(
        source='get_difficulty_display',
        read_only=True
    )
    cover_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'instructor',
            'price',
            'category',
            'category_display',
            'difficulty',
            'difficulty_display',
            'duration_hours',
            'average_rating',
            'total_enrollments',
            'cover_image',
            'cover_image_url',
            'created_at',
        ]
    
    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None


class CourseDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer for course details.
    Includes all course information.
    """
    
    category_display = serializers.CharField(
        source='get_category_display',
        read_only=True
    )
    difficulty_display = serializers.CharField(
        source='get_difficulty_display',
        read_only=True
    )
    tags_list = serializers.ListField(
        source='get_tags_list',
        read_only=True
    )
    cover_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'description',
            'instructor',
            'price',
            'category',
            'category_display',
            'difficulty',
            'difficulty_display',
            'video_url',
            'cover_image',
            'cover_image_url',
            'tags',
            'tags_list',
            'duration_hours',
            'total_enrollments',
            'average_rating',
            'is_published',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None


class CourseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new courses."""
    
    class Meta:
        model = Course
        fields = [
            'title',
            'description',
            'instructor',
            'price',
            'category',
            'difficulty',
            'video_url',
            'cover_image',
            'tags',
            'duration_hours',
        ]
    
    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative")
        return value


class StudentProfileSerializer(serializers.ModelSerializer):
    """Serializer for student profiles."""
    
    user = UserSerializer(read_only=True)
    skills_list = serializers.ListField(
        source='get_skills_list',
        read_only=True
    )
    profile_pic_url = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentProfile
        fields = [
            'id',
            'user',
            'profile_pic',
            'profile_pic_url',
            'resume',
            'resume_url',
            'focus_points',
            'total_focus_time_minutes',
            'skills',
            'skills_list',
            'career_interests',
            'preferred_difficulty',
            'courses_completed',
            'total_learning_hours',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'focus_points', 'total_focus_time_minutes',
            'courses_completed', 'total_learning_hours',
            'created_at', 'updated_at'
        ]
    
    def get_profile_pic_url(self, obj):
        if obj.profile_pic:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_pic.url)
            return obj.profile_pic.url
        return None
    
    def get_resume_url(self, obj):
        if obj.resume:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.url)
            return obj.resume.url
        return None


class LearningLogSerializer(serializers.ModelSerializer):
    """Serializer for learning logs."""
    
    course = CourseListSerializer(read_only=True)
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )
    
    class Meta:
        model = LearningLog
        fields = [
            'id',
            'course',
            'status',
            'status_display',
            'progress_percentage',
            'time_spent_minutes',
            'focus_sessions',
            'focus_points_earned',
            'rating',
            'notes',
            'first_viewed_at',
            'last_accessed_at',
            'completed_at',
        ]
        read_only_fields = ['id', 'first_viewed_at', 'last_accessed_at', 'completed_at']


class FocusSessionSerializer(serializers.ModelSerializer):
    """Serializer for focus sessions."""
    
    class Meta:
        model = FocusSession
        fields = [
            'id',
            'started_at',
            'ended_at',
            'duration_minutes',
            'points_earned',
            'total_frames_captured',
            'frames_with_face_detected',
            'attention_score',
            'is_active',
        ]
        read_only_fields = ['id', 'started_at']


class RecommendationRequestSerializer(serializers.Serializer):
    """Serializer for recommendation requests."""
    
    course_id = serializers.UUIDField(
        required=True,
        help_text="UUID of the course to get recommendations for"
    )
    top_n = serializers.IntegerField(
        required=False,
        default=10,
        min_value=1,
        max_value=50,
        help_text="Number of recommendations to return"
    )
    exclude_same_category = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Exclude courses in the same category"
    )


class RecommendationResponseSerializer(serializers.Serializer):
    """Serializer for recommendation responses."""
    
    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    category = serializers.CharField()
    difficulty = serializers.CharField()
    instructor = serializers.CharField()
    price = serializers.FloatField()
    duration_hours = serializers.IntegerField()
    average_rating = serializers.FloatField()
    similarity_score = serializers.FloatField()
    match_percentage = serializers.FloatField()
    cover_image = serializers.CharField(allow_blank=True)


class ResumeUploadSerializer(serializers.Serializer):
    """Serializer for resume upload requests."""
    
    resume = serializers.FileField(
        required=True,
        help_text="PDF resume file"
    )
    
    def validate_resume(self, value):
        # Check file extension
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed")
        
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size must be under 10MB")
        
        return value


class ChatGuideRequestSerializer(serializers.Serializer):
    """Serializer for AI chat guide requests."""
    
    question = serializers.CharField(
        required=True,
        max_length=2000,
        help_text="User's question for the AI study guide"
    )
    context = serializers.CharField(
        required=False,
        max_length=5000,
        allow_blank=True,
        help_text="Additional context about the user's learning journey"
    )


class ChatGuideResponseSerializer(serializers.Serializer):
    """Serializer for AI chat guide responses."""
    
    response = serializers.CharField()
    suggestions = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class CareerRoadmapSerializer(serializers.Serializer):
    """Serializer for career roadmap responses."""
    
    extracted_skills = serializers.ListField(
        child=serializers.CharField()
    )
    suggested_categories = serializers.ListField(
        child=serializers.CharField()
    )
    career_paths = serializers.ListField(
        child=serializers.DictField()
    )
    recommended_courses = serializers.ListField(
        child=serializers.DictField()
    )
    roadmap = serializers.DictField()
