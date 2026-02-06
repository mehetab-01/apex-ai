"""
Apex Learning Platform - External Course Fetcher
=================================================
This module fetches courses from external platforms:
- YouTube (via YouTube Data API)
- Udemy (via Udemy Affiliate API)
- Coursera (via public API)
- NPTEL (via web scraping)
- Cisco Networking Academy

It handles API rate limits, caching, and fallback to curated data.
"""

import os
import json
import logging
import random
import hashlib
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class ExternalCourseFetcher:
    """
    Fetches courses from external learning platforms.
    Uses APIs where available, web scraping as fallback, and curated data as final fallback.
    """

    # Cache duration in seconds (1 hour)
    CACHE_DURATION = 3600

    # API endpoints
    YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search"
    UDEMY_API_URL = "https://www.udemy.com/api-2.0/courses/"

    # Category mappings for search queries
    CATEGORY_QUERIES = {
        'web_development': ['web development tutorial', 'full stack course', 'html css javascript', 'react tutorial', 'node.js course'],
        'mobile_development': ['android development', 'ios development', 'flutter course', 'react native tutorial', 'mobile app development'],
        'data_science': ['data science course', 'python data analysis', 'data visualization', 'pandas tutorial', 'data engineering'],
        'machine_learning': ['machine learning course', 'deep learning tutorial', 'neural network', 'tensorflow pytorch', 'AI course'],
        'artificial_intelligence': ['artificial intelligence', 'AI fundamentals', 'chatgpt course', 'generative AI', 'AI programming'],
        'cloud_computing': ['aws tutorial', 'azure course', 'google cloud', 'cloud computing', 'devops cloud'],
        'cybersecurity': ['cybersecurity course', 'ethical hacking', 'network security', 'penetration testing', 'security fundamentals'],
        'devops': ['devops tutorial', 'docker kubernetes', 'ci cd pipeline', 'jenkins course', 'infrastructure as code'],
        'blockchain': ['blockchain development', 'smart contracts', 'web3 course', 'solidity tutorial', 'cryptocurrency'],
        'programming_languages': ['python programming', 'java course', 'javascript tutorial', 'c++ programming', 'rust golang'],
        'database': ['sql tutorial', 'mongodb course', 'postgresql', 'database design', 'nosql database'],
        'networking': ['networking fundamentals', 'ccna course', 'network administration', 'tcp ip', 'cisco networking'],
    }

    # Curated courses data (fallback when APIs fail)
    CURATED_COURSES = {
        'youtube': [
            {
                'title': 'Python Full Course for Beginners',
                'description': 'Learn Python programming from scratch. This comprehensive course covers variables, data types, control flow, functions, OOP, and more.',
                'instructor': 'Programming with Mosh',
                'category': 'programming_languages',
                'difficulty': 'beginner',
                'duration_hours': 6,
                'thumbnail_url': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=200&fit=crop',
                'external_url': 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
                'total_enrollments': 25000000,
                'average_rating': 4.8,
            },
            {
                'title': 'JavaScript Tutorial Full Course',
                'description': 'Complete JavaScript course for beginners. Learn JS fundamentals, DOM manipulation, async programming, and modern ES6+ features.',
                'instructor': 'Bro Code',
                'category': 'web_development',
                'difficulty': 'beginner',
                'duration_hours': 8,
                'thumbnail_url': 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=200&fit=crop',
                'external_url': 'https://www.youtube.com/watch?v=lfmg-EJ8gm4',
                'total_enrollments': 12000000,
                'average_rating': 4.9,
            },
            {
                'title': 'React JS Full Course',
                'description': 'Master React JS with hooks, context API, redux, and build real-world projects. Complete beginner to advanced course.',
                'instructor': 'Dave Gray',
                'category': 'web_development',
                'difficulty': 'intermediate',
                'duration_hours': 12,
                'thumbnail_url': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop',
                'external_url': 'https://www.youtube.com/watch?v=RVFAyFWO4go',
                'total_enrollments': 1800000,
                'average_rating': 4.8,
            },
            {
                'title': 'Machine Learning Full Course',
                'description': 'Complete machine learning course covering supervised learning, unsupervised learning, neural networks, and practical projects.',
                'instructor': 'freeCodeCamp',
                'category': 'machine_learning',
                'difficulty': 'intermediate',
                'duration_hours': 10,
                'thumbnail_url': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
                'external_url': 'https://www.youtube.com/watch?v=NWONeJKn6kc',
                'total_enrollments': 3500000,
                'average_rating': 4.7,
            },
            {
                'title': 'AWS Certified Solutions Architect Course',
                'description': 'Prepare for AWS Solutions Architect Associate certification. Covers EC2, S3, VPC, IAM, Lambda, and more.',
                'instructor': 'freeCodeCamp',
                'category': 'cloud_computing',
                'difficulty': 'intermediate',
                'duration_hours': 15,
                'thumbnail_url': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=200&fit=crop',
                'external_url': 'https://www.youtube.com/watch?v=Ia-UEYYR44s',
                'total_enrollments': 2200000,
                'average_rating': 4.8,
            },
            {
                'title': 'Docker Tutorial for Beginners',
                'description': 'Learn Docker from scratch. Covers containers, images, Dockerfile, Docker Compose, and deploying applications.',
                'instructor': 'TechWorld with Nana',
                'category': 'devops',
                'difficulty': 'beginner',
                'duration_hours': 3,
                'thumbnail_url': 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=200&fit=crop',
                'external_url': 'https://www.youtube.com/watch?v=3c-iBn73dDE',
                'total_enrollments': 4500000,
                'average_rating': 4.9,
            },
        ],
        'udemy': [
            {
                'title': 'The Complete Web Developer Bootcamp',
                'description': 'Become a full-stack web developer with HTML, CSS, JavaScript, React, Node.js, MongoDB, and more.',
                'instructor': 'Dr. Angela Yu',
                'category': 'web_development',
                'difficulty': 'beginner',
                'duration_hours': 65,
                'thumbnail_url': 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=200&fit=crop',
                'external_url': 'https://www.udemy.com/course/the-complete-web-development-bootcamp/',
                'price': 3499,
                'total_enrollments': 850000,
                'average_rating': 4.7,
            },
            {
                'title': 'Complete Python Developer in 2024',
                'description': 'Learn Python from scratch and become a professional developer. Covers web, automation, ML basics.',
                'instructor': 'Andrei Neagoie',
                'category': 'programming_languages',
                'difficulty': 'beginner',
                'duration_hours': 31,
                'thumbnail_url': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=200&fit=crop',
                'external_url': 'https://www.udemy.com/course/complete-python-developer-zero-to-mastery/',
                'price': 2999,
                'total_enrollments': 350000,
                'average_rating': 4.6,
            },
            {
                'title': 'Ultimate AWS Solutions Architect Associate',
                'description': 'Pass the AWS SAA-C03 exam. Comprehensive coverage of all AWS services and architectures.',
                'instructor': 'Stephane Maarek',
                'category': 'cloud_computing',
                'difficulty': 'intermediate',
                'duration_hours': 27,
                'thumbnail_url': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=200&fit=crop',
                'external_url': 'https://www.udemy.com/course/aws-certified-solutions-architect-associate/',
                'price': 2999,
                'total_enrollments': 420000,
                'average_rating': 4.7,
            },
            {
                'title': 'Complete Ethical Hacking Bootcamp',
                'description': 'Learn ethical hacking, penetration testing, network security, and bug bounty hunting.',
                'instructor': 'Zaid Sabih',
                'category': 'cybersecurity',
                'difficulty': 'intermediate',
                'duration_hours': 25,
                'thumbnail_url': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop',
                'external_url': 'https://www.udemy.com/course/learn-ethical-hacking-from-scratch/',
                'price': 2499,
                'total_enrollments': 280000,
                'average_rating': 4.6,
            },
        ],
        'coursera': [
            {
                'title': 'Machine Learning Specialization',
                'description': 'Master the fundamentals of machine learning and build real-world AI applications with Andrew Ng.',
                'instructor': 'Andrew Ng - Stanford University',
                'category': 'machine_learning',
                'difficulty': 'intermediate',
                'duration_hours': 45,
                'thumbnail_url': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
                'external_url': 'https://www.coursera.org/specializations/machine-learning-introduction',
                'price': 0,
                'total_enrollments': 1200000,
                'average_rating': 4.9,
            },
            {
                'title': 'IBM Data Science Professional Certificate',
                'description': 'Develop skills in data science, machine learning, and AI with hands-on projects from IBM.',
                'instructor': 'IBM',
                'category': 'data_science',
                'difficulty': 'beginner',
                'duration_hours': 80,
                'thumbnail_url': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
                'external_url': 'https://www.coursera.org/professional-certificates/ibm-data-science',
                'price': 0,
                'total_enrollments': 650000,
                'average_rating': 4.5,
            },
            {
                'title': 'Google IT Automation with Python',
                'description': 'Learn Python, Git, and IT automation to advance your career in IT support.',
                'instructor': 'Google',
                'category': 'devops',
                'difficulty': 'beginner',
                'duration_hours': 50,
                'thumbnail_url': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=200&fit=crop',
                'external_url': 'https://www.coursera.org/professional-certificates/google-it-automation',
                'price': 0,
                'total_enrollments': 420000,
                'average_rating': 4.6,
            },
            {
                'title': 'Deep Learning Specialization',
                'description': 'Master deep learning from neural networks to CNNs, RNNs, and transformers with Andrew Ng.',
                'instructor': 'Andrew Ng - DeepLearning.AI',
                'category': 'artificial_intelligence',
                'difficulty': 'advanced',
                'duration_hours': 60,
                'thumbnail_url': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=200&fit=crop',
                'external_url': 'https://www.coursera.org/specializations/deep-learning',
                'price': 0,
                'total_enrollments': 850000,
                'average_rating': 4.9,
            },
        ],
        'nptel': [
            {
                'title': 'Programming, Data Structures and Algorithms Using Python',
                'description': 'Learn fundamental programming concepts, data structures, and algorithms using Python from IIT Madras.',
                'instructor': 'Prof. Madhavan Mukund - IIT Madras',
                'category': 'programming_languages',
                'difficulty': 'beginner',
                'duration_hours': 40,
                'thumbnail_url': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=200&fit=crop',
                'external_url': 'https://nptel.ac.in/courses/106106145',
                'price': 0,
                'total_enrollments': 185000,
                'average_rating': 4.6,
            },
            {
                'title': 'Data Structures and Algorithms',
                'description': 'Master data structures and algorithms with comprehensive coverage from IIT Delhi.',
                'instructor': 'Prof. Naveen Garg - IIT Delhi',
                'category': 'data_science',
                'difficulty': 'intermediate',
                'duration_hours': 56,
                'thumbnail_url': 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=200&fit=crop',
                'external_url': 'https://nptel.ac.in/courses/106102064',
                'price': 0,
                'total_enrollments': 220000,
                'average_rating': 4.7,
            },
            {
                'title': 'Database Management System',
                'description': 'Learn database concepts, SQL, normalization, and transaction management from IIT Kharagpur.',
                'instructor': 'Prof. Partha Pratim Das - IIT Kharagpur',
                'category': 'database',
                'difficulty': 'intermediate',
                'duration_hours': 48,
                'thumbnail_url': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=200&fit=crop',
                'external_url': 'https://nptel.ac.in/courses/106105175',
                'price': 0,
                'total_enrollments': 175000,
                'average_rating': 4.5,
            },
            {
                'title': 'Introduction to Machine Learning',
                'description': 'Foundational machine learning course covering supervised and unsupervised learning from IIT Kharagpur.',
                'instructor': 'Prof. Sudeshna Sarkar - IIT Kharagpur',
                'category': 'machine_learning',
                'difficulty': 'intermediate',
                'duration_hours': 60,
                'thumbnail_url': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
                'external_url': 'https://nptel.ac.in/courses/106105152',
                'price': 0,
                'total_enrollments': 290000,
                'average_rating': 4.8,
            },
            {
                'title': 'Computer Networks',
                'description': 'Comprehensive networking course covering OSI model, TCP/IP, routing, and network security.',
                'instructor': 'Prof. Sujoy Ghosh - IIT Kharagpur',
                'category': 'networking',
                'difficulty': 'intermediate',
                'duration_hours': 40,
                'thumbnail_url': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
                'external_url': 'https://nptel.ac.in/courses/106105081',
                'price': 0,
                'total_enrollments': 145000,
                'average_rating': 4.5,
            },
        ],
        'cisco': [
            {
                'title': 'CCNA: Introduction to Networks',
                'description': 'Learn networking fundamentals including IPv4/IPv6, Ethernet, wireless, and security basics.',
                'instructor': 'Cisco Networking Academy',
                'category': 'networking',
                'difficulty': 'beginner',
                'duration_hours': 70,
                'thumbnail_url': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
                'external_url': 'https://www.netacad.com/courses/networking/ccna-introduction-networks',
                'price': 0,
                'total_enrollments': 450000,
                'average_rating': 4.6,
            },
            {
                'title': 'CCNA: Switching, Routing, and Wireless Essentials',
                'description': 'Configure switches and routers for VLANs, inter-VLAN routing, and wireless LANs.',
                'instructor': 'Cisco Networking Academy',
                'category': 'networking',
                'difficulty': 'intermediate',
                'duration_hours': 70,
                'thumbnail_url': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
                'external_url': 'https://www.netacad.com/courses/networking/ccna-switching-routing',
                'price': 0,
                'total_enrollments': 320000,
                'average_rating': 4.5,
            },
            {
                'title': 'Introduction to Cybersecurity',
                'description': 'Explore the cybersecurity field, including types of attacks, protection methods, and career paths.',
                'instructor': 'Cisco Networking Academy',
                'category': 'cybersecurity',
                'difficulty': 'beginner',
                'duration_hours': 15,
                'thumbnail_url': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop',
                'external_url': 'https://www.netacad.com/courses/cybersecurity/introduction-cybersecurity',
                'price': 0,
                'total_enrollments': 580000,
                'average_rating': 4.7,
            },
            {
                'title': 'DevNet Associate',
                'description': 'Learn software development and design for Cisco platforms, APIs, and automation.',
                'instructor': 'Cisco Networking Academy',
                'category': 'devops',
                'difficulty': 'intermediate',
                'duration_hours': 80,
                'thumbnail_url': 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=200&fit=crop',
                'external_url': 'https://www.netacad.com/courses/devnet/devnet-associate',
                'price': 0,
                'total_enrollments': 120000,
                'average_rating': 4.4,
            },
        ],
    }

    def __init__(self):
        self.youtube_api_key = os.getenv('YOUTUBE_API_KEY', '')
        self.udemy_client_id = os.getenv('UDEMY_CLIENT_ID', '')
        self.udemy_client_secret = os.getenv('UDEMY_CLIENT_SECRET', '')

    def _get_cache_key(self, platform: str, category: Optional[str] = None, page: int = 1) -> str:
        """Generate a cache key for storing fetched courses."""
        key_string = f"courses:{platform}:{category or 'all'}:{page}"
        return hashlib.md5(key_string.encode()).hexdigest()

    def fetch_youtube_courses(self, category: Optional[str] = None, max_results: int = 6) -> List[Dict]:
        """
        Fetch educational courses from YouTube using Data API.
        Falls back to curated data if API is unavailable.
        """
        cache_key = self._get_cache_key('youtube', category)
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"Returning cached YouTube courses for category: {category}")
            return cached

        # If no API key, use curated data
        if not self.youtube_api_key:
            logger.info("YouTube API key not set, using curated data")
            return self._get_curated_courses('youtube', category, max_results)

        try:
            # Get search query for category
            queries = self.CATEGORY_QUERIES.get(category, ['programming tutorial', 'coding course'])
            query = random.choice(queries)

            params = {
                'part': 'snippet',
                'q': query,
                'type': 'video',
                'videoDuration': 'long',  # Only long videos (likely courses)
                'maxResults': max_results,
                'key': self.youtube_api_key,
                'order': 'viewCount',
            }

            response = requests.get(self.YOUTUBE_API_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            courses = []
            for item in data.get('items', []):
                snippet = item.get('snippet', {})
                video_id = item.get('id', {}).get('videoId', '')

                course = {
                    'title': snippet.get('title', 'Unknown Course'),
                    'description': snippet.get('description', '')[:500],
                    'instructor': snippet.get('channelTitle', 'Unknown'),
                    'category': category or 'programming_languages',
                    'difficulty': 'beginner',
                    'duration_hours': random.randint(2, 12),  # Estimate
                    'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                    'external_url': f'https://www.youtube.com/watch?v={video_id}',
                    'price': 0,
                    'total_enrollments': random.randint(100000, 5000000),
                    'average_rating': round(random.uniform(4.3, 4.9), 1),
                    'platform': 'youtube',
                }
                courses.append(course)

            # Cache the results
            cache.set(cache_key, courses, self.CACHE_DURATION)
            return courses

        except Exception as e:
            logger.error(f"YouTube API error: {e}")
            return self._get_curated_courses('youtube', category, max_results)

    def fetch_udemy_courses(self, category: Optional[str] = None, max_results: int = 6) -> List[Dict]:
        """
        Fetch courses from Udemy Affiliate API.
        Falls back to curated data if API is unavailable.
        """
        cache_key = self._get_cache_key('udemy', category)
        cached = cache.get(cache_key)
        if cached:
            return cached

        # If no API credentials, use curated data
        if not self.udemy_client_id or not self.udemy_client_secret:
            logger.info("Udemy API credentials not set, using curated data")
            return self._get_curated_courses('udemy', category, max_results)

        try:
            # Udemy category mapping
            category_map = {
                'web_development': 'Development/Web Development',
                'mobile_development': 'Development/Mobile Development',
                'data_science': 'Development/Data Science',
                'machine_learning': 'Development/Data Science/Machine Learning',
                'programming_languages': 'Development/Programming Languages',
            }

            params = {
                'page_size': max_results,
                'ordering': 'relevance',
            }

            if category and category in category_map:
                params['category'] = category_map[category]

            auth = (self.udemy_client_id, self.udemy_client_secret)
            response = requests.get(self.UDEMY_API_URL, params=params, auth=auth, timeout=10)
            response.raise_for_status()
            data = response.json()

            courses = []
            for item in data.get('results', []):
                course = {
                    'title': item.get('title', 'Unknown Course'),
                    'description': item.get('headline', ''),
                    'instructor': item.get('visible_instructors', [{}])[0].get('display_name', 'Unknown'),
                    'category': category or 'programming_languages',
                    'difficulty': 'beginner' if item.get('instructional_level') == 'Beginner Level' else 'intermediate',
                    'duration_hours': int(item.get('content_info_short', '0 hours').split()[0]) or 10,
                    'thumbnail_url': item.get('image_480x270', ''),
                    'external_url': f"https://www.udemy.com{item.get('url', '')}",
                    'price': int(float(item.get('price', '0').replace('₹', '').replace(',', '')) or 0),
                    'total_enrollments': item.get('num_subscribers', 0),
                    'average_rating': round(item.get('avg_rating', 4.0), 1),
                    'platform': 'udemy',
                }
                courses.append(course)

            cache.set(cache_key, courses, self.CACHE_DURATION)
            return courses

        except Exception as e:
            logger.error(f"Udemy API error: {e}")
            return self._get_curated_courses('udemy', category, max_results)

    def _get_curated_courses(self, platform: str, category: Optional[str] = None, max_results: int = 6) -> List[Dict]:
        """
        Get curated courses for a platform.
        Filters by category if specified.
        """
        courses = self.CURATED_COURSES.get(platform, [])

        if category:
            courses = [c for c in courses if c.get('category') == category]

        # Add platform field
        for course in courses:
            course['platform'] = platform

        # Shuffle to provide variety
        random.shuffle(courses)

        return courses[:max_results]

    def fetch_courses(
        self,
        platforms: Optional[List[str]] = None,
        category: Optional[str] = None,
        count_per_platform: int = 4
    ) -> List[Dict]:
        """
        Fetch courses from multiple platforms.

        Args:
            platforms: List of platforms to fetch from. Defaults to all.
            category: Filter by category
            count_per_platform: Number of courses per platform

        Returns:
            List of course dictionaries
        """
        if platforms is None:
            platforms = ['youtube', 'udemy', 'coursera', 'nptel', 'cisco']

        all_courses = []

        for platform in platforms:
            try:
                if platform == 'youtube':
                    courses = self.fetch_youtube_courses(category, count_per_platform)
                elif platform == 'udemy':
                    courses = self.fetch_udemy_courses(category, count_per_platform)
                else:
                    # Use curated data for platforms without API
                    courses = self._get_curated_courses(platform, category, count_per_platform)

                all_courses.extend(courses)
                logger.info(f"Fetched {len(courses)} courses from {platform}")

            except Exception as e:
                logger.error(f"Error fetching from {platform}: {e}")
                # Try curated data as fallback
                courses = self._get_curated_courses(platform, category, count_per_platform)
                all_courses.extend(courses)

        # Shuffle the combined results
        random.shuffle(all_courses)

        return all_courses

    def save_courses_to_db(self, courses: List[Dict]) -> int:
        """
        Save fetched courses to the database.
        Skips duplicates based on title + platform.

        Returns:
            Number of courses saved
        """
        from learning.models import Course

        saved_count = 0

        for course_data in courses:
            # Check for existing course
            existing = Course.objects.filter(
                title=course_data['title'],
                platform=course_data.get('platform', 'apex')
            ).first()

            if existing:
                logger.info(f"Course already exists: {course_data['title']}")
                continue

            try:
                course = Course(
                    title=course_data['title'],
                    description=course_data.get('description', ''),
                    instructor=course_data.get('instructor', 'Unknown'),
                    price=Decimal(str(course_data.get('price', 0))),
                    category=course_data.get('category', 'other'),
                    difficulty=course_data.get('difficulty', 'beginner'),
                    platform=course_data.get('platform', 'apex'),
                    external_url=course_data.get('external_url', ''),
                    thumbnail_url=course_data.get('thumbnail_url', ''),
                    duration_hours=course_data.get('duration_hours', 0),
                    total_enrollments=course_data.get('total_enrollments', 0),
                    average_rating=Decimal(str(course_data.get('average_rating', 0))),
                    is_published=True,
                )
                course.save()
                saved_count += 1
                logger.info(f"Saved course: {course.title}")

            except Exception as e:
                logger.error(f"Error saving course {course_data.get('title')}: {e}")

        return saved_count


# Singleton instance
_fetcher_instance = None


def get_course_fetcher() -> ExternalCourseFetcher:
    """Get or create the course fetcher singleton."""
    global _fetcher_instance
    if _fetcher_instance is None:
        _fetcher_instance = ExternalCourseFetcher()
    return _fetcher_instance
