#!/bin/bash

################################################################################
# Quick Install Script for vagrant-libvirt Plugin
# 
# This script installs the vagrant-libvirt plugin and its dependencies
# for testing Bifrostvault with KVM/libvirt.
#
# Usage:
#   chmod +x quick-install-libvirt.sh
#   ./quick-install-libvirt.sh
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}║           VAGRANT-LIBVIRT PLUGIN INSTALLATION                  ║${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    echo -e "${RED}[ERROR]${NC} This script should NOT be run as root"
    echo -e "${GREEN}[INFO]${NC} Run as regular user: ./quick-install-libvirt.sh"
    exit 1
fi

# Detect distribution
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    DISTRO="$ID"
else
    DISTRO="unknown"
fi

echo -e "${GREEN}[INFO]${NC} Detected distribution: $DISTRO"
echo

# Install dependencies based on distribution
case "$DISTRO" in
    ubuntu|debian)
        echo -e "${BLUE}[STEP]${NC} Installing dependencies for Ubuntu/Debian..."
        sudo apt-get update
        sudo apt-get install -y \
            build-essential \
            libvirt-dev \
            ruby-dev \
            libguestfs-tools \
            qemu-kvm \
            libvirt-daemon-system \
            libvirt-clients \
            bridge-utils
        ;;
    fedora|rhel|centos|rocky|almalinux)
        echo -e "${BLUE}[STEP]${NC} Installing dependencies for Fedora/RHEL..."
        sudo dnf install -y \
            gcc \
            libvirt-devel \
            ruby-devel \
            libguestfs-tools-c \
            qemu-kvm \
            libvirt
        ;;
    arch|manjaro)
        echo -e "${BLUE}[STEP]${NC} Installing dependencies for Arch Linux..."
        sudo pacman -S --noconfirm \
            base-devel \
            libvirt \
            ruby \
            libguestfs \
            qemu
        ;;
    *)
        echo -e "${YELLOW}[WARN]${NC} Unknown distribution, attempting generic installation..."
        ;;
esac

# Configure libvirt
echo -e "${BLUE}[STEP]${NC} Configuring libvirt..."
sudo usermod -aG libvirt $USER
sudo usermod -aG kvm $USER

# Start libvirt
sudo systemctl start libvirtd 2>/dev/null || true
sudo systemctl enable libvirtd 2>/dev/null || true

# Install vagrant-libvirt plugin
echo -e "${BLUE}[STEP]${NC} Installing vagrant-libvirt plugin..."
vagrant plugin install vagrant-libvirt

# Verify installation
echo
echo -e "${BLUE}[STEP]${NC} Verifying installation..."
if vagrant plugin list | grep -q vagrant-libvirt; then
    echo -e "${GREEN}[SUCCESS]${NC} vagrant-libvirt plugin installed successfully!"
    vagrant plugin list | grep vagrant-libvirt
else
    echo -e "${RED}[ERROR]${NC} vagrant-libvirt plugin installation failed"
    exit 1
fi

echo
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║         VAGRANT-LIBVIRT PLUGIN INSTALLED!                      ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo

echo -e "${YELLOW}[IMPORTANT]${NC} You MUST log out and log back in for group changes to take effect!"
echo
echo -e "${GREEN}[INFO]${NC} After logging back in, run:"
echo "  cd Bifrostvault"
echo "  vagrant up --provider=libvirt"
echo

echo -e "${GREEN}[INFO]${NC} Or run this to apply group changes without logging out:"
echo "  newgrp libvirt"
echo
