using Ishara.Domain.Signs;

namespace Ishara.Application.Dictionary;

public interface IDictionaryRepository
{
  Task<PagedResult<SignDto>> GetSignsAsync(SignQuery query, CancellationToken cancellationToken = default);

  Task<SignDto?> GetSignAsync(Guid id, CancellationToken cancellationToken = default);

  Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken cancellationToken = default);

  Task<SignCategory?> FindCategoryBySlugAsync(string slug, CancellationToken cancellationToken = default);

  Task<Sign?> FindSignBySourceAsync(string sourceName, string sourceRecordId, CancellationToken cancellationToken = default);

  void AddCategory(SignCategory category);

  void AddSign(Sign sign);

  Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
