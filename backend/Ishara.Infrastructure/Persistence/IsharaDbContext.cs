using Microsoft.EntityFrameworkCore;

namespace Ishara.Infrastructure.Persistence;

public sealed class IsharaDbContext(DbContextOptions<IsharaDbContext> options) : DbContext(options)
{
}
