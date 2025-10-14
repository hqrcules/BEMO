"""
Middleware to debug cookies
"""


class CookieDebugMiddleware:
    """Debug middleware to check cookies"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Debug: print all cookies
        # print(f"🍪 Cookies in request: {dict(request.COOKIES)}")

        response = self.get_response(request)
        return response
