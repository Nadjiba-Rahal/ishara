using System.Net;
using System.Net.Http.Json;
namespace Ishara.Api.Tests;

public sealed class HealthEndpointTests(IsharaApiFactory factory)
  : IClassFixture<IsharaApiFactory>
{
  [Fact]
  public async Task LiveHealthEndpointReturnsOk()
  {
    using var client = factory.CreateClient();

    var response = await client.GetAsync("/api/health/live");

    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }

  [Fact]
  public async Task ReadyHealthEndpointReportsUnavailableWhenDatabaseIsOffline()
  {
    using var client = factory.CreateClient();

    var response = await client.GetAsync("/api/health/ready");

    Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
  }

  [Fact]
  public async Task OpenApiDocumentIsAvailableInDevelopment()
  {
    using var client = factory.CreateClient();

    var response = await client.GetAsync("/openapi/v1.json");

    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
  }

  [Fact]
  public async Task RootEndpointIdentifiesApi()
  {
    using var client = factory.CreateClient();

    var response = await client.GetFromJsonAsync<RootResponse>("/");

    Assert.NotNull(response);
    Assert.Equal("ISHARA API", response.Name);
  }

  private sealed record RootResponse(string Name, string Status, string Description);
}
