"""
Apex Learning Platform - Course Recommendation Engine
======================================================
This module implements a content-based recommendation system using
TF-IDF vectorization and Cosine Similarity for course recommendations.

The recommendation engine:
1. Loads course data from the database into a Pandas DataFrame
2. Vectorizes course descriptions using TF-IDF
3. Computes similarity scores using Cosine Similarity
4. Returns ranked recommendations based on content similarity

Author: Apex AI Team
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel, cosine_similarity
from typing import List, Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class CourseRecommender:
    """
    Content-Based Course Recommendation Engine using TF-IDF and Cosine Similarity.
    
    This class provides intelligent course recommendations based on course content
    similarity. It uses Natural Language Processing techniques to analyze course
    descriptions and find similar courses.
    
    Attributes:
        courses_df (pd.DataFrame): DataFrame containing course data
        tfidf_matrix: TF-IDF vectorized representation of course content
        cosine_sim: Precomputed cosine similarity matrix
        course_indices (pd.Series): Mapping from course ID to DataFrame index
    
    Example:
        >>> recommender = CourseRecommender()
        >>> recommendations = recommender.get_recommendations(course_id='uuid-here', top_n=5)
        >>> for course_id, score in recommendations:
        ...     print(f"Course: {course_id}, Score: {score:.2f}")
    """
    
    def __init__(self):
        """Initialize the recommendation engine."""
        self.courses_df: Optional[pd.DataFrame] = None
        self.tfidf_matrix = None
        self.cosine_sim = None
        self.course_indices: Optional[pd.Series] = None
        self.vectorizer: Optional[TfidfVectorizer] = None
        self._is_fitted = False
    
    def load_data(self) -> pd.DataFrame:
        """
        Load course data from the Django database into a Pandas DataFrame.
        
        Returns:
            pd.DataFrame: DataFrame containing course information with columns:
                - id: Course UUID
                - title: Course title
                - description: Course description
                - category: Course category
                - difficulty: Course difficulty level
                - tags: Course tags
                - instructor: Course instructor
                - combined_text: Combined text for TF-IDF
        
        Raises:
            Exception: If database query fails
        """
        from learning.models import Course
        
        try:
            # Query all published courses
            courses = Course.objects.filter(is_published=True).values(
                'id',
                'title',
                'description',
                'category',
                'difficulty',
                'tags',
                'instructor',
                'price',
                'duration_hours',
                'average_rating',
                'total_enrollments',
                'video_url',
                'cover_image'
            )
            
            # Convert to DataFrame
            self.courses_df = pd.DataFrame(list(courses))
            
            if self.courses_df.empty:
                logger.warning("No courses found in database")
                return self.courses_df
            
            # Convert UUID to string for easier handling
            self.courses_df['id'] = self.courses_df['id'].astype(str)
            
            # Create combined text field for TF-IDF vectorization
            self.courses_df['combined_text'] = self.courses_df.apply(
                self._create_combined_text, axis=1
            )
            
            # Create course index mapping
            self.course_indices = pd.Series(
                self.courses_df.index,
                index=self.courses_df['id']
            )
            
            logger.info(f"Loaded {len(self.courses_df)} courses from database")
            return self.courses_df
            
        except Exception as e:
            logger.error(f"Error loading course data: {e}")
            raise
    
    def _create_combined_text(self, row: pd.Series) -> str:
        """
        Create combined text from course fields for TF-IDF vectorization.
        
        Args:
            row: DataFrame row containing course data
        
        Returns:
            str: Combined and cleaned text
        """
        parts = []
        
        # Add title (weighted heavily by repetition)
        if pd.notna(row.get('title')):
            parts.extend([str(row['title'])] * 3)  # Weight title more
        
        # Add description
        if pd.notna(row.get('description')):
            parts.append(str(row['description']))
        
        # Add category (cleaned)
        if pd.notna(row.get('category')):
            category = str(row['category']).replace('_', ' ')
            parts.extend([category] * 2)  # Weight category
        
        # Add difficulty
        if pd.notna(row.get('difficulty')):
            parts.append(str(row['difficulty']))
        
        # Add tags
        if pd.notna(row.get('tags')):
            parts.append(str(row['tags']))
        
        # Add instructor
        if pd.notna(row.get('instructor')):
            parts.append(str(row['instructor']))
        
        # Combine and clean
        combined = ' '.join(parts)
        return combined.lower().strip()
    
    def fit(self) -> 'CourseRecommender':
        """
        Fit the TF-IDF vectorizer and compute similarity matrix.
        
        This method:
        1. Creates a TF-IDF vectorizer with optimized parameters
        2. Fits and transforms the course content
        3. Computes the cosine similarity matrix
        
        Returns:
            self: The fitted recommender instance
        
        Raises:
            ValueError: If data hasn't been loaded
        """
        if self.courses_df is None or self.courses_df.empty:
            self.load_data()
        
        if self.courses_df.empty:
            logger.warning("No courses available for fitting")
            self._is_fitted = False
            return self
        
        try:
            # Initialize TF-IDF Vectorizer with optimized parameters
            self.vectorizer = TfidfVectorizer(
                # Text preprocessing
                lowercase=True,
                strip_accents='unicode',
                
                # Tokenization
                analyzer='word',
                token_pattern=r'\b[a-zA-Z]{2,}\b',  # Words with 2+ chars
                
                # N-grams (unigrams and bigrams)
                ngram_range=(1, 2),
                
                # Term frequency limits
                min_df=1,  # Minimum document frequency
                max_df=0.95,  # Maximum document frequency (95%)
                
                # Feature limits
                max_features=5000,  # Limit vocabulary size
                
                # Stop words
                stop_words='english',
                
                # Sublinear TF scaling (use log of TF)
                sublinear_tf=True,
                
                # Smooth IDF
                smooth_idf=True,
            )
            
            # Fit and transform the course content
            logger.info("Fitting TF-IDF vectorizer...")
            self.tfidf_matrix = self.vectorizer.fit_transform(
                self.courses_df['combined_text']
            )
            
            logger.info(f"TF-IDF matrix shape: {self.tfidf_matrix.shape}")
            
            # Compute cosine similarity matrix using linear_kernel (faster for normalized vectors)
            logger.info("Computing cosine similarity matrix...")
            self.cosine_sim = linear_kernel(self.tfidf_matrix, self.tfidf_matrix)
            
            self._is_fitted = True
            logger.info("Recommendation engine fitted successfully")
            
            return self
            
        except Exception as e:
            logger.error(f"Error fitting recommendation engine: {e}")
            raise
    
    def get_recommendations(
        self,
        course_id: str,
        top_n: int = 10,
        exclude_same_category: bool = False,
        min_score: float = 0.0
    ) -> List[Dict]:
        """
        Get course recommendations based on a given course.
        
        This method finds courses similar to the input course using
        precomputed cosine similarity scores.
        
        Args:
            course_id: The UUID of the course to find recommendations for
            top_n: Number of recommendations to return (default: 10)
            exclude_same_category: Whether to exclude courses in same category
            min_score: Minimum similarity score threshold (0-1)
        
        Returns:
            List of dictionaries containing recommended courses with:
                - id: Course UUID
                - title: Course title
                - description: Course description (truncated)
                - category: Course category
                - similarity_score: Similarity score (0-1)
                - match_percentage: Similarity as percentage
        
        Raises:
            ValueError: If course_id not found or engine not fitted
        """
        # Ensure engine is fitted
        if not self._is_fitted:
            self.fit()
        
        if not self._is_fitted:
            logger.warning("Engine could not be fitted - no data")
            return []
        
        # Convert to string if needed
        course_id = str(course_id)
        
        # Validate course exists
        if course_id not in self.course_indices.index:
            logger.warning(f"Course ID {course_id} not found")
            raise ValueError(f"Course with ID {course_id} not found")
        
        # Get index of the input course
        idx = self.course_indices[course_id]
        
        # Get similarity scores for this course
        sim_scores = list(enumerate(self.cosine_sim[idx]))
        
        # Sort by similarity score (descending)
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        
        # Filter out the input course itself (index 0 after sorting)
        sim_scores = [(i, score) for i, score in sim_scores if i != idx]
        
        # Get the input course's category for optional filtering
        input_category = self.courses_df.loc[idx, 'category']
        
        # Build recommendations list
        recommendations = []
        
        for course_idx, score in sim_scores:
            # Skip if below minimum score
            if score < min_score:
                continue
            
            course_data = self.courses_df.iloc[course_idx]
            
            # Optional: exclude same category
            if exclude_same_category and course_data['category'] == input_category:
                continue
            
            # Truncate description
            description = str(course_data.get('description', ''))
            if len(description) > 200:
                description = description[:200] + '...'
            
            recommendations.append({
                'id': str(course_data['id']),
                'title': course_data['title'],
                'description': description,
                'category': course_data['category'],
                'category_display': course_data.get('category', '').replace('_', ' ').title(),
                'difficulty': course_data.get('difficulty', 'beginner'),
                'difficulty_display': course_data.get('difficulty', 'beginner').title(),
                'instructor': course_data.get('instructor', 'Unknown'),
                'price': float(course_data.get('price', 0)),
                'duration_hours': int(course_data.get('duration_hours', 0)),
                'average_rating': float(course_data.get('average_rating', 0)),
                'total_enrollments': int(course_data.get('total_enrollments', 0)),
                'platform': course_data.get('platform', 'apex'),
                'platform_display': course_data.get('platform', 'apex').replace('_', ' ').title(),
                'external_url': str(course_data.get('external_url', '') or ''),
                'thumbnail_url': str(course_data.get('thumbnail_url', '') or ''),
                'cover_image_url': str(course_data.get('cover_image', '') or ''),
                'tags': str(course_data.get('tags', '')),
                'similarity_score': round(float(score), 4),
                'match_percentage': round(float(score) * 100, 1),
                'cover_image': str(course_data.get('cover_image', '')),
            })
            
            # Stop when we have enough recommendations
            if len(recommendations) >= top_n:
                break
        
        logger.info(f"Generated {len(recommendations)} recommendations for course {course_id}")
        return recommendations
    
    def get_recommendations_for_text(
        self,
        query_text: str,
        top_n: int = 10,
        min_score: float = 0.0
    ) -> List[Dict]:
        """
        Get course recommendations based on free-form text query.
        
        Useful for finding courses based on user interests, resume content,
        or search queries.
        
        Args:
            query_text: Free-form text to find similar courses for
            top_n: Number of recommendations to return
            min_score: Minimum similarity score threshold
        
        Returns:
            List of recommended courses with similarity scores
        """
        if not self._is_fitted:
            self.fit()
        
        if not self._is_fitted or self.vectorizer is None:
            return []
        
        try:
            # Transform query text using fitted vectorizer
            query_vector = self.vectorizer.transform([query_text.lower()])
            
            # Compute similarity with all courses
            sim_scores = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
            
            # Get indices sorted by similarity
            sorted_indices = np.argsort(sim_scores)[::-1]
            
            recommendations = []
            
            for idx in sorted_indices:
                score = sim_scores[idx]
                
                if score < min_score:
                    continue
                
                course_data = self.courses_df.iloc[idx]
                
                description = str(course_data.get('description', ''))
                if len(description) > 200:
                    description = description[:200] + '...'
                
                recommendations.append({
                    'id': str(course_data['id']),
                    'title': course_data['title'],
                    'description': description,
                    'category': course_data['category'],
                    'category_display': course_data.get('category', '').replace('_', ' ').title(),
                    'difficulty': course_data.get('difficulty', 'beginner'),
                    'difficulty_display': course_data.get('difficulty', 'beginner').title(),
                    'instructor': course_data.get('instructor', 'Unknown'),
                    'price': float(course_data.get('price', 0)),
                    'duration_hours': int(course_data.get('duration_hours', 0)),
                    'average_rating': float(course_data.get('average_rating', 0)),
                    'total_enrollments': int(course_data.get('total_enrollments', 0)),
                    'platform': course_data.get('platform', 'apex'),
                    'platform_display': course_data.get('platform', 'apex').replace('_', ' ').title(),
                    'external_url': str(course_data.get('external_url', '') or ''),
                    'thumbnail_url': str(course_data.get('thumbnail_url', '') or ''),
                    'cover_image_url': str(course_data.get('cover_image', '') or ''),
                    'tags': str(course_data.get('tags', '')),
                    'similarity_score': round(float(score), 4),
                    'match_percentage': round(float(score) * 100, 1),
                    'cover_image': str(course_data.get('cover_image', '')),
                })
                
                if len(recommendations) >= top_n:
                    break
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting text-based recommendations: {e}")
            return []
    
    def get_popular_courses(self, top_n: int = 10) -> List[Dict]:
        """
        Get most popular courses based on enrollments and ratings.
        
        Args:
            top_n: Number of courses to return
        
        Returns:
            List of popular courses
        """
        if self.courses_df is None:
            self.load_data()
        
        if self.courses_df.empty:
            return []
        
        # Sort by enrollments and rating
        sorted_df = self.courses_df.sort_values(
            by=['total_enrollments', 'average_rating'],
            ascending=[False, False]
        )
        
        courses = []
        for _, row in sorted_df.head(top_n).iterrows():
            courses.append({
                'id': str(row['id']),
                'title': row['title'],
                'description': str(row.get('description', ''))[:200],
                'category': row['category'],
                'category_display': row.get('category', '').replace('_', ' ').title(),
                'difficulty': row.get('difficulty', 'beginner'),
                'difficulty_display': row.get('difficulty', 'beginner').title(),
                'instructor': row.get('instructor', 'Unknown'),
                'price': float(row.get('price', 0)),
                'duration_hours': int(row.get('duration_hours', 0)),
                'average_rating': float(row.get('average_rating', 0)),
                'total_enrollments': int(row.get('total_enrollments', 0)),
                'platform': row.get('platform', 'apex'),
                'platform_display': row.get('platform', 'apex').replace('_', ' ').title(),
                'external_url': str(row.get('external_url', '') or ''),
                'thumbnail_url': str(row.get('thumbnail_url', '') or ''),
                'cover_image_url': str(row.get('cover_image', '') or ''),
                'tags': str(row.get('tags', '')),
                'cover_image': str(row.get('cover_image', '')),
            })
        
        return courses
    
    def refresh(self) -> 'CourseRecommender':
        """
        Refresh the recommendation engine by reloading data and refitting.
        
        Call this method when course data has been updated.
        
        Returns:
            self: The refreshed recommender instance
        """
        logger.info("Refreshing recommendation engine...")
        self._is_fitted = False
        self.courses_df = None
        self.tfidf_matrix = None
        self.cosine_sim = None
        return self.fit()
    
    def get_feature_names(self) -> List[str]:
        """Get the feature names (vocabulary) from the TF-IDF vectorizer."""
        if self.vectorizer is None:
            return []
        return self.vectorizer.get_feature_names_out().tolist()
    
    def get_top_terms_for_course(self, course_id: str, top_n: int = 10) -> List[Tuple[str, float]]:
        """
        Get the most important terms for a specific course.
        
        Args:
            course_id: The course UUID
            top_n: Number of top terms to return
        
        Returns:
            List of (term, tfidf_score) tuples
        """
        if not self._is_fitted:
            self.fit()
        
        course_id = str(course_id)
        
        if course_id not in self.course_indices.index:
            return []
        
        idx = self.course_indices[course_id]
        feature_names = self.get_feature_names()
        
        # Get TF-IDF scores for this course
        tfidf_scores = self.tfidf_matrix[idx].toarray().flatten()
        
        # Get top terms
        top_indices = tfidf_scores.argsort()[::-1][:top_n]
        
        return [
            (feature_names[i], round(tfidf_scores[i], 4))
            for i in top_indices
            if tfidf_scores[i] > 0
        ]


# Singleton instance for global access
_recommender_instance: Optional[CourseRecommender] = None


def get_recommender() -> CourseRecommender:
    """
    Get the global recommender instance (singleton pattern).
    
    Returns:
        CourseRecommender: The global recommender instance
    """
    global _recommender_instance
    
    if _recommender_instance is None:
        _recommender_instance = CourseRecommender()
        _recommender_instance.fit()
    
    return _recommender_instance


def refresh_recommender() -> CourseRecommender:
    """
    Refresh the global recommender instance.
    
    Returns:
        CourseRecommender: The refreshed recommender instance
    """
    global _recommender_instance
    
    if _recommender_instance is None:
        _recommender_instance = CourseRecommender()
    
    return _recommender_instance.refresh()
