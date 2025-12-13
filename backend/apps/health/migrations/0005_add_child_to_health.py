from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('children', '0001_initial'),
        ('health', '0004_alter_dailyhealthlog_baby_movement_and_more'),
    ]

    operations = [
        # Step 1: Add child field to all models
        migrations.AddField(
            model_name='dailyhealthlog',
            name='child',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='health_logs', to='children.child'),
        ),
        migrations.AddField(
            model_name='kickcount',
            name='child',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='kick_counts', to='children.child'),
        ),
        migrations.AddField(
            model_name='appointment',
            name='child',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='appointments', to='children.child'),
        ),
        # Step 2: Remove old unique_together
        migrations.AlterUniqueTogether(
            name='dailyhealthlog',
            unique_together=set(),
        ),
        # Step 3: Set new unique_together
        migrations.AlterUniqueTogether(
            name='dailyhealthlog',
            unique_together={('child', 'date')},
        ),
        # Step 4: Remove old user fields
        migrations.RemoveField(
            model_name='dailyhealthlog',
            name='user',
        ),
        migrations.RemoveField(
            model_name='kickcount',
            name='user',
        ),
        migrations.RemoveField(
            model_name='appointment',
            name='user',
        ),
    ]
