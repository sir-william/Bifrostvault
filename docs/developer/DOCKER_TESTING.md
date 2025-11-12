# Docker Testing Guide for Bifrostvault

This guide covers using Docker for backend and database testing. **Note**: Docker is **NOT recommended** for YubiKey testing due to USB passthrough limitations. Use [native development](./LOCAL_TESTING_YUBIKEY.md) for YubiKey testing.

---

## ⚠️ Important Limitations

### Why Not Docker for YubiKey Testing?

**USB Passthrough Issues**:
- Docker containers have limited USB device access
- WebAuthn requires direct USB communication with authenticators
- Virtualization layers add latency that breaks FIDO2 timing
- USB passthrough is unreliable and OS-dependent

**Browser Security Requirements**:
- WebAuthn requires secure context (HTTPS or localhost)
- Browser must have direct access to USB devices
- Container networking adds complexity

**Recommendation**: Use Docker for backend/database testing only. For YubiKey testing, use native development as described in [LOCAL_TESTING_YUBIKEY.md](./LOCAL_TESTING_YUBIKEY.md).

---

## 🐳 Docker Setup (Backend Testing)

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### Installation

#### macOS
```bash
# Using Homebrew
brew install --cask docker

# Or download Docker Desktop
# https://www.docker.com/products/docker-desktop
```

#### Ubuntu/Debian
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Windows
```powershell
# Download and install Docker Desktop
# https://www.docker.com/products/docker-desktop
```

---

## 🚀 Quick Start

### Start Services

```bash
# Start all services (database + app)
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v
```

### Rebuild After Changes

```bash
# Rebuild and restart
docker-compose up -d --build
```

---

## 📋 Available Services

### MySQL Database
- **Container**: `bifrostvault-db`
- **Port**: `3306`
- **Database**: `bifrostvault`
- **User**: `bifrost`
- **Password**: `vaultpass`
- **Root Password**: `rootpass`

### Application
- **Container**: `bifrostvault-app`
- **Port**: `3000`
- **URL**: `http://localhost:3000`
- **Mode**: Development with hot reload

---

## 🔧 Configuration

### Environment Variables

Create `.env.docker` file:

```bash
# Database Configuration
DATABASE_URL=mysql://bifrost:vaultpass@db:3306/bifrostvault

# WebAuthn Configuration
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# OAuth Configuration (optional)
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Environment
NODE_ENV=development
PORT=3000
```

Update `docker-compose.yml` to use it:

```yaml
services:
  app:
    env_file:
      - .env.docker
```

---

## 🧪 Testing Scenarios

### 1. Database Testing

Test database operations without YubiKey:

```bash
# Start only database
docker-compose up -d db

# Connect to database
docker exec -it bifrostvault-db mysql -u bifrost -pvaultpass bifrostvault

# Run migrations
docker-compose exec app pnpm db:push

# Seed test data
docker-compose exec app pnpm db:seed
```

### 2. API Testing

Test backend APIs without frontend:

```bash
# Start services
docker-compose up -d

# Test health endpoint
curl http://localhost:3000/health

# Test tRPC endpoints
curl -X POST http://localhost:3000/trpc/vault.list \
  -H "Content-Type: application/json" \
  -d '{"json":{}}'
```

### 3. E2E Tests (Without YubiKey)

Run E2E tests with WebAuthn mocking:

```bash
# Install Playwright in container
docker-compose exec app pnpm playwright install

# Run E2E tests
docker-compose exec app pnpm test:e2e
```

**Note**: These tests use WebAuthn mocks and don't require physical YubiKey.

---

## 🔍 Debugging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 app
```

### Access Container Shell

```bash
# Application container
docker-compose exec app sh

# Database container
docker-compose exec db bash
```

### Inspect Database

```bash
# MySQL shell
docker-compose exec db mysql -u bifrost -pvaultpass bifrostvault

# Show tables
docker-compose exec db mysql -u bifrost -pvaultpass -e "SHOW TABLES;" bifrostvault

