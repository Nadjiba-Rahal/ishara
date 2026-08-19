FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/Ishara.slnx backend/
COPY backend/Ishara.Api/Ishara.Api.csproj backend/Ishara.Api/
COPY backend/Ishara.Application/Ishara.Application.csproj backend/Ishara.Application/
COPY backend/Ishara.Domain/Ishara.Domain.csproj backend/Ishara.Domain/
COPY backend/Ishara.Infrastructure/Ishara.Infrastructure.csproj backend/Ishara.Infrastructure/
COPY Directory.Build.props global.json ./

RUN dotnet restore backend/Ishara.slnx

COPY . .
RUN dotnet publish backend/Ishara.Api/Ishara.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Ishara.Api.dll"]
