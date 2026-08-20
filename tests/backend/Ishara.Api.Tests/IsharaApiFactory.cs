using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Ishara.Api.Tests;

public class IsharaApiFactory : WebApplicationFactory<Program>
{
  public IsharaApiFactory()
  {
    Environment.SetEnvironmentVariable("Jwt__Issuer", "Ishara.Api.Tests");
    Environment.SetEnvironmentVariable("Jwt__Audience", "Ishara.Api.Tests");
    Environment.SetEnvironmentVariable("Jwt__AccessTokenMinutes", "15");
    Environment.SetEnvironmentVariable("Jwt__SigningKey", "test-signing-key-for-ishara-auth-phase-three");
    Environment.SetEnvironmentVariable("ConnectionStrings__Postgres", "Host=localhost;Port=5432;Database=ishara;Username=ishara;Password=ishara_dev_password");
  }

  protected override void ConfigureWebHost(IWebHostBuilder builder)
  {
    builder.ConfigureAppConfiguration(configuration =>
    {
      configuration.AddInMemoryCollection(new Dictionary<string, string?>
      {
        ["Jwt:Issuer"] = "Ishara.Api.Tests",
        ["Jwt:Audience"] = "Ishara.Api.Tests",
        ["Jwt:AccessTokenMinutes"] = "15",
        ["Jwt:SigningKey"] = "test-signing-key-for-ishara-auth-phase-three"
      });
    });
  }
}
