using Ishara.Application.Dictionary;
using Ishara.Domain.Signs;
using Ishara.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ishara.Infrastructure.Dictionary;

public sealed class EfDictionaryRepository(IsharaDbContext dbContext) : IDictionaryRepository
{
  public async Task<PagedResult<SignDto>> GetSignsAsync(SignQuery query, CancellationToken cancellationToken = default)
  {
    var page = Math.Max(query.Page, 1);
    var pageSize = Math.Clamp(query.PageSize, 1, 100);
    var signs = dbContext.Signs
      .AsNoTracking()
      .Include(sign => sign.Category)
      .AsQueryable();

    if (!string.IsNullOrWhiteSpace(query.Q))
    {
      var q = query.Q.Trim();
      signs = signs.Where(sign =>
        sign.ArabicLabel.Contains(q) ||
        (sign.Gloss != null && sign.Gloss.Contains(q)));
    }

    if (!string.IsNullOrWhiteSpace(query.Category))
    {
      var category = query.Category.Trim();
      signs = signs.Where(sign => sign.Category != null &&
        (sign.Category.Slug == category || sign.Category.Name == category));
    }

    var totalCount = await signs.CountAsync(cancellationToken);
    var items = await signs
      .OrderBy(sign => sign.ArabicLabel)
      .Skip((page - 1) * pageSize)
      .Take(pageSize)
      .Select(sign => ToDto(sign))
      .ToListAsync(cancellationToken);

    return new PagedResult<SignDto>(items, page, pageSize, totalCount);
  }

  public Task<SignDto?> GetSignAsync(Guid id, CancellationToken cancellationToken = default) =>
    dbContext.Signs
      .AsNoTracking()
      .Include(sign => sign.Category)
      .Where(sign => sign.Id == id)
      .Select(sign => ToDto(sign))
      .SingleOrDefaultAsync(cancellationToken);

  public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default) =>
    await dbContext.SignCategories
      .AsNoTracking()
      .OrderBy(category => category.Name)
      .Select(category => new CategoryDto(
        category.Id,
        category.Name,
        category.Slug,
        category.Signs.Count))
      .ToListAsync(cancellationToken);

  public Task<SignCategory?> FindCategoryBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
    dbContext.SignCategories.SingleOrDefaultAsync(category => category.Slug == slug, cancellationToken);

  public Task<Sign?> FindSignBySourceAsync(string sourceName, string sourceRecordId, CancellationToken cancellationToken = default) =>
    dbContext.Signs.SingleOrDefaultAsync(
      sign => sign.SourceName == sourceName && sign.SourceRecordId == sourceRecordId,
      cancellationToken);

  public void AddCategory(SignCategory category)
  {
    dbContext.SignCategories.Add(category);
  }

  public void AddSign(Sign sign)
  {
    dbContext.Signs.Add(sign);
  }

  public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
    dbContext.SaveChangesAsync(cancellationToken);

  private static SignDto ToDto(Sign sign) => new(
    sign.Id,
    sign.ArabicLabel,
    sign.Gloss,
    sign.Category == null ? null : sign.Category.Name,
    sign.SourceName,
    sign.SourceRecordId,
    !string.IsNullOrWhiteSpace(sign.HamNoSys),
    !string.IsNullOrWhiteSpace(sign.Sigml),
    !string.IsNullOrWhiteSpace(sign.MediaUrl),
    sign.HamNoSys,
    sign.Sigml,
    sign.MediaUrl);
}
