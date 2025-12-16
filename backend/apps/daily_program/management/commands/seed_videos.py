from django.core.management.base import BaseCommand
from apps.daily_program.models import YouTubeLesson


class Command(BaseCommand):
    help = 'Seed 60 pregnancy education YouTube videos across 40 weeks'

    def handle(self, *args, **options):
        # Comprehensive pregnancy education video collection
        # Organized by week to provide daily video tasks throughout pregnancy
        # Videos from reputable pregnancy education channels

        videos = [
            # ============ FIRST TRIMESTER (Weeks 1-13) ============

            # Week 4 - Early Pregnancy
            {
                'stage': 'pregnancy',
                'week': 4,
                'day': 1,
                'youtube_id': 'HvLN_Ud4Hes',
                'title': 'First Trimester: What to Expect',
                'description': 'Learn about the changes happening in your body during the first trimester and how to manage common symptoms like fatigue and nausea.',
                'duration_seconds': 480,
                'key_points': ['Early pregnancy symptoms', 'Body changes', 'What to expect'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 4,
                'day': 3,
                'youtube_id': 'qRvO0Xm_cYI',
                'title': 'Early Pregnancy Signs and Symptoms',
                'description': 'Understanding the earliest signs of pregnancy and what they mean for you and your baby.',
                'duration_seconds': 420,
                'key_points': ['Early signs', 'Pregnancy symptoms', 'When to test'],
                'token_reward': 10,
            },

            # Week 5 - Confirming Pregnancy
            {
                'stage': 'pregnancy',
                'week': 5,
                'day': 1,
                'youtube_id': 'Lf1KXKCY-Uw',
                'title': 'Your First Prenatal Visit: What to Expect',
                'description': 'Everything you need to know about your first prenatal appointment, tests, and questions to ask your doctor.',
                'duration_seconds': 540,
                'key_points': ['First prenatal visit', 'Medical tests', 'Questions for doctor'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 5,
                'day': 4,
                'youtube_id': 'OAYHr8Dy9Ek',
                'title': 'Choosing Your Healthcare Provider',
                'description': 'Midwife vs OB-GYN: Understanding your options for prenatal care and delivery.',
                'duration_seconds': 600,
                'key_points': ['Midwife vs OB-GYN', 'Birth settings', 'Care options'],
                'token_reward': 10,
            },

            # Week 6 - Nutrition Basics
            {
                'stage': 'pregnancy',
                'week': 6,
                'day': 1,
                'youtube_id': 'yyDU5Y1F8D4',
                'title': 'Healthy Eating During Pregnancy',
                'description': 'Essential nutrition tips for a healthy pregnancy. Learn what foods to eat and what to avoid for optimal baby development.',
                'duration_seconds': 600,
                'key_points': ['Pregnancy nutrition', 'Foods to eat', 'Foods to avoid'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 6,
                'day': 4,
                'youtube_id': 'XKj4UfGhYsU',
                'title': 'Prenatal Vitamins: What You Need to Know',
                'description': 'Understanding folic acid, iron, and other essential vitamins for a healthy pregnancy.',
                'duration_seconds': 480,
                'key_points': ['Prenatal vitamins', 'Folic acid', 'Essential nutrients'],
                'token_reward': 10,
            },

            # Week 7 - Managing Symptoms
            {
                'stage': 'pregnancy',
                'week': 7,
                'day': 1,
                'youtube_id': '9CkWUZABqFI',
                'title': 'Managing Morning Sickness',
                'description': 'Practical tips and natural remedies to help you cope with nausea and morning sickness during pregnancy.',
                'duration_seconds': 420,
                'key_points': ['Morning sickness relief', 'Natural remedies', 'When to seek help'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 7,
                'day': 4,
                'youtube_id': 'vHfTjXvBE7Y',
                'title': 'First Trimester Fatigue: Coping Strategies',
                'description': 'Why you feel so tired in early pregnancy and practical ways to boost your energy.',
                'duration_seconds': 390,
                'key_points': ['Fatigue causes', 'Energy boosters', 'Rest importance'],
                'token_reward': 10,
            },

            # Week 8 - Baby Development
            {
                'stage': 'pregnancy',
                'week': 8,
                'day': 1,
                'youtube_id': 'QgxB7QOmvqs',
                'title': 'Baby Development Week 8',
                'description': 'See how your baby is developing at 8 weeks - from tiny embryo to recognizable form.',
                'duration_seconds': 360,
                'key_points': ['Week 8 development', 'Organ formation', 'Baby size'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 8,
                'day': 4,
                'youtube_id': 'JsVLL19AJBQ',
                'title': 'Understanding Your First Ultrasound',
                'description': 'What to expect during your dating ultrasound and what the images mean.',
                'duration_seconds': 480,
                'key_points': ['First ultrasound', 'Dating scan', 'What you will see'],
                'token_reward': 10,
            },

            # Week 9 - Emotional Health
            {
                'stage': 'pregnancy',
                'week': 9,
                'day': 1,
                'youtube_id': 'QdVmGKGbP_c',
                'title': 'Emotional Changes in Pregnancy',
                'description': 'Understanding mood swings, anxiety, and emotional changes during pregnancy.',
                'duration_seconds': 540,
                'key_points': ['Mood swings', 'Pregnancy emotions', 'Mental health'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 9,
                'day': 4,
                'youtube_id': 'Xa4iVi0P7XE',
                'title': 'Bonding With Your Baby During Pregnancy',
                'description': 'Ways to connect with your baby before birth through talking, music, and touch.',
                'duration_seconds': 420,
                'key_points': ['Prenatal bonding', 'Talking to baby', 'Music and touch'],
                'token_reward': 10,
            },

            # Week 10 - Safety and Lifestyle
            {
                'stage': 'pregnancy',
                'week': 10,
                'day': 1,
                'youtube_id': 'kD0xYfxLsLs',
                'title': 'Pregnancy Safety: What to Avoid',
                'description': 'Important safety guidelines including foods, activities, and substances to avoid during pregnancy.',
                'duration_seconds': 600,
                'key_points': ['Foods to avoid', 'Activities to skip', 'Safety tips'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 10,
                'day': 4,
                'youtube_id': 'PLm7vKw0GkQ',
                'title': 'Exercise Safety in First Trimester',
                'description': 'Safe exercises for early pregnancy and activities to modify or avoid.',
                'duration_seconds': 480,
                'key_points': ['Safe exercises', 'What to modify', 'Staying active'],
                'token_reward': 10,
            },

            # Week 11 - Prenatal Testing
            {
                'stage': 'pregnancy',
                'week': 11,
                'day': 1,
                'youtube_id': 'wL5MH5gVykA',
                'title': 'First Trimester Screening Tests Explained',
                'description': 'Understanding NIPT, NT scan, and other first trimester screening options.',
                'duration_seconds': 720,
                'key_points': ['NIPT test', 'NT scan', 'Genetic screening'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 11,
                'day': 4,
                'youtube_id': 'xWpMdM7Z2ws',
                'title': 'Making Decisions About Prenatal Testing',
                'description': 'Factors to consider when deciding which prenatal tests are right for you.',
                'duration_seconds': 540,
                'key_points': ['Test decisions', 'Risk factors', 'Personal choice'],
                'token_reward': 10,
            },

            # Week 12 - End of First Trimester
            {
                'stage': 'pregnancy',
                'week': 12,
                'day': 1,
                'youtube_id': 'j1BDWDRFY5k',
                'title': 'End of First Trimester: Celebrating This Milestone',
                'description': 'What reaching 12 weeks means and changes you can expect as you enter the second trimester.',
                'duration_seconds': 480,
                'key_points': ['12 week milestone', 'Reduced risks', 'Sharing news'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 12,
                'day': 4,
                'youtube_id': 'r2Hd3Qb1Q8c',
                'title': 'Announcing Your Pregnancy',
                'description': 'Creative and meaningful ways to share your pregnancy news with family and friends.',
                'duration_seconds': 360,
                'key_points': ['Announcement ideas', 'When to share', 'Work announcement'],
                'token_reward': 10,
            },

            # Week 13 - Transition to Second Trimester
            {
                'stage': 'pregnancy',
                'week': 13,
                'day': 1,
                'youtube_id': 'Qw5qJXbPLnY',
                'title': 'Welcome to the Second Trimester',
                'description': 'What to expect as you enter the honeymoon phase of pregnancy.',
                'duration_seconds': 540,
                'key_points': ['Second trimester changes', 'Energy return', 'Symptom relief'],
                'token_reward': 10,
            },

            # ============ SECOND TRIMESTER (Weeks 14-27) ============

            # Week 14 - Baby Growth
            {
                'stage': 'pregnancy',
                'week': 14,
                'day': 1,
                'youtube_id': 'pFoFgWcjHrM',
                'title': 'Second Trimester: Baby Development',
                'description': 'Discover the amazing developments happening with your baby during the second trimester.',
                'duration_seconds': 540,
                'key_points': ['Baby growth', 'Organ development', 'Movement begins'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 14,
                'day': 4,
                'youtube_id': 'K5xGQPYwtUo',
                'title': 'Your Changing Body: Second Trimester',
                'description': 'Physical changes to expect as your belly grows and your body adapts.',
                'duration_seconds': 480,
                'key_points': ['Body changes', 'Belly growth', 'Skin changes'],
                'token_reward': 10,
            },

            # Week 15 - Common Discomforts
            {
                'stage': 'pregnancy',
                'week': 15,
                'day': 1,
                'youtube_id': 'Tj7dPLbU1Dk',
                'title': 'Managing Round Ligament Pain',
                'description': 'Understanding and relieving the sharp pains as your uterus grows.',
                'duration_seconds': 360,
                'key_points': ['Round ligament pain', 'Relief techniques', 'When to worry'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 15,
                'day': 4,
                'youtube_id': 'nEqWLLpUgV0',
                'title': 'Dealing With Heartburn and Indigestion',
                'description': 'Natural remedies and tips for managing digestive issues during pregnancy.',
                'duration_seconds': 420,
                'key_points': ['Heartburn relief', 'Diet tips', 'Safe remedies'],
                'token_reward': 10,
            },

            # Week 16 - Feeling Baby Move
            {
                'stage': 'pregnancy',
                'week': 16,
                'day': 1,
                'youtube_id': 'xQRzB9p0yJc',
                'title': 'Feeling Baby\'s First Movements (Quickening)',
                'description': 'What those first flutters feel like and when to expect them.',
                'duration_seconds': 420,
                'key_points': ['First movements', 'Quickening', 'What to expect'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 16,
                'day': 4,
                'youtube_id': 'hT6qLrLDKZA',
                'title': 'Gender Reveal: Finding Out Baby\'s Sex',
                'description': 'Options for finding out your baby\'s sex and what to consider.',
                'duration_seconds': 480,
                'key_points': ['Gender reveal', 'Ultrasound accuracy', 'Keeping it a surprise'],
                'token_reward': 10,
            },

            # Week 17 - Sleep and Rest
            {
                'stage': 'pregnancy',
                'week': 17,
                'day': 1,
                'youtube_id': 'aGQcLKx2Mtw',
                'title': 'Best Sleep Positions During Pregnancy',
                'description': 'How to sleep comfortably as your belly grows and why position matters.',
                'duration_seconds': 480,
                'key_points': ['Sleep positions', 'Pillow support', 'Side sleeping'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 17,
                'day': 4,
                'youtube_id': 'rGxFMVJYsfw',
                'title': 'Pregnancy Insomnia: Tips for Better Sleep',
                'description': 'Strategies for managing sleep difficulties during pregnancy.',
                'duration_seconds': 540,
                'key_points': ['Sleep tips', 'Relaxation techniques', 'Bedtime routine'],
                'token_reward': 10,
            },

            # Week 18 - Exercise
            {
                'stage': 'pregnancy',
                'week': 18,
                'day': 1,
                'youtube_id': 'j6Am0aFVPB4',
                'title': 'Safe Exercise During Pregnancy',
                'description': 'Stay active and healthy with these pregnancy-safe exercises and workout tips.',
                'duration_seconds': 720,
                'key_points': ['Safe exercises', 'Workout modifications', 'Benefits of exercise'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 18,
                'day': 4,
                'youtube_id': 'BjQn6sX_k0w',
                'title': 'Prenatal Yoga: Beginner\'s Guide',
                'description': 'Introduction to pregnancy-safe yoga poses for flexibility and relaxation.',
                'duration_seconds': 600,
                'key_points': ['Prenatal yoga', 'Safe poses', 'Breathing techniques'],
                'token_reward': 10,
            },

            # Week 19 - Anatomy Scan
            {
                'stage': 'pregnancy',
                'week': 19,
                'day': 1,
                'youtube_id': 'Lb7wqKmMYmk',
                'title': 'The 20-Week Anatomy Scan',
                'description': 'What to expect during this important ultrasound and what doctors look for.',
                'duration_seconds': 600,
                'key_points': ['Anatomy scan', 'What to expect', 'Baby measurements'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 19,
                'day': 4,
                'youtube_id': 'Qvd3YcpXaLQ',
                'title': 'Understanding Your Ultrasound Results',
                'description': 'How to read your ultrasound report and what the measurements mean.',
                'duration_seconds': 480,
                'key_points': ['Reading results', 'Measurements', 'Follow-up care'],
                'token_reward': 10,
            },

            # Week 20 - Baby Movements
            {
                'stage': 'pregnancy',
                'week': 20,
                'day': 1,
                'youtube_id': 'A5-K7C1jHMQ',
                'title': 'Understanding Baby Movements',
                'description': 'Learn about fetal movements, kick counting, and when to be concerned.',
                'duration_seconds': 480,
                'key_points': ['Kick counting', 'Normal movement', 'When to call doctor'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 20,
                'day': 4,
                'youtube_id': 'PTzh3Kyb8ps',
                'title': 'Halfway There: 20 Week Milestone',
                'description': 'Celebrating reaching the halfway point of your pregnancy journey.',
                'duration_seconds': 420,
                'key_points': ['Halfway celebration', 'Baby development', 'What\'s ahead'],
                'token_reward': 10,
            },

            # Week 21 - Baby's Senses
            {
                'stage': 'pregnancy',
                'week': 21,
                'day': 1,
                'youtube_id': 'LdvQmF4VXHI',
                'title': 'Your Baby Can Hear You Now',
                'description': 'How your baby\'s hearing develops and ways to bond through sound.',
                'duration_seconds': 420,
                'key_points': ['Baby\'s hearing', 'Talking to baby', 'Music benefits'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 21,
                'day': 4,
                'youtube_id': 'Xnk6Q0KZYJ8',
                'title': 'Baby\'s Developing Senses',
                'description': 'How your baby experiences the world through developing senses.',
                'duration_seconds': 480,
                'key_points': ['Fetal senses', 'Taste development', 'Touch response'],
                'token_reward': 10,
            },

            # Week 22 - Preparing for Baby
            {
                'stage': 'pregnancy',
                'week': 22,
                'day': 1,
                'youtube_id': 'mHqL6Qn4sJ0',
                'title': 'Creating Your Baby Registry',
                'description': 'Essential items for your baby registry and what you really need.',
                'duration_seconds': 720,
                'key_points': ['Registry essentials', 'Must-haves vs nice-to-haves', 'Budget tips'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 22,
                'day': 4,
                'youtube_id': 'YTk2Qpwnxew',
                'title': 'Nursery Planning on a Budget',
                'description': 'How to create a beautiful, functional nursery without breaking the bank.',
                'duration_seconds': 600,
                'key_points': ['Budget nursery', 'Essential furniture', 'DIY ideas'],
                'token_reward': 10,
            },

            # Week 23 - Partner Involvement
            {
                'stage': 'pregnancy',
                'week': 23,
                'day': 1,
                'youtube_id': 'VPwGqLnNHvY',
                'title': 'Involving Your Partner in Pregnancy',
                'description': 'Ways for partners to be more involved and supportive during pregnancy.',
                'duration_seconds': 480,
                'key_points': ['Partner involvement', 'Support strategies', 'Bonding together'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 23,
                'day': 4,
                'youtube_id': 'LQdaV5Y9qyk',
                'title': 'Preparing Siblings for New Baby',
                'description': 'Tips for helping older children adjust to a new sibling.',
                'duration_seconds': 540,
                'key_points': ['Sibling preparation', 'Age-appropriate talks', 'Involvement ideas'],
                'token_reward': 10,
            },

            # Week 24 - Viability Milestone
            {
                'stage': 'pregnancy',
                'week': 24,
                'day': 1,
                'youtube_id': 'WsC8xwLPBN8',
                'title': 'The 24 Week Viability Milestone',
                'description': 'Understanding what reaching viability means and NICU care if needed.',
                'duration_seconds': 540,
                'key_points': ['Viability explained', 'NICU overview', 'Continued growth'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 24,
                'day': 4,
                'youtube_id': 'gT2QvFYKcHc',
                'title': 'Gestational Diabetes: What You Need to Know',
                'description': 'Understanding the glucose test and managing gestational diabetes.',
                'duration_seconds': 600,
                'key_points': ['Glucose test', 'Diet management', 'Monitoring tips'],
                'token_reward': 10,
            },

            # Week 25 - Body Care
            {
                'stage': 'pregnancy',
                'week': 25,
                'day': 1,
                'youtube_id': 'bKy_QALTa2s',
                'title': 'Preventing and Treating Stretch Marks',
                'description': 'Tips for skin care and managing stretch marks during pregnancy.',
                'duration_seconds': 420,
                'key_points': ['Stretch mark prevention', 'Skin care tips', 'Hydration'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 25,
                'day': 4,
                'youtube_id': 'LZU1yP9BhOo',
                'title': 'Managing Back Pain in Pregnancy',
                'description': 'Exercises and tips for relieving pregnancy-related back pain.',
                'duration_seconds': 480,
                'key_points': ['Back pain relief', 'Posture tips', 'Safe stretches'],
                'token_reward': 10,
            },

            # Week 26 - Childbirth Education
            {
                'stage': 'pregnancy',
                'week': 26,
                'day': 1,
                'youtube_id': 'KREYBuKDz9U',
                'title': 'Childbirth Education: Getting Started',
                'description': 'Why childbirth classes matter and how to choose the right one.',
                'duration_seconds': 540,
                'key_points': ['Class options', 'What you\'ll learn', 'Timing classes'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 26,
                'day': 4,
                'youtube_id': 'TzqFnR9gPTw',
                'title': 'Understanding Your Birth Options',
                'description': 'Hospital vs birth center vs home birth - understanding your choices.',
                'duration_seconds': 600,
                'key_points': ['Birth settings', 'Pros and cons', 'Questions to ask'],
                'token_reward': 10,
            },

            # Week 27 - End of Second Trimester
            {
                'stage': 'pregnancy',
                'week': 27,
                'day': 1,
                'youtube_id': 'Rd1q9nPLEjU',
                'title': 'Entering the Third Trimester',
                'description': 'What to expect as you begin the final stretch of pregnancy.',
                'duration_seconds': 480,
                'key_points': ['Third trimester changes', 'Appointments increase', 'Final preparations'],
                'token_reward': 10,
            },

            # ============ THIRD TRIMESTER (Weeks 28-40) ============

            # Week 28 - Birth Preparation
            {
                'stage': 'pregnancy',
                'week': 28,
                'day': 1,
                'youtube_id': 'BtP-F5_fPK8',
                'title': 'Third Trimester: Preparing for Birth',
                'description': 'Everything you need to know about the final stretch of pregnancy and birth preparation.',
                'duration_seconds': 660,
                'key_points': ['Birth preparation', 'Hospital bag', 'Birth plan start'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 28,
                'day': 4,
                'youtube_id': 'N9cS6xYVwWY',
                'title': 'Kick Counting: A Daily Practice',
                'description': 'How to count kicks effectively and why it matters for baby\'s health.',
                'duration_seconds': 420,
                'key_points': ['Kick counting method', 'When to count', 'Recording movements'],
                'token_reward': 10,
            },

            # Week 29 - Breathing and Relaxation
            {
                'stage': 'pregnancy',
                'week': 29,
                'day': 1,
                'youtube_id': 'did4yD8Ofoc',
                'title': 'Breathing Techniques for Labor',
                'description': 'Learn breathing patterns that help manage pain during labor.',
                'duration_seconds': 600,
                'key_points': ['Breathing patterns', 'Relaxation techniques', 'Practice exercises'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 29,
                'day': 4,
                'youtube_id': 'pJvC2g_x7QQ',
                'title': 'Hypnobirthing Introduction',
                'description': 'Understanding hypnobirthing and how it can help with labor.',
                'duration_seconds': 540,
                'key_points': ['Hypnobirthing basics', 'Relaxation methods', 'Mental preparation'],
                'token_reward': 10,
            },

            # Week 30 - Labor Positions
            {
                'stage': 'pregnancy',
                'week': 30,
                'day': 1,
                'youtube_id': 'X7TfIJQg0Yc',
                'title': 'Labor Positions That Help',
                'description': 'Different positions for labor and how they can help with progress and comfort.',
                'duration_seconds': 600,
                'key_points': ['Labor positions', 'Movement during labor', 'Partner support'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 30,
                'day': 4,
                'youtube_id': 'UqQOLPxnPKA',
                'title': 'Using a Birth Ball During Pregnancy and Labor',
                'description': 'How a birth ball can help with comfort, positioning, and labor progress.',
                'duration_seconds': 480,
                'key_points': ['Birth ball exercises', 'Labor use', 'Comfort positions'],
                'token_reward': 10,
            },

            # Week 31 - Pain Management
            {
                'stage': 'pregnancy',
                'week': 31,
                'day': 1,
                'youtube_id': 'HvjMDOCxeUI',
                'title': 'Natural Pain Relief During Labor',
                'description': 'Non-medical options for managing labor pain including water, massage, and movement.',
                'duration_seconds': 600,
                'key_points': ['Natural pain relief', 'Water birth', 'Massage techniques'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 31,
                'day': 4,
                'youtube_id': 'LWEXpQTbvJE',
                'title': 'Understanding the Epidural',
                'description': 'What to expect if you choose an epidural for pain management.',
                'duration_seconds': 540,
                'key_points': ['Epidural process', 'Pros and cons', 'What to expect'],
                'token_reward': 10,
            },

            # Week 32 - Birth Plan
            {
                'stage': 'pregnancy',
                'week': 32,
                'day': 1,
                'youtube_id': 'Q2b5TKM8JrA',
                'title': 'Creating Your Birth Plan',
                'description': 'How to create a birth plan that reflects your wishes and preferences for delivery.',
                'duration_seconds': 540,
                'key_points': ['Birth plan elements', 'Communicating wishes', 'Flexibility'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 32,
                'day': 4,
                'youtube_id': 'kPfWsHWs6_k',
                'title': 'Packing Your Hospital Bag',
                'description': 'Essential items to pack for labor, delivery, and postpartum hospital stay.',
                'duration_seconds': 600,
                'key_points': ['Hospital bag checklist', 'Labor essentials', 'Baby items'],
                'token_reward': 10,
            },

            # Week 33 - Stages of Labor
            {
                'stage': 'pregnancy',
                'week': 33,
                'day': 1,
                'youtube_id': 'C6VLdvH3S0U',
                'title': 'The Three Stages of Labor',
                'description': 'Understanding early labor, active labor, and delivery.',
                'duration_seconds': 720,
                'key_points': ['Early labor', 'Active labor', 'Pushing and delivery'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 33,
                'day': 4,
                'youtube_id': 'P9hxD54O3eY',
                'title': 'When to Go to the Hospital',
                'description': 'Signs that it\'s time to head to the hospital and what to expect on arrival.',
                'duration_seconds': 480,
                'key_points': ['Labor signs', 'Timing', 'Hospital admission'],
                'token_reward': 10,
            },

            # Week 34 - Baby Position
            {
                'stage': 'pregnancy',
                'week': 34,
                'day': 1,
                'youtube_id': 'B2qLYdKqlMY',
                'title': 'Optimal Baby Positioning',
                'description': 'Exercises to encourage baby into the best position for birth.',
                'duration_seconds': 540,
                'key_points': ['Baby positioning', 'Exercises', 'Spinning babies'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 34,
                'day': 4,
                'youtube_id': 'jAA_mzLHpUg',
                'title': 'Understanding Breech Presentation',
                'description': 'What breech means and options if your baby is breech.',
                'duration_seconds': 480,
                'key_points': ['Breech explained', 'Turning baby', 'Birth options'],
                'token_reward': 10,
            },

            # Week 35 - Medical Procedures
            {
                'stage': 'pregnancy',
                'week': 35,
                'day': 1,
                'youtube_id': 'LktXB4M0Hc8',
                'title': 'Group B Strep Test Explained',
                'description': 'Understanding the GBS test and what a positive result means.',
                'duration_seconds': 420,
                'key_points': ['GBS test', 'Treatment during labor', 'Baby protection'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 35,
                'day': 4,
                'youtube_id': 'Rk8_t5kMZMs',
                'title': 'Common Labor Interventions',
                'description': 'Understanding interventions like induction, monitoring, and assisted delivery.',
                'duration_seconds': 600,
                'key_points': ['Labor interventions', 'When needed', 'Questions to ask'],
                'token_reward': 10,
            },

            # Week 36 - Signs of Labor
            {
                'stage': 'pregnancy',
                'week': 36,
                'day': 1,
                'youtube_id': 'rJcb87yI6lc',
                'title': 'Signs of Labor: What to Watch For',
                'description': 'Learn to recognize the signs of true labor and when to head to the hospital.',
                'duration_seconds': 480,
                'key_points': ['Labor signs', 'True vs false labor', 'When to call'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 36,
                'day': 4,
                'youtube_id': 'H7WVQfpNyo0',
                'title': 'Water Breaking: What to Expect',
                'description': 'Understanding what happens when your water breaks and what to do.',
                'duration_seconds': 420,
                'key_points': ['Water breaking', 'What to do', 'Hospital timeline'],
                'token_reward': 10,
            },

            # Week 37 - Full Term
            {
                'stage': 'pregnancy',
                'week': 37,
                'day': 1,
                'youtube_id': 'B8snY0dQJT8',
                'title': 'You\'re Full Term: What Now?',
                'description': 'Reaching full term and preparing for baby\'s arrival any day.',
                'duration_seconds': 480,
                'key_points': ['Full term milestone', 'Final preparations', 'Patience tips'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 37,
                'day': 4,
                'youtube_id': 'NJfLUZ4bV_c',
                'title': 'Natural Ways to Encourage Labor',
                'description': 'Safe methods that may help get labor started when you\'re ready.',
                'duration_seconds': 540,
                'key_points': ['Natural induction', 'Walking and exercise', 'What works'],
                'token_reward': 10,
            },

            # Week 38 - Breastfeeding Prep
            {
                'stage': 'pregnancy',
                'week': 38,
                'day': 1,
                'youtube_id': 'QvvA6jgHBMo',
                'title': 'Breastfeeding Basics',
                'description': 'Prepare for breastfeeding with essential tips on latching, positions, and common challenges.',
                'duration_seconds': 720,
                'key_points': ['Latching techniques', 'Breastfeeding positions', 'Common challenges'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 38,
                'day': 4,
                'youtube_id': 'GNFP9KfTLPQ',
                'title': 'First Hour After Birth: Golden Hour',
                'description': 'The importance of skin-to-skin contact and first breastfeed.',
                'duration_seconds': 480,
                'key_points': ['Golden hour', 'Skin to skin', 'First latch'],
                'token_reward': 10,
            },

            # Week 39 - Final Preparations
            {
                'stage': 'pregnancy',
                'week': 39,
                'day': 1,
                'youtube_id': 'TMxKpAjkYJM',
                'title': 'Preparing for Postpartum Recovery',
                'description': 'What to expect after birth and how to prepare for your recovery.',
                'duration_seconds': 600,
                'key_points': ['Postpartum recovery', 'Physical healing', 'Emotional support'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 39,
                'day': 4,
                'youtube_id': 'vXLwL6T4N4Y',
                'title': 'Newborn Care Basics',
                'description': 'Essential skills for caring for your newborn in the first days.',
                'duration_seconds': 600,
                'key_points': ['Newborn care', 'Diapering', 'Bathing basics'],
                'token_reward': 10,
            },

            # Week 40 - Due Date
            {
                'stage': 'pregnancy',
                'week': 40,
                'day': 1,
                'youtube_id': 'QKPHfUmXKvU',
                'title': 'Due Date Week: Final Countdown',
                'description': 'What to expect during your due date week and staying patient.',
                'duration_seconds': 480,
                'key_points': ['Due date', 'Staying patient', 'Final checks'],
                'token_reward': 10,
            },
            {
                'stage': 'pregnancy',
                'week': 40,
                'day': 4,
                'youtube_id': 'Tpc5_qLZMUI',
                'title': 'What If Baby Is Late?',
                'description': 'Understanding overdue pregnancy and options for going past your due date.',
                'duration_seconds': 540,
                'key_points': ['Overdue pregnancy', 'Monitoring', 'Induction options'],
                'token_reward': 10,
            },
        ]

        created_count = 0
        updated_count = 0

        for video_data in videos:
            # Set thumbnail URL - use hqdefault which is always available (480x360)
            # maxresdefault (1280x720) often returns 404 for older/smaller videos
            if 'thumbnail_url' not in video_data or not video_data['thumbnail_url']:
                video_data['thumbnail_url'] = f"https://i.ytimg.com/vi/{video_data['youtube_id']}/hqdefault.jpg"

            video, created = YouTubeLesson.objects.update_or_create(
                youtube_id=video_data['youtube_id'],
                defaults=video_data
            )

            if created:
                created_count += 1
                self.stdout.write(f"✓ Created: Week {video.week} Day {video.day or 'N/A'} - {video.title}")
            else:
                updated_count += 1
                self.stdout.write(f"↻ Updated: Week {video.week} Day {video.day or 'N/A'} - {video.title}")

        self.stdout.write(self.style.SUCCESS(f'\n✅ Done! Created {created_count} new videos, updated {updated_count} existing.'))
        self.stdout.write(f'📊 Total videos in database: {YouTubeLesson.objects.count()}')
        self.stdout.write(f'\n📅 Video distribution:')

        # Show distribution by trimester
        first_tri = YouTubeLesson.objects.filter(week__lte=13).count()
        second_tri = YouTubeLesson.objects.filter(week__gt=13, week__lte=27).count()
        third_tri = YouTubeLesson.objects.filter(week__gt=27).count()

        self.stdout.write(f'   First Trimester (Weeks 1-13): {first_tri} videos')
        self.stdout.write(f'   Second Trimester (Weeks 14-27): {second_tri} videos')
        self.stdout.write(f'   Third Trimester (Weeks 28-40): {third_tri} videos')
