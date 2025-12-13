from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Child
from .serializers import (
    ChildSerializer,
    ChildCreateSerializer,
    ChildBirthTransitionSerializer,
    ChildDashboardSerializer,
)


class ChildViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing children.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ChildSerializer

    def get_queryset(self):
        """Return children for the current user."""
        return Child.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return ChildCreateSerializer
        if self.action == 'dashboard':
            return ChildDashboardSerializer
        return ChildSerializer

    def list(self, request):
        """List all children for the current user."""
        queryset = self.get_queryset()

        # Optional filter for active only
        active_only = request.query_params.get('active', 'true').lower() == 'true'
        if active_only:
            queryset = queryset.filter(is_active=True)

        serializer = self.get_serializer(queryset, many=True)

        # Also return summary info
        active_count = queryset.filter(is_active=True).count()
        pregnant_count = queryset.filter(status='pregnant', is_active=True).count()
        born_count = queryset.filter(status='born', is_active=True).count()

        return Response({
            'success': True,
            'data': {
                'children': serializer.data,
                'summary': {
                    'total_active': active_count,
                    'pregnant': pregnant_count,
                    'born': born_count,
                }
            }
        })

    def create(self, request):
        """Create a new child."""
        serializer = ChildCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            child = serializer.save()
            return Response({
                'success': True,
                'message': 'Child added successfully!',
                'data': ChildSerializer(child).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Invalid data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        """Get a specific child."""
        child = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(child)
        return Response({
            'success': True,
            'data': serializer.data
        })

    def partial_update(self, request, pk=None):
        """Update a child."""
        child = get_object_or_404(self.get_queryset(), pk=pk)
        serializer = self.get_serializer(child, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Child updated successfully!',
                'data': serializer.data
            })

        return Response({
            'success': False,
            'message': 'Invalid data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def dashboard(self, request, pk=None):
        """Get dashboard data for a specific child."""
        child = get_object_or_404(self.get_queryset(), pk=pk)

        # Check if child should be archived (baby > 2 years)
        child.check_and_archive()

        serializer = ChildDashboardSerializer(child)
        return Response({
            'success': True,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'])
    def record_birth(self, request, pk=None):
        """
        Record the birth of a baby (transition from pregnant to born).
        """
        child = get_object_or_404(self.get_queryset(), pk=pk)

        if child.status != 'pregnant':
            return Response({
                'success': False,
                'message': 'This child is not currently marked as pregnant.'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ChildBirthTransitionSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            child.transition_to_born(
                birth_date=data['birth_date'],
                name=data.get('name'),
                weight=data.get('birth_weight_kg'),
                gender=data.get('gender'),
                delivery_type=data.get('delivery_type'),
                birth_time=data.get('birth_time'),
            )

            return Response({
                'success': True,
                'message': 'Congratulations! Birth recorded successfully!',
                'data': ChildSerializer(child).data
            })

        return Response({
            'success': False,
            'message': 'Invalid data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a child (stop tracking)."""
        child = get_object_or_404(self.get_queryset(), pk=pk)

        child.status = 'archived'
        child.is_active = False
        child.save()

        return Response({
            'success': True,
            'message': 'Child archived successfully.',
            'data': ChildSerializer(child).data
        })

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the primary active child (for quick access)."""
        # Return the most recently active child
        child = self.get_queryset().filter(is_active=True).first()

        if not child:
            return Response({
                'success': True,
                'data': None,
                'message': 'No active children found.'
            })

        return Response({
            'success': True,
            'data': ChildSerializer(child).data
        })
