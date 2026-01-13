from django.contrib import admin
from .models import Course, StudentProfile, LearningLog, FocusSession


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
