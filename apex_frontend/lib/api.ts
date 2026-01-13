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

// Request interceptor for logging and auth
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('apex_token');
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
  video_url: string | null;
  cover_image: string | null;
  cover_image_url: string | null;
  tags: string;
  tags_list: string[];
  duration_hours: number;
  total_enrollments: number;
  average_rating: number;
  created_at: string;
}

export interface RecommendedCourse extends Course {
  similarity_score: number;
  match_percentage: number;
}

export interface FocusStats {
  frame_count: number;
  face_detected_count: number;
  attention_score: number;
  accumulated_points: number;
  elapsed_seconds: number;
  elapsed_minutes: number;
}

export interface CareerAnalysis {
  extracted_skills: string[];
  experience_level: string;
  suggested_categories: string[];
  career_paths: {
    title: string;
    description: string;
  }[];
  skills_gap: string[];
  skills_text: string;
}

export interface ChatResponse {
  status: string;
  question: string;
  response: string;
  suggestions: string[];
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
 * Upload resume for AI analysis
 */
export async function uploadResume(file: File): Promise<{
  status: string;
  analysis: CareerAnalysis;
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
  context?: string
): Promise<ChatResponse> {
  const response = await api.post('/chat-guide/', {
    question,
    context,
  });
  return response.data;
}

/**
 * Get current focus session stats
 */
export async function getFocusStats(): Promise<FocusStats> {
  const response = await api.get('/focus/stats/');
  return response.data.stats;
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
  
  const response = await api.post('/validate-face/', formData, {
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

export default api;
