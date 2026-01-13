"""
Apex Learning Platform - Main App URLs
"""

from django.urls import path
from . import views

urlpatterns = [
    # Focus Mode Video Stream
    path('video_feed/', views.video_feed, name='video_feed'),
    path('focus_stats/', views.focus_stats, name='focus_stats'),
    path('end_focus_session/', views.end_focus_session, name='end_focus_session'),
]
