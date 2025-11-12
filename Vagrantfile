# -*- mode: ruby -*-
# vi: set ft=ruby :

################################################################################
# Bifrostvault Vagrant Configuration for VMware
# 
# This Vagrantfile creates a fully configured Ubuntu VM with:
# - Automated Bifrostvault installation
# - USB passthrough for YubiKey detection
# - All dependencies pre-installed
# - Ready-to-use development environment
#
# Requirements:
# - Vagrant 2.3+
# - VMware Workstation/Fusion
# - Vagrant VMware plugin
#
# Usage:
#   vagrant up          # Create and provision VM
#   vagrant ssh         # SSH into VM
#   vagrant halt        # Stop VM
#   vagrant destroy     # Delete VM
################################################################################

Vagrant.configure("2") do |config|
  # Base box - Ubuntu 22.04 LTS
  config.vm.box = "bento/ubuntu-22.04"
  config.vm.box_version = ">= 202309.08.0"
  
  # Set VMware as default provider
  config.vm.provider "vmware_desktop"
  config.vm.provider "vmware_fusion"
  config.vm.provider "vmware_workstation"
  
  # VM hostname
  config.vm.hostname = "bifrostvault-dev"
  
  # Network configuration
  # Private network for accessing the app from host
  config.vm.network "private_network", ip: "192.168.56.10"
  
  # Port forwarding for web access
  config.vm.network "forwarded_port", guest: 3000, host: 3000, host_ip: "127.0.0.1"
  config.vm.network "forwarded_port", guest: 3306, host: 3306, host_ip: "127.0.0.1"
  
  # Synced folder - share project directory
  config.vm.synced_folder ".", "/vagrant", 
    type: "vmware",
    owner: "vagrant",
    group: "vagrant",
    mount_options: ["dmode=775,fmode=664"]
  
  # VMware-specific configuration
  config.vm.provider "vmware_desktop" do |vmware|
    # VM display name
    vmware.vmx["displayName"] = "Bifrostvault Development"
    
    # Memory and CPU allocation
    vmware.vmx["memsize"] = "4096"      # 4GB RAM
    vmware.vmx["numvcpus"] = "2"        # 2 CPU cores
    
    # Enable 3D graphics acceleration
    vmware.vmx["mks.enable3d"] = "TRUE"
    
    # USB Controller configuration
    vmware.vmx["usb.present"] = "TRUE"
    vmware.vmx["ehci.present"] = "TRUE"
    vmware.vmx["usb.generic.autoconnect"] = "TRUE"
    
    # USB 3.0 support (if available)
    vmware.vmx["usb_xhci.present"] = "TRUE"
    
    # YubiKey USB passthrough
    # Yubico vendor ID: 0x1050
    vmware.vmx["usb.autoConnect.device0"] = "vid:1050"
    vmware.vmx["usb.autoConnect.device1"] = "name:Yubico"
    
    # Alternative: Manual USB filter (uncomment if auto-connect doesn't work)
    # vmware.vmx["usb.quirks.device0"] = "0x1050:0x0407 allow"  # YubiKey 5
    # vmware.vmx["usb.quirks.device1"] = "0x1050:0x0402 allow"  # Security Key
    
    # Enable nested virtualization (if needed)
    vmware.vmx["vhv.enable"] = "TRUE"
    
    # GUI mode (set to false for headless)
    vmware.gui = false
    
    # Linked clone for faster provisioning
    vmware.linked_clone = true
    
    # SSH configuration
    vmware.ssh_info_public = true
    vmware.vmx["isolation.tools.copy.disable"] = "FALSE"
    vmware.vmx["isolation.tools.paste.disable"] = "FALSE"
  end
  
  # VMware Fusion specific settings (macOS)
  config.vm.provider "vmware_fusion" do |fusion|
    fusion.vmx["displayName"] = "Bifrostvault Development"
    fusion.vmx["memsize"] = "4096"
    fusion.vmx["numvcpus"] = "2"
    fusion.vmx["usb.present"] = "TRUE"
    fusion.vmx["ehci.present"] = "TRUE"
    fusion.vmx["usb.generic.autoconnect"] = "TRUE"
    fusion.vmx["usb_xhci.present"] = "TRUE"
    fusion.vmx["usb.autoConnect.device0"] = "vid:1050"
    fusion.vmx["usb.autoConnect.device1"] = "name:Yubico"
    fusion.gui = false
    fusion.linked_clone = true
  end
  
  # VMware Workstation specific settings (Windows/Linux)
  config.vm.provider "vmware_workstation" do |workstation|
    workstation.vmx["displayName"] = "Bifrostvault Development"
    workstation.vmx["memsize"] = "4096"
    workstation.vmx["numvcpus"] = "2"
    workstation.vmx["usb.present"] = "TRUE"
    workstation.vmx["ehci.present"] = "TRUE"
    workstation.vmx["usb.generic.autoconnect"] = "TRUE"
    workstation.vmx["usb_xhci.present"] = "TRUE"
    workstation.vmx["usb.autoConnect.device0"] = "vid:1050"
    workstation.vmx["usb.autoConnect.device1"] = "name:Yubico"
    workstation.gui = false
    workstation.linked_clone = true
  end
  
  # Provisioning script
  config.vm.provision "shell", path: "vagrant/provision.sh", privileged: false
  
  # Post-provisioning message
  config.vm.post_up_message = <<-MESSAGE
  ╔════════════════════════════════════════════════════════════════╗
  ║                                                                ║
  ║          BIFROSTVAULT DEVELOPMENT VM READY!                    ║
  ║                                                                ║
  ╚════════════════════════════════════════════════════════════════╝
  
  VM is ready for Bifrostvault development with YubiKey support!
  
  Access the application:
    - URL: http://localhost:3000 (from host)
    - URL: http://192.168.56.10:3000 (from host)
  
  SSH into the VM:
    vagrant ssh
  
  Inside the VM:
    cd /vagrant
    pnpm dev              # Start development server
    pnpm test:e2e         # Run E2E tests
    pnpm db:push          # Initialize database
  
  YubiKey Detection:
    - Insert YubiKey into host machine
    - It will auto-connect to VM
    - Check with: lsusb | grep -i yubico
  
  Useful commands:
    vagrant halt          # Stop VM
    vagrant up            # Start VM
    vagrant reload        # Restart VM
    vagrant destroy       # Delete VM
  
  For detailed documentation, see:
    docs/developer/VAGRANT_TESTING.md
  MESSAGE
end
