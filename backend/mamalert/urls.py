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
    # Blockchain API (Developer A)
    path("api/", include("apps.blockchain_api.urls")),
    # SMS API (Developer A)
    path("sms/", include("apps.sms_api.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
