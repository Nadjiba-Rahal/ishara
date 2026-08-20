using Ishara.Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Ishara.Infrastructure.Persistence;

public sealed class IsharaDbContext(DbContextOptions<IsharaDbContext> options) : DbContext(options)
{
  public DbSet<User> Users => Set<User>();

  public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<User>(entity =>
    {
      entity.ToTable("users");

      entity.HasKey(user => user.Id);

      entity.Property(user => user.Id)
        .HasColumnName("id");

      entity.Property(user => user.Email)
        .HasColumnName("email")
        .HasMaxLength(320)
        .IsRequired();

      entity.HasIndex(user => user.Email)
        .IsUnique();

      entity.Property(user => user.DisplayName)
        .HasColumnName("display_name")
        .HasMaxLength(80)
        .IsRequired();

      entity.Property(user => user.PasswordHash)
        .HasColumnName("password_hash")
        .HasMaxLength(512)
        .IsRequired();

      entity.Property(user => user.Role)
        .HasColumnName("role")
        .HasConversion<string>()
        .HasMaxLength(40)
        .IsRequired();

      entity.Property(user => user.CreatedAtUtc)
        .HasColumnName("created_at_utc")
        .IsRequired();

      entity.HasMany(user => user.RefreshTokens)
        .WithOne(refreshToken => refreshToken.User)
        .HasForeignKey(refreshToken => refreshToken.UserId)
        .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<RefreshToken>(entity =>
    {
      entity.ToTable("refresh_tokens");

      entity.HasKey(refreshToken => refreshToken.Id);

      entity.Property(refreshToken => refreshToken.Id)
        .HasColumnName("id");

      entity.Property(refreshToken => refreshToken.UserId)
        .HasColumnName("user_id")
        .IsRequired();

      entity.Property(refreshToken => refreshToken.TokenHash)
        .HasColumnName("token_hash")
        .HasMaxLength(128)
        .IsRequired();

      entity.HasIndex(refreshToken => refreshToken.TokenHash)
        .IsUnique();

      entity.Property(refreshToken => refreshToken.ExpiresAtUtc)
        .HasColumnName("expires_at_utc")
        .IsRequired();

      entity.Property(refreshToken => refreshToken.CreatedAtUtc)
        .HasColumnName("created_at_utc")
        .IsRequired();

      entity.Property(refreshToken => refreshToken.RevokedAtUtc)
        .HasColumnName("revoked_at_utc");
    });
  }
}
