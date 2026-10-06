class AICommerceBaseException(Exception):
    """Base exception for all AI Commerce Agent errors."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500, details: dict = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class AuthenticationError(AICommerceBaseException):
    def __init__(self, message: str = "Authentication required or invalid session", details: dict = None):
        super().__init__(message, code="UNAUTHENTICATED", status_code=401, details=details)


class AuthorizationError(AICommerceBaseException):
    def __init__(self, message: str = "Permission denied for this action", details: dict = None):
        super().__init__(message, code="FORBIDDEN", status_code=403, details=details)


class ToolExecutionError(AICommerceBaseException):
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code="TOOL_EXECUTION_FAILED", status_code=500, details=details)


class SpringBootError(AICommerceBaseException):
    def __init__(self, message: str = "Commerce backend unavailable or failed", details: dict = None, status_code: int = 502):
        super().__init__(message, code="SPRINGBOOT_COMMERCE_ERROR", status_code=status_code, details=details)


class LLMError(AICommerceBaseException):
    def __init__(self, message: str = "AI model provider error", details: dict = None):
        super().__init__(message, code="LLM_PROVIDER_ERROR", status_code=502, details=details)


class RAGError(AICommerceBaseException):
    def __init__(self, message: str = "Knowledge base retrieval failed", details: dict = None):
        super().__init__(message, code="RAG_RETRIEVAL_ERROR", status_code=500, details=details)


class ConfirmationRequiredError(AICommerceBaseException):
    def __init__(self, message: str = "Action requires customer confirmation", details: dict = None):
        super().__init__(message, code="CONFIRMATION_REQUIRED", status_code=400, details=details)


class RateLimitError(AICommerceBaseException):
    def __init__(self, message: str = "Rate limit exceeded. Please wait a moment.", details: dict = None):
        super().__init__(message, code="RATE_LIMIT_EXCEEDED", status_code=429, details=details)


class ValidationError(AICommerceBaseException):
    def __init__(self, message: str = "Invalid request payload or parameters", details: dict = None):
        super().__init__(message, code="VALIDATION_ERROR", status_code=422, details=details)


class OrderNotEligibleError(AICommerceBaseException):
    def __init__(self, message: str = "This order is not eligible for this action", details: dict = None):
        super().__init__(message, code="ORDER_NOT_ELIGIBLE", status_code=400, details=details)