# Describe table
docker-compose exec db mysql -u bifrost -pvaultpass -e "DESCRIBE users;" bifrostvault
```

### Check Container Resources

```bash
# Resource usage
docker stats

# Disk usage
docker system df

# Container details
docker inspect bifrostvault-app
```

---

## 🐛 Common Issues

### Issue: Port Already in Use

**Symptoms**: `Error: bind: address already in use`

**Solutions**:

```bash
# Check what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Issue: Database Connection Failed

**Symptoms**: `Error: connect ECONNREFUSED`

**Solutions**:

```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Wait for database to be ready
docker-compose up -d db
sleep 10
docker-compose up -d app
```

### Issue: Permission Denied

**Symptoms**: `Error: EACCES: permission denied`

**Solutions**:

```bash
# Fix ownership (Linux)
sudo chown -R $USER:$USER .

# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: Out of Disk Space

**Symptoms**: `Error: no space left on device`

**Solutions**:

```bash
# Clean up unused images
docker image prune -a

# Clean up unused volumes
docker volume prune

# Clean up everything
docker system prune -a --volumes
```

---

## 📊 Performance Optimization

### Use Volume Mounts Efficiently

```yaml
services:
  app:
    volumes:
      - .:/app
      - /app/node_modules  # Don't sync node_modules
      - /app/.next  # Don't sync build cache
```

### Limit Resource Usage

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Use BuildKit

```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build with BuildKit
docker-compose build
```

---

## 🚀 Production Deployment

### Build Production Image

```bash
# Build production image
docker build -t bifrostvault:latest .

# Run production container
docker run -d \
  --name bifrostvault \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://user:pass@host:3306/db \
  -e WEBAUTHN_RP_ID=yourdomain.com \
  -e WEBAUTHN_ORIGIN=https://yourdomain.com \
  bifrostvault:latest
```

### Docker Compose Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: bifrostvault
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - bifrostvault-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    depends_on:
      - db
    environment:
      DATABASE_URL: mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@db:3306/bifrostvault
      WEBAUTHN_RP_ID: ${DOMAIN}
      WEBAUTHN_ORIGIN: https://${DOMAIN}
      NODE_ENV: production
    ports:
      - "3000:3000"
    networks:
      - bifrostvault-network

  nginx:
    image: nginx:alpine
    restart: always
    depends_on:
      - app
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    networks:
      - bifrostvault-network

networks:
  bifrostvault-network:
    driver: bridge

volumes:
  mysql_data:
```

Deploy:

```bash
# Create .env.prod file with secrets
# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔐 Security Best Practices

### Don't Commit Secrets

```bash
# Add to .gitignore
echo ".env.docker" >> .gitignore
echo ".env.prod" >> .gitignore
```

### Use Docker Secrets

```yaml
services:
  app:
    secrets:
      - db_password
      - oauth_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  oauth_secret:
    file: ./secrets/oauth_secret.txt
```

### Run as Non-Root User

```dockerfile
# In Dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

### Scan for Vulnerabilities

```bash
# Scan image
docker scan bifrostvault:latest

# Use Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image bifrostvault:latest
```

---

## 📚 Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose Reference**: https://docs.docker.com/compose/
- **Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **Bifrostvault Docs**: https://github.com/sir-william/Bifrostvault/tree/main/docs

---

## 🆘 When to Use Docker vs Native

### Use Docker For:
- ✅ Backend API testing
- ✅ Database testing
- ✅ CI/CD pipelines
- ✅ Team development environment consistency
- ✅ E2E tests with WebAuthn mocks

### Use Native Development For:
- ✅ YubiKey testing (REQUIRED)
- ✅ WebAuthn with physical authenticators
- ✅ Biometric authentication testing
- ✅ USB device interaction
- ✅ Faster hot reload

---

**Recommendation**: Use Docker for backend testing, native development for YubiKey testing. See [LOCAL_TESTING_YUBIKEY.md](./LOCAL_TESTING_YUBIKEY.md) for YubiKey testing guide.

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0
