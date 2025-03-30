#!/bin/bash

# Script to set up the Spheron Provider Proxy Server
# This is necessary for submitting manifests to Spheron providers

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if the container is already running
if docker ps | grep -q "spheron-provider-proxy"; then
    echo "Spheron Provider Proxy Server is already running."
    echo "To restart it, run: docker restart spheron-provider-proxy"
    exit 0
fi

# Check if the container exists but is not running
if docker ps -a | grep -q "spheron-provider-proxy"; then
    echo "Spheron Provider Proxy Server container exists but is not running."
    echo "Starting existing container..."
    docker start spheron-provider-proxy
    echo "Provider Proxy Server is now running at http://localhost:3040"
    exit 0
fi

# Pull and run the Docker image
echo "Setting up Spheron Provider Proxy Server using Docker..."
docker pull spheronnetwork/provider-proxy-server:latest
docker run -d -p 3040:3040 --name spheron-provider-proxy spheronnetwork/provider-proxy-server:latest

# Check if container started successfully
if [ $? -eq 0 ]; then
    echo "Provider Proxy Server is running at http://localhost:3040"
    echo "You can now use this URL in your Spheron SDK configuration"
else
    echo "Failed to start the Provider Proxy Server."
    echo "Check Docker logs with: docker logs spheron-provider-proxy"
    exit 1
fi

# Print status information
echo ""
echo "To check the status: docker ps | grep spheron-provider-proxy"
echo "To view logs: docker logs spheron-provider-proxy"
echo "To stop the server: docker stop spheron-provider-proxy"
echo "To remove the container: docker rm spheron-provider-proxy"