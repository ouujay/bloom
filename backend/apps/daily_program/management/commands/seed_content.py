from django.core.management.base import BaseCommand
from apps.daily_program.models import DailyContent, QuizQuestion


class Command(BaseCommand):
    help = 'Seed the database with initial daily content'

    def handle(self, *args, **options):
        self.stdout.write('Seeding daily content...')

        # Sample content for first 2 weeks
        content_data = [
            # Week 1
            {
                'week': 1, 'day': 1,
                'title': 'Welcome to Your Journey',
                'theme': 'Introduction',
                'lesson_title': 'Understanding Your Pregnancy',
                'lesson_content': '''Congratulations on your pregnancy! This is the beginning of an incredible journey. During these 40 weeks, your body will go through amazing changes to nurture and grow your baby.

In this program, you'll learn about:
- What to expect each week
- How to take care of yourself and your baby
- Recognizing warning signs
- Preparing for birth

Let's start this beautiful journey together!''',
                'tip_of_day': 'Start taking prenatal vitamins if you haven\'t already. Folic acid is especially important in early pregnancy.',
                'task_title': 'Set Up Your Profile',
                'task_description': 'Complete your health profile with your due date and important information.',
                'task_type': 'setup',
            },
            {
                'week': 1, 'day': 2,
                'title': 'Nutrition Basics',
                'theme': 'Nutrition',
                'lesson_title': 'Eating for Two',
                'lesson_content': '''Good nutrition during pregnancy is vital for your baby's development. Here's what you need to know:

Key nutrients:
- Protein: Essential for baby's growth
- Iron: Prevents anemia and supports blood production
- Calcium: Builds strong bones and teeth
- Folic acid: Prevents neural tube defects

Foods to include:
- Leafy greens, beans, and fortified cereals
- Lean meats, fish (low mercury), and eggs
- Dairy products or fortified alternatives
- Fresh fruits and vegetables''',
                'tip_of_day': 'Eat small, frequent meals to help with nausea and maintain energy levels.',
                'task_title': 'Plan Your Meals',
                'task_description': 'Write down 3 healthy meals you can prepare this week.',
                'task_type': 'planning',
            },
            {
                'week': 1, 'day': 3,
                'title': 'Staying Hydrated',
                'theme': 'Health',
                'lesson_title': 'The Importance of Water',
                'lesson_content': '''Water is essential during pregnancy. It helps:
- Form amniotic fluid
- Produce extra blood
- Build new tissue
- Carry nutrients to baby
- Prevent constipation and hemorrhoids

Aim for 8-12 glasses of water daily. Signs of dehydration include dark urine, headaches, and dizziness.''',
                'tip_of_day': 'Keep a water bottle with you at all times. Add lemon or cucumber for flavor.',
                'task_title': 'Track Your Water',
                'task_description': 'Drink at least 8 glasses of water today and record it.',
                'task_type': 'tracking',
            },
            {
                'week': 1, 'day': 4,
                'title': 'Rest and Sleep',
                'theme': 'Self-Care',
                'lesson_title': 'Getting Quality Sleep',
                'lesson_content': '''Sleep becomes more challenging but more important during pregnancy. Your body is working hard even while resting.

Tips for better sleep:
- Sleep on your left side to improve blood flow
- Use pillows to support your belly and back
- Avoid screens before bedtime
- Create a cool, dark sleeping environment
- Limit fluids before bed to reduce bathroom trips''',
                'tip_of_day': 'Take short naps during the day if you\'re feeling tired. Listen to your body.',
                'task_title': 'Create a Sleep Routine',
                'task_description': 'Set a consistent bedtime and create a relaxing pre-sleep routine.',
                'task_type': 'habit',
            },
            {
                'week': 1, 'day': 5,
                'title': 'Exercise During Pregnancy',
                'theme': 'Fitness',
                'lesson_title': 'Safe Movement',
                'lesson_content': '''Regular exercise during pregnancy has many benefits:
- Reduces back pain
- Improves mood and energy
- Helps with better sleep
- Prepares body for labor

Safe exercises include:
- Walking
- Swimming
- Prenatal yoga
- Light stretching

Always consult your doctor before starting any exercise routine.''',
                'tip_of_day': 'Start with 15-minute walks and gradually increase duration as you feel comfortable.',
                'task_title': 'Go for a Walk',
                'task_description': 'Take a gentle 15-minute walk today.',
                'task_type': 'exercise',
            },
            {
                'week': 1, 'day': 6,
                'title': 'Warning Signs',
                'theme': 'Safety',
                'lesson_title': 'When to Seek Help',
                'lesson_content': '''Knowing warning signs can save lives. Contact your healthcare provider immediately if you experience:

Emergency signs:
- Heavy vaginal bleeding
- Severe abdominal pain
- Sudden severe headache
- Vision changes
- Decreased or no fetal movement
- Signs of preterm labor

Trust your instincts - if something feels wrong, seek help.''',
                'tip_of_day': 'Save emergency numbers in your phone, including your hospital and healthcare provider.',
                'task_title': 'Create Emergency Contact List',
                'task_description': 'Add your doctor, hospital, and emergency contacts to your phone.',
                'task_type': 'safety',
            },
            {
                'week': 1, 'day': 7,
                'title': 'Week 1 Review',
                'theme': 'Review',
                'lesson_title': 'Reflecting on Week 1',
                'lesson_content': '''Congratulations on completing your first week! Let's review what you learned:

- Importance of prenatal vitamins
- Nutrition basics for pregnancy
- Staying hydrated
- Quality sleep tips
- Safe exercise options
- Warning signs to watch for

Take the quiz to test your knowledge and earn bonus tokens!''',
                'tip_of_day': 'Celebrate your progress! You\'re doing great.',
                'task_title': 'Complete Weekly Quiz',
                'task_description': 'Test your knowledge with the weekly quiz.',
                'task_type': 'quiz',
                'is_quiz_day': True,
            },
            # Week 2
            {
                'week': 2, 'day': 1,
                'title': 'Understanding Your Body',
                'theme': 'Body Changes',
                'lesson_title': 'First Trimester Changes',
                'lesson_content': '''Your body is changing rapidly. Common first trimester symptoms include:

- Morning sickness (can happen anytime!)
- Fatigue
- Breast tenderness
- Frequent urination
- Food cravings or aversions

These are normal! Your hormones are working hard to support your pregnancy.''',
                'tip_of_day': 'Keep crackers by your bed to eat before getting up - this can help with morning sickness.',
                'task_title': 'Track Symptoms',
                'task_description': 'Note any symptoms you\'re experiencing in your health log.',
                'task_type': 'tracking',
            },
            {
                'week': 2, 'day': 2,
                'title': 'Prenatal Care',
                'theme': 'Medical',
                'lesson_title': 'Your First Prenatal Visit',
                'lesson_content': '''Regular prenatal visits are crucial. At your first visit, expect:

- Medical history review
- Physical examination
- Blood tests and urine tests
- Discussion of your due date
- Questions and answers session

Prepare a list of questions to ask your healthcare provider.''',
                'tip_of_day': 'Write down your questions before appointments so you don\'t forget them.',
                'task_title': 'Schedule Prenatal Visit',
                'task_description': 'If you haven\'t already, schedule your first prenatal appointment.',
                'task_type': 'appointment',
            },
            {
                'week': 2, 'day': 3,
                'title': 'Mental Health',
                'theme': 'Wellness',
                'lesson_title': 'Emotional Wellbeing',
                'lesson_content': '''Pregnancy brings many emotions. It's normal to feel:

- Excited and happy
- Anxious or worried
- Mood swings
- Overwhelmed

Taking care of your mental health is just as important as physical health. Talk to someone if you're struggling.''',
                'tip_of_day': 'Practice deep breathing for 5 minutes when feeling stressed.',
                'task_title': 'Self-Care Activity',
                'task_description': 'Do something that makes you happy today - read, walk, or talk to a friend.',
                'task_type': 'self-care',
            },
            {
                'week': 2, 'day': 4,
                'title': 'Building Support',
                'theme': 'Support',
                'lesson_title': 'Your Support Network',
                'lesson_content': '''Having support during pregnancy is important. Consider:

- Partner involvement
- Family and friends
- Healthcare team
- Support groups
- Online communities

Don't be afraid to ask for help when you need it.''',
                'tip_of_day': 'Share your feelings with someone you trust today.',
                'task_title': 'Reach Out',
                'task_description': 'Connect with a friend or family member about your pregnancy journey.',
                'task_type': 'social',
            },
            {
                'week': 2, 'day': 5,
                'title': 'Healthy Habits',
                'theme': 'Lifestyle',
                'lesson_title': 'Things to Avoid',
                'lesson_content': '''Some things should be avoided during pregnancy:

- Alcohol and smoking
- Raw or undercooked foods
- Unpasteurized products
- High-mercury fish
- Excessive caffeine
- Certain medications

Always check with your doctor before taking any medications.''',
                'tip_of_day': 'Replace caffeine with herbal tea (check which ones are pregnancy-safe).',
                'task_title': 'Review Your Habits',
                'task_description': 'Identify one unhealthy habit to replace with a healthier alternative.',
                'task_type': 'planning',
            },
            {
                'week': 2, 'day': 6,
                'title': 'Baby Development',
                'theme': 'Baby',
                'lesson_title': 'How Your Baby is Growing',
                'lesson_content': '''In the first trimester, amazing development happens:

- Heart begins to beat
- Brain and nervous system develop
- Arms and legs form
- Facial features appear
- All major organs begin forming

By week 12, your baby will be about 2.5 inches long!''',
                'tip_of_day': 'Download a pregnancy app to track your baby\'s weekly development.',
                'task_title': 'Learn About Development',
                'task_description': 'Read about what stage your baby is at this week.',
                'task_type': 'education',
            },
            {
                'week': 2, 'day': 7,
                'title': 'Week 2 Review',
                'theme': 'Review',
                'lesson_title': 'Reflecting on Week 2',
                'lesson_content': '''Great job completing Week 2! This week you learned about:

- First trimester body changes
- Importance of prenatal care
- Emotional wellbeing
- Building your support network
- Things to avoid during pregnancy
- Baby's development

Take the quiz to test your knowledge!''',
                'tip_of_day': 'You\'re doing amazing! Keep up the great work.',
                'task_title': 'Complete Weekly Quiz',
                'task_description': 'Test your knowledge with the weekly quiz.',
                'task_type': 'quiz',
                'is_quiz_day': True,
            },
        ]

        for data in content_data:
            is_quiz = data.pop('is_quiz_day', False)
            week = data.pop('week')
            day = data['day']
            content, created = DailyContent.objects.update_or_create(
                stage_type='pregnancy',
                stage_week=week,
                day=day,
                defaults={
                    **data,
                    'lesson_summary': data['lesson_content'][:200] + '...',
                    'is_quiz_day': is_quiz,
                }
            )
            if created:
                self.stdout.write(f'  Created: Week {week} Day {day}')
            else:
                self.stdout.write(f'  Updated: Week {week} Day {day}')

            # Add quiz questions for quiz days
            if is_quiz:
                self.create_quiz_questions(content)

        self.stdout.write(self.style.SUCCESS('Successfully seeded daily content!'))

    def create_quiz_questions(self, content):
        questions_data = {
            1: [  # Week 1 quiz
                {
                    'question': 'What is an important supplement to take during early pregnancy?',
                    'option_a': 'Vitamin C only',
                    'option_b': 'Folic acid',
                    'option_c': 'Calcium only',
                    'option_d': 'Iron only',
                    'correct_answer': 'B',
                    'order': 1,
                },
                {
                    'question': 'How many glasses of water should you aim to drink daily during pregnancy?',
                    'option_a': '4-6 glasses',
                    'option_b': '8-12 glasses',
                    'option_c': '2-4 glasses',
                    'option_d': '15-20 glasses',
                    'correct_answer': 'B',
                    'order': 2,
                },
                {
                    'question': 'Which sleeping position is recommended during pregnancy?',
                    'option_a': 'On your back',
                    'option_b': 'On your stomach',
                    'option_c': 'On your left side',
                    'option_d': 'Sitting up',
                    'correct_answer': 'C',
                    'order': 3,
                },
            ],
            2: [  # Week 2 quiz
                {
                    'question': 'Which of these is a normal first trimester symptom?',
                    'option_a': 'Heavy bleeding',
                    'option_b': 'Severe chest pain',
                    'option_c': 'Morning sickness',
                    'option_d': 'High fever',
                    'correct_answer': 'C',
                    'order': 1,
                },
                {
                    'question': 'What should you avoid during pregnancy?',
                    'option_a': 'Vegetables',
                    'option_b': 'Water',
                    'option_c': 'Alcohol',
                    'option_d': 'Walking',
                    'correct_answer': 'C',
                    'order': 2,
                },
                {
                    'question': 'When does the baby\'s heart begin to beat?',
                    'option_a': 'Third trimester',
                    'option_b': 'First trimester',
                    'option_c': 'At birth',
                    'option_d': 'Second trimester',
                    'correct_answer': 'B',
                    'order': 3,
                },
            ],
        }

        week_questions = questions_data.get(content.stage_week, [])
        for q_data in week_questions:
            QuizQuestion.objects.update_or_create(
                daily_content=content,
                order=q_data['order'],
                defaults=q_data
            )
