using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Ishara.Application.Auth;
using Ishara.Domain.Users;
using Microsoft.Extensions.Options;

namespace Ishara.Infrastructure.Auth;

public sealed class HmacJwtTokenService(IOptions<JwtOptions> options) : IJwtTokenService
{
  public AuthResponse CreateToken(User user, string refreshToken)
  {
    var jwtOptions = options.Value;
    var expiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(jwtOptions.AccessTokenMinutes);

    var header = new Dictionary<string, object>
    {
      ["alg"] = "HS256",
      ["typ"] = "JWT"
    };

    var payload = new Dictionary<string, object>
    {
      [ClaimTypes.NameIdentifier] = user.Id.ToString(),
      [ClaimTypes.Email] = user.Email,
      [ClaimTypes.Name] = user.DisplayName,
      [ClaimTypes.Role] = user.Role.ToString(),
      ["iss"] = jwtOptions.Issuer,
      ["aud"] = jwtOptions.Audience,
      ["iat"] = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
      ["exp"] = expiresAtUtc.ToUnixTimeSeconds()
    };

    var encodedHeader = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(header));
    var encodedPayload = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(payload));
    var unsignedToken = $"{encodedHeader}.{encodedPayload}";
    var signature = Sign(unsignedToken, jwtOptions.SigningKey);

    return new AuthResponse(
      user.Id,
      user.Email,
      user.DisplayName,
      user.Role.ToString(),
      $"{unsignedToken}.{signature}",
      refreshToken,
      expiresAtUtc);
  }

  private static string Sign(string unsignedToken, string signingKey)
  {
    using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(signingKey));
    return Base64UrlEncode(hmac.ComputeHash(Encoding.UTF8.GetBytes(unsignedToken)));
  }

  private static string Base64UrlEncode(byte[] bytes) =>
    Convert.ToBase64String(bytes)
      .TrimEnd('=')
      .Replace('+', '-')
      .Replace('/', '_');
}
