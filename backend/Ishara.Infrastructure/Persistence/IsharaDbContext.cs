using Ishara.Domain.Signs;
using Ishara.Domain.Users;
using Microsoft.EntityFrameworkCore;

namespace Ishara.Infrastructure.Persistence;

public sealed class IsharaDbContext(DbContextOptions<IsharaDbContext> options) : DbContext(options)
{
  public DbSet<User> Users => Set<User>();

  public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

  public DbSet<Sign> Signs => Set<Sign>();

  public DbSet<SignCategory> SignCategories => Set<SignCategory>();

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

    modelBuilder.Entity<SignCategory>(entity =>
    {
      entity.ToTable("sign_categories");

      entity.HasKey(category => category.Id);

      entity.Property(category => category.Id)
        .HasColumnName("id");

      entity.Property(category => category.Name)
        .HasColumnName("name")
        .HasMaxLength(120)
        .IsRequired();

      entity.Property(category => category.Slug)
        .HasColumnName("slug")
        .HasMaxLength(160)
        .IsRequired();

      entity.HasIndex(category => category.Slug)
        .IsUnique();

      entity.Property(category => category.CreatedAtUtc)
        .HasColumnName("created_at_utc")
        .IsRequired();
    });

    modelBuilder.Entity<Sign>(entity =>
    {
      entity.ToTable("signs");

      entity.HasKey(sign => sign.Id);

      entity.Property(sign => sign.Id)
        .HasColumnName("id");

      entity.Property(sign => sign.ArabicLabel)
        .HasColumnName("arabic_label")
        .HasMaxLength(320)
        .IsRequired();

      entity.Property(sign => sign.Gloss)
        .HasColumnName("gloss")
        .HasMaxLength(320);

      entity.Property(sign => sign.CategoryId)
        .HasColumnName("category_id");

      entity.Property(sign => sign.SourceName)
        .HasColumnName("source_name")
        .HasMaxLength(120)
        .IsRequired();

      entity.Property(sign => sign.SourceRecordId)
        .HasColumnName("source_record_id")
        .HasMaxLength(320)
        .IsRequired();

      entity.HasIndex(sign => new { sign.SourceName, sign.SourceRecordId })
        .IsUnique();

      entity.HasIndex(sign => sign.ArabicLabel);

      entity.Property(sign => sign.HamNoSys)
        .HasColumnName("ham_no_sys");

      entity.Property(sign => sign.Sigml)
        .HasColumnName("sigml");

      entity.Property(sign => sign.MediaUrl)
        .HasColumnName("media_url")
        .HasMaxLength(2048);

      entity.Property(sign => sign.CreatedAtUtc)
        .HasColumnName("created_at_utc")
        .IsRequired();

      entity.HasOne(sign => sign.Category)
        .WithMany(category => category.Signs)
        .HasForeignKey(sign => sign.CategoryId)
        .OnDelete(DeleteBehavior.SetNull);
    });
  }
}
