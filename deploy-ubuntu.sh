#!/bin/bash

################################################################################
# Bifrostvault Deployment Script for Ubuntu
# 
# This script automates the deployment of Bifrostvault on Ubuntu 20.04+ servers.
# It installs all required dependencies, configures the database, and sets up
# the application for production use.
#
# Usage: sudo ./deploy-ubuntu.sh
#
# Requirements:
# - Ubuntu 20.04 or later
# - Root or sudo access
# - Internet connection
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="bifrostvault"
APP_DIR="/opt/bifrostvault"
APP_USER="bifrost"
NODE_VERSION="22"
MYSQL_VERSION="8.0"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║                    BIFROSTVAULT DEPLOYMENT                     ║"
    echo "║            Secure Password Manager with YubiKey Bio            ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

check_ubuntu() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot detect OS version"
        exit 1
    fi
    
    source /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        log_error "This script is designed for Ubuntu only"
        exit 1
    fi
    
    log_info "Detected Ubuntu $VERSION_ID"
}

################################################################################
# Installation Functions
################################################################################

update_system() {
    log_info "Updating system packages..."
    apt-get update -qq
    apt-get upgrade -y -qq
    apt-get install -y -qq \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    log_info "System updated successfully"
}

install_nodejs() {
    log_info "Installing Node.js ${NODE_VERSION}..."
    
    # Remove old Node.js if exists
    apt-get remove -y nodejs npm || true
    
    # Install Node.js from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    NODE_VER=$(node --version)
    NPM_VER=$(npm --version)
    log_info "Node.js ${NODE_VER} installed"
    log_info "npm ${NPM_VER} installed"
}

install_pnpm() {
    log_info "Installing pnpm..."
    npm install -g pnpm
    PNPM_VER=$(pnpm --version)
    log_info "pnpm ${PNPM_VER} installed"
}

install_mysql() {
    log_info "Installing MySQL ${MYSQL_VERSION}..."
    
    # Check if MySQL is already installed
    if command -v mysql &> /dev/null; then
        log_warn "MySQL is already installed"
        return
    fi
    
    # Install MySQL server
    apt-get install -y mysql-server
    
    # Start MySQL service
    systemctl start mysql
    systemctl enable mysql
    
    log_info "MySQL ${MYSQL_VERSION} installed and started"
}

configure_mysql() {
    log_info "Configuring MySQL database..."
    
    # Prompt for database credentials
    read -p "Enter MySQL root password (leave empty for no password): " MYSQL_ROOT_PASS
    read -p "Enter database name [bifrostvault]: " DB_NAME
    DB_NAME=${DB_NAME:-bifrostvault}
    read -p "Enter database user [bifrost]: " DB_USER
    DB_USER=${DB_USER:-bifrost}
    read -sp "Enter database password: " DB_PASS
    echo
    
    # Create database and user
    if [[ -z "$MYSQL_ROOT_PASS" ]]; then
        mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
        mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
        mysql -e "FLUSH PRIVILEGES;"
    else
        mysql -u root -p"${MYSQL_ROOT_PASS}" -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        mysql -u root -p"${MYSQL_ROOT_PASS}" -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
        mysql -u root -p"${MYSQL_ROOT_PASS}" -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
        mysql -u root -p"${MYSQL_ROOT_PASS}" -e "FLUSH PRIVILEGES;"
    fi
    
    log_info "Database ${DB_NAME} created successfully"
    
    # Store credentials for later use
    export DB_NAME DB_USER DB_PASS
}

install_nginx() {
    log_info "Installing Nginx..."
    
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
    
    log_info "Nginx installed and started"
}

install_certbot() {
    log_info "Installing Certbot for SSL certificates..."
    
    apt-get install -y certbot python3-certbot-nginx
    
    log_info "Certbot installed"
}

create_app_user() {
    log_info "Creating application user..."
    
    if id "$APP_USER" &>/dev/null; then
        log_warn "User $APP_USER already exists"
    else
        useradd -r -s /bin/bash -d "$APP_DIR" -m "$APP_USER"
        log_info "User $APP_USER created"
    fi
}

clone_repository() {
    log_info "Cloning Bifrostvault repository..."
    
    if [[ -d "$APP_DIR" ]]; then
        log_warn "Directory $APP_DIR already exists"
        read -p "Remove and re-clone? (y/N): " CONFIRM
        if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
            rm -rf "$APP_DIR"
        else
            log_info "Using existing directory"
            return
        fi
    fi
    
    git clone https://github.com/sir-william/Bifrostvault.git "$APP_DIR"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    
    log_info "Repository cloned to $APP_DIR"
}

