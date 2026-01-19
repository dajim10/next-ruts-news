#!/bin/bash

# Configuration
IMAGE_NAME="node:next-ruts-news"
# Accept registry as first argument or from environment variable
REGISTRY="${1:-${DOCKER_REGISTRY:-}}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building Docker image: ${IMAGE_NAME}${NC}"

# Build the image
docker build -t ${IMAGE_NAME} .

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# If registry is provided, tag and push
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}"
    echo -e "${YELLOW}Tagging image as: ${FULL_IMAGE_NAME}${NC}"
    docker tag ${IMAGE_NAME} ${FULL_IMAGE_NAME}
    
    echo -e "${YELLOW}Pushing image to registry...${NC}"
    docker push ${FULL_IMAGE_NAME}
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Push failed!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Image pushed successfully: ${FULL_IMAGE_NAME}${NC}"
else
    echo -e "${YELLOW}No registry specified. Skipping push.${NC}"
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "${YELLOW}  ./build-image.sh                    # Build only${NC}"
    echo -e "${YELLOW}  ./build-image.sh your-registry.com   # Build and push${NC}"
    echo -e "${YELLOW}  DOCKER_REGISTRY=your-registry.com ./build-image.sh  # Build and push (env var)${NC}"
fi

echo -e "${GREEN}Done!${NC}"
