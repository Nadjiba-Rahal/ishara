using System.Security.Cryptography;
using Ishara.Application.Auth;

namespace Ishara.Infrastructure.Auth;

public sealed class Pbkdf2PasswordHasher : IPasswordHasher
{
  private const int SaltSize = 16;
  private const int KeySize = 32;
  private const int Iterations = 210_000;
  private const char Separator = '$';

  public string HashPassword(string password)
  {
    var salt = RandomNumberGenerator.GetBytes(SaltSize);
    var key = Rfc2898DeriveBytes.Pbkdf2(
      password,
      salt,
      Iterations,
      HashAlgorithmName.SHA256,
      KeySize);

    return string.Join(
      Separator,
      "pbkdf2-sha256",
      Iterations,
      Convert.ToBase64String(salt),
      Convert.ToBase64String(key));
  }

  public bool VerifyPassword(string passwordHash, string providedPassword)
  {
    var parts = passwordHash.Split(Separator);

    if (parts.Length != 4 ||
        parts[0] != "pbkdf2-sha256" ||
        !int.TryParse(parts[1], out var iterations))
    {
      return false;
    }

    var salt = Convert.FromBase64String(parts[2]);
    var expectedKey = Convert.FromBase64String(parts[3]);
    var actualKey = Rfc2898DeriveBytes.Pbkdf2(
      providedPassword,
      salt,
      iterations,
      HashAlgorithmName.SHA256,
      expectedKey.Length);

    return CryptographicOperations.FixedTimeEquals(actualKey, expectedKey);
  }
}
