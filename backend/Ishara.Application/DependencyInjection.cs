using Microsoft.Extensions.DependencyInjection;
using Ishara.Application.Auth;
using Ishara.Application.Dictionary;

namespace Ishara.Application;

public static class DependencyInjection
{
  public static IServiceCollection AddApplication(this IServiceCollection services)
  {
    services.AddScoped<IAuthService, AuthService>();
    services.AddScoped<IDictionaryImportService, DictionaryImportService>();

    return services;
  }
}
