/**
 * Apex Frontend - API Client
 * Centralized API communication with the Django backend
 */

import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

// Request interceptor for logging and auth
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('apex_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('apex_refresh_token');
        
        // If no refresh token, just reject
        if (!refreshToken) {
          console.error('API Error:', error.response?.data || error.message);
          return Promise.reject(error);
        }
        
        // If already refreshing, wait for the new token
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            });
          });
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          // Try to refresh the token
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const newAccessToken = response.data.access;
          localStorage.setItem('apex_access_token', newAccessToken);
          
          // If we got a new refresh token, save it too
          if (response.data.refresh) {
            localStorage.setItem('apex_refresh_token', response.data.refresh);
          }
          
          onTokenRefreshed(newAccessToken);
          isRefreshing = false;
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];
          
          // Refresh failed - clear tokens and redirect to login
          localStorage.removeItem('apex_access_token');
          localStorage.removeItem('apex_refresh_token');
          localStorage.removeItem('apex_user');
          
          // Only redirect if in browser
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      }
    }
    
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================
// Type Definitions
// ============================================

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  category: string;
  category_display: string;
  difficulty: string;
  difficulty_display: string;
  platform: string;
  platform_display: string;
  external_url: string | null;
  video_url: string | null;
  cover_image: string | null;
  cover_image_url: string | null;
  thumbnail_url: string | null;
  tags: string;
  tags_list: string[];
  duration_hours: number;
  total_enrollments: number;
  average_rating: number;
  syllabus?: string;
  prerequisites?: string;
  what_you_learn?: string;
  created_at: string;
}

export interface RecommendedCourse extends Course {
  similarity_score: number;
  match_percentage: number;
}

export interface FocusStats {
  frame_count: number;
  face_detected_count: number;
  eyes_open_count?: number;
  eye_open_ratio?: number;
  attention_score: number;
  accumulated_points: number;
  elapsed_seconds: number;
  elapsed_minutes: number;
  blink_count?: number;
  eye_tracking_enabled?: boolean;
}

export interface CareerAnalysis {
  extracted_skills: string[];
  experience_level: string;
  suggested_categories: string[];
  profile_summary?: string;
  strengths?: string[];
  career_paths: {
    title: string;
    description: string;
    salary_range?: string;
    match_score?: number;
    required_skills?: string[];
    growth_potential?: string;
  }[];
  skills_gap: {
    skill: string;
    importance: 'critical' | 'important' | 'nice_to_have';
    reason: string;
    related_roles: string[];
  }[] | string[];  // Support both old and new format
  skills_text: string;
}

export interface ChatResponse {
  status: string;
  question: string;
  response: string;
  suggestions: string[];
  conversation_id?: string;
  provider?: string;
  model?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string;
  tokens_used?: number;
  response_time_ms?: number;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  ai_provider: string;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  course: Course;
  status: 'viewed' | 'started' | 'in_progress' | 'completed' | 'dropped';
  status_display: string;
  progress_percentage: number;
  time_spent_minutes: number;
  focus_sessions: number;
  focus_points_earned: number;
  rating: number | null;
  notes: string;
  first_viewed_at: string;
  last_accessed_at: string;
  completed_at: string | null;
}

export interface EnrollmentStats {
  started: number;
  in_progress: number;
  completed: number;
  total: number;
}

// ============================================
// API Functions
// ============================================

/**
 * Fetch all courses with optional filters
 */
export async function getCourses(params?: {
  category?: string;
  difficulty?: string;
  platform?: string;
  free?: boolean;
  search?: string;
  ordering?: string;
}): Promise<Course[]> {
  const response = await api.get('/courses/', { params });
  return response.data;
}

/**
 * Fetch a single course by ID
 */
export async function getCourse(id: string): Promise<Course> {
  const response = await api.get(`/courses/${id}/`);
  return response.data;
}

/**
 * Get course categories
 */
export async function getCategories(): Promise<{ value: string; label: string }[]> {
  const response = await api.get('/courses/categories/');
  return response.data;
}

/**
 * Get course platforms
 */
export async function getPlatforms(): Promise<{ value: string; label: string }[]> {
  const response = await api.get('/courses/platforms/');
  return response.data;
}

/**
 * Fetch courses from external platforms (YouTube, Udemy, Coursera, NPTEL, Cisco)
 */
export interface FetchExternalCoursesParams {
  platforms?: string[];
  category?: string;
  count?: number;
  page?: number;
  save?: boolean;
}

export interface FetchExternalCoursesResponse {
  status: string;
  count: number;
  saved_count: number;
  platforms: string[];
  page: number;
  has_more: boolean;
  courses: Course[];
}

