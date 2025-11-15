from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings
from .serializers import RegisterSerializer, UserProfileSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login user and set JWT tokens in httpOnly cookies"""
    email = request.data.get('email')
    password = request.data.get('password')
    remember_me = request.data.get('remember_me', False)

    user = authenticate(request, username=email, password=password)

    if user is None:
        return Response(
            {'message': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)

    # Add remember_me to token payload for persistence
    refresh['remember_me'] = remember_me

    # Set token lifetime based on remember_me
    if remember_me:
        # 7 days for both tokens when remember_me is True
        from datetime import timedelta
        refresh.access_token.set_exp(lifetime=timedelta(days=7))
        refresh.access_token['remember_me'] = True
        access_token_max_age = 7 * 24 * 60 * 60  # 7 days
        refresh_token_max_age = 7 * 24 * 60 * 60  # 7 days
    else:
        # Default: 1 hour for access token
        refresh.access_token['remember_me'] = False
        access_token_max_age = 60 * 60  # 1 hour
        refresh_token_max_age = 7 * 24 * 60 * 60  # 7 days (standard)

    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    response = Response({
        'user': {
            'id': str(user.id),
            'email': user.email,
            'full_name': user.full_name or user.email,
            'balance': str(user.balance),
            'bot_type': user.bot_type,
            'is_bot_enabled': user.is_bot_enabled,
            'is_verified': user.is_verified,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'created_at': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
        },
        'access': access_token,
        'message': 'Login successful'
    }, status=status.HTTP_200_OK)

    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=settings.SECURE_COOKIES,  # Dynamic: False in dev, True in production
        samesite='Lax',
        max_age=access_token_max_age,
        path='/',
        domain=None,
    )

    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=settings.SECURE_COOKIES,  # Dynamic: False in dev, True in production
        samesite='Lax',
        max_age=refresh_token_max_age,
        path='/',
        domain=None,
    )

    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user and optionally log them in with remember_me"""
    serializer = RegisterSerializer(data=request.data)
    remember_me = request.data.get('remember_me', False)

    if serializer.is_valid():
        user = serializer.save()

        # Automatically log in the user after registration
        refresh = RefreshToken.for_user(user)

        # Add remember_me to token payload for persistence
        refresh['remember_me'] = remember_me

        # Set token lifetime based on remember_me
        if remember_me:
            # 7 days for both tokens when remember_me is True
            from datetime import timedelta
            refresh.access_token.set_exp(lifetime=timedelta(days=7))
            refresh.access_token['remember_me'] = True
            access_token_max_age = 7 * 24 * 60 * 60  # 7 days
            refresh_token_max_age = 7 * 24 * 60 * 60  # 7 days
        else:
            # Default: 1 hour for access token
            refresh.access_token['remember_me'] = False
            access_token_max_age = 60 * 60  # 1 hour
            refresh_token_max_age = 7 * 24 * 60 * 60  # 7 days (standard)

        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        response = Response({
            'success': True,
            'message': 'Account created successfully',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.full_name or user.email,
                'balance': str(user.balance),
                'bot_type': user.bot_type,
                'is_verified': user.is_verified,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'created_at': user.created_at.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
            },
            'access': access_token,
        }, status=status.HTTP_201_CREATED)

        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            secure=settings.SECURE_COOKIES,  # Dynamic: False in dev, True in production
            samesite='Lax',
            max_age=access_token_max_age,
            path='/',
            domain=None,
        )

        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            secure=settings.SECURE_COOKIES,  # Dynamic: False in dev, True in production
            samesite='Lax',
            max_age=refresh_token_max_age,
            path='/',
            domain=None,
        )

        return response

    # Return validation errors
    return Response({
        'success': False,
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout user by deleting cookies"""
    response = Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get current user profile"""
    user = request.user

    return Response({
        'id': str(user.id),
        'email': user.email,
        'full_name': user.full_name or user.email,
        'balance': str(user.balance),
        'bot_type': user.bot_type,
        'is_bot_enabled': user.is_bot_enabled,
        'is_verified': user.is_verified,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'created_at': user.created_at.isoformat(),
        'last_login': user.last_login.isoformat() if user.last_login else None,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    """Refresh access token using refresh token from cookies"""
    refresh_token = request.COOKIES.get('refresh_token')

    if not refresh_token:
        return Response(
            {'message': 'Refresh token is missing'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        refresh = RefreshToken(refresh_token)

        # Check if remember_me was set in the original token
        remember_me = refresh.get('remember_me', False)

        # Set access token lifetime based on remember_me preference
        if remember_me:
            from datetime import timedelta
            refresh.access_token.set_exp(lifetime=timedelta(days=7))
            refresh.access_token['remember_me'] = True
            access_token_max_age = 7 * 24 * 60 * 60  # 7 days
        else:
            refresh.access_token['remember_me'] = False
            access_token_max_age = 60 * 60  # 1 hour

        access_token = str(refresh.access_token)

        response = Response({'message': 'Token refreshed'}, status=status.HTTP_200_OK)

        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            secure=settings.SECURE_COOKIES,  # Dynamic: False in dev, True in production
            samesite='Lax',
            max_age=access_token_max_age,
            path='/',
            domain=None,
        )

        return response
    except Exception as e:
        return Response(
            {'message': 'Invalid refresh token'},
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def balance_view(request):
    """Get current user balance"""
    user = request.user
    return Response({'balance': str(user.balance)})


@api_view(['GET', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Get or update user profile including wallet address

    GET: Returns current user profile with wallet_address
    PATCH/PUT: Updates user profile fields
    """
    user = request.user

    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method in ['PATCH', 'PUT']:
        # Partial update for PATCH, full update for PUT
        partial = request.method == 'PATCH'
        serializer = UserProfileSerializer(user, data=request.data, partial=partial)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_bot_view(request):
    """Toggle bot enabled/disabled status"""
    from django.db import transaction
    from apps.trading.models import TradingSession
    from django.utils import timezone

    try:
        with transaction.atomic():
            # CRITICAL: Lock the user row to prevent race conditions
            from .models import User
            user = User.objects.select_for_update().get(id=request.user.id)

            # Check if user has a bot subscription
            if user.bot_type == 'none':
                return Response({
                    'success': False,
                    'message': 'You need to purchase a bot subscription first'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Toggle the bot enabled status
            user.is_bot_enabled = not user.is_bot_enabled
            user.save()

            # If bot is being disabled, close the active trading session
            # This must be inside the transaction to ensure atomicity
            if not user.is_bot_enabled:
                # End any active trading sessions (with row locking)
                active_sessions = TradingSession.objects.select_for_update().filter(
                    user=user,
                    is_active=True
                )

                for session in active_sessions:
                    session.is_active = False
                    session.ended_at = timezone.now()
                    session.save()

            return Response({
                'success': True,
                'is_bot_enabled': user.is_bot_enabled,
                'message': f"Bot {'enabled' if user.is_bot_enabled else 'disabled'} successfully"
            }, status=status.HTTP_200_OK)

    except Exception as e:
        # Transaction will be automatically rolled back
        return Response({
            'success': False,
            'message': f'Toggle failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upgrade_bot_view(request):
    """Upgrade bot subscription to a higher tier"""
    from decimal import Decimal
    from django.db import transaction
    from apps.transactions.models import Transaction

    target_bot_type = request.data.get('bot_type')

    # Bot types and their costs
    bot_pricing = {
        'basic': 250.0,
        'premium': 500.0,
        'specialist': 1000.0,
    }

    # Validate target bot type (before transaction)
    if target_bot_type not in bot_pricing:
        return Response({
            'success': False,
            'message': 'Invalid bot type'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            # CRITICAL: Lock the user row to prevent race conditions
            from .models import User
            user = User.objects.select_for_update().get(id=request.user.id)

            # Check if user is trying to downgrade or stay same
            bot_hierarchy = {'none': 0, 'basic': 1, 'premium': 2, 'specialist': 3}
            current_level = bot_hierarchy.get(user.bot_type, 0)
            target_level = bot_hierarchy.get(target_bot_type, 0)

            if target_level <= current_level:
                return Response({
                    'success': False,
                    'message': 'You can only upgrade to a higher tier bot'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Calculate upgrade cost (difference between tiers)
            current_cost = bot_pricing.get(user.bot_type, 0.0)
            target_cost = bot_pricing.get(target_bot_type, 0.0)
            upgrade_cost = target_cost - current_cost

            # Check if user has sufficient balance (inside transaction)
            if user.balance < upgrade_cost:
                return Response({
                    'success': False,
                    'message': f'Insufficient balance. Need €{upgrade_cost:.2f} for upgrade',
                    'required': upgrade_cost,
                    'current_balance': float(user.balance)
                }, status=status.HTTP_400_BAD_REQUEST)

            # Deduct balance and upgrade bot (atomic operation)
            user.balance -= Decimal(str(upgrade_cost))
            user.bot_type = target_bot_type
            user.save()

            # Create transaction record INSIDE atomic block
            # If this fails, balance deduction will be rolled back
            Transaction.objects.create(
                user=user,
                transaction_type='bot_purchase',
                amount=Decimal(str(upgrade_cost)),
                status='completed',
                payment_method='balance',
                admin_notes=f'Bot upgraded from {current_level} to {target_bot_type}'
            )

            return Response({
                'success': True,
                'bot_type': user.bot_type,
                'new_balance': str(user.balance),
                'upgrade_cost': upgrade_cost,
                'message': f'Successfully upgraded to {target_bot_type} bot!'
            }, status=status.HTTP_200_OK)

    except Exception as e:
        # Transaction will be automatically rolled back
        return Response({
            'success': False,
            'message': f'Upgrade failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)