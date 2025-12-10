#!/bin/bash
# Script to restart Docker Compose services on EC2 with fresh images from Docker Hub

set -e  # Exit on error

echo "=========================================="
echo "Starting EC2 deployment restart"
echo "=========================================="

# Navigate to project directory
cd ~/aygo-reporter

# Step 1: Pull latest code from GitHub
echo ""
echo "Step 1: Pulling latest code from GitHub..."
git pull origin main

# Step 2: Stop and remove existing containers
echo ""
echo "Step 2: Stopping existing containers..."
docker-compose -f docker-compose.ec2.yml down

# Step 3: Pull latest images from Docker Hub
echo ""
echo "Step 3: Pulling latest images from Docker Hub..."
docker-compose -f docker-compose.ec2.yml pull

# Step 4: Start services with fresh images
echo ""
echo "Step 4: Starting services with fresh images..."
docker-compose -f docker-compose.ec2.yml up -d

# Step 5: Wait for services to stabilize
echo ""
echo "Step 5: Waiting 30 seconds for services to stabilize..."
sleep 30

# Step 6: Show status
echo ""
echo "Step 6: Service status:"
docker-compose -f docker-compose.ec2.yml ps

# Step 7: Check health of key services
echo ""
echo "Step 7: Checking API Gateway health..."
curl -s http://localhost/health || echo "API Gateway not yet responding (this is normal during startup)"

echo ""
echo "=========================================="
echo "Restart completed!"
echo "=========================================="
echo ""
echo "Frontend accessible at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):80"
echo "API Gateway at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):80"
echo ""
echo "To view logs: docker-compose -f docker-compose.ec2.yml logs -f {service-name}"
echo "To check specific service: docker-compose -f docker-compose.ec2.yml logs {service-name}"
