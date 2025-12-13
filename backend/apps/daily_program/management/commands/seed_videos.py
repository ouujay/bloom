from django.core.management.base import BaseCommand
from apps.daily_program.models import YouTubeLesson


class Command(BaseCommand):
    help = 'Seed sample YouTube video lessons'

    def handle(self, *args, **options):
        videos = [
            # First Trimester Videos
            {
                'stage': 'pregnancy',
                'week': 4,
                'youtube_id': 'HvLN_Ud4Hes',
                'title': 'First Trimester: What to Expect',
                'description': 'Learn about the changes happening in your body during the first trimester and how to manage common symptoms.',
                'duration_seconds': 480,
                'thumbnail_url': 'https://i.ytimg.com/vi/HvLN_Ud4Hes/maxresdefault.jpg',
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 6,
                'youtube_id': 'yyDU5Y1F8D4',
                'title': 'Healthy Eating During Pregnancy',
                'description': 'Essential nutrition tips for a healthy pregnancy. Learn what foods to eat and what to avoid.',
                'duration_seconds': 600,
                'thumbnail_url': 'https://i.ytimg.com/vi/yyDU5Y1F8D4/maxresdefault.jpg',
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 8,
                'youtube_id': '9CkWUZABqFI',
                'title': 'Managing Morning Sickness',
                'description': 'Practical tips and remedies to help you cope with nausea and morning sickness during pregnancy.',
                'duration_seconds': 420,
                'thumbnail_url': 'https://i.ytimg.com/vi/9CkWUZABqFI/maxresdefault.jpg',
                'token_reward': 10,
            },
            # Second Trimester Videos
            {
                'stage': 'pregnancy',
                'week': 14,
                'youtube_id': 'pFoFgWcjHrM',
                'title': 'Second Trimester: Baby Development',
                'description': 'Discover the amazing developments happening with your baby during the second trimester.',
                'duration_seconds': 540,
                'thumbnail_url': 'https://i.ytimg.com/vi/pFoFgWcjHrM/maxresdefault.jpg',
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 18,
                'youtube_id': 'j6Am0aFVPB4',
                'title': 'Safe Exercise During Pregnancy',
                'description': 'Stay active and healthy with these pregnancy-safe exercises and workout tips.',
                'duration_seconds': 720,
                'thumbnail_url': 'https://i.ytimg.com/vi/j6Am0aFVPB4/maxresdefault.jpg',
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 20,
                'youtube_id': 'A5-K7C1jHMQ',
                'title': 'Understanding Baby Movements',
                'description': 'Learn about fetal movements, kick counting, and when to be concerned.',
                'duration_seconds': 480,
                'thumbnail_url': 'https://i.ytimg.com/vi/A5-K7C1jHMQ/maxresdefault.jpg',
                'token_reward': 10,
            },
            # Third Trimester Videos
            {
                'stage': 'pregnancy',
                'week': 28,
                'youtube_id': 'BtP-F5_fPK8',
                'title': 'Third Trimester: Preparing for Birth',
                'description': 'Everything you need to know about the final stretch of pregnancy and birth preparation.',
                'duration_seconds': 660,
                'thumbnail_url': 'https://i.ytimg.com/vi/BtP-F5_fPK8/maxresdefault.jpg',
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 32,
                'youtube_id': 'Q2b5TKM8JrA',
                'title': 'Creating Your Birth Plan',
                'description': 'How to create a birth plan that reflects your wishes and preferences for delivery.',
                'duration_seconds': 540,
                'thumbnail_url': 'https://i.ytimg.com/vi/Q2b5TKM8JrA/maxresdefault.jpg',
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 36,
                'youtube_id': 'rJcb87yI6lc',
                'title': 'Signs of Labor: What to Watch For',
                'description': 'Learn to recognize the signs of true labor and when to head to the hospital.',
                'duration_seconds': 480,
                'thumbnail_url': 'https://i.ytimg.com/vi/rJcb87yI6lc/maxresdefault.jpg',
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 38,
                'youtube_id': 'QvvA6jgHBMo',
                'title': 'Breastfeeding Basics',
                'description': 'Prepare for breastfeeding with essential tips on latching, positions, and common challenges.',
                'duration_seconds': 720,
                'thumbnail_url': 'https://i.ytimg.com/vi/QvvA6jgHBMo/maxresdefault.jpg',
                'token_reward': 10,
            },
        ]

        created_count = 0
        for video_data in videos:
            video, created = YouTubeLesson.objects.get_or_create(
                youtube_id=video_data['youtube_id'],
                defaults=video_data
            )
            if created:
                created_count += 1
                self.stdout.write(f"Created: {video.title}")
            else:
                self.stdout.write(f"Already exists: {video.title}")

        self.stdout.write(self.style.SUCCESS(f'\nDone! Created {created_count} new videos.'))
        self.stdout.write(f'Total videos in database: {YouTubeLesson.objects.count()}')
