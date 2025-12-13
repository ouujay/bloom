from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.children.models import Child
from .models import PassportShare, PassportEvent, PassportService
from .serializers import (
    PassportShareSerializer,
    PassportShareCreateSerializer,
    PassportEventSerializer,
    PassportVerifySerializer,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_passport(request, child_id):
    """Get the full passport data for a child."""
    child = get_object_or_404(Child, id=child_id, user=request.user)
    passport_data = PassportService.get_passport_data(child)
    return Response({'success': True, 'data': passport_data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_passport_events(request, child_id):
    """Get passport events for a child."""
    child = get_object_or_404(Child, id=child_id, user=request.user)
    queryset = PassportEvent.objects.filter(child=child)
    event_type = request.query_params.get('type')
    if event_type:
        queryset = queryset.filter(event_type=event_type)
    limit = int(request.query_params.get('limit', 50))
    queryset = queryset[:limit]
    serializer = PassportEventSerializer(queryset, many=True)
    return Response({'success': True, 'data': serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_share(request, child_id):
    """Create a share link for a passport."""
    child = get_object_or_404(Child, id=child_id, user=request.user)
    serializer = PassportShareCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    share = PassportShare.objects.create(child=child, **serializer.validated_data)
    return Response({'success': True, 'data': PassportShareSerializer(share).data}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_shares(request, child_id):
    """List all share links for a child."""
    child = get_object_or_404(Child, id=child_id, user=request.user)
    shares = PassportShare.objects.filter(child=child)
    return Response({'success': True, 'data': PassportShareSerializer(shares, many=True).data})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deactivate_share(request, child_id, share_id):
    """Deactivate a share link."""
    child = get_object_or_404(Child, id=child_id, user=request.user)
    share = get_object_or_404(PassportShare, id=share_id, child=child)
    share.deactivate()
    return Response({'success': True, 'message': 'Share link deactivated'})


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_share(request, share_code):
    """Verify passcode for a shared passport."""
    share = get_object_or_404(PassportShare, share_code=share_code)
    if not share.is_active:
        return Response({'success': False, 'message': 'Share link deactivated'}, status=status.HTTP_403_FORBIDDEN)
    if share.is_expired:
        return Response({'success': False, 'message': 'Share link expired'}, status=status.HTTP_403_FORBIDDEN)
    serializer = PassportVerifySerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    if not share.verify_passcode(serializer.validated_data['passcode']):
        return Response({'success': False, 'message': 'Invalid passcode'}, status=status.HTTP_403_FORBIDDEN)
    import secrets
    access_token = secrets.token_urlsafe(32)
    request.session[f'passport_access_{share_code}'] = access_token
    share.record_view()
    return Response({'success': True, 'data': {'access_token': access_token, 'child_name': share.child.name or share.child.nickname}})


@api_view(['GET'])
@permission_classes([AllowAny])
def view_shared_passport(request, share_code):
    """View a shared passport (after verification)."""
    share = get_object_or_404(PassportShare, share_code=share_code)
    if not share.is_valid:
        return Response({'success': False, 'message': 'Share link invalid'}, status=status.HTTP_403_FORBIDDEN)
    access_token = request.headers.get('X-Access-Token')
    session_token = request.session.get(f'passport_access_{share_code}')
    if not access_token or access_token != session_token:
        return Response({'success': False, 'message': 'Verify passcode first'}, status=status.HTTP_403_FORBIDDEN)
    passport_data = PassportService.get_passport_data(share.child)
    return Response({'success': True, 'data': passport_data})
