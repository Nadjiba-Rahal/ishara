namespace Ishara.Application.Recognition;

public sealed record RecognitionRequest(
  IReadOnlyList<IReadOnlyList<float>>? Frames,
  IReadOnlyList<LandmarkPoint>? Landmarks);

public sealed record LandmarkPoint(float X, float Y, float Z = 0);

public sealed record RecognitionStatusResponse(
    string Status,
    string Message,
    string? ModelVersion,
    string? DatasetVersion,
    int? Frames = null,
    int? FeaturesPerFrame = null);

public sealed record RecognitionInputShape(int Frames, int FeaturesPerFrame);

public sealed record RecognitionResponse(
    bool Available,
    string? PredictedSign,
    float? Confidence,
    string ModelStatus,
    string? ModelVersion,
    string? DatasetVersion,
    IReadOnlyList<RecognitionCandidate> TopPredictions);

public sealed record RecognitionCandidate(string Sign, float Confidence);

public interface IRecognitionService
{
  RecognitionStatusResponse GetStatus();
  RecognitionInputShape GetInputShape();
  Task<RecognitionResponse> PredictAsync(RecognitionRequest request, CancellationToken cancellationToken);
}