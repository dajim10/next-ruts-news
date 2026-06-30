#!/bin/bash

# Configuration
IMAGE_NAME="node:next-news-ruts"
# Accept registry as first argument or from environment variable
REGISTRY="${1:-${DOCKER_REGISTRY:-registry.rmutsv.app/panuwat.n}}"

# Platform to build for (Linux AMD64 only - server is Linux)
PLATFORMS="linux/amd64"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if buildx is available
if ! docker buildx version > /dev/null 2>&1; then
    echo -e "${RED}Error: docker buildx is not available!${NC}"
    echo -e "${YELLOW}Please install or enable docker buildx${NC}"
    exit 1
fi

# Create and use buildx builder if it doesn't exist
BUILDER_NAME="multiarch-builder"
if ! docker buildx inspect ${BUILDER_NAME} > /dev/null 2>&1; then
    echo -e "${YELLOW}Creating buildx builder: ${BUILDER_NAME}${NC}"
    docker buildx create --name ${BUILDER_NAME} --use
    docker buildx inspect --bootstrap
else
    echo -e "${YELLOW}Using existing buildx builder: ${BUILDER_NAME}${NC}"
    docker buildx use ${BUILDER_NAME}
fi

# Construct full image name
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}"
else
    FULL_IMAGE_NAME="${IMAGE_NAME}"
fi

echo -e "${GREEN}Building Docker image: ${FULL_IMAGE_NAME}${NC}"
echo -e "${YELLOW}Platform: ${PLATFORMS}${NC}"

# Build and push using buildx
if [ -n "$REGISTRY" ]; then
    # Build and push to registry
    docker buildx build \
        --platform ${PLATFORMS} \
        -t ${FULL_IMAGE_NAME} \
        --push \
        .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Build and push failed!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Image built and pushed successfully: ${FULL_IMAGE_NAME}${NC}"
else
    # Build only (load to local docker)
    echo -e "${YELLOW}Building for local platform only (no push)${NC}"
    docker buildx build \
        --platform ${PLATFORMS} \
        -t ${FULL_IMAGE_NAME} \
        --load \
        .
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Build failed!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Build successful!${NC}"
fi

echo -e "${GREEN}Done!${NC}"
