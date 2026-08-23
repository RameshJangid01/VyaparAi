# --- Build stage ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY VyaparAI.Api.csproj ./
RUN dotnet restore VyaparAI.Api.csproj

COPY . .
RUN dotnet publish VyaparAI.Api.csproj -c Release -o /app/publish

# --- Runtime stage ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Kestrel listens on 8080 inside the container. Render/Railway/Fly all
# auto-detect the exposed port and route external traffic to it - you
# don't need to match $PORT manually, just point the platform at 8080.
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "VyaparAI.Api.dll"]