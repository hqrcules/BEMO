from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/details/', views.user_profile_view, name='user-profile'),
    path('refresh/', views.refresh_token_view, name='refresh'),
    path('balance/', views.balance_view, name='balance'),
]