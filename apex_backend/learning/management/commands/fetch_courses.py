"""
Django Management Command: Fetch External Courses
==================================================
Fetches courses from external platforms (YouTube, Udemy, Coursera, NPTEL, Cisco)
and saves them to the database.

Usage:
    python manage.py fetch_courses
    python manage.py fetch_courses --platforms youtube udemy
    python manage.py fetch_courses --category web_development
    python manage.py fetch_courses --count 10
    python manage.py fetch_courses --no-save  # Just preview, don't save to DB
"""

from django.core.management.base import BaseCommand, CommandError
from learning.course_fetcher import get_course_fetcher


class Command(BaseCommand):
    help = 'Fetch courses from external platforms (YouTube, Udemy, Coursera, NPTEL, Cisco)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--platforms',
            nargs='+',
            type=str,
            default=['youtube', 'udemy', 'coursera', 'nptel', 'cisco'],
            help='Platforms to fetch from (default: all)'
        )
        parser.add_argument(
            '--category',
            type=str,
            default=None,
            help='Filter by category (e.g., web_development, machine_learning)'
        )
        parser.add_argument(
            '--count',
            type=int,
            default=4,
            help='Number of courses to fetch per platform (default: 4)'
        )
        parser.add_argument(
            '--no-save',
            action='store_true',
            help='Preview courses without saving to database'
        )

    def handle(self, *args, **options):
        platforms = options['platforms']
        category = options['category']
        count = options['count']
        no_save = options['no_save']

        self.stdout.write(
            self.style.NOTICE(f"Fetching courses from: {', '.join(platforms)}")
        )

        if category:
            self.stdout.write(self.style.NOTICE(f"Category filter: {category}"))

        # Get the course fetcher
        fetcher = get_course_fetcher()

        # Fetch courses
        self.stdout.write("Fetching courses...")
        courses = fetcher.fetch_courses(
            platforms=platforms,
            category=category,
            count_per_platform=count
        )

        if not courses:
            self.stdout.write(self.style.WARNING("No courses fetched."))
            return

        self.stdout.write(
            self.style.SUCCESS(f"Fetched {len(courses)} courses total")
        )

        # Display fetched courses
        self.stdout.write("\n" + "=" * 60)
        for i, course in enumerate(courses, 1):
            self.stdout.write(f"\n{i}. {course['title']}")
            self.stdout.write(f"   Platform: {course.get('platform', 'unknown').upper()}")
            self.stdout.write(f"   Instructor: {course.get('instructor', 'Unknown')}")
            self.stdout.write(f"   Category: {course.get('category', 'other')}")
            self.stdout.write(f"   Difficulty: {course.get('difficulty', 'beginner')}")
            self.stdout.write(f"   Duration: {course.get('duration_hours', 0)} hours")
            price = course.get('price', 0)
            self.stdout.write(f"   Price: {'Free' if price == 0 else f'₹{price}'}")
            self.stdout.write(f"   Rating: {course.get('average_rating', 0)}")
            self.stdout.write(f"   URL: {course.get('external_url', 'N/A')[:60]}...")
        self.stdout.write("\n" + "=" * 60 + "\n")

        # Save to database if not in preview mode
        if no_save:
            self.stdout.write(
                self.style.WARNING("Preview mode: Courses not saved to database")
            )
        else:
            self.stdout.write("Saving courses to database...")
            saved_count = fetcher.save_courses_to_db(courses)
            self.stdout.write(
                self.style.SUCCESS(f"Saved {saved_count} new courses to database")
            )

        # Summary by platform
        self.stdout.write("\nCourses by platform:")
        platform_counts = {}
        for course in courses:
            platform = course.get('platform', 'unknown')
            platform_counts[platform] = platform_counts.get(platform, 0) + 1

        for platform, count in sorted(platform_counts.items()):
            self.stdout.write(f"  - {platform.upper()}: {count}")
