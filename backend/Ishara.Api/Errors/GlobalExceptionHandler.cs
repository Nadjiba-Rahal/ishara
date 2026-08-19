using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Ishara.Api.Errors;

public sealed class GlobalExceptionHandler(
  IProblemDetailsService problemDetailsService,
  ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
  public async ValueTask<bool> TryHandleAsync(
    HttpContext httpContext,
    Exception exception,
    CancellationToken cancellationToken)
  {
    logger.LogError(exception, "Unhandled exception while processing {Path}", httpContext.Request.Path);

    httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

    return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
    {
      HttpContext = httpContext,
      Exception = exception,
      ProblemDetails = new ProblemDetails
      {
        Title = "An unexpected error occurred.",
        Status = StatusCodes.Status500InternalServerError,
        Detail = "The request could not be completed. Try again later."
      }
    });
  }
}
