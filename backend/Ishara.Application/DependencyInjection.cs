using Microsoft.Extensions.DependencyInjection;

namespace Ishara.Application;

public static class DependencyInjection
{
  public static IServiceCollection AddApplication(this IServiceCollection services)
  {
    return services;
  }
}
