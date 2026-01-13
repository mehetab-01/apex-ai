"""
Apex Learning Platform - Database Models
==========================================
This module defines the core data models for the AI-powered e-learning platform.

Models:
    - Course: Represents educational courses with metadata
    - StudentProfile: Extended user profile with resume and skills
    - LearningLog: Tracks student-course interactions
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid


class Course(models.Model):
    """
    Course Model - Represents an educational course on the platform.
    
    This model stores all course-related information including metadata
    used by the recommendation engine for content-based filtering.
    """
    
    CATEGORY_CHOICES = [
        ('web_development', 'Web Development'),
        ('mobile_development', 'Mobile Development'),
        ('data_science', 'Data Science'),
        ('machine_learning', 'Machine Learning'),
        ('artificial_intelligence', 'Artificial Intelligence'),
        ('cloud_computing', 'Cloud Computing'),
        ('cybersecurity', 'Cybersecurity'),
        ('devops', 'DevOps'),
        ('blockchain', 'Blockchain'),
        ('game_development', 'Game Development'),
        ('ui_ux_design', 'UI/UX Design'),
        ('database', 'Database'),
        ('programming_languages', 'Programming Languages'),
        ('software_engineering', 'Software Engineering'),
        ('networking', 'Networking'),
        ('other', 'Other'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    
    # Primary identifier
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    # Core course information
    title = models.CharField(
        max_length=255,
        help_text="The title of the course"
    )
    
    description = models.TextField(
        help_text="Detailed description of the course content and objectives"
    )
    
    instructor = models.CharField(
        max_length=255,
        help_text="Name of the course instructor"
    )
    
    # Pricing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Course price in USD"
    )
    
    # Categorization
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='other',
        db_index=True,
        help_text="Primary category of the course"
    )
    
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='beginner',
        help_text="Difficulty level of the course"
    )
    
    # Media
    video_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL to the course introduction video"
    )
    
    cover_image = models.ImageField(
        upload_to='course_covers/',
        blank=True,
        null=True,
        help_text="Course cover image"
    )
    
    # Additional metadata for recommendations
    tags = models.TextField(
        blank=True,
        help_text="Comma-separated tags for better recommendations"
    )
    
    duration_hours = models.PositiveIntegerField(
        default=0,
        help_text="Estimated course duration in hours"
    )
    
    # Statistics
    total_enrollments = models.PositiveIntegerField(
        default=0,
        help_text="Total number of student enrollments"
    )
    
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('5.00'))
        ],
        help_text="Average student rating (0-5)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Status
    is_published = models.BooleanField(
        default=True,
        help_text="Whether the course is visible to students"
    )
    
    class Meta:
        db_table = 'apex_courses'
        ordering = ['-created_at']
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        indexes = [
            models.Index(fields=['category', 'difficulty']),
            models.Index(fields=['is_published', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.instructor}"
    
    def get_tags_list(self):
        """Returns tags as a list."""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',')]
        return []
    
    def get_combined_text(self):
        """
        Returns combined text for TF-IDF vectorization.
        Used by the recommendation engine.
        """
        parts = [
            self.title,
            self.description,
            self.category.replace('_', ' '),
            self.difficulty,
            self.tags,
            self.instructor
        ]
        return ' '.join(filter(None, parts))


class StudentProfile(models.Model):
    """
    StudentProfile Model - Extended profile for platform users.
    
    This model extends Django's built-in User model with additional
    fields specific to the learning platform, including resume
    and focus tracking for the AI features.
    """
    
    # One-to-one relationship with custom User model
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    
    # Profile media
    profile_pic = models.ImageField(
        upload_to='profile_pics/',
        blank=True,
        null=True,
        help_text="Student profile picture"
    )
    
    # Resume for AI career guidance
    resume = models.FileField(
        upload_to='resumes/',
        blank=True,
        null=True,
        help_text="PDF resume for AI career analysis"
    )
    
    # Focus Mode tracking
    focus_points = models.PositiveIntegerField(
        default=0,
        help_text="Accumulated focus points from Focus Mode sessions"
    )
    
    total_focus_time_minutes = models.PositiveIntegerField(
        default=0,
        help_text="Total time spent in Focus Mode (minutes)"
    )
    
    # Skills extracted from resume or manually added
    skills = models.TextField(
        blank=True,
        help_text="Comma-separated list of skills"
    )
    
    # Career preferences
    career_interests = models.TextField(
        blank=True,
        help_text="Student's career interests and goals"
    )
    
    # Learning preferences
    preferred_difficulty = models.CharField(
        max_length=20,
        choices=Course.DIFFICULTY_CHOICES,
        default='beginner',
        help_text="Preferred course difficulty level"
    )
    
    # Statistics
    courses_completed = models.PositiveIntegerField(
        default=0,
        help_text="Number of courses completed"
    )
    
    total_learning_hours = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total hours spent learning"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'apex_student_profiles'
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'
    
    def __str__(self):
        return f"Profile: {self.user.username}"
    
    def get_skills_list(self):
        """Returns skills as a list."""
        if self.skills:
            return [skill.strip() for skill in self.skills.split(',')]
        return []
    
    def add_focus_points(self, points):
        """Add focus points and save."""
        self.focus_points += points
        self.save(update_fields=['focus_points'])
    
    def add_focus_time(self, minutes):
        """Add focus time and save."""
        self.total_focus_time_minutes += minutes
        self.save(update_fields=['total_focus_time_minutes'])


class LearningLog(models.Model):
    """
    LearningLog Model - Tracks student-course interactions.
    
    This model records when students view, start, or complete courses,
    enabling analytics and personalized recommendations.
    """
    
    STATUS_CHOICES = [
        ('viewed', 'Viewed'),
        ('started', 'Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
    ]
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    # Relationships
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='learning_logs'
    )
    
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='learning_logs'
    )
    
    # Progress tracking
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='viewed'
    )
    
    progress_percentage = models.PositiveIntegerField(
        default=0,
        validators=[MaxValueValidator(100)],
        help_text="Course completion percentage"
    )
    
    # Time tracking
    time_spent_minutes = models.PositiveIntegerField(
        default=0,
        help_text="Time spent on this course in minutes"
    )
    
    # Focus Mode data for this course
    focus_sessions = models.PositiveIntegerField(
        default=0,
        help_text="Number of Focus Mode sessions for this course"
    )
    
    focus_points_earned = models.PositiveIntegerField(
        default=0,
        help_text="Focus points earned while studying this course"
    )
    
    # Rating (optional)
    rating = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Student rating for this course (1-5)"
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        help_text="Student's notes for this course"
    )
    
    # Timestamps
    first_viewed_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the course was completed"
    )
    
    class Meta:
        db_table = 'apex_learning_logs'
        ordering = ['-last_accessed_at']
        verbose_name = 'Learning Log'
        verbose_name_plural = 'Learning Logs'
        unique_together = ['student', 'course']  # One log per student-course pair
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['course', '-last_accessed_at']),
        ]
    
    def __str__(self):
        return f"{self.student.user.username} - {self.course.title} ({self.status})"
    
    def mark_as_completed(self):
        """Mark the course as completed."""
        from django.utils import timezone
        self.status = 'completed'
        self.progress_percentage = 100
        self.completed_at = timezone.now()
        self.save()
        
        # Update student profile
        self.student.courses_completed += 1
        self.student.save(update_fields=['courses_completed'])


class FocusSession(models.Model):
    """
    FocusSession Model - Tracks individual Focus Mode sessions.
    
    Records detailed data about each focus session including
    face detection metrics for attention tracking.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    # Relationships
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='focus_sessions'
    )
    
    learning_log = models.ForeignKey(
        LearningLog,
        on_delete=models.CASCADE,
        related_name='log_focus_sessions',
        null=True,
        blank=True
    )
    
    # Session timing
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(
        null=True,
        blank=True
    )
    
    duration_minutes = models.PositiveIntegerField(
        default=0,
        help_text="Session duration in minutes"
    )

    # Focus metrics
    points_earned = models.PositiveIntegerField(
        default=0,
        help_text="Points earned in this session"
    )
    
    # Face detection metrics
    total_frames_captured = models.PositiveIntegerField(
        default=0,
        help_text="Total frames analyzed"
    )
    
    frames_with_face_detected = models.PositiveIntegerField(
        default=0,
        help_text="Frames where face was detected"
    )
    
    attention_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
            MaxValueValidator(Decimal('100.00'))
        ],
        help_text="Calculated attention score (0-100)"
    )
    
    # Session status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether session is currently active"
    )
    
    class Meta:
        db_table = 'apex_focus_sessions'
        ordering = ['-started_at']
        verbose_name = 'Focus Session'
        verbose_name_plural = 'Focus Sessions'
    
    def __str__(self):
        return f"Focus Session: {self.student.user.username} ({self.started_at})"
    
    def end_session(self):
        """End the focus session and calculate metrics."""
        from django.utils import timezone
        
        self.is_active = False
        self.ended_at = timezone.now()
        
        # Calculate duration
        if self.started_at:
            delta = self.ended_at - self.started_at
            self.duration_minutes = int(delta.total_seconds() / 60)
        
        # Calculate attention score
        if self.total_frames_captured > 0:
            self.attention_score = Decimal(
                (self.frames_with_face_detected / self.total_frames_captured) * 100
            ).quantize(Decimal('0.01'))
        
        self.save()
        
        # Update student profile
        self.student.add_focus_points(self.points_earned)
        self.student.add_focus_time(self.duration_minutes)


