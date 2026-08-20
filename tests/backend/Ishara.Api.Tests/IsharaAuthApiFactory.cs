using Ishara.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Ishara.Api.Tests;

public sealed class IsharaAuthApiFactory : IsharaApiFactory
{
  private readonly string databaseName = $"ishara-tests-{Guid.NewGuid()}";

  public IsharaAuthApiFactory()
  {
    Environment.SetEnvironmentVariable("ConnectionStrings__Postgres", string.Empty);
  }

  protected override void ConfigureWebHost(IWebHostBuilder builder)
  {
    base.ConfigureWebHost(builder);

    builder.ConfigureServices(services =>
    {
      services.RemoveAll<DbContextOptions<IsharaDbContext>>();
      services.AddDbContext<IsharaDbContext>(options =>
        options.UseInMemoryDatabase(databaseName));
    });
  }
}
