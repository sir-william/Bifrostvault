#!/bin/bash

################################################################################
# Bifrostvault Vagrant Provisioning Script
# 
# This script fully automates the setup of a Bifrostvault development
# environment inside a Vagrant VM with YubiKey support.
#
# Features:
# - Complete system update and dependency installation
# - Node.js 22, pnpm, MySQL 8.0 setup
# - USB device detection and configuration
# - YubiKey-specific udev rules
# - Bifrostvault application setup
# - Database initialization
# - Development tools installation
#
# Author: Bifrostvault Team
# Version: 1.0.0
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Configuration
readonly NODE_VERSION="22"
readonly MYSQL_ROOT_PASSWORD="rootpass"
readonly MYSQL_DATABASE="bifrostvault"
readonly MYSQL_USER="bifrost"
readonly MYSQL_PASSWORD="vaultpass"
readonly APP_DIR="/vagrant"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║           BIFROSTVAULT VAGRANT PROVISIONING                    ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] [INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] [WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] [STEP]${NC} $1"
}

log_success() {
    echo -e "${MAGENTA}[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $1"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        log_success "$1 is already installed"
        return 0
    else
        return 1
    fi
}

################################################################################
# System Setup
################################################################################

update_system() {
    log_step "Updating system packages..."
    
    export DEBIAN_FRONTEND=noninteractive
    
    sudo apt-get update -qq
    sudo apt-get upgrade -y -qq
    
    log_info "Installing essential packages..."
    sudo apt-get install -y -qq \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        usbutils \
        pciutils \
        libusb-1.0-0 \
        libusb-1.0-0-dev \
        libpcsclite1 \
        pcscd \
        pcsc-tools \
        libnss3-tools \
        vim \
        htop \
        net-tools \
        jq
    
    log_success "System updated successfully"
}

################################################################################
# USB and YubiKey Setup
################################################################################

setup_usb_support() {
    log_step "Setting up USB support for YubiKey..."
    
    # Add user to plugdev group for USB access
    sudo usermod -aG plugdev vagrant
    
    # Install udev rules for YubiKey
    log_info "Installing YubiKey udev rules..."
    
    sudo tee /etc/udev/rules.d/70-yubikey.rules > /dev/null <<'EOF'
# Yubico YubiKey
# YubiKey 5 Series
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", ATTR{idProduct}=="0407", MODE="0660", GROUP="plugdev", TAG+="uaccess"
# YubiKey 5 NFC
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", ATTR{idProduct}=="0405", MODE="0660", GROUP="plugdev", TAG+="uaccess"
# YubiKey 5C
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", ATTR{idProduct}=="0406", MODE="0660", GROUP="plugdev", TAG+="uaccess"
# YubiKey 5C NFC
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", ATTR{idProduct}=="0408", MODE="0660", GROUP="plugdev", TAG+="uaccess"
# YubiKey Bio - FIDO Edition
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", ATTR{idProduct}=="0402", MODE="0660", GROUP="plugdev", TAG+="uaccess"
# Security Key by Yubico
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", ATTR{idProduct}=="0120", MODE="0660", GROUP="plugdev", TAG+="uaccess"
# Security Key C NFC
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", ATTR{idProduct}=="0407", MODE="0660", GROUP="plugdev", TAG+="uaccess"
# Security Key NFC
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", ATTR{idProduct}=="0406", MODE="0660", GROUP="plugdev", TAG+="uaccess"

# All Yubico devices (catch-all)
SUBSYSTEM=="usb", ATTR{idVendor}=="1050", MODE="0660", GROUP="plugdev", TAG+="uaccess"
EOF
    
    # Reload udev rules
    sudo udevadm control --reload-rules
    sudo udevadm trigger
    
    # Start pcscd service for smart card support
    log_info "Starting PC/SC daemon for smart card support..."
    sudo systemctl enable pcscd
    sudo systemctl start pcscd
    
    log_success "USB support configured"
}

