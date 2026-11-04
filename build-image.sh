#!/bin/bash
# https://portainer.web2.rmutsv.ac.th/api/stacks/webhooks/1794ac3c-cdaa-40cf-8d5d-d5e76fc17ea6 
# Configuration
IMAGE_NAME="node:next-news-ruts"

# Portainer stack webhook - ยิงหลัง push สำเร็จ เพื่อให้ stack ดึง image ใหม่ไป deploy ทันที
# override ได้ด้วย env PORTAINER_WEBHOOK / ข้ามการ deploy ด้วย SKIP_DEPLOY=1
PORTAINER_WEBHOOK="${PORTAINER_WEBHOOK:-https://portainer.web2.rmutsv.ac.th/api/stacks/webhooks/1794ac3c-cdaa-40cf-8d5d-d5e76fc17ea6}"
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

# Trigger Portainer stack webhook to redeploy with the image we just pushed
deploy_stack() {
    if [ "${SKIP_DEPLOY}" = "1" ]; then
        echo -e "${YELLOW}SKIP_DEPLOY=1 -> ข้ามการ deploy${NC}"
        return 0
    fi

    if [ -z "${PORTAINER_WEBHOOK}" ]; then
        echo -e "${YELLOW}ไม่ได้ตั้ง PORTAINER_WEBHOOK -> ข้ามการ deploy${NC}"
        return 0
    fi

    echo -e "${GREEN}Triggering Portainer stack webhook...${NC}"
    local http_code
    http_code=$(curl -sS -X POST -o /dev/null -w '%{http_code}' --max-time 120 "${PORTAINER_WEBHOOK}")

    case "${http_code}" in
        200|204)
            echo -e "${GREEN}Deploy triggered successfully (HTTP ${http_code})${NC}"
            ;;
        404)
            echo -e "${RED}Webhook ไม่ถูกต้องหรือถูกลบไปแล้ว (HTTP 404)${NC}"
            return 1
            ;;
        409)
            echo -e "${RED}Stack กำลัง deploy อยู่ ยังรับคำสั่งใหม่ไม่ได้ (HTTP 409)${NC}"
            return 1
            ;;
        000)
            echo -e "${RED}เชื่อมต่อ Portainer ไม่ได้ (timeout / DNS / TLS)${NC}"
            return 1
            ;;
        *)
            echo -e "${RED}Deploy ล้มเหลว (HTTP ${http_code})${NC}"
            return 1
            ;;
    esac
}

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

    deploy_stack || exit 1
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
    echo -e "${YELLOW}ไม่ได้ push ขึ้น registry -> ไม่ยิง webhook${NC}"
fi

echo -e "${GREEN}Done!${NC}"
