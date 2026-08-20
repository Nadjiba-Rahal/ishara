using System.Security.Cryptography;
using Ishara.Application.Auth;

namespace Ishara.Infrastructure.Auth;

public sealed class SecureRefreshTokenService : IRefreshTokenService
{
  public string CreateToken() =>
    Base64UrlEncode(RandomNumberGenerator.GetBytes(64));

  public string HashToken(string refreshToken)
  {
    var hash = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(refreshToken));
    return Convert.ToHexString(hash);
  }

  private static string Base64UrlEncode(byte[] bytes) =>
    Convert.ToBase64String(bytes)
      .TrimEnd('=')
      .Replace('+', '-')
      .Replace('/', '_');
}