# ============================================
# AI Chat Models
# ============================================

class ChatConversation(models.Model):
    """
    ChatConversation Model - Groups related chat messages into conversations.
    
    Each conversation has a title and can be continued over multiple sessions.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_conversations'
    )
    
    title = models.CharField(
        max_length=255,
        default="New Conversation",
        help_text="Conversation title (auto-generated from first message)"
    )
    
    # AI Provider used
    ai_provider = models.CharField(
        max_length=50,
        default='gemini',
        choices=[
            ('gemini', 'Google Gemini'),
            ('groq', 'Groq (Llama)'),
            ('cohere', 'Cohere'),
        ],
        help_text="AI provider used for this conversation"
    )
    
    # Context/topic
    context = models.TextField(
        blank=True,
        help_text="Additional context for the AI"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Status
    is_archived = models.BooleanField(
        default=False,
        help_text="Whether conversation is archived"
    )
    
    class Meta:
        db_table = 'apex_chat_conversations'
        ordering = ['-updated_at']
        verbose_name = 'Chat Conversation'
        verbose_name_plural = 'Chat Conversations'
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def get_message_count(self):
        return self.messages.count()


class ChatMessage(models.Model):
    """
    ChatMessage Model - Individual messages in a conversation.
    
    Stores both user messages and AI responses with metadata.
    """
    
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'AI Assistant'),
        ('system', 'System'),
    ]
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    conversation = models.ForeignKey(
        ChatConversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='user'
    )
    
    content = models.TextField(
        help_text="Message content"
    )
    
    # Token usage tracking
    tokens_used = models.PositiveIntegerField(
        default=0,
        help_text="Tokens used for this message"
    )
    
    # AI model used
    model_used = models.CharField(
        max_length=100,
        blank=True,
        help_text="Specific AI model used for response"
    )
    
    # Response time
    response_time_ms = models.PositiveIntegerField(
        default=0,
        help_text="Response time in milliseconds"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    # User feedback
    is_helpful = models.BooleanField(
        null=True,
        blank=True,
        help_text="User feedback on response helpfulness"
    )
    
    class Meta:
        db_table = 'apex_chat_messages'
        ordering = ['created_at']
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."


class UserPreference(models.Model):
    """
    UserPreference Model - Stores user preferences and settings.
    
    Includes AI preferences, learning preferences, and UI settings.
    """
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='preferences'
    )
    
    # AI Preferences
    preferred_ai_provider = models.CharField(
        max_length=50,
        default='gemini',
        choices=[
            ('gemini', 'Google Gemini'),
            ('groq', 'Groq (Llama)'),
            ('cohere', 'Cohere'),
            ('auto', 'Auto (Best Available)'),
        ],
        help_text="Preferred AI provider for chat"
    )
    
    ai_response_style = models.CharField(
        max_length=50,
        default='balanced',
        choices=[
            ('concise', 'Concise'),
            ('balanced', 'Balanced'),
            ('detailed', 'Detailed'),
        ],
        help_text="Preferred AI response verbosity"
    )
    
    # Learning Preferences
    preferred_difficulty = models.CharField(
        max_length=20,
        default='intermediate',
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
            ('expert', 'Expert'),
        ]
    )
    
    preferred_categories = models.JSONField(
        default=list,
        blank=True,
        help_text="List of preferred course categories"
    )
    
    learning_goals = models.TextField(
        blank=True,
        help_text="User's learning goals"
    )
    
    # Career Information
    current_role = models.CharField(
        max_length=255,
        blank=True,
        help_text="User's current job role"
    )
    
    target_role = models.CharField(
        max_length=255,
        blank=True,
        help_text="User's target career role"
    )
    
    skills = models.JSONField(
        default=list,
        blank=True,
        help_text="List of user's skills"
    )
    
    # UI Preferences
    theme = models.CharField(
        max_length=20,
        default='dark',
        choices=[
            ('dark', 'Dark Mode'),
            ('light', 'Light Mode'),
            ('system', 'System Default'),
        ]
    )
    
    # Notification Preferences
    email_notifications = models.BooleanField(
        default=True,
        help_text="Receive email notifications"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'apex_user_preferences'
        verbose_name = 'User Preference'
        verbose_name_plural = 'User Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.email}"