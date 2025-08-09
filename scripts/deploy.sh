#!/bin/bash

# LBS IoT Project Deployment Script
# This script deploys the entire LBS IoT system using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are available"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f env.example ]; then
            cp env.example .env
            print_warning "Please update the .env file with your actual configuration values"
            print_warning "Especially update GOOGLE_MAPS_API_KEY and JWT_SECRET"
            exit 1
        else
            print_error "env.example file not found. Please create a .env file manually."
            exit 1
        fi
    fi
    print_status ".env file found"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p logs
    mkdir -p uploads
    mkdir -p config/nginx/ssl
    mkdir -p config/postgres
    mkdir -p config/prometheus
    mkdir -p config/grafana/provisioning
    print_status "Directories created successfully"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Pull latest images
    docker-compose pull
    
    # Build services
    docker-compose build --no-cache
    
    # Start services
    docker-compose up -d
    
    print_status "Services deployed successfully"
}

# Check service health
check_health() {
    print_status "Checking service health..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check if all containers are running
    if docker-compose ps | grep -q "Exit"; then
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
    
    print_status "All services are running"
}

# Show service status
show_status() {
    print_status "Service Status:"
    docker-compose ps
    
    echo ""
    print_status "Service URLs:"
    echo "Frontend: http://localhost"
    echo "Backend API: http://localhost:3000"
    echo "Management Platform: http://localhost:8080"
    echo "RabbitMQ Management: http://localhost:15672"
    echo "Prometheus: http://localhost:9090"
    echo "Grafana: http://localhost:3001"
    echo ""
    print_status "Default credentials:"
    echo "RabbitMQ: lbsiot / lbsiot_password"
    echo "Grafana: admin / admin"
}

# Main deployment function
main() {
    print_status "Starting LBS IoT deployment..."
    
    check_docker
    check_env_file
    create_directories
    deploy_services
    check_health
    show_status
    
    print_status "Deployment completed successfully!"
    print_status "You can now access the LBS IoT system at http://localhost"
}

# Handle script arguments
case "${1:-}" in
    "stop")
        print_status "Stopping services..."
        docker-compose down
        print_status "Services stopped"
        ;;
    "restart")
        print_status "Restarting services..."
        docker-compose restart
        print_status "Services restarted"
        ;;
    "logs")
        print_status "Showing logs..."
        docker-compose logs -f
        ;;
    "clean")
        print_warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            print_status "Cleaning up..."
            docker-compose down -v --remove-orphans
            docker system prune -f
            print_status "Cleanup completed"
        else
            print_status "Cleanup cancelled"
        fi
        ;;
    "update")
        print_status "Updating services..."
        docker-compose pull
        docker-compose up -d --force-recreate
        print_status "Services updated"
        ;;
    *)
        main
        ;;
esac 