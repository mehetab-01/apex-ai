"""
Apex Learning Platform - Focus Mode Video Stream
=================================================
This module implements the Focus Mode feature using MediaPipe for
real-time face detection, eye tracking, and attention monitoring.

Features:
- Webcam video capture
- Face detection using MediaPipe Face Mesh
- Eye open/closed detection using Eye Aspect Ratio (EAR)
- Real-time frame processing with cyberpunk styling
- Streaming response for frontend consumption
- Focus point calculation based on face presence and eye state

Author: Apex AI Team
"""

import cv2
import numpy as np
from typing import Generator, Optional, Tuple, List
import time
import logging
import os

logger = logging.getLogger(__name__)

# Try to import MediaPipe - fall back to basic face detection if not available
try:
    import mediapipe as mp
    # Test if mediapipe.solutions is available (some versions have issues)
    _ = mp.solutions.face_mesh
    MEDIAPIPE_AVAILABLE = True
    logger.info("MediaPipe loaded successfully - Eye detection enabled")
except (ImportError, AttributeError) as e:
    MEDIAPIPE_AVAILABLE = False
    mp = None
    logger.warning(f"MediaPipe not available ({e}) - falling back to basic face detection")


class EyeDetector:
    """
    Eye detection using MediaPipe Face Mesh.

    Uses Eye Aspect Ratio (EAR) to detect if eyes are open or closed.
    EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
    """

    # MediaPipe Face Mesh eye landmarks
    # Left eye landmarks (from user's perspective, mirrored in camera)
    LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
    RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]

    # Additional eye contour for visualization
    LEFT_EYE_CONTOUR = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
    RIGHT_EYE_CONTOUR = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]

    # Iris landmarks for gaze detection
    LEFT_IRIS = [474, 475, 476, 477]
    RIGHT_IRIS = [469, 470, 471, 472]

    def __init__(self, ear_threshold: float = 0.21):
        """
        Initialize eye detector.

        Args:
            ear_threshold: EAR threshold below which eye is considered closed
        """
        self.ear_threshold = ear_threshold
        self.face_mesh = None

        if MEDIAPIPE_AVAILABLE:
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,  # Enables iris landmarks
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.mp_drawing = mp.solutions.drawing_utils
            self.mp_drawing_styles = mp.solutions.drawing_styles

    def calculate_ear(self, eye_landmarks: List[Tuple[int, int]]) -> float:
        """
        Calculate Eye Aspect Ratio (EAR).

        Args:
            eye_landmarks: 6 eye landmark points [(x,y), ...]

        Returns:
            float: Eye Aspect Ratio value
        """
        if len(eye_landmarks) != 6:
            return 0.0

        # Vertical distances
        v1 = np.linalg.norm(np.array(eye_landmarks[1]) - np.array(eye_landmarks[5]))
        v2 = np.linalg.norm(np.array(eye_landmarks[2]) - np.array(eye_landmarks[4]))

        # Horizontal distance
        h = np.linalg.norm(np.array(eye_landmarks[0]) - np.array(eye_landmarks[3]))

        if h == 0:
            return 0.0

        ear = (v1 + v2) / (2.0 * h)
        return ear

    def get_eye_landmarks(self, landmarks, indices: List[int],
                          frame_width: int, frame_height: int) -> List[Tuple[int, int]]:
        """
        Extract eye landmark coordinates from face mesh landmarks.
        """
        points = []
        for idx in indices:
            lm = landmarks[idx]
            x = int(lm.x * frame_width)
            y = int(lm.y * frame_height)
            points.append((x, y))
        return points

    def detect(self, frame: np.ndarray) -> dict:
        """
        Detect face and eye state in a frame.

        Args:
            frame: BGR image frame

        Returns:
            dict with keys: face_detected, left_eye_open, right_eye_open,
                           left_ear, right_ear, landmarks, eye_contours
        """
        result = {
            'face_detected': False,
            'left_eye_open': False,
            'right_eye_open': False,
            'both_eyes_open': False,
            'left_ear': 0.0,
            'right_ear': 0.0,
            'avg_ear': 0.0,
            'landmarks': None,
            'left_eye_contour': [],
            'right_eye_contour': [],
            'left_iris': [],
            'right_iris': [],
            'face_bbox': None
        }

        if not MEDIAPIPE_AVAILABLE or self.face_mesh is None:
            return result

        height, width = frame.shape[:2]

        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process frame
        results = self.face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            return result

        # Get first face
        face_landmarks = results.multi_face_landmarks[0]
        result['face_detected'] = True
        result['landmarks'] = face_landmarks

        # Calculate bounding box from face landmarks
        x_coords = [lm.x * width for lm in face_landmarks.landmark]
        y_coords = [lm.y * height for lm in face_landmarks.landmark]
        x_min, x_max = int(min(x_coords)), int(max(x_coords))
        y_min, y_max = int(min(y_coords)), int(max(y_coords))
        result['face_bbox'] = (x_min, y_min, x_max - x_min, y_max - y_min)

        # Get eye landmarks
        left_eye_pts = self.get_eye_landmarks(
            face_landmarks.landmark, self.LEFT_EYE_INDICES, width, height
        )
        right_eye_pts = self.get_eye_landmarks(
            face_landmarks.landmark, self.RIGHT_EYE_INDICES, width, height
        )

        # Get eye contours for visualization
        result['left_eye_contour'] = self.get_eye_landmarks(
            face_landmarks.landmark, self.LEFT_EYE_CONTOUR, width, height
        )
        result['right_eye_contour'] = self.get_eye_landmarks(
            face_landmarks.landmark, self.RIGHT_EYE_CONTOUR, width, height
        )

        # Get iris landmarks
        result['left_iris'] = self.get_eye_landmarks(
            face_landmarks.landmark, self.LEFT_IRIS, width, height
        )
        result['right_iris'] = self.get_eye_landmarks(
            face_landmarks.landmark, self.RIGHT_IRIS, width, height
        )

        # Calculate EAR for both eyes
        left_ear = self.calculate_ear(left_eye_pts)
        right_ear = self.calculate_ear(right_eye_pts)

        result['left_ear'] = left_ear
        result['right_ear'] = right_ear
        result['avg_ear'] = (left_ear + right_ear) / 2

        # Determine if eyes are open
        result['left_eye_open'] = left_ear > self.ear_threshold
        result['right_eye_open'] = right_ear > self.ear_threshold
        result['both_eyes_open'] = result['left_eye_open'] and result['right_eye_open']

        return result


