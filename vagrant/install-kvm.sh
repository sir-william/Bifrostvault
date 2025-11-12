#!/bin/bash

################################################################################
# KVM/libvirt Installation Script for Bifrostvault
# 
# This script automates the installation of KVM, libvirt, and Vagrant
# with vagrant-libvirt plugin for testing Bifrostvault with YubiKey.
#
# Supported distributions:
# - Ubuntu/Debian
# - Fedora/RHEL/CentOS
# - Arch Linux
#
# Usage:
#   chmod +x install-kvm.sh
#   ./install-kvm.sh
#
# Author: Bifrostvault Team
# Version: 1.0.0
################################################################################

set -e  # Exit on error

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║           KVM/LIBVIRT INSTALLATION FOR BIFROSTVAULT            ║"
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

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should NOT be run as root"
        log_info "Run as regular user: ./install-kvm.sh"
        exit 1
    fi
}

detect_distro() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        echo "$ID"
    else
        echo "unknown"
    fi
}

check_virtualization() {
    log_step "Checking CPU virtualization support..."
    
    if grep -E -q 'vmx|svm' /proc/cpuinfo; then
        log_info "CPU virtualization support detected"
        return 0
    else
        log_error "CPU virtualization not supported or not enabled in BIOS"
        log_warn "Enable VT-x (Intel) or AMD-V (AMD) in BIOS/UEFI settings"
        exit 1
    fi
}

################################################################################
# Installation Functions
################################################################################

install_ubuntu_debian() {
    log_step "Installing KVM/libvirt on Ubuntu/Debian..."
    
    # Update package list
    sudo apt-get update
    
    # Install KVM and libvirt
    sudo apt-get install -y \
        qemu-kvm \
        libvirt-daemon-system \
        libvirt-clients \
        bridge-utils \
        virt-manager \
        libvirt-dev \
        ruby-dev \
        libguestfs-tools \
        nfs-kernel-server
    
    # Install Vagrant
    if ! command -v vagrant &> /dev/null; then
        log_info "Installing Vagrant..."
        wget -q https://releases.hashicorp.com/vagrant/2.4.0/vagrant_2.4.0-1_amd64.deb
        sudo dpkg -i vagrant_2.4.0-1_amd64.deb
        rm vagrant_2.4.0-1_amd64.deb
    fi
    
    log_info "Ubuntu/Debian installation complete"
}

install_fedora_rhel() {
    log_step "Installing KVM/libvirt on Fedora/RHEL..."
    
    # Install virtualization group
    sudo dnf install -y @virtualization
    
    # Install additional packages
    sudo dnf install -y \
        libvirt-devel \
        ruby-devel \
        libguestfs-tools-c \
        nfs-utils
    
    # Install Vagrant
    if ! command -v vagrant &> /dev/null; then
        log_info "Installing Vagrant..."
        sudo dnf install -y vagrant
    fi
    
    log_info "Fedora/RHEL installation complete"
}

install_arch() {
    log_step "Installing KVM/libvirt on Arch Linux..."
    
    # Install packages
    sudo pacman -S --noconfirm \
        qemu \
        libvirt \
        virt-manager \
        bridge-utils \
        dnsmasq \
        libvirt \
        ruby \
        libguestfs \
        nfs-utils \
        vagrant
    
    log_info "Arch Linux installation complete"
}

configure_libvirt() {
    log_step "Configuring libvirt..."
    
    # Add user to libvirt and kvm groups
    sudo usermod -aG libvirt $USER
    sudo usermod -aG kvm $USER
    
    log_info "User $USER added to libvirt and kvm groups"
    
    # Start and enable libvirt
    sudo systemctl start libvirtd
    sudo systemctl enable libvirtd
    
    # Start default network
    sudo virsh net-start default 2>/dev/null || true
    sudo virsh net-autostart default 2>/dev/null || true
    
    log_info "libvirt service started and enabled"
}

