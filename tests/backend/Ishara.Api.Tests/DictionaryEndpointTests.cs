using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Ishara.Application.Auth;
using Ishara.Application.Dictionary;
using Ishara.Domain.Users;
using Ishara.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace Ishara.Api.Tests;

public sealed class DictionaryEndpointTests(IsharaAuthApiFactory factory) : IClassFixture<IsharaAuthApiFactory>
{
  [Fact]
  public async Task ImportSearchPaginationAndRetrievalWork()
  {
    using var client = factory.CreateClient();
    var auth = await CreateContributorAsync(client);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);

    var dataset = CreateTestDataset();
    var import = await client.PostAsJsonAsync("/api/signs/import/3dzsigndb", new Import3DzSignDbRequest(
      dataset.CategoriesFile,
      dataset.SigmlDirectory,
      "TEST_SOURCE"));

    Assert.Equal(HttpStatusCode.OK, import.StatusCode);
    var importResult = await import.Content.ReadFromJsonAsync<Import3DzSignDbResult>();
    Assert.NotNull(importResult);
    Assert.Equal(1, importResult.CategoriesImported);
    Assert.Equal(2, importResult.SignsImported);
    Assert.Equal(1, importResult.SigmlFilesLinked);

    var page = await client.GetFromJsonAsync<PagedResult<SignDto>>("/api/signs?page=1&pageSize=1");
    Assert.NotNull(page);
    Assert.Equal(1, page.Page);
    Assert.Equal(1, page.PageSize);
    Assert.Equal(2, page.TotalCount);
    Assert.Single(page.Items);

    var search = await client.GetFromJsonAsync<PagedResult<SignDto>>("/api/signs/search?q=TEST_ONLY_ALPHA");
    Assert.NotNull(search);
    var sign = Assert.Single(search.Items);
    Assert.Equal("TEST_ONLY_ALPHA", sign.ArabicLabel);
    Assert.True(sign.HasSigml);

    var detail = await client.GetFromJsonAsync<SignDto>($"/api/signs/{sign.Id}");
    Assert.NotNull(detail);
    Assert.Equal(sign.Id, detail.Id);
    Assert.Contains("hamgestural_sign", detail.Sigml);

    var categories = await client.GetFromJsonAsync<List<CategoryDto>>("/api/categories");
    Assert.NotNull(categories);
    var category = Assert.Single(categories);
    Assert.Equal("TEST_ONLY_CATEGORY", category.Name);
    Assert.Equal(2, category.SignCount);
  }

  [Fact]
  public async Task UnknownSignReturnsNotFound()
  {
    using var client = factory.CreateClient();

    var response = await client.GetAsync($"/api/signs/{Guid.NewGuid()}");

    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
  }

  [Fact]
  public async Task ImportRequiresContributorRole()
  {
    using var client = factory.CreateClient();
    var user = await AuthEndpointTests.RegisterAsync(client);
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.AccessToken);

    var response = await client.PostAsJsonAsync("/api/signs/import/3dzsigndb", new Import3DzSignDbRequest(
      "missing.json",
      "missing",
      "TEST_SOURCE"));

    Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
  }

  private async Task<AuthResponse> CreateContributorAsync(HttpClient client)
  {
    var email = $"contributor-{Guid.NewGuid():N}@ishara.test";

    using var scope = factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<IsharaDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    dbContext.Users.Add(new User(
      Guid.NewGuid(),
      email,
      "Dictionary Contributor",
      passwordHasher.HashPassword("StrongPassword123!"),
      UserRole.Contributor,
      DateTimeOffset.UtcNow));

    await dbContext.SaveChangesAsync();

    var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
      email,
      "StrongPassword123!"));

    response.EnsureSuccessStatusCode();
    return (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
  }

  private static TestDataset CreateTestDataset()
  {
    var root = Path.Combine(Path.GetTempPath(), $"ishara-dictionary-test-{Guid.NewGuid():N}");
    var sigml = Path.Combine(root, "sigml");
    Directory.CreateDirectory(sigml);

    var categories = Path.Combine(root, "categories_files.json");
    File.WriteAllText(categories, """
      {
        "TEST_ONLY_CATEGORY": [
          "TEST_ONLY_ALPHA",
          "TEST_ONLY_BETA"
        ]
      }
      """);

    File.WriteAllText(
      Path.Combine(sigml, "TEST_ONLY_ALPHA.sigml"),
      "<sigml><hamgestural_sign gloss=\"TEST_ONLY_ALPHA\" /></sigml>");

    return new TestDataset(categories, sigml);
  }

  private sealed record TestDataset(string CategoriesFile, string SigmlDirectory);
}
