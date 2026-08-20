using Microsoft.Extensions.DependencyInjection;
using Ishara.Application.Auth;

namespace Ishara.Application;

public static class DependencyInjection
{
  public static IServiceCollection AddApplication(this IServiceCollection services)
  {
    services.AddScoped<IAuthService, AuthService>();

    return services;
  }
}
