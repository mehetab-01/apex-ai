"""
Apex Learning Platform - DRF Serializers
==========================================
This module defines the serializers for converting Django models
to JSON and vice versa for the REST API.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from learning.models import Course, StudentProfile, LearningLog, FocusSession, StudyRoom, RoomParticipant, RoomMessage


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
    platform_display = serializers.CharField(
        source='get_platform_display',
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
            'platform',
            'platform_display',
            'external_url',
            'thumbnail_url',
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
    platform_display = serializers.CharField(
        source='get_platform_display',
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
            'platform',
            'platform_display',
            'external_url',
            'thumbnail_url',
            'video_url',
            'cover_image',
            'cover_image_url',
            'tags',
            'tags_list',
            'duration_hours',
            'total_enrollments',
            'average_rating',
            'syllabus',
            'prerequisites',
            'what_you_learn',
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
    category_display = serializers.CharField(required=False, allow_blank=True)
    difficulty = serializers.CharField()
    difficulty_display = serializers.CharField(required=False, allow_blank=True)
    instructor = serializers.CharField()
    price = serializers.FloatField()
    duration_hours = serializers.IntegerField(required=False, default=0)
    average_rating = serializers.FloatField()
    total_enrollments = serializers.IntegerField(required=False, default=0)
    platform = serializers.CharField(required=False, allow_blank=True)
    platform_display = serializers.CharField(required=False, allow_blank=True)
    external_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    thumbnail_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cover_image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tags = serializers.CharField(required=False, allow_blank=True)
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


# ============================================
# Study Room Serializers
# ============================================

class RoomParticipantSerializer(serializers.ModelSerializer):
    """Serializer for room participants."""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_id = serializers.CharField(source='user.id', read_only=True)
    display_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomParticipant
        fields = [
            'id',
            'user_id',
            'user_name',
            'user_email',
            'display_picture',
            'is_active',
            'is_muted',
            'is_camera_on',
            'focus_time_minutes',
            'focus_points_earned',
            'joined_at',
            'left_at',
        ]
    
    def get_display_picture(self, obj):
        if hasattr(obj.user, 'display_picture') and obj.user.display_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.display_picture.url)
            return str(obj.user.display_picture.url)
        return None


class RoomMessageSerializer(serializers.ModelSerializer):
    """Serializer for room messages."""
    
    sender_name = serializers.SerializerMethodField()
    sender_id = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomMessage
        fields = [
            'id',
            'sender_id',
            'sender_name',
            'content',
            'message_type',
            'created_at',
        ]
    
    def get_sender_name(self, obj):
        if obj.sender:
            return obj.sender.full_name
        return 'System'
    
    def get_sender_id(self, obj):
        if obj.sender:
            return str(obj.sender.id)
        return None


class StudyRoomListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for room listings."""
    
    host_name = serializers.CharField(source='host.full_name', read_only=True)
    participant_count = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = StudyRoom
        fields = [
            'id',
            'name',
            'description',
            'room_code',
            'is_private',
            'max_participants',
            'participant_count',
            'category',
            'category_display',
            'host_name',
            'status',
            'status_display',
            'pomodoro_work_minutes',
            'pomodoro_break_minutes',
            'timer_running',
            'current_round',
            'is_break',
            'created_at',
        ]
    
    def get_participant_count(self, obj):
        return obj.participants.filter(is_active=True).count()


class StudyRoomDetailSerializer(serializers.ModelSerializer):
    """Full serializer for room details with participants and messages."""
    
    host_name = serializers.CharField(source='host.full_name', read_only=True)
    host_id = serializers.CharField(source='host.id', read_only=True)
    participant_count = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
    recent_messages = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = StudyRoom
        fields = [
            'id',
            'name',
            'description',
            'room_code',
            'is_private',
            'max_participants',
            'participant_count',
            'category',
            'category_display',
            'host_id',
            'host_name',
            'status',
            'status_display',
            'pomodoro_work_minutes',
            'pomodoro_break_minutes',
            'pomodoro_rounds',
            'timer_running',
            'timer_started_at',
            'current_round',
            'is_break',
            'participants',
            'recent_messages',
            'created_at',
            'updated_at',
        ]
    
    def get_participant_count(self, obj):
        return obj.participants.filter(is_active=True).count()
    
    def get_participants(self, obj):
        active_participants = obj.participants.filter(is_active=True)
        return RoomParticipantSerializer(active_participants, many=True, context=self.context).data
    
    def get_recent_messages(self, obj):
        messages = obj.messages.order_by('-created_at')[:50]
        return RoomMessageSerializer(list(reversed(messages)), many=True, context=self.context).data


class CreateStudyRoomSerializer(serializers.Serializer):
    """Serializer for creating a study room."""
    
    name = serializers.CharField(max_length=100)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    is_private = serializers.BooleanField(default=False)
    max_participants = serializers.IntegerField(min_value=2, max_value=8, default=6)
    category = serializers.ChoiceField(
        choices=StudyRoom.CATEGORY_CHOICES,
        default='general'
    )
    pomodoro_work_minutes = serializers.IntegerField(min_value=5, max_value=60, default=25)
    pomodoro_break_minutes = serializers.IntegerField(min_value=1, max_value=30, default=5)
    pomodoro_rounds = serializers.IntegerField(min_value=1, max_value=10, default=4)


class JoinRoomSerializer(serializers.Serializer):
    """Serializer for joining a room by code."""
    
    room_code = serializers.CharField(max_length=8)


class RoomChatSerializer(serializers.Serializer):
    """Serializer for sending a chat message."""
    
    content = serializers.CharField(max_length=1000)
    message_type = serializers.ChoiceField(
        choices=RoomMessage.MESSAGE_TYPES,
        default='text'
    )