export async function fetchExternalCourses(
  params?: FetchExternalCoursesParams
): Promise<FetchExternalCoursesResponse> {
  const queryParams: Record<string, string> = {};

  if (params?.platforms && params.platforms.length > 0) {
    queryParams.platforms = params.platforms.join(',');
  }
  if (params?.category) {
    queryParams.category = params.category;
  }
  if (params?.count) {
    queryParams.count = params.count.toString();
  }
  if (params?.page) {
    queryParams.page = params.page.toString();
  }
  if (params?.save) {
    queryParams.save = 'true';
  }

  const response = await api.get('/courses/fetch-external/', { params: queryParams });
  return response.data;
}

/**
 * AI-Powered Course Discovery
 * Uses AI to generate search keywords, searches YouTube, validates results
 */
export interface DiscoverCoursesParams {
  count?: number;
  save?: boolean;
}

export interface DiscoverCoursesResponse {
  status: string;
  count: number;
  saved_count: number;
  keywords_used: string[];
  has_more: boolean;
  courses: Course[];
}

export async function discoverCourses(
  params?: DiscoverCoursesParams
): Promise<DiscoverCoursesResponse> {
  const queryParams: Record<string, string> = {};

  if (params?.count) {
    queryParams.count = params.count.toString();
  }
  if (params?.save !== undefined) {
    queryParams.save = params.save ? 'true' : 'false';
  }

  const response = await api.get('/courses/discover/', { params: queryParams });
  return response.data;
}

/**
 * Get course recommendations based on a course ID
 */
export async function getRecommendations(
  courseId: string,
  topN: number = 10
): Promise<RecommendedCourse[]> {
  const response = await api.post('/recommend/', {
    course_id: courseId,
    top_n: topN,
  });
  return response.data.recommendations;
}

/**
 * Get course recommendations based on text query
 */
export async function getTextRecommendations(
  query: string,
  topN: number = 10
): Promise<RecommendedCourse[]> {
  const response = await api.post('/recommend/text/', {
    query,
    top_n: topN,
  });
  return response.data.recommendations;
}

/**
 * Skill trend analysis for a single skill
 */
export interface SkillTrend {
  skill: string;
  demand_level: 'very_high' | 'high' | 'medium' | 'low';
  demand_score: number;
  trend: 'rising' | 'stable' | 'declining';
  growth_rate: string;
  avg_salary_impact: string;
  job_openings: string;
  top_companies: string[];
  related_roles: string[];
}

/**
 * Complete skill trends analysis
 */
export interface SkillTrendsAnalysis {
  market_overview: string;
  skill_analysis: SkillTrend[];
  hot_skills: string[];
  emerging_combinations: {
    skills: string[];
    value: string;
  }[];
  market_insights: string[];
  recommendations: string[];
  industry_demand: {
    tech: number;
    finance: number;
    healthcare: number;
    retail: number;
    other: number;
  };
}

/**
 * Upload resume for AI analysis
 */
