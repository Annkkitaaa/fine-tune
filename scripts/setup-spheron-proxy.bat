@echo off
setlocal enabledelayedexpansion

:: Script to set up the Spheron Provider Proxy Server
:: This is necessary for submitting manifests to Spheron providers

:: Check if Docker is installed
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker is not installed. Please install Docker first.
    echo Visit https://docs.docker.com/get-docker/ for installation instructions.
    exit /b 1
)

:: Check if the container is already running
docker ps | findstr "spheron-provider-proxy" >nul
if %ERRORLEVEL% equ 0 (
    echo Spheron Provider Proxy Server is already running.
    echo To restart it, run: docker restart spheron-provider-proxy
    exit /b 0
)

:: Check if the container exists but is not running
docker ps -a | findstr "spheron-provider-proxy" >nul
if %ERRORLEVEL% equ 0 (
    echo Spheron Provider Proxy Server container exists but is not running.
    echo Starting existing container...
    docker start spheron-provider-proxy
    echo Provider Proxy Server is now running at http://localhost:3040
    exit /b 0
)

:: Pull and run the Docker image
echo Setting up Spheron Provider Proxy Server using Docker...
docker pull spheronnetwork/provider-proxy-server:latest
docker run -d -p 3040:3040 --name spheron-provider-proxy spheronnetwork/provider-proxy-server:latest

:: Check if container started successfully
if %ERRORLEVEL% equ 0 (
    echo Provider Proxy Server is running at http://localhost:3040
    echo You can now use this URL in your Spheron SDK configuration
) else (
    echo Failed to start the Provider Proxy Server.
    echo Check Docker logs with: docker logs spheron-provider-proxy
    exit /b 1
)

:: Print status information
echo.
echo To check the status: docker ps | findstr spheron-provider-proxy
echo To view logs: docker logs spheron-provider-proxy
echo To stop the server: docker stop spheron-provider-proxy
echo To remove the container: docker rm spheron-provider-proxy