install_vagrant_libvirt() {
    log_step "Installing vagrant-libvirt plugin..."
    
    # Install plugin
    vagrant plugin install vagrant-libvirt
    
    log_info "vagrant-libvirt plugin installed"
}

configure_nfs() {
    log_step "Configuring NFS for Vagrant synced folders..."
    
    # Start and enable NFS
    if command -v systemctl &> /dev/null; then
        sudo systemctl start nfs-server 2>/dev/null || sudo systemctl start nfs-kernel-server 2>/dev/null || true
        sudo systemctl enable nfs-server 2>/dev/null || sudo systemctl enable nfs-kernel-server 2>/dev/null || true
    fi
    
    log_info "NFS configured"
}

verify_installation() {
    log_step "Verifying installation..."
    
    # Check KVM module
    if lsmod | grep -q kvm; then
        log_info "✓ KVM module loaded"
    else
        log_warn "✗ KVM module not loaded"
    fi
    
    # Check libvirt
    if systemctl is-active --quiet libvirtd; then
        log_info "✓ libvirt service running"
    else
        log_warn "✗ libvirt service not running"
    fi
    
    # Check Vagrant
    if command -v vagrant &> /dev/null; then
        log_info "✓ Vagrant installed: $(vagrant --version)"
    else
        log_warn "✗ Vagrant not installed"
    fi
    
    # Check vagrant-libvirt plugin
    if vagrant plugin list | grep -q vagrant-libvirt; then
        log_info "✓ vagrant-libvirt plugin installed"
    else
        log_warn "✗ vagrant-libvirt plugin not installed"
    fi
    
    # Check /dev/kvm
    if [[ -c /dev/kvm ]]; then
        log_info "✓ /dev/kvm exists"
    else
        log_warn "✗ /dev/kvm not found"
    fi
}

print_summary() {
    echo
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║         KVM/LIBVIRT INSTALLATION COMPLETE!                     ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    log_info "Installation Summary:"
    echo "  ✓ KVM/QEMU installed"
    echo "  ✓ libvirt installed and configured"
    echo "  ✓ Vagrant installed"
    echo "  ✓ vagrant-libvirt plugin installed"
    echo "  ✓ User added to libvirt and kvm groups"
    echo "  ✓ NFS configured for synced folders"
    echo
    
    log_warn "IMPORTANT: Log out and log back in for group changes to take effect!"
    echo
    
    log_info "Next Steps:"
    echo "  1. Log out and log back in (or run: newgrp libvirt)"
    echo "  2. cd Bifrostvault"
    echo "  3. cp Vagrantfile.kvm Vagrantfile"
    echo "  4. cp .vagrantrc.kvm .vagrantrc"
    echo "  5. vagrant up --provider=libvirt"
    echo
    
    log_info "Verify Installation:"
    echo "  sudo kvm-ok                    # Check KVM support"
    echo "  virsh list --all               # List VMs"
    echo "  vagrant plugin list            # Check plugins"
    echo
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header
    
    check_root
    check_virtualization
    
    # Detect distribution
    DISTRO=$(detect_distro)
    log_info "Detected distribution: $DISTRO"
    
    # Install based on distribution
    case "$DISTRO" in
        ubuntu|debian)
            install_ubuntu_debian
            ;;
        fedora|rhel|centos|rocky|almalinux)
            install_fedora_rhel
            ;;
        arch|manjaro)
            install_arch
            ;;
        *)
            log_error "Unsupported distribution: $DISTRO"
            log_info "Please install manually following the documentation"
            exit 1
            ;;
    esac
    
    # Common configuration
    configure_libvirt
    install_vagrant_libvirt
    configure_nfs
    
    # Verify installation
    verify_installation
    
    # Print summary
    print_summary
}

# Trap errors
trap 'log_error "Installation failed at line $LINENO"' ERR

# Run main function
main "$@"
