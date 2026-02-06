from django.contrib import admin
from .models import Course, StudentProfile, LearningLog, FocusSession, StudyRoom, RoomParticipant, RoomMessage


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'instructor', 'category', 'difficulty', 'price', 'is_published', 'created_at']
    list_filter = ['category', 'difficulty', 'is_published']
    search_fields = ['title', 'description', 'instructor', 'tags']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'instructor')
        }),
        ('Categorization', {
            'fields': ('category', 'difficulty', 'tags')
        }),
        ('Pricing & Duration', {
            'fields': ('price', 'duration_hours')
        }),
        ('Media', {
            'fields': ('video_url', 'cover_image')
        }),
        ('Statistics', {
            'fields': ('total_enrollments', 'average_rating')
        }),
        ('Status', {
            'fields': ('is_published',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'focus_points', 'courses_completed', 'total_learning_hours', 'created_at']
    search_fields = ['user__username', 'user__email', 'skills']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user', 'profile_pic')
        }),
        ('Career', {
            'fields': ('resume', 'skills', 'career_interests')
        }),
        ('Focus Mode', {
            'fields': ('focus_points', 'total_focus_time_minutes')
        }),
        ('Learning Stats', {
            'fields': ('preferred_difficulty', 'courses_completed', 'total_learning_hours')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(LearningLog)
class LearningLogAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'status', 'progress_percentage', 'last_accessed_at']
    list_filter = ['status']
    search_fields = ['student__user__username', 'course__title']
    readonly_fields = ['id', 'first_viewed_at', 'last_accessed_at']


@admin.register(FocusSession)
class FocusSessionAdmin(admin.ModelAdmin):
    list_display = ['student', 'duration_minutes', 'points_earned', 'attention_score', 'is_active', 'started_at']
    list_filter = ['is_active']
    search_fields = ['student__user__username']
    readonly_fields = ['id', 'started_at']


@admin.register(StudyRoom)
class StudyRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_code', 'host', 'category', 'status', 'get_participant_count', 'max_participants', 'created_at']
    list_filter = ['status', 'category', 'is_private']
    search_fields = ['name', 'room_code', 'host__email']
    readonly_fields = ['id', 'room_code', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_participant_count(self, obj):
        return obj.get_participant_count()
    get_participant_count.short_description = 'Active Participants'


@admin.register(RoomParticipant)
class RoomParticipantAdmin(admin.ModelAdmin):
    list_display = ['user', 'room', 'is_active', 'focus_time_minutes', 'focus_points_earned', 'joined_at']
    list_filter = ['is_active']
    search_fields = ['user__email', 'room__name']
    readonly_fields = ['id', 'joined_at']


@admin.register(RoomMessage)
class RoomMessageAdmin(admin.ModelAdmin):
    list_display = ['room', 'sender', 'message_type', 'content_short', 'created_at']
    list_filter = ['message_type']
    search_fields = ['content', 'room__name']
    readonly_fields = ['id', 'created_at']

    def content_short(self, obj):
        return obj.content[:60] + '...' if len(obj.content) > 60 else obj.content
    content_short.short_description = 'Content'