class FocusModeProcessor:
    """
    Real-time video processor for Focus Mode with face and eye detection.

    Uses MediaPipe Face Mesh for accurate face and eye tracking,
    with Eye Aspect Ratio (EAR) to detect if eyes are open or closed.
    """

    def __init__(self, camera_index: int = 0):
        """
        Initialize the Focus Mode processor.

        Args:
            camera_index: Index of the camera to use (default: 0)
        """
        self.camera_index = camera_index
        self.camera: Optional[cv2.VideoCapture] = None
        self.eye_detector = EyeDetector()

        # Fallback face cascade for when MediaPipe is not available
        self.face_cascade: Optional[cv2.CascadeClassifier] = None
        if not MEDIAPIPE_AVAILABLE:
            self._load_face_cascade()

        # Session tracking
        self.frame_count = 0
        self.face_detected_count = 0
        self.eyes_open_count = 0
        self.points_per_second = 1
        self.session_start_time: Optional[float] = None
        self.accumulated_points = 0

        # Blink detection
        self.blink_count = 0
        self.last_eye_state = True  # True = open
        self.consecutive_closed_frames = 0
        self.drowsy_threshold = 15  # Frames of closed eyes before drowsy warning

        # Configuration
        self.frame_width = 640
        self.frame_height = 480

        # Visual styling for cyberpunk theme
        self.colors = {
            'green': (0, 255, 0),
            'cyan': (0, 255, 255),
            'yellow': (0, 255, 255),
            'red': (0, 0, 255),
            'purple': (255, 0, 255),
            'white': (255, 255, 255),
            'black': (0, 0, 0)
        }
        self.font = cv2.FONT_HERSHEY_SIMPLEX

    def _load_face_cascade(self) -> None:
        """Load Haar Cascade as fallback when MediaPipe is not available."""
        cascade_paths = [
            os.path.join(os.path.dirname(__file__), 'cascades', 'haarcascade_frontalface_default.xml'),
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
        ]

        for cascade_path in cascade_paths:
            if os.path.exists(cascade_path):
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                if not self.face_cascade.empty():
                    logger.info(f"Loaded face cascade from: {cascade_path}")
                    return

        logger.error("Could not load face cascade classifier")

    def start_camera(self) -> bool:
        """Start the webcam capture."""
        try:
            self.camera = cv2.VideoCapture(self.camera_index)

            if not self.camera.isOpened():
                logger.error(f"Could not open camera at index {self.camera_index}")
                return False

            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.frame_width)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frame_height)
            self.camera.set(cv2.CAP_PROP_FPS, 30)

            # Reset session tracking
            self.frame_count = 0
            self.face_detected_count = 0
            self.eyes_open_count = 0
            self.accumulated_points = 0
            self.blink_count = 0
            self.consecutive_closed_frames = 0
            self.session_start_time = time.time()

            logger.info("Camera started successfully")
            return True

        except Exception as e:
            logger.error(f"Error starting camera: {e}")
            return False

    def stop_camera(self) -> dict:
        """Stop the webcam capture and return session statistics."""
        stats = self.get_session_stats()

        if self.camera is not None:
            self.camera.release()
            self.camera = None

        logger.info(f"Camera stopped. Session stats: {stats}")
        return stats

    def _fallback_face_detection(self, frame: np.ndarray) -> dict:
        """Fallback face detection using Haar Cascade."""
        result = {
            'face_detected': False,
            'both_eyes_open': True,  # Assume open when we can't detect
            'face_bbox': None
        }

        if self.face_cascade is None:
            return result

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )

        if len(faces) > 0:
            result['face_detected'] = True
            result['face_bbox'] = tuple(faces[0])

        return result

    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, dict]:
        """
        Process a single frame with face and eye detection.

        Returns:
            Tuple of (processed_frame, detection_result)
        """
        self.frame_count += 1

        # Detect face and eyes
        if MEDIAPIPE_AVAILABLE:
            detection = self.eye_detector.detect(frame)
        else:
            detection = self._fallback_face_detection(frame)

        face_detected = detection['face_detected']
        eyes_open = detection.get('both_eyes_open', True)

        # Update counters
        if face_detected:
            self.face_detected_count += 1

            if eyes_open:
                self.eyes_open_count += 1
                self.accumulated_points += self.points_per_second / 30
                self.consecutive_closed_frames = 0

                # Blink detection
                if not self.last_eye_state:
                    self.blink_count += 1
            else:
                self.consecutive_closed_frames += 1

            self.last_eye_state = eyes_open

        # Draw visualizations
        frame = self._draw_face_detection(frame, detection)
        frame = self._draw_eye_visualization(frame, detection)
        frame = self._add_hud(frame, detection)

        return frame, detection

    def _draw_face_detection(self, frame: np.ndarray, detection: dict) -> np.ndarray:
        """Draw face bounding box with cyberpunk styling."""
        if not detection['face_detected'] or detection.get('face_bbox') is None:
            return frame

        x, y, w, h = detection['face_bbox']

        # Determine color based on eye state
        eyes_open = detection.get('both_eyes_open', True)
        box_color = self.colors['green'] if eyes_open else self.colors['yellow']

        # Draw main rectangle
        cv2.rectangle(frame, (x, y), (x + w, y + h), box_color, 2)

        # Draw corner accents
        corner_length = 20
        accent_color = self.colors['cyan']

        # Top-left
        cv2.line(frame, (x, y), (x + corner_length, y), accent_color, 3)
        cv2.line(frame, (x, y), (x, y + corner_length), accent_color, 3)
        # Top-right
        cv2.line(frame, (x + w, y), (x + w - corner_length, y), accent_color, 3)
        cv2.line(frame, (x + w, y), (x + w, y + corner_length), accent_color, 3)
        # Bottom-left
        cv2.line(frame, (x, y + h), (x + corner_length, y + h), accent_color, 3)
        cv2.line(frame, (x, y + h), (x, y + h - corner_length), accent_color, 3)
        # Bottom-right
        cv2.line(frame, (x + w, y + h), (x + w - corner_length, y + h), accent_color, 3)
        cv2.line(frame, (x + w, y + h), (x + w, y + h - corner_length), accent_color, 3)

        # Status label
        if eyes_open:
            label = "FOCUSED - EYES OPEN"
            label_color = self.colors['green']
        else:
            label = "EYES CLOSED"
            label_color = self.colors['yellow']

        cv2.putText(frame, label, (x, y - 10), self.font, 0.5, label_color, 2, cv2.LINE_AA)

        return frame

    def _draw_eye_visualization(self, frame: np.ndarray, detection: dict) -> np.ndarray:
        """Draw eye contours and iris detection."""
        if not MEDIAPIPE_AVAILABLE or not detection['face_detected']:
            return frame

        # Draw eye contours
        left_contour = detection.get('left_eye_contour', [])
        right_contour = detection.get('right_eye_contour', [])

        left_open = detection.get('left_eye_open', True)
        right_open = detection.get('right_eye_open', True)

        if left_contour:
            color = self.colors['green'] if left_open else self.colors['red']
            pts = np.array(left_contour, np.int32).reshape((-1, 1, 2))
            cv2.polylines(frame, [pts], True, color, 1)

        if right_contour:
            color = self.colors['green'] if right_open else self.colors['red']
            pts = np.array(right_contour, np.int32).reshape((-1, 1, 2))
            cv2.polylines(frame, [pts], True, color, 1)

        # Draw iris centers
        left_iris = detection.get('left_iris', [])
        right_iris = detection.get('right_iris', [])

        if left_iris and left_open:
            center = np.mean(left_iris, axis=0).astype(int)
            cv2.circle(frame, tuple(center), 3, self.colors['cyan'], -1)

        if right_iris and right_open:
            center = np.mean(right_iris, axis=0).astype(int)
            cv2.circle(frame, tuple(center), 3, self.colors['cyan'], -1)

        return frame

    def _add_hud(self, frame: np.ndarray, detection: dict) -> np.ndarray:
        """Add heads-up display overlay."""
        height, width = frame.shape[:2]

        # Calculate stats
        attention_score = 0
        if self.frame_count > 0:
            attention_score = (self.eyes_open_count / self.frame_count) * 100

        elapsed_time = 0
        if self.session_start_time:
            elapsed_time = int(time.time() - self.session_start_time)

        minutes = elapsed_time // 60
        seconds = elapsed_time % 60

        # Bottom bar
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, height - 70), (width, height), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.7, frame, 0.3, 0)

        # Status indicator
        face_detected = detection['face_detected']
        eyes_open = detection.get('both_eyes_open', True)

        if not face_detected:
            status_text = "○ NO FACE DETECTED"
            status_color = self.colors['red']
        elif not eyes_open:
            if self.consecutive_closed_frames > self.drowsy_threshold:
                status_text = "⚠ DROWSY - OPEN YOUR EYES!"
                status_color = self.colors['red']
            else:
                status_text = "◐ EYES CLOSED"
                status_color = self.colors['yellow']
        else:
            status_text = "● FOCUSED"
            status_color = self.colors['green']

        cv2.putText(frame, status_text, (10, height - 45), self.font, 0.6, status_color, 2, cv2.LINE_AA)

        # Eye status
        if MEDIAPIPE_AVAILABLE and face_detected:
            left_ear = detection.get('left_ear', 0)
            right_ear = detection.get('right_ear', 0)
            ear_text = f"EAR: L={left_ear:.2f} R={right_ear:.2f}"
            cv2.putText(frame, ear_text, (10, height - 20), self.font, 0.5, self.colors['white'], 1, cv2.LINE_AA)

        # Points and blinks
        points_text = f"Points: {int(self.accumulated_points)}"
        cv2.putText(frame, points_text, (200, height - 45), self.font, 0.6, self.colors['yellow'], 2, cv2.LINE_AA)

        blink_text = f"Blinks: {self.blink_count}"
        cv2.putText(frame, blink_text, (200, height - 20), self.font, 0.5, self.colors['cyan'], 1, cv2.LINE_AA)

        # Time and attention
        time_text = f"Time: {minutes:02d}:{seconds:02d}"
        cv2.putText(frame, time_text, (width - 180, height - 45), self.font, 0.6, self.colors['white'], 2, cv2.LINE_AA)

        score_color = self.colors['green'] if attention_score >= 70 else self.colors['yellow'] if attention_score >= 40 else self.colors['red']
        score_text = f"Attention: {attention_score:.1f}%"
        cv2.putText(frame, score_text, (width - 180, height - 20), self.font, 0.5, score_color, 1, cv2.LINE_AA)

        # Top bar
        cv2.rectangle(frame, (0, 0), (width, 35), (0, 0, 0), -1)
        cv2.putText(frame, "APEX FOCUS MODE", (10, 25), self.font, 0.7, self.colors['cyan'], 2, cv2.LINE_AA)

        # Eye detection indicator
        if MEDIAPIPE_AVAILABLE:
            cv2.putText(frame, "EYE TRACKING: ON", (width - 180, 25), self.font, 0.5, self.colors['green'], 1, cv2.LINE_AA)
        else:
            cv2.putText(frame, "EYE TRACKING: OFF", (width - 180, 25), self.font, 0.5, self.colors['yellow'], 1, cv2.LINE_AA)

        return frame

    def get_session_stats(self) -> dict:
        """Get current session statistics."""
        elapsed_time = 0
        if self.session_start_time:
            elapsed_time = time.time() - self.session_start_time

        attention_score = 0
        eye_open_ratio = 0
        if self.frame_count > 0:
            attention_score = (self.face_detected_count / self.frame_count) * 100
            if self.face_detected_count > 0:
                eye_open_ratio = (self.eyes_open_count / self.face_detected_count) * 100

        return {
            'frame_count': self.frame_count,
            'face_detected_count': self.face_detected_count,
            'eyes_open_count': self.eyes_open_count,
            'eye_open_ratio': round(eye_open_ratio, 2),
            'attention_score': round(attention_score, 2),
            'accumulated_points': int(self.accumulated_points),
            'elapsed_seconds': int(elapsed_time),
            'elapsed_minutes': round(elapsed_time / 60, 2),
            'blink_count': self.blink_count,
            'eye_tracking_enabled': MEDIAPIPE_AVAILABLE,
        }

    def gen_frames(self) -> Generator[bytes, None, None]:
        """Generator function that yields JPEG-encoded frames."""
        if not self.start_camera():
            placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(placeholder, "Camera not available", (150, 240),
                       self.font, 1, (0, 0, 255), 2, cv2.LINE_AA)
            _, buffer = cv2.imencode('.jpg', placeholder)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            return

        try:
            while True:
                success, frame = self.camera.read()

                if not success:
                    logger.warning("Failed to read frame from camera")
                    break

                # Flip horizontally for mirror effect
                frame = cv2.flip(frame, 1)

                # Process frame
                processed_frame, _ = self.process_frame(frame)

                # Encode to JPEG
                _, buffer = cv2.imencode('.jpg', processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])

                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

        except GeneratorExit:
            logger.info("Frame generator closed")
        except Exception as e:
            logger.error(f"Error in frame generator: {e}")
        finally:
            self.stop_camera()


# Global processor instance
_focus_processor: Optional[FocusModeProcessor] = None


def get_focus_processor() -> FocusModeProcessor:
    """Get or create the global focus processor instance."""
    global _focus_processor
    if _focus_processor is None:
        _focus_processor = FocusModeProcessor()
    return _focus_processor


def gen_frames() -> Generator[bytes, None, None]:
    """Generator function for video feed streaming."""
    processor = get_focus_processor()
    yield from processor.gen_frames()


def get_current_focus_stats() -> dict:
    """Get current focus session statistics."""
    global _focus_processor
    if _focus_processor is None:
        return {
            'frame_count': 0,
            'face_detected_count': 0,
            'eyes_open_count': 0,
            'eye_open_ratio': 0,
            'attention_score': 0,
            'accumulated_points': 0,
            'elapsed_seconds': 0,
            'elapsed_minutes': 0,
            'blink_count': 0,
            'eye_tracking_enabled': MEDIAPIPE_AVAILABLE,
        }
    return _focus_processor.get_session_stats()


def stop_focus_session() -> dict:
    """Stop the current focus session."""
    global _focus_processor
    if _focus_processor is not None:
        stats = _focus_processor.stop_camera()
        _focus_processor = None
        return stats
    return {}
