from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import ApexUser, OTPVerification, LoginHistory


@admin.register(ApexUser)
class ApexUserAdmin(UserAdmin):
    list_display = ['email', 'phone_number', 'full_name', 'is_verified', 'face_validated', 'auth_provider', 'created_at']
    list_filter = ['is_verified', 'face_validated', 'auth_provider', 'is_active', 'is_staff']
    search_fields = ['email', 'phone_number', 'full_name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone_number', 'profile_picture')}),
        ('Verification', {'fields': ('is_verified', 'email_verified', 'phone_verified', 'face_validated')}),
        ('OAuth', {'fields': ('google_id', 'auth_provider')}),
        ('Onboarding', {'fields': ('onboarding_completed',)}),
        ('Stats', {'fields': ('focus_points', 'total_focus_time_minutes', 'courses_completed')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login_at', 'created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login_at']
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone_number', 'password1', 'password2'),
        }),
    )


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'verification_type', 'otp_code', 'is_used', 'expires_at', 'created_at']
    list_filter = ['verification_type', 'is_used']
    search_fields = ['user__email', 'user__phone_number']
    ordering = ['-created_at']


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'login_method', 'ip_address', 'success', 'created_at']
    list_filter = ['login_method', 'success']
    search_fields = ['user__email', 'user__phone_number', 'ip_address']
    ordering = ['-created_at']
