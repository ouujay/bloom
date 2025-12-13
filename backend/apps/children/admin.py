from django.contrib import admin
from .models import Child


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'display_name', 'current_stage_display', 'is_active', 'created_at']
    list_filter = ['status', 'is_active', 'gender']
    search_fields = ['user__email', 'user__first_name', 'name', 'nickname']
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Info', {
            'fields': ('id', 'user', 'status', 'is_active')
        }),
        ('Pregnancy Info', {
            'fields': ('due_date', 'conception_date', 'weeks_at_registration', 'last_menstrual_period'),
            'classes': ('collapse',)
        }),
        ('Baby Info', {
            'fields': ('name', 'nickname', 'birth_date', 'birth_weight_kg', 'birth_time', 'gender', 'delivery_type'),
            'classes': ('collapse',)
        }),
        ('Progress', {
            'fields': ('current_day', 'current_streak', 'longest_streak')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def display_name(self, obj):
        if obj.status == 'pregnant':
            return obj.nickname or 'Baby'
        return obj.name or obj.nickname or 'Baby'
    display_name.short_description = 'Name'

    def current_stage_display(self, obj):
        stage = obj.get_current_stage()
        if stage['type'] == 'pregnancy':
            return f"Week {stage['week']}"
        elif stage['type'] == 'baby':
            return f"{stage['age_months']} months"
        return 'Archived'
    current_stage_display.short_description = 'Stage'
