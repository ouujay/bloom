from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('children', '0001_initial'),
        ('daily_program', '0002_initial'),
    ]

    operations = [
        # Step 1: Add stage_type field
        migrations.AddField(
            model_name='dailycontent',
            name='stage_type',
            field=models.CharField(choices=[('pregnancy', 'Pregnancy'), ('postpartum', 'Postpartum'), ('baby', 'Baby')], default='pregnancy', max_length=20),
        ),
        # Step 2: Add stage_week field (keeping week for now)
        migrations.AddField(
            model_name='dailycontent',
            name='stage_week',
            field=models.IntegerField(default=1),
        ),
        # Step 3: Add child field to UserDayProgress (nullable for now)
        migrations.AddField(
            model_name='userdayprogress',
            name='child',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='day_progress', to='children.child'),
        ),
        # Step 4: Copy data from week to stage_week
        migrations.RunSQL(
            "UPDATE daily_program_dailycontent SET stage_week = week;",
            reverse_sql="UPDATE daily_program_dailycontent SET week = stage_week;"
        ),
        # Step 5: Remove old unique_together
        migrations.AlterUniqueTogether(
            name='dailycontent',
            unique_together=set(),
        ),
        migrations.AlterUniqueTogether(
            name='userdayprogress',
            unique_together=set(),
        ),
        # Step 6: Set new unique_together
        migrations.AlterUniqueTogether(
            name='dailycontent',
            unique_together={('stage_type', 'stage_week', 'day')},
        ),
        migrations.AlterUniqueTogether(
            name='userdayprogress',
            unique_together={('child', 'daily_content')},
        ),
        # Step 7: Remove old fields
        migrations.RemoveField(
            model_name='dailycontent',
            name='week',
        ),
        migrations.RemoveField(
            model_name='userdayprogress',
            name='user',
        ),
        # Step 8: Update ordering
        migrations.AlterModelOptions(
            name='dailycontent',
            options={'ordering': ['stage_type', 'stage_week', 'day']},
        ),
        # Step 9: Update day field default
        migrations.AlterField(
            model_name='dailycontent',
            name='day',
            field=models.IntegerField(default=1),
        ),
    ]
