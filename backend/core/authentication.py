"""
Custom authentication class to read JWT from cookies
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed as DRFAuthenticationFailed


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads token from cookies
    Fallback to Authorization header if cookie not present
    """

    def authenticate(self, request):
        # Debug: print cookies
        # print(f"DEBUG: Cookies in request: {request.COOKIES}")

        # Try to get token from cookie first
        cookie_token = request.COOKIES.get('access_token')

        if cookie_token:
            try:
                # Validate token from cookie
                validated_token = self.get_validated_token(cookie_token)
                user = self.get_user(validated_token)
                return (user, validated_token)
            except (InvalidToken, AuthenticationFailed) as e:
                # If cookie token is invalid, try header
                print(f"DEBUG: Cookie token invalid: {e}")
                pass

        # Fallback to Authorization header
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