export async function uploadResume(file: File): Promise<{
  status: string;
  analysis: CareerAnalysis;
  skill_trends: SkillTrendsAnalysis;
  recommended_courses: RecommendedCourse[];
}> {
  const formData = new FormData();
  formData.append('resume', file);
  
  const response = await api.post('/upload-resume/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Send a question to the AI chat guide
 */
export async function chatWithGuide(
  question: string,
  context?: string,
  conversationId?: string
): Promise<ChatResponse> {
  const response = await api.post('/chat-guide/', {
    question,
    context,
    conversation_id: conversationId,
  });
  return response.data;
}

/**
 * Get all chat conversations for the user
 */
export async function getChatConversations(): Promise<ChatConversation[]> {
  const response = await api.get('/chat-history/');
  return response.data.conversations || [];
}

/**
 * Get messages for a specific conversation
 */
export async function getChatMessages(conversationId: string): Promise<{
  conversation: ChatConversation;
  messages: ChatMessage[];
}> {
  const response = await api.get(`/chat-history/${conversationId}/`);
  return {
    conversation: response.data.conversation,
    messages: response.data.messages || [],
  };
}

/**
 * Delete a chat conversation
 */
export async function deleteChatConversation(conversationId: string): Promise<void> {
  await api.delete(`/chat-history/${conversationId}/`);
}

/**
 * Get current focus session stats
 */
export async function getFocusStats(): Promise<FocusStats> {
  const response = await api.get('/focus/stats/');
  return response.data.stats;
}

/**
 * Save focus session results to user profile
 */
export async function saveFocusSession(data: {
  points: number;
  duration_seconds: number;
  attention_score: number;
}): Promise<{
  status: string;
  message: string;
  user_stats: {
    total_focus_points: number;
    total_focus_time_minutes: number;
    session_points: number;
    session_duration_seconds: number;
  };
}> {
  const response = await api.post('/focus/save-session/', data);
  return response.data;
}

/**
 * End focus session and release camera
 */
export async function endFocusSession(): Promise<{
  status: string;
  message: string;
  stats: FocusStats;
}> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${API_BASE_URL}/end_focus_session/`, {
    method: 'POST',
  });
  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{
  status: string;
  service: string;
  version: string;
}> {
  const response = await api.get('/health/');
  return response.data;
}

// Video feed URL (not an API call, just the URL for img src)
export const VIDEO_FEED_URL = `${API_BASE_URL}/video_feed/`;

// Focus stats polling URL
export const FOCUS_STATS_URL = `${API_BASE_URL}/focus_stats/`;

/**
 * Validate face in profile picture
 */
export async function validateFace(imageFile: File): Promise<{
  status: string;
  validation: {
    is_valid: boolean;
    status: 'valid' | 'no_face' | 'multiple_faces';
    message: string;
    face_count: number;
  };
  quality: {
    brightness?: 'good' | 'poor';
    sharpness?: 'good' | 'blurry';
    size?: 'good' | 'adjust';
  };
  preview_image: string;
  cropped_face: string | null;
}> {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await api.post('/auth/validate-face/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Save validated profile picture
 */
export async function saveProfilePicture(croppedFace: string): Promise<{
  status: string;
  message: string;
  profile_pic_url: string;
}> {
  const response = await api.post('/save-profile-pic/', {
    cropped_face: croppedFace,
  });
  return response.data;
}

/**
 * Upload display picture (user avatar)
 */
export async function uploadDisplayPicture(imageFile: File): Promise<{
  status: string;
  message: string;
  display_picture_url: string;
}> {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await api.post('/auth/display-picture/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Remove display picture
 */
export async function removeDisplayPicture(): Promise<{
  status: string;
  message: string;
}> {
  const response = await api.delete('/auth/display-picture/');
  return response.data;
}

// ============================================
// Course Enrollment API Functions
// ============================================

/**
 * Enroll in a course
 */
export async function enrollInCourse(courseId: string): Promise<{
  status: string;
  message: string;
  enrollment: Enrollment;
  is_new: boolean;
}> {
  const response = await api.post(`/courses/${courseId}/enroll/`);
  return response.data;
}

/**
 * Check enrollment status for a course
 */
export async function getEnrollmentStatus(courseId: string): Promise<{
  status: string;
  is_enrolled: boolean;
  enrollment: Enrollment | null;
}> {
  const response = await api.get(`/courses/${courseId}/enrollment-status/`);
  return response.data;
}

/**
 * Get all user enrollments
 */
export async function getUserEnrollments(statusFilter?: string): Promise<{
  status: string;
  count: number;
  stats: EnrollmentStats;
  enrollments: Enrollment[];
}> {
  const params = statusFilter ? { status: statusFilter } : {};
  const response = await api.get('/enrollments/', { params });
  return response.data;
}

/**
 * Update enrollment progress
 */
export async function updateEnrollment(
  enrollmentId: string,
  data: {
    progress_percentage?: number;
    status?: string;
    time_spent_minutes?: number;
    rating?: number;
    notes?: string;
  }
): Promise<{
  status: string;
  message: string;
  enrollment: Enrollment;
}> {
  const response = await api.put(`/enrollments/${enrollmentId}/`, data);
  return response.data;
}

// ============================================
// YouTube Video Info API Functions
// ============================================

export interface YouTubeChapter {
  title: string;
  timestamp: string;
  seconds: number;
}

export interface PlaylistVideo {
  position: number;
  video_id: string;
  title: string;
  thumbnail: string;
  channel?: string;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channel: string;
  published_at: string;
  view_count: number;
  like_count: number;
  duration_seconds: number;
  duration_formatted: string;
}

export interface YouTubePlaylistInfo {
  id: string;
  title: string;
  videos: PlaylistVideo[];
  total_videos: number;
}

export interface YouTubeVideoInfoResponse {
  status: string;
  video: YouTubeVideoInfo | null;
  chapters: YouTubeChapter[];
  playlist: YouTubePlaylistInfo | null;
}

/**
 * Get YouTube video info including chapters and playlist
 */
export async function getYouTubeVideoInfo(
  videoId?: string,
  playlistId?: string
): Promise<YouTubeVideoInfoResponse> {
  const params: Record<string, string> = {};
  if (videoId) params.video_id = videoId;
  if (playlistId) params.playlist_id = playlistId;

  const response = await api.get('/youtube/video-info/', { params });
  return response.data;
}

export default api;