install_dependencies() {
    log_info "Installing application dependencies..."
    
    cd "$APP_DIR"
    sudo -u "$APP_USER" pnpm install
    
    log_info "Dependencies installed"
}

configure_environment() {
    log_info "Configuring environment variables..."
    
    # Prompt for configuration
    read -p "Enter domain name (e.g., bifrostvault.example.com): " DOMAIN
    read -p "Enter OAuth Client ID: " OAUTH_CLIENT_ID
    read -sp "Enter OAuth Client Secret: " OAUTH_CLIENT_SECRET
    echo
    
    # Create .env file
    cat > "$APP_DIR/.env" <<EOF
# Database Configuration
DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}

# WebAuthn Configuration
WEBAUTHN_RP_ID=${DOMAIN}
WEBAUTHN_ORIGIN=https://${DOMAIN}

# OAuth Configuration
OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}
OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}
OAUTH_REDIRECT_URI=https://${DOMAIN}/auth/callback

# Environment
NODE_ENV=production
PORT=3000
EOF
    
    chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    
    log_info "Environment configured"
    
    # Store domain for later use
    export DOMAIN
}

setup_database() {
    log_info "Setting up database schema..."
    
    cd "$APP_DIR"
    sudo -u "$APP_USER" pnpm db:push
    
    log_info "Database schema created"
}

build_application() {
    log_info "Building application..."
    
    cd "$APP_DIR"
    sudo -u "$APP_USER" pnpm build
    
    log_info "Application built successfully"
}

create_systemd_service() {
    log_info "Creating systemd service..."
    
    cat > /etc/systemd/system/bifrostvault.service <<EOF
[Unit]
Description=Bifrostvault Password Manager
After=network.target mysql.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node ${APP_DIR}/dist/server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bifrostvault

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable bifrostvault
    
    log_info "Systemd service created"
}

configure_nginx() {
    log_info "Configuring Nginx..."
    
    cat > /etc/nginx/sites-available/bifrostvault <<EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    # SSL certificates (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/bifrostvault /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    
    log_info "Nginx configured"
}

setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    read -p "Do you want to obtain SSL certificate now? (y/N): " SETUP_SSL
    if [[ "$SETUP_SSL" =~ ^[Yy]$ ]]; then
        read -p "Enter email for Let's Encrypt notifications: " EMAIL
        certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"
        log_info "SSL certificate obtained"
    else
        log_warn "Skipping SSL setup. You can run 'certbot --nginx -d $DOMAIN' later"
    fi
}

configure_firewall() {
    log_info "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        log_info "Firewall configured"
    else
        log_warn "UFW not found. Please configure firewall manually"
    fi
}

start_services() {
    log_info "Starting services..."
    
    systemctl restart bifrostvault
    systemctl restart nginx
    
    log_info "Services started"
}

print_summary() {
    echo
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║              BIFROSTVAULT DEPLOYMENT COMPLETE!                 ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
    log_info "Application URL: https://${DOMAIN}"
    log_info "Application directory: ${APP_DIR}"
    log_info "Application user: ${APP_USER}"
    log_info "Database name: ${DB_NAME}"
    echo
    log_info "Useful commands:"
    echo "  - Check status: sudo systemctl status bifrostvault"
    echo "  - View logs: sudo journalctl -u bifrostvault -f"
    echo "  - Restart app: sudo systemctl restart bifrostvault"
    echo "  - Update app: cd ${APP_DIR} && git pull && pnpm install && pnpm build && sudo systemctl restart bifrostvault"
    echo
    log_warn "Next steps:"
    echo "  1. Configure OAuth provider with redirect URI: https://${DOMAIN}/auth/callback"
    echo "  2. Register your YubiKey at: https://${DOMAIN}/setup-yubikey"
    echo "  3. Start using Bifrostvault!"
    echo
}

################################################################################
# Main Installation Flow
################################################################################

main() {
    print_header
    
    log_info "Starting Bifrostvault deployment..."
    echo
    
    # Pre-flight checks
    check_root
    check_ubuntu
    
    # System setup
    update_system
    install_nodejs
    install_pnpm
    install_mysql
    configure_mysql
    install_nginx
    install_certbot
    
    # Application setup
    create_app_user
    clone_repository
    install_dependencies
    configure_environment
    setup_database
    build_application
    
    # Service setup
    create_systemd_service
    configure_nginx
    setup_ssl
    configure_firewall
    start_services
    
    # Finish
    print_summary
}

################################################################################
# Script Entry Point
################################################################################

# Trap errors
trap 'log_error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
