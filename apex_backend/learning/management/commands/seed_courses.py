"""
Management command to seed the database with sample courses.
Run: python manage.py seed_courses
"""

from django.core.management.base import BaseCommand
from learning.models import Course
from decimal import Decimal
import random


class Command(BaseCommand):
    help = 'Seeds the database with sample courses for the Apex platform'

    def handle(self, *args, **options):
        self.stdout.write('Seeding courses...')
        
        courses_data = [
            # Web Development
            {
                'title': 'Complete React Developer Masterclass 2024',
                'description': 'Master React from zero to hero! Learn React 18, Redux Toolkit, React Query, TypeScript, Next.js, and build real-world projects. This comprehensive course covers hooks, context API, performance optimization, testing with Jest and React Testing Library, and deployment strategies.',
                'instructor': 'Sarah Chen',
                'price': Decimal('89.99'),
                'category': 'web_development',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/react-course',
                'tags': 'react, javascript, frontend, web development, redux, typescript, hooks, next.js',
                'duration_hours': 45,
                'average_rating': Decimal('4.85'),
                'total_enrollments': 15420,
            },
            {
                'title': 'Node.js & Express Backend Development',
                'description': 'Build scalable backend applications with Node.js and Express. Learn REST API design, authentication with JWT, database integration with MongoDB and PostgreSQL, real-time features with Socket.io, and microservices architecture.',
                'instructor': 'Michael Roberts',
                'price': Decimal('79.99'),
                'category': 'web_development',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/nodejs-course',
                'tags': 'nodejs, express, backend, api, mongodb, postgresql, jwt, authentication',
                'duration_hours': 38,
                'average_rating': Decimal('4.72'),
                'total_enrollments': 12350,
            },
            {
                'title': 'Full Stack Django & React Development',
                'description': 'Combine the power of Django REST Framework with React to build full-stack applications. Learn authentication, state management, deployment with Docker, and CI/CD pipelines.',
                'instructor': 'Emily Watson',
                'price': Decimal('99.99'),
                'category': 'web_development',
                'difficulty': 'advanced',
                'video_url': 'https://example.com/fullstack-course',
                'tags': 'django, react, fullstack, python, javascript, docker, rest api',
                'duration_hours': 52,
                'average_rating': Decimal('4.90'),
                'total_enrollments': 8920,
            },
            
            # Data Science
            {
                'title': 'Python for Data Science & Machine Learning',
                'description': 'Complete data science bootcamp with Python! Master NumPy, Pandas, Matplotlib, Seaborn, Scikit-Learn, and TensorFlow. Learn data cleaning, visualization, statistical analysis, and build predictive models.',
                'instructor': 'Dr. James Liu',
                'price': Decimal('129.99'),
                'category': 'data_science',
                'difficulty': 'beginner',
                'video_url': 'https://example.com/datascience-course',
                'tags': 'python, data science, pandas, numpy, machine learning, tensorflow, visualization',
                'duration_hours': 60,
                'average_rating': Decimal('4.88'),
                'total_enrollments': 25680,
            },
            {
                'title': 'Advanced SQL & Database Analytics',
                'description': 'Master SQL for data analysis! Learn complex queries, window functions, CTEs, stored procedures, and database optimization. Work with PostgreSQL, MySQL, and SQL Server.',
                'instructor': 'Anna Martinez',
                'price': Decimal('69.99'),
                'category': 'data_science',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/sql-course',
                'tags': 'sql, database, analytics, postgresql, mysql, data analysis, queries',
                'duration_hours': 28,
                'average_rating': Decimal('4.75'),
                'total_enrollments': 18900,
            },
            
            # Machine Learning
            {
                'title': 'Deep Learning with PyTorch',
                'description': 'Master deep learning with PyTorch! Build neural networks, CNNs, RNNs, Transformers, and GANs. Learn computer vision, NLP, and deploy models to production.',
                'instructor': 'Dr. Alex Thompson',
                'price': Decimal('149.99'),
                'category': 'machine_learning',
                'difficulty': 'advanced',
                'video_url': 'https://example.com/pytorch-course',
                'tags': 'pytorch, deep learning, neural networks, cnn, rnn, transformers, nlp, computer vision',
                'duration_hours': 55,
                'average_rating': Decimal('4.92'),
                'total_enrollments': 9870,
            },
            {
                'title': 'Machine Learning A-Z: Hands-On with Scikit-Learn',
                'description': 'Learn machine learning algorithms from scratch! Master regression, classification, clustering, and dimensionality reduction. Build real projects with Scikit-Learn and understand the math behind ML.',
                'instructor': 'David Kim',
                'price': Decimal('94.99'),
                'category': 'machine_learning',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/ml-course',
                'tags': 'machine learning, scikit-learn, python, regression, classification, clustering, algorithms',
                'duration_hours': 42,
                'average_rating': Decimal('4.80'),
                'total_enrollments': 21450,
            },
            
            # Artificial Intelligence
            {
                'title': 'Natural Language Processing with Transformers',
                'description': 'Master NLP with the latest transformer models! Learn BERT, GPT, T5, and build text classification, sentiment analysis, question answering, and text generation systems.',
                'instructor': 'Dr. Lisa Park',
                'price': Decimal('139.99'),
                'category': 'artificial_intelligence',
                'difficulty': 'advanced',
                'video_url': 'https://example.com/nlp-course',
                'tags': 'nlp, transformers, bert, gpt, huggingface, text classification, sentiment analysis',
                'duration_hours': 48,
                'average_rating': Decimal('4.87'),
                'total_enrollments': 7650,
            },
            {
                'title': 'Computer Vision: From Basics to Advanced',
                'description': 'Master computer vision with OpenCV and deep learning! Learn image processing, object detection, face recognition, image segmentation, and deploy vision models.',
                'instructor': 'Robert Zhang',
                'price': Decimal('119.99'),
                'category': 'artificial_intelligence',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/cv-course',
                'tags': 'computer vision, opencv, deep learning, object detection, image processing, cnn, yolo',
                'duration_hours': 40,
                'average_rating': Decimal('4.78'),
                'total_enrollments': 11230,
            },
            
            # Cloud Computing
            {
                'title': 'AWS Solutions Architect Certification Prep',
                'description': 'Prepare for the AWS Solutions Architect Associate exam! Learn EC2, S3, VPC, Lambda, RDS, and design scalable, highly available architectures on AWS.',
                'instructor': 'Jennifer Adams',
                'price': Decimal('109.99'),
                'category': 'cloud_computing',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/aws-course',
                'tags': 'aws, cloud, architecture, ec2, s3, lambda, vpc, certification',
                'duration_hours': 35,
                'average_rating': Decimal('4.82'),
                'total_enrollments': 28900,
            },
            {
                'title': 'Google Cloud Platform: Complete Guide',
                'description': 'Master Google Cloud Platform from scratch! Learn Compute Engine, Kubernetes, BigQuery, Cloud Functions, and build cloud-native applications.',
                'instructor': 'Chris Anderson',
                'price': Decimal('99.99'),
                'category': 'cloud_computing',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/gcp-course',
                'tags': 'gcp, google cloud, kubernetes, bigquery, cloud functions, compute engine',
                'duration_hours': 32,
                'average_rating': Decimal('4.76'),
                'total_enrollments': 14560,
            },
            
            # DevOps
            {
                'title': 'Docker & Kubernetes Masterclass',
                'description': 'Master containerization with Docker and orchestration with Kubernetes! Learn container networking, volumes, Helm charts, and deploy production-grade clusters.',
                'instructor': 'Mark Wilson',
                'price': Decimal('119.99'),
                'category': 'devops',
                'difficulty': 'advanced',
                'video_url': 'https://example.com/docker-k8s-course',
                'tags': 'docker, kubernetes, containers, devops, helm, orchestration, microservices',
                'duration_hours': 45,
                'average_rating': Decimal('4.89'),
                'total_enrollments': 16780,
            },
            {
                'title': 'CI/CD Pipeline with GitHub Actions & Jenkins',
                'description': 'Automate your development workflow! Learn continuous integration and deployment with GitHub Actions, Jenkins, and ArgoCD. Master testing automation and deployment strategies.',
                'instructor': 'Patricia Brown',
                'price': Decimal('79.99'),
                'category': 'devops',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/cicd-course',
                'tags': 'ci/cd, github actions, jenkins, automation, devops, argocd, testing',
                'duration_hours': 28,
                'average_rating': Decimal('4.71'),
                'total_enrollments': 9340,
            },
            
            # Cybersecurity
            {
                'title': 'Ethical Hacking: Complete Penetration Testing',
                'description': 'Learn ethical hacking and penetration testing! Master Kali Linux, network scanning, vulnerability assessment, web application security, and write professional reports.',
                'instructor': 'Kevin Black',
                'price': Decimal('134.99'),
                'category': 'cybersecurity',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/hacking-course',
                'tags': 'ethical hacking, penetration testing, kali linux, cybersecurity, security, vulnerability',
                'duration_hours': 50,
                'average_rating': Decimal('4.86'),
                'total_enrollments': 19870,
            },
            
            # Mobile Development
            {
                'title': 'Flutter & Dart: Build iOS & Android Apps',
                'description': 'Build beautiful cross-platform mobile apps with Flutter! Learn Dart programming, state management with Provider and Riverpod, Firebase integration, and publish to app stores.',
                'instructor': 'Sophie Turner',
                'price': Decimal('99.99'),
                'category': 'mobile_development',
                'difficulty': 'beginner',
                'video_url': 'https://example.com/flutter-course',
                'tags': 'flutter, dart, mobile development, ios, android, cross-platform, firebase',
                'duration_hours': 42,
                'average_rating': Decimal('4.84'),
                'total_enrollments': 22340,
            },
            {
                'title': 'React Native: Mobile App Development',
                'description': 'Build native mobile apps with React Native! Learn navigation, state management, native modules, and deploy to iOS and Android app stores.',
                'instructor': 'Jason Miller',
                'price': Decimal('89.99'),
                'category': 'mobile_development',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/react-native-course',
                'tags': 'react native, mobile development, javascript, ios, android, cross-platform',
                'duration_hours': 38,
                'average_rating': Decimal('4.77'),
                'total_enrollments': 17650,
            },
            
            # Programming Languages
            {
                'title': 'Python Programming: From Zero to Expert',
                'description': 'Complete Python programming course! Learn Python fundamentals, OOP, file handling, decorators, generators, and build real-world projects. Perfect for beginners.',
                'instructor': 'Dr. Maria Garcia',
                'price': Decimal('69.99'),
                'category': 'programming_languages',
                'difficulty': 'beginner',
                'video_url': 'https://example.com/python-course',
                'tags': 'python, programming, oop, beginner, fundamentals, scripting',
                'duration_hours': 35,
                'average_rating': Decimal('4.91'),
                'total_enrollments': 45670,
            },
            {
                'title': 'Rust Programming: Systems Development',
                'description': 'Master Rust for systems programming! Learn ownership, borrowing, lifetimes, async/await, and build high-performance, memory-safe applications.',
                'instructor': 'Thomas Moore',
                'price': Decimal('109.99'),
                'category': 'programming_languages',
                'difficulty': 'advanced',
                'video_url': 'https://example.com/rust-course',
                'tags': 'rust, systems programming, memory safety, performance, concurrency',
                'duration_hours': 40,
                'average_rating': Decimal('4.83'),
                'total_enrollments': 6780,
            },
            {
                'title': 'Go Programming: Build Scalable Services',
                'description': 'Learn Go for building scalable backend services! Master goroutines, channels, web frameworks, and microservices architecture with Go.',
                'instructor': 'Rachel Green',
                'price': Decimal('84.99'),
                'category': 'programming_languages',
                'difficulty': 'intermediate',
                'video_url': 'https://example.com/go-course',
                'tags': 'go, golang, backend, concurrency, microservices, web services',
                'duration_hours': 32,
                'average_rating': Decimal('4.79'),
                'total_enrollments': 11890,
            },
        ]
        
        created_count = 0
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                title=course_data['title'],
                defaults=course_data
            )
            if created:
                created_count += 1
                self.stdout.write(f'  Created: {course.title}')
            else:
                self.stdout.write(f'  Skipped (exists): {course.title}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully seeded {created_count} new courses! '
                f'Total courses: {Course.objects.count()}'
            )
        )
