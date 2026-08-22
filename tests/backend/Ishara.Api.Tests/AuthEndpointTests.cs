using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Ishara.Application.Auth;
using Ishara.Domain.Users;
using Ishara.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace Ishara.Api.Tests;

public sealed class AuthEndpointTests(IsharaAuthApiFactory factory) : IClassFixture<IsharaAuthApiFactory>
{
  [Fact]
  public async Task RegisterLoginAndMeUseJwtAuthentication()
  {
    using var client = factory.CreateClient();
    var email = $"user-{Guid.NewGuid():N}@ishara.test";

    var register = await client.PostAsJsonAsync("/api/auth/register", new RegisterUserRequest(
      email,
      "ISHARA User",
      "StrongPassword123!"));

    Assert.Equal(HttpStatusCode.Created, register.StatusCode);
    var registered = await register.Content.ReadFromJsonAsync<AuthResponse>();
    AssertAuthResponse(registered, email, "User");

    var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
      email,
      "StrongPassword123!"));

    Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    var loggedIn = await login.Content.ReadFromJsonAsync<AuthResponse>();
    AssertAuthResponse(loggedIn, email, "User");

    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loggedIn!.AccessToken);
    var me = await client.GetFromJsonAsync<MeResponse>("/api/auth/me");

    Assert.NotNull(me);
    Assert.Equal(email, me.Email);
    Assert.Equal("ISHARA User", me.DisplayName);
    Assert.Equal("User", me.Role);
  }

  [Fact]
  public async Task MeRejectsAnonymousRequests()
  {
    using var client = factory.CreateClient();

    var response = await client.GetAsync("/api/auth/me");

    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
  }

  [Fact]
  public async Task RefreshRotatesRefreshToken()
  {
    using var client = factory.CreateClient();
    var auth = await RegisterAsync(client);

    var refresh = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshTokenRequest(auth.RefreshToken));

    Assert.Equal(HttpStatusCode.OK, refresh.StatusCode);
    var refreshed = await refresh.Content.ReadFromJsonAsync<AuthResponse>();
    Assert.NotNull(refreshed);
    Assert.NotEqual(auth.RefreshToken, refreshed.RefreshToken);

    var reuse = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshTokenRequest(auth.RefreshToken));
    Assert.Equal(HttpStatusCode.Unauthorized, reuse.StatusCode);
  }

  [Fact]
  public async Task LogoutRevokesRefreshToken()
  {
    using var client = factory.CreateClient();
    var auth = await RegisterAsync(client);

    var logout = await client.PostAsJsonAsync("/api/auth/logout", new LogoutRequest(auth.RefreshToken));
    Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);

    var refresh = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshTokenRequest(auth.RefreshToken));
    Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);
  }

  [Fact]
  public async Task RoleAuthorizationRejectsUserAndAllowsAdmin()
  {
    using var client = factory.CreateClient();
    var user = await RegisterAsync(client);

    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", user.AccessToken);
    var userAdminCheck = await client.GetAsync("/api/auth/admin-check");

    Assert.Equal(HttpStatusCode.Forbidden, userAdminCheck.StatusCode);

    var adminEmail = $"admin-{Guid.NewGuid():N}@ishara.test";
    await CreateAdminAsync(adminEmail);

    var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
      adminEmail,
      "AdminPassword123!"));
    var admin = await login.Content.ReadFromJsonAsync<AuthResponse>();

    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", admin!.AccessToken);
    var adminCheck = await client.GetAsync("/api/auth/admin-check");

    Assert.Equal(HttpStatusCode.OK, adminCheck.StatusCode);
  }

  internal static async Task<AuthResponse> RegisterAsync(HttpClient client)
  {
    var email = $"user-{Guid.NewGuid():N}@ishara.test";
    var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterUserRequest(
      email,
      "ISHARA User",
      "StrongPassword123!"));

    response.EnsureSuccessStatusCode();
    return (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
  }

  private async Task CreateAdminAsync(string email)
  {
    using var scope = factory.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<IsharaDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    dbContext.Users.Add(new User(
      Guid.NewGuid(),
      email,
      "ISHARA Admin",
      passwordHasher.HashPassword("AdminPassword123!"),
      UserRole.Admin,
      DateTimeOffset.UtcNow));

    await dbContext.SaveChangesAsync();
  }

  private static void AssertAuthResponse(AuthResponse? response, string email, string role)
  {
    Assert.NotNull(response);
    Assert.Equal(email, response.Email);
    Assert.Equal(role, response.Role);
    Assert.False(string.IsNullOrWhiteSpace(response.AccessToken));
    Assert.False(string.IsNullOrWhiteSpace(response.RefreshToken));
    Assert.True(response.ExpiresAtUtc > DateTimeOffset.UtcNow);
  }

  private sealed record MeResponse(
    string UserId,
    string Email,
    string DisplayName,
    string Role);
}
