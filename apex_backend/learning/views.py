"""
Apex Learning Platform - Django Views
======================================
This module contains Django views for non-API endpoints,
including the video feed streaming for Focus Mode.
"""

from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .focus_mode import gen_frames, get_current_focus_stats, stop_focus_session


@require_GET
def video_feed(request):
    """
    Video feed endpoint for Focus Mode streaming.
    
    This view returns a streaming response that continuously
    yields JPEG frames from the webcam with face detection.
    
    The frontend consumes this by setting it as the src of an
    <img> tag, which automatically handles the multipart stream.
    
    Returns:
        StreamingHttpResponse: Multipart JPEG video stream
    """
    return StreamingHttpResponse(
        gen_frames(),
        content_type='multipart/x-mixed-replace; boundary=frame'
    )


@require_GET
def focus_stats(request):
    """
    Get current Focus Mode session statistics.
    
    Returns:
        JsonResponse: Current session statistics
    """
    stats = get_current_focus_stats()
    return JsonResponse(stats)


@csrf_exempt
@require_POST
def end_focus_session(request):
    """
    End the current Focus Mode session.
    
    Returns:
        JsonResponse: Final session statistics
    """
    stats = stop_focus_session()
    return JsonResponse({
        'status': 'success',
        'message': 'Focus session ended',
        'stats': stats
    })