test_usb_detection() {
    log_step "Testing USB device detection..."
    
    log_info "Available USB devices:"
    lsusb || log_warn "lsusb command failed"
    
    log_info "Checking for YubiKey..."
    if lsusb | grep -i yubico > /dev/null; then
        log_success "YubiKey detected!"
        lsusb | grep -i yubico
    else
        log_warn "YubiKey not detected. Please insert YubiKey and run: lsusb | grep -i yubico"
    fi
    
    log_info "USB device permissions:"
    ls -la /dev/bus/usb/*/* 2>/dev/null | head -n 5 || log_warn "Cannot list USB devices"
}

################################################################################
# Node.js and pnpm Installation
################################################################################

install_nodejs() {
    log_step "Installing Node.js ${NODE_VERSION}..."
    
    if check_command node; then
        local current_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$current_version" == "$NODE_VERSION" ]]; then
            log_info "Node.js ${NODE_VERSION} already installed"
            return 0
        fi
    fi
    
    log_info "Removing old Node.js versions..."
    sudo apt-get remove -y nodejs npm 2>/dev/null || true
    
    log_info "Adding NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    
    log_info "Installing Node.js..."
    sudo apt-get install -y nodejs
    
    local node_ver=$(node --version)
    local npm_ver=$(npm --version)
    
    log_success "Node.js ${node_ver} installed"
    log_success "npm ${npm_ver} installed"
}

install_pnpm() {
    log_step "Installing pnpm..."
    
    if check_command pnpm; then
        log_info "pnpm already installed"
        return 0
    fi
    
    sudo npm install -g pnpm
    
    local pnpm_ver=$(pnpm --version)
    log_success "pnpm ${pnpm_ver} installed"
}

################################################################################
# MySQL Installation and Configuration
################################################################################

install_mysql() {
    log_step "Installing MySQL 8.0..."
    
    if check_command mysql; then
        log_info "MySQL already installed"
        return 0
    fi
    
    export DEBIAN_FRONTEND=noninteractive
    
    log_info "Pre-configuring MySQL password..."
    sudo debconf-set-selections <<< "mysql-server mysql-server/root_password password ${MYSQL_ROOT_PASSWORD}"
    sudo debconf-set-selections <<< "mysql-server mysql-server/root_password_again password ${MYSQL_ROOT_PASSWORD}"
    
    log_info "Installing MySQL server..."
    sudo apt-get install -y mysql-server
    
    log_info "Starting MySQL service..."
    sudo systemctl start mysql
    sudo systemctl enable mysql
    
    log_success "MySQL installed and started"
}

configure_mysql() {
    log_step "Configuring MySQL database..."
    
    log_info "Creating database and user..."
    
    # Create database and user
    sudo mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    log_success "Database ${MYSQL_DATABASE} created"
    log_info "Database: ${MYSQL_DATABASE}"
    log_info "User: ${MYSQL_USER}"
    log_info "Password: ${MYSQL_PASSWORD}"
    
    # Configure MySQL to listen on all interfaces (for host access)
    log_info "Configuring MySQL for remote access..."
    sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
    
    # Allow remote access for development
    sudo mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
FLUSH PRIVILEGES;
EOF
    
    sudo systemctl restart mysql
    
    log_success "MySQL configured for development"
}

################################################################################
# Application Setup
################################################################################

setup_application() {
    log_step "Setting up Bifrostvault application..."
    
    cd "${APP_DIR}"
    
    # Install dependencies
    log_info "Installing application dependencies..."
    if [[ -f "package.json" ]]; then
        pnpm install
        log_success "Dependencies installed"
    else
        log_warn "package.json not found, skipping dependency installation"
    fi
    
    # Create .env file if it doesn't exist
    if [[ ! -f ".env" ]]; then
        log_info "Creating .env file..."
        cat > .env <<EOF
# Database Configuration
DATABASE_URL=mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@localhost:3306/${MYSQL_DATABASE}

# WebAuthn Configuration
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# OAuth Configuration (optional for development)
OAUTH_CLIENT_ID=dev_client_id
OAUTH_CLIENT_SECRET=dev_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Environment
NODE_ENV=development
PORT=3000
EOF
        log_success ".env file created"
    else
        log_info ".env file already exists"
    fi
    
    # Initialize database schema
    log_info "Initializing database schema..."
    if [[ -f "package.json" ]] && grep -q "db:push" package.json; then
        pnpm db:push || log_warn "Database initialization failed (may need to run manually)"
        log_success "Database schema initialized"
    else
        log_warn "db:push script not found, skipping database initialization"
    fi
}

################################################################################
# Development Tools
################################################################################

install_dev_tools() {
    log_step "Installing development tools..."
    
    # Install Playwright browsers for E2E testing
    log_info "Installing Playwright browsers..."
    cd "${APP_DIR}"
    if [[ -f "package.json" ]] && grep -q "@playwright/test" package.json; then
        pnpm playwright install --with-deps chromium || log_warn "Playwright installation failed"
        log_success "Playwright browsers installed"
    else
        log_warn "Playwright not found, skipping browser installation"
    fi
    
    # Install useful CLI tools
    log_info "Installing additional CLI tools..."
    sudo npm install -g \
        pm2 \
        nodemon \
        typescript \
        ts-node
    
    log_success "Development tools installed"
}

################################################################################
# Firewall and Security
################################################################################

configure_firewall() {
    log_step "Configuring firewall..."
    
    if ! check_command ufw; then
        log_info "Installing UFW..."
        sudo apt-get install -y ufw
    fi
    
    log_info "Configuring firewall rules..."
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 3000/tcp  # Application
    sudo ufw allow 3306/tcp  # MySQL (for host access)
    
    log_success "Firewall configured"
}

################################################################################
# Helper Scripts
################################################################################

create_helper_scripts() {
    log_step "Creating helper scripts..."
    
    # Create yubikey-test script
    cat > /home/vagrant/yubikey-test.sh <<'EOF'
#!/bin/bash
# YubiKey Detection Test Script

echo "=== YubiKey Detection Test ==="
echo

echo "1. USB Devices:"
lsusb

echo
echo "2. YubiKey Devices:"
lsusb | grep -i yubico || echo "No YubiKey detected"

echo
echo "3. USB Device Details:"
lsusb -v 2>/dev/null | grep -A 10 -i yubico || echo "No detailed info available"

echo
echo "4. PC/SC Daemon Status:"
systemctl status pcscd --no-pager

echo
echo "5. Smart Card Readers:"
pcsc_scan -n 2>/dev/null || echo "No smart card readers detected"

echo
echo "=== Test Complete ==="
EOF
    
    chmod +x /home/vagrant/yubikey-test.sh
    
    # Create start-dev script
    cat > /home/vagrant/start-dev.sh <<'EOF'
#!/bin/bash
# Start Bifrostvault Development Server

cd /vagrant
echo "Starting Bifrostvault development server..."
pnpm dev
EOF
    
    chmod +x /home/vagrant/start-dev.sh
    
    # Create db-reset script
    cat > /home/vagrant/db-reset.sh <<'EOF'
#!/bin/bash
# Reset Database

cd /vagrant
echo "Resetting database..."
pnpm db:push --force
echo "Database reset complete"
EOF
    
    chmod +x /home/vagrant/db-reset.sh
    
    log_success "Helper scripts created in /home/vagrant/"
}

################################################################################
# Completion and Summary
################################################################################

print_summary() {
    echo
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║         BIFROSTVAULT PROVISIONING COMPLETE!                    ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    log_info "System Information:"
    echo "  - OS: $(lsb_release -ds)"
    echo "  - Kernel: $(uname -r)"
    echo "  - Node.js: $(node --version)"
    echo "  - npm: $(npm --version)"
    echo "  - pnpm: $(pnpm --version)"
    echo "  - MySQL: $(mysql --version | awk '{print $5}' | cut -d',' -f1)"
    echo
    
    log_info "Database Configuration:"
    echo "  - Host: localhost"
    echo "  - Port: 3306"
    echo "  - Database: ${MYSQL_DATABASE}"
    echo "  - User: ${MYSQL_USER}"
    echo "  - Password: ${MYSQL_PASSWORD}"
    echo
    
    log_info "Application:"
    echo "  - Directory: ${APP_DIR}"
    echo "  - URL: http://localhost:3000"
    echo "  - URL: http://192.168.56.10:3000"
    echo
    
    log_info "Helper Scripts:"
    echo "  - ~/yubikey-test.sh    # Test YubiKey detection"
    echo "  - ~/start-dev.sh       # Start development server"
    echo "  - ~/db-reset.sh        # Reset database"
    echo
    
    log_info "Useful Commands:"
    echo "  - cd /vagrant          # Go to project directory"
    echo "  - pnpm dev             # Start development server"
    echo "  - pnpm test:e2e        # Run E2E tests"
    echo "  - pnpm db:push         # Update database schema"
    echo "  - lsusb | grep yubico  # Check YubiKey connection"
    echo
    
    log_info "YubiKey Testing:"
    echo "  1. Insert YubiKey into host machine"
    echo "  2. Run: lsusb | grep -i yubico"
    echo "  3. Run: ~/yubikey-test.sh"
    echo "  4. Open browser: http://localhost:3000"
    echo "  5. Register YubiKey in application"
    echo
    
    log_warn "Next Steps:"
    echo "  1. Start development server: cd /vagrant && pnpm dev"
    echo "  2. Open browser: http://localhost:3000"
    echo "  3. Insert YubiKey and test registration"
    echo
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header
    
    log_info "Starting provisioning at $(date)"
    log_info "Running as user: $(whoami)"
    echo
    
    # System setup
    update_system
    
    # USB and YubiKey support
    setup_usb_support
    test_usb_detection
    
    # Install Node.js and pnpm
    install_nodejs
    install_pnpm
    
    # Install and configure MySQL
    install_mysql
    configure_mysql
    
    # Setup application
    setup_application
    
    # Install development tools
    install_dev_tools
    
    # Configure firewall
    configure_firewall
    
    # Create helper scripts
    create_helper_scripts
    
    # Print summary
    print_summary
    
    log_success "Provisioning completed successfully at $(date)"
}

# Trap errors
trap 'log_error "Provisioning failed at line $LINENO"' ERR

# Run main function
main "$@"
