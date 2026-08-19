using Ishara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Ishara.Infrastructure;

public static class DependencyInjection
{
  public static IServiceCollection AddInfrastructure(
    this IServiceCollection services,
    IConfiguration configuration)
  {
    var connectionString = configuration.GetConnectionString("Postgres");

    if (!string.IsNullOrWhiteSpace(connectionString))
    {
      services.AddDbContext<IsharaDbContext>(options =>
        options.UseNpgsql(connectionString));
    }

    return services;
  }
}
