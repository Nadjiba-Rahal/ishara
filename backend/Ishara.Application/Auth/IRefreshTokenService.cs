namespace Ishara.Application.Auth;

public interface IRefreshTokenService
{
  string CreateToken();

  string HashToken(string refreshToken);
}
