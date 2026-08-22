namespace Ishara.Application.Dictionary;

public interface IDictionaryImportService
{
  Task<Import3DzSignDbResult> Import3DzSignDbAsync(
    Import3DzSignDbRequest request,
    CancellationToken cancellationToken = default);
}
