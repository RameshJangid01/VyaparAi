namespace VyaparAI.Api.Helpers;

/// <summary>
/// Thrown for expected business-rule failures (duplicate email, invalid credentials,
/// insufficient stock, etc.) so ExceptionMiddleware can map them to the right status code
/// instead of a generic 500.
/// </summary>
public class ApiException : Exception
{
    public int StatusCode { get; }

    public ApiException(string message, int statusCode = 400) : base(message)
    {
        StatusCode = statusCode;
    }
}
