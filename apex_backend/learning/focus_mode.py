"""
Apex Learning Platform - Focus Mode Video Stream
=================================================
This module implements the Focus Mode feature using OpenCV for
real-time face detection and attention tracking.

Features:
- Webcam video capture
- Face detection using Haar Cascades
- Real-time frame processing with green bounding boxes
- Streaming response for frontend consumption
- Focus point calculation based on face presence

Author: Apex AI Team
"""

import cv2
import numpy as np
from typing import Generator, Optional, Tuple
import time
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


class FocusModeProcessor:
    """
    Real-time video processor for Focus Mode with face detection.
    
    This class manages webcam capture and face detection for the
    Focus Mode feature, tracking user attention during study sessions.
    
    Attributes:
        camera: OpenCV VideoCapture instance
        face_cascade: Haar Cascade classifier for face detection
        frame_count: Total frames processed
        face_detected_count: Frames where face was detected
        points_per_second: Points earned per second of focus
        session_start_time: When the current session started
    """
    
    def __init__(self, camera_index: int = 0):
        """
        Initialize the Focus Mode processor.
        
        Args:
            camera_index: Index of the camera to use (default: 0)
        """
        self.camera_index = camera_index
        self.camera: Optional[cv2.VideoCapture] = None
        self.face_cascade: Optional[cv2.CascadeClassifier] = None
        
        # Session tracking
        self.frame_count = 0
        self.face_detected_count = 0
        self.points_per_second = 1
        self.session_start_time: Optional[float] = None
        self.accumulated_points = 0
        
        # Configuration
        self.frame_width = 640
        self.frame_height = 480
        self.detection_scale_factor = 1.1
        self.min_neighbors = 5
        self.min_face_size = (30, 30)
        
        # Visual styling for cyberpunk theme
        self.box_color = (0, 255, 0)  # Green in BGR
        self.box_thickness = 2
        self.text_color = (0, 255, 255)  # Cyan in BGR
        self.font = cv2.FONT_HERSHEY_SIMPLEX
        self.font_scale = 0.7
        
        # Initialize face cascade
        self._load_face_cascade()
    
    def _load_face_cascade(self) -> None:
        """Load the Haar Cascade classifier for face detection."""
        # Try multiple paths for the cascade file
        cascade_paths = [
            # Local project path
            os.path.join(
                os.path.dirname(__file__),
                'cascades',
                'haarcascade_frontalface_default.xml'
            ),
            # OpenCV installation path
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
        ]
        
        for cascade_path in cascade_paths:
            if os.path.exists(cascade_path):
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                if not self.face_cascade.empty():
                    logger.info(f"Loaded face cascade from: {cascade_path}")
                    return
        
        # If no local file found, try OpenCV's data directory
        try:
            self.face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            if not self.face_cascade.empty():
                logger.info("Loaded face cascade from OpenCV data directory")
                return
        except Exception as e:
            logger.error(f"Failed to load face cascade: {e}")
        
        logger.error("Could not load face cascade classifier")
        self.face_cascade = None
    
    def start_camera(self) -> bool:
        """
        Start the webcam capture.
        
        Returns:
            bool: True if camera started successfully
        """
        try:
            self.camera = cv2.VideoCapture(self.camera_index)
            
            if not self.camera.isOpened():
                logger.error(f"Could not open camera at index {self.camera_index}")
                return False
            
            # Set camera properties
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.frame_width)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.frame_height)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            
            # Reset session tracking
            self.frame_count = 0
            self.face_detected_count = 0
            self.accumulated_points = 0
            self.session_start_time = time.time()
            
            logger.info("Camera started successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error starting camera: {e}")
            return False
    
    def stop_camera(self) -> dict:
        """
        Stop the webcam capture and return session statistics.
        
        Returns:
            dict: Session statistics including points and attention score
        """
        stats = self.get_session_stats()
        
        if self.camera is not None:
            self.camera.release()
            self.camera = None
        
        logger.info(f"Camera stopped. Session stats: {stats}")
        return stats
    
    def detect_faces(self, frame: np.ndarray) -> list:
        """
        Detect faces in a frame.
        
        Args:
            frame: BGR image frame from webcam
        
        Returns:
            list: List of face rectangles (x, y, w, h)
        """
        if self.face_cascade is None:
            return []
        
        # Convert to grayscale for detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Equalize histogram for better detection
        gray = cv2.equalizeHist(gray)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=self.detection_scale_factor,
            minNeighbors=self.min_neighbors,
            minSize=self.min_face_size,
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        return faces
    
    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, bool]:
        """
        Process a single frame with face detection and annotations.
        
        Args:
            frame: Raw BGR frame from webcam
        
        Returns:
            Tuple of (processed_frame, face_detected)
        """
        self.frame_count += 1
        face_detected = False
        
        # Detect faces
        faces = self.detect_faces(frame)
        
        if len(faces) > 0:
            face_detected = True
            self.face_detected_count += 1
            self.accumulated_points += self.points_per_second / 30  # Assuming 30 FPS
        
        # Draw bounding boxes around detected faces
        for (x, y, w, h) in faces:
            # Draw rectangle with cyberpunk styling
            cv2.rectangle(
                frame,
                (x, y),
                (x + w, y + h),
                self.box_color,
                self.box_thickness
            )
            
            # Draw corner accents for cyberpunk effect
            corner_length = 15
            # Top-left corner
            cv2.line(frame, (x, y), (x + corner_length, y), (0, 255, 255), 2)
            cv2.line(frame, (x, y), (x, y + corner_length), (0, 255, 255), 2)
            # Top-right corner
            cv2.line(frame, (x + w, y), (x + w - corner_length, y), (0, 255, 255), 2)
            cv2.line(frame, (x + w, y), (x + w, y + corner_length), (0, 255, 255), 2)
            # Bottom-left corner
            cv2.line(frame, (x, y + h), (x + corner_length, y + h), (0, 255, 255), 2)
            cv2.line(frame, (x, y + h), (x, y + h - corner_length), (0, 255, 255), 2)
            # Bottom-right corner
            cv2.line(frame, (x + w, y + h), (x + w - corner_length, y + h), (0, 255, 255), 2)
            cv2.line(frame, (x + w, y + h), (x + w, y + h - corner_length), (0, 255, 255), 2)
            
            # Add label
            label = "FOCUS DETECTED"
            cv2.putText(
                frame,
                label,
                (x, y - 10),
                self.font,
                0.5,
                self.text_color,
                1,
                cv2.LINE_AA
            )
        
        # Add HUD overlay
        frame = self._add_hud(frame, face_detected)
        
        return frame, face_detected
    
    def _add_hud(self, frame: np.ndarray, face_detected: bool) -> np.ndarray:
        """
        Add heads-up display overlay with session information.
        
        Args:
            frame: Frame to add HUD to
            face_detected: Whether face is currently detected
        
        Returns:
            Frame with HUD overlay
        """
        height, width = frame.shape[:2]
        
        # Calculate current stats
        attention_score = 0
        if self.frame_count > 0:
            attention_score = (self.face_detected_count / self.frame_count) * 100
        
        elapsed_time = 0
        if self.session_start_time:
            elapsed_time = int(time.time() - self.session_start_time)
        
        minutes = elapsed_time // 60
        seconds = elapsed_time % 60
        
        # Semi-transparent overlay bar at bottom
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, height - 60), (width, height), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.7, frame, 0.3, 0)
        
        # Status indicator
        status_color = (0, 255, 0) if face_detected else (0, 0, 255)
        status_text = "● FOCUSED" if face_detected else "○ NOT DETECTED"
        cv2.putText(
            frame,
            status_text,
            (10, height - 35),
            self.font,
            0.6,
            status_color,
            2,
            cv2.LINE_AA
        )
        
        # Points display
        points_text = f"Points: {int(self.accumulated_points)}"
        cv2.putText(
            frame,
            points_text,
            (10, height - 10),
            self.font,
            0.6,
            (255, 255, 0),
            2,
            cv2.LINE_AA
        )
        
        # Time display
        time_text = f"Time: {minutes:02d}:{seconds:02d}"
        cv2.putText(
            frame,
            time_text,
            (width - 150, height - 35),
            self.font,
            0.6,
            (255, 255, 255),
            2,
            cv2.LINE_AA
        )
        
        # Attention score
        score_text = f"Attention: {attention_score:.1f}%"
        cv2.putText(
            frame,
            score_text,
            (width - 150, height - 10),
            self.font,
            0.6,
            (0, 255, 255),
            2,
            cv2.LINE_AA
        )
        
        # Top bar with APEX branding
        cv2.rectangle(frame, (0, 0), (width, 30), (0, 0, 0), -1)
        cv2.putText(
            frame,
            "APEX FOCUS MODE",
            (10, 20),
            self.font,
            0.6,
            (0, 255, 255),
            2,
            cv2.LINE_AA
        )
        
        return frame
    
    def get_session_stats(self) -> dict:
        """
        Get current session statistics.
        
        Returns:
            dict: Session statistics
        """
        elapsed_time = 0
        if self.session_start_time:
            elapsed_time = time.time() - self.session_start_time
        
        attention_score = 0
        if self.frame_count > 0:
            attention_score = (self.face_detected_count / self.frame_count) * 100
        
        return {
            'frame_count': self.frame_count,
            'face_detected_count': self.face_detected_count,
            'attention_score': round(attention_score, 2),
            'accumulated_points': int(self.accumulated_points),
            'elapsed_seconds': int(elapsed_time),
            'elapsed_minutes': round(elapsed_time / 60, 2),
        }
    
    def gen_frames(self) -> Generator[bytes, None, None]:
        """
        Generator function that yields JPEG-encoded frames.
        
        This generator is designed to be used with Django's
        StreamingHttpResponse for real-time video streaming.
        
        Yields:
            bytes: JPEG-encoded frame with multipart boundary
        """
        if not self.start_camera():
            # Yield a placeholder frame if camera fails
            placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(
                placeholder,
                "Camera not available",
                (150, 240),
                self.font,
                1,
                (0, 0, 255),
                2,
                cv2.LINE_AA
            )
            _, buffer = cv2.imencode('.jpg', placeholder)
            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n'
            )
            return
        
        try:
            while True:
                success, frame = self.camera.read()
                
                if not success:
                    logger.warning("Failed to read frame from camera")
                    break
                
                # Flip horizontally for mirror effect
                frame = cv2.flip(frame, 1)
                
                # Process frame with face detection
                processed_frame, _ = self.process_frame(frame)
                
                # Encode to JPEG
                encode_params = [cv2.IMWRITE_JPEG_QUALITY, 85]
                _, buffer = cv2.imencode('.jpg', processed_frame, encode_params)
                
                # Yield frame with multipart boundary
                yield (
                    b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n'
                )
                
        except GeneratorExit:
            logger.info("Frame generator closed")
        except Exception as e:
            logger.error(f"Error in frame generator: {e}")
        finally:
            self.stop_camera()


