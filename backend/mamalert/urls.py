from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/children/", include("apps.children.urls")),
    path("api/ai/", include("apps.ai.urls")),
    path("api/passport/", include("apps.passport.urls")),
    path("api/daily/", include("apps.daily_program.urls")),
    path("api/health/", include("apps.health.urls")),
    path("api/tokens/", include("apps.tokens.urls")),
    path("api/withdrawals/", include("apps.withdrawals.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/organizations/", include("apps.organizations.urls")),  # Healthcare organizations
    path("api/", include("apps.blockchain_api.urls")),  # Developer A - Blockchain endpoints
    path("sms/", include("apps.sms_api.urls")),         # Developer A - SMS endpoints
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
