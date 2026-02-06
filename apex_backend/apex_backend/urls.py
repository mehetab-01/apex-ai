"""
URL configuration for apex_backend project.
Apex - Next-Gen AI E-Learning Platform
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('learning.api.urls')),
    path('', include('learning.urls')),
]

# Serve media files in development (in production, Nginx handles this)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
else:
    # In production, still serve media if not behind Nginx (fallback)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
