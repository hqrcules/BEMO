from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """Custom exception handler for DRF"""

    response = exception_handler(exc, context)

    if response is not None:
        custom_response_data = {
            'error': True,
            'message': str(exc),
            'details': response.data
        }
        response.data = custom_response_data

    return response
