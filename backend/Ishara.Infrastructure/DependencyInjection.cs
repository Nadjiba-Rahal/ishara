using Ishara.Application.Auth;
using Ishara.Application.Dictionary;
using Ishara.Application.Recognition;
using Ishara.Infrastructure.Auth;
using Ishara.Infrastructure.Dictionary;
using Ishara.Infrastructure.Persistence;
using Ishara.Infrastructure.Recognition;
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

    var jwtSection = configuration.GetSection(JwtOptions.SectionName);
    services.Configure<JwtOptions>(options =>
    {
      options.Issuer = jwtSection["Issuer"] ?? string.Empty;
      options.Audience = jwtSection["Audience"] ?? string.Empty;
      options.SigningKey = jwtSection["SigningKey"] ?? string.Empty;

      if (int.TryParse(jwtSection["AccessTokenMinutes"], out var accessTokenMinutes))
      {
        options.AccessTokenMinutes = accessTokenMinutes;
      }
    });
    services.AddScoped<IUserRepository, EfUserRepository>();
    services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
    services.AddSingleton<IRefreshTokenService, SecureRefreshTokenService>();
    services.AddScoped<IJwtTokenService, HmacJwtTokenService>();
    services.AddScoped<IDictionaryRepository, EfDictionaryRepository>();
    services.AddSingleton<IRecognitionService, OnnxRecognitionService>();

    return services;
  }
}
