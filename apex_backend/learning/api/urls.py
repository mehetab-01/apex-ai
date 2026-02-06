"""
Apex Learning Platform - API URL Configuration
"""

from django.urls import path
from . import views

urlpatterns = [
    # Root and health
    path('', views.api_root, name='api_root'),
    path('health/', views.health_check, name='health_check'),
    
    # Courses
    path('courses/', views.CourseListCreateView.as_view(), name='course_list'),
    path('courses/<uuid:pk>/', views.CourseDetailView.as_view(), name='course_detail'),
    path('courses/categories/', views.CourseCategoriesView.as_view(), name='course_categories'),
    path('courses/platforms/', views.CoursePlatformsView.as_view(), name='course_platforms'),
    path('courses/fetch-external/', views.FetchExternalCoursesView.as_view(), name='fetch_external_courses'),
    
    # Recommendations
    path('recommend/', views.RecommendationView.as_view(), name='recommend'),
    path('recommend/text/', views.TextRecommendationView.as_view(), name='recommend_text'),
    
    # AI Features
    path('upload-resume/', views.ResumeUploadView.as_view(), name='upload_resume'),
    path('chat-guide/', views.ChatGuideView.as_view(), name='chat_guide'),
    
    # Chat History
    path('chat-history/', views.ChatHistoryView.as_view(), name='chat_history'),
    path('chat-history/<uuid:conversation_id>/', views.ChatHistoryView.as_view(), name='chat_conversation'),
    
    # User Preferences
    path('preferences/', views.UserPreferenceView.as_view(), name='user_preferences'),
    
    # AI Providers
    path('ai-providers/', views.AIProvidersView.as_view(), name='ai_providers'),
    
    # Focus Mode
    path('focus/stats/', views.FocusStatsAPIView.as_view(), name='focus_stats'),
    path('focus/save-session/', views.SaveFocusSessionView.as_view(), name='save_focus_session'),
    
    # Student Profile
    path('profile/', views.StudentProfileView.as_view(), name='student_profile'),

    # Save Profile Picture (for demo purposes)
    path('save-profile-pic/', views.SaveProfilePictureView.as_view(), name='save_profile_pic'),

    # Course Enrollment
    path('courses/<uuid:course_id>/enroll/', views.CourseEnrollView.as_view(), name='course_enroll'),
    path('courses/<uuid:course_id>/enrollment-status/', views.EnrollmentStatusView.as_view(), name='enrollment_status'),
    path('enrollments/', views.UserEnrollmentsView.as_view(), name='user_enrollments'),
    path('enrollments/<uuid:enrollment_id>/', views.UpdateEnrollmentView.as_view(), name='update_enrollment'),

    # YouTube Video Info
    path('youtube/video-info/', views.YouTubeVideoInfoView.as_view(), name='youtube_video_info'),

    # ===== Collaborative Study Rooms =====
    path('rooms/', views.StudyRoomListView.as_view(), name='study_room_list'),
    path('rooms/categories/', views.RoomCategoriesView.as_view(), name='room_categories'),
    path('rooms/join-by-code/', views.JoinRoomView.as_view(), name='join_room_by_code'),
    path('rooms/<uuid:room_id>/', views.StudyRoomDetailView.as_view(), name='study_room_detail'),
    path('rooms/<uuid:room_id>/join/', views.JoinRoomView.as_view(), name='join_room'),
    path('rooms/<uuid:room_id>/leave/', views.LeaveRoomView.as_view(), name='leave_room'),
    path('rooms/<uuid:room_id>/messages/', views.RoomChatView.as_view(), name='room_chat'),
    path('rooms/<uuid:room_id>/timer/', views.RoomTimerView.as_view(), name='room_timer'),
    path('rooms/<uuid:room_id>/participants/', views.RoomParticipantsView.as_view(), name='room_participants'),
    path('rooms/<uuid:room_id>/toggle-status/', views.RoomToggleStatusView.as_view(), name='room_toggle_status'),
    path('rooms/<uuid:room_id>/heartbeat/', views.RoomHeartbeatView.as_view(), name='room_heartbeat'),
]