# Global processor instance for session continuity
_focus_processor: Optional[FocusModeProcessor] = None


def get_focus_processor() -> FocusModeProcessor:
    """Get or create the global focus processor instance."""
    global _focus_processor
    if _focus_processor is None:
        _focus_processor = FocusModeProcessor()
    return _focus_processor


def gen_frames() -> Generator[bytes, None, None]:
    """
    Generator function for video feed streaming.
    
    This is the main entry point for the video feed view.
    It yields JPEG frames with multipart boundaries for
    streaming to the frontend.
    
    Yields:
        bytes: JPEG-encoded frames
    """
    processor = get_focus_processor()
    yield from processor.gen_frames()


def get_current_focus_stats() -> dict:
    """
    Get current focus session statistics.
    
    Returns:
        dict: Current session stats or empty stats if no active session
    """
    global _focus_processor
    if _focus_processor is None:
        return {
            'frame_count': 0,
            'face_detected_count': 0,
            'attention_score': 0,
            'accumulated_points': 0,
            'elapsed_seconds': 0,
            'elapsed_minutes': 0,
        }
    return _focus_processor.get_session_stats()


def stop_focus_session() -> dict:
    """
    Stop the current focus session.
    
    Returns:
        dict: Final session statistics
    """
    global _focus_processor
    if _focus_processor is not None:
        stats = _focus_processor.stop_camera()
        _focus_processor = None
        return stats
    return {}
