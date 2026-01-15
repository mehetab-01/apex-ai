"""
Management command to add real thumbnail URLs to existing courses.
Run with: python manage.py add_course_thumbnails
"""

from django.core.management.base import BaseCommand
from learning.models import Course


class Command(BaseCommand):
    help = 'Add real thumbnail URLs to existing courses'

    def handle(self, *args, **options):
        # Map course titles to their real thumbnail URLs
        # Using actual course thumbnails and high-quality relevant images
        thumbnail_map = {
            # UDEMY COURSES
            'The Complete Web Developer Course 3.0': 'https://img-c.udemycdn.com/course/480x270/764164_de03_2.jpg',
            'Machine Learning A-Z: AI, Python & R + ChatGPT Prize [2024]': 'https://img-c.udemycdn.com/course/480x270/950390_270f_3.jpg',
            'The Complete JavaScript Course 2024: From Zero to Expert!': 'https://img-c.udemycdn.com/course/480x270/851712_fc61_6.jpg',
            '100 Days of Code: The Complete Python Pro Bootcamp': 'https://img-c.udemycdn.com/course/480x270/2776760_f176_10.jpg',
            
            # YOUTUBE COURSES
            'CS50: Introduction to Computer Science': 'https://i.ytimg.com/vi/LfaMVlDaQ24/hqdefault.jpg',
            'Full Stack Web Development Course': 'https://i.ytimg.com/vi/nu_pCVPKzTk/maxresdefault.jpg',
            'Python Full Course for Beginners': 'https://i.ytimg.com/vi/_uQrJ0TkZlc/maxresdefault.jpg',
            'React Tutorial for Beginners': 'https://i.ytimg.com/vi/j942wKiXFu8/maxresdefault.jpg',
            
            # COURSERA COURSES
            'Deep Learning Specialization': 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/eb/a2501052be11e8a5f7517ff4e5d558/CarsshadowML.png?auto=format%2Ccompress&dpr=1&w=330&h=330&fit=fill&q=25',
            'Google Data Analytics Professional Certificate': 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/4a/cb36835ae3421187080898a7ecc11d/Google-G_360x360.png?auto=format%2Ccompress&dpr=1&w=56&h=56&q=40',
            'IBM Full Stack Software Developer': 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/http://coursera-university-assets.s3.amazonaws.com/bb/f5ced2bdd4437aa79f00eb1bf7fbf0/IBM-Logo-Blk---Square.png?auto=format%2Ccompress&dpr=1&w=56&h=56&q=40',
            'TensorFlow Developer Certificate': 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://d15cw65ipctsrr.cloudfront.net/2b/e5a550d97711e8986c85e55b3f5646/TensorFlow_Dev_logo.png?auto=format%2Ccompress&dpr=1&w=330&h=330&fit=fill&q=25',
            
            # INFOSYS SPRINGBOARD
            'Python for Beginners': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=480&h=270&fit=crop',
            'Data Science Foundation': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=480&h=270&fit=crop',
            'Cloud Computing Fundamentals': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=480&h=270&fit=crop',
            
            # NPTEL COURSES
            'Programming, Data Structures and Algorithms Using Python': 'https://storage.googleapis.com/swayam-node1-production.appspot.com/assets/img/noc20_cs21/noc20_cs21.jpg',
            'Deep Learning': 'https://storage.googleapis.com/swayam-node1-production.appspot.com/assets/img/noc19_cs85/noc19_cs85.jpg',
            'Database Management System': 'https://storage.googleapis.com/swayam-node1-production.appspot.com/assets/img/noc19_cs48/noc19_cs48.jpg',
            
            # CISCO COURSES
            'CCNA: Introduction to Networks': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=480&h=270&fit=crop',
            'CyberOps Associate': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=480&h=270&fit=crop',
            'Introduction to Cybersecurity': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=480&h=270&fit=crop',
            
            # CYFRIN COURSES
            'Blockchain Developer Bootcamp': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=480&h=270&fit=crop',
            'Smart Contract Security & Auditing': 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=480&h=270&fit=crop',
            
            # FREECODECAMP COURSES
            'Responsive Web Design Certification': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480&h=270&fit=crop',
            'JavaScript Algorithms and Data Structures': 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=480&h=270&fit=crop',
            'Scientific Computing with Python': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=480&h=270&fit=crop',
            'Machine Learning with Python': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=480&h=270&fit=crop',
            
            # HACKERRANK
            'Python (Basic) Certification': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=480&h=270&fit=crop',
            'Problem Solving (Basic) Certification': 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=480&h=270&fit=crop',
            'SQL (Advanced) Certification': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=480&h=270&fit=crop',
            
            # CODECHEF
            'Learn Data Structures and Algorithms': 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=480&h=270&fit=crop',
            'Competitive Programming Bootcamp': 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=480&h=270&fit=crop',
            
            # LEETCODE
            'Data Structures & Algorithms Interview Prep': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=480&h=270&fit=crop',
            
            # EDX COURSES
            'CS50\'s Web Programming with Python and JavaScript': 'https://prod-discovery.edx-cdn.org/media/course/image/8f8e5124-1dab-47e6-8fa6-3fbdc0738f0a-f78831c35d44.small.jpg',
            'Introduction to Linux': 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=480&h=270&fit=crop',
            
            # MIT OCW
            'Introduction to Computer Science and Programming Using Python': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=480&h=270&fit=crop',
            'Introduction to Algorithms': 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=480&h=270&fit=crop',
            
            # COURSERA - Additional
            'AWS Cloud Technical Essentials': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=480&h=270&fit=crop',
            'Google UX Design Professional Certificate': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=480&h=270&fit=crop',
            'Meta React Native Specialization': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=480&h=270&fit=crop',
            'DevOps on AWS Specialization': 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=480&h=270&fit=crop',
            
            # UNITY LEARN
            'Unity Certified Programmer': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=480&h=270&fit=crop',
        }

        updated_count = 0
        not_found = []

        for title, thumbnail_url in thumbnail_map.items():
            try:
                course = Course.objects.get(title=title)
                course.thumbnail_url = thumbnail_url
                course.save()
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f'Updated: {title}'))
            except Course.DoesNotExist:
                not_found.append(title)
                self.stdout.write(self.style.WARNING(f'Not found: {title}'))

        # For courses without explicit thumbnails, use category-based images
        category_thumbnails = {
            'web_development': 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=480&h=270&fit=crop',
            'mobile_development': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=480&h=270&fit=crop',
            'data_science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=480&h=270&fit=crop',
            'machine_learning': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=480&h=270&fit=crop',
            'artificial_intelligence': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=480&h=270&fit=crop',
            'cloud_computing': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=480&h=270&fit=crop',
            'cybersecurity': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=480&h=270&fit=crop',
            'devops': 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=480&h=270&fit=crop',
            'blockchain': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=480&h=270&fit=crop',
            'game_development': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=480&h=270&fit=crop',
            'ui_ux_design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=480&h=270&fit=crop',
            'database': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=480&h=270&fit=crop',
            'programming_languages': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=480&h=270&fit=crop',
            'software_engineering': 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=480&h=270&fit=crop',
            'networking': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=480&h=270&fit=crop',
        }

        # Update courses without thumbnails using category-based images
        courses_without_thumbnails = Course.objects.filter(thumbnail_url__isnull=True) | Course.objects.filter(thumbnail_url='')
        for course in courses_without_thumbnails:
            if course.category in category_thumbnails:
                course.thumbnail_url = category_thumbnails[course.category]
                course.save()
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f'Set category thumbnail for: {course.title}'))

        self.stdout.write(self.style.SUCCESS(f'\nDone! Updated {updated_count} courses with thumbnails.'))
        if not_found:
            self.stdout.write(self.style.WARNING(f'Courses not found: {len(not_found)}'))
