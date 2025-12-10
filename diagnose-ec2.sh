#!/bin/bash
# Diagnostic script to verify all services are healthy and accessible

echo "=========================================="
echo "EC2 Deployment Diagnostic Check"
echo "=========================================="

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo ""
echo "EC2 Public IP: $PUBLIC_IP"

# Step 1: Check Docker Compose status
echo ""
echo "Step 1: Docker Compose Container Status"
echo "========================================"
docker-compose -f ~/aygo-reporter/docker-compose.ec2.yml ps

# Step 2: Check individual service health
echo ""
echo "Step 2: Service Health Checks"
echo "=============================="

echo ""
echo "API Gateway (Port 80):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/health || echo "Not responding"

echo ""
echo "Auth Service (Port 2081):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:2081/api/auth/health || echo "Not responding"

echo ""
echo "Data Service (Port 2082):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:2082/api/data/health || echo "Not responding"

echo ""
echo "Upload Service (Port 2083):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:2083/api/upload/health || echo "Not responding"

echo ""
echo "Report Service (Port 2084):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:2084/api/reports/health || echo "Not responding"

# Step 3: Check database connectivity
echo ""
echo "Step 3: Database Connectivity"
echo "============================="

echo ""
echo "PostgreSQL (Port 5432):"
docker exec aygo-reporter-postgres pg_isready -U postgres || echo "PostgreSQL not responding"

echo ""
echo "MongoDB (Port 27017):"
docker exec aygo-reporter-mongodb mongosh --eval "db.adminCommand('ping')" --quiet || echo "MongoDB not responding"

echo ""
echo "Redis (Port 6379):"
docker exec aygo-reporter-redis redis-cli ping || echo "Redis not responding"

# Step 4: View docker images to confirm they're from Hub
echo ""
echo "Step 4: Docker Images in Use"
echo "============================="
docker images | grep arleygf

# Step 5: Check logs for errors
echo ""
echo "Step 5: Recent Error Logs (if any)"
echo "================================="
echo ""
echo "Auth Service Logs (last 10 lines):"
docker-compose -f ~/aygo-reporter/docker-compose.ec2.yml logs --tail=10 auth-service | grep -i error || echo "No errors found"

echo ""
echo "=========================================="
echo "Diagnostic check completed!"
echo "=========================================="
echo ""
echo "Accessible URLs:"
echo "  Frontend:     http://$PUBLIC_IP"
echo "  API Gateway:  http://$PUBLIC_IP"
echo "  Auth Service: http://$PUBLIC_IP:2081"
echo "  Data Service: http://$PUBLIC_IP:2082"
echo "  Upload Service: http://$PUBLIC_IP:2083"
echo "  Report Service: http://$PUBLIC_IP:2084"
