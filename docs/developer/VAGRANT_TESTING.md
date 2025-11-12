# Vagrant + VMware Testing Guide for Bifrostvault

Complete guide for testing Bifrostvault with YubiKey using Vagrant and VMware hypervisor with automated USB passthrough.

---

## 🎯 Overview

This guide provides a **fully automated** Vagrant + VMware setup for testing Bifrostvault with YubiKey detection. The provisioning script handles everything automatically.

**Features**:
- ✅ Automated Ubuntu 22.04 VM creation
- ✅ USB passthrough for YubiKey (automatic)
- ✅ Complete Bifrostvault installation
- ✅ MySQL database setup
- ✅ Development environment ready-to-use
- ✅ Helper scripts for testing

---

## 📋 Prerequisites

### Required Software

1. **Vagrant 2.3+**
   - Download: https://www.vagrantup.com/downloads

2. **VMware Workstation/Fusion**
   - **Windows/Linux**: VMware Workstation Pro 16+
   - **macOS**: VMware Fusion 12+
   - Download: https://www.vmware.com/products/

3. **Vagrant VMware Plugin**
   - Purchase license: https://www.vagrantup.com/vmware
   - Or use trial version

### Installation

#### Install Vagrant

**macOS**:
```bash
brew install vagrant
```

**Windows**:
```powershell
choco install vagrant
```

**Linux**:
```bash
wget https://releases.hashicorp.com/vagrant/2.4.0/vagrant_2.4.0_linux_amd64.zip
unzip vagrant_2.4.0_linux_amd64.zip
sudo mv vagrant /usr/local/bin/
```

#### Install VMware

**macOS**:
```bash
# Download VMware Fusion from vmware.com
# Install the .dmg file
```

**Windows**:
```powershell
# Download VMware Workstation from vmware.com
# Run the installer
```

**Linux**:
```bash
# Download VMware Workstation bundle
chmod +x VMware-Workstation-*.bundle
sudo ./VMware-Workstation-*.bundle
```

#### Install Vagrant VMware Plugin

```bash
# Install the plugin
vagrant plugin install vagrant-vmware-desktop

# Verify installation
vagrant plugin list
```

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/sir-william/Bifrostvault.git
cd Bifrostvault
```

### 2. Start VM (Automatic Setup)

```bash
# This will:
# - Download Ubuntu 22.04 box
# - Create VM with 4GB RAM, 2 CPUs
# - Configure USB passthrough for YubiKey
# - Install all dependencies
# - Setup database
# - Configure application
vagrant up
```

**First run takes 10-15 minutes** (downloads box and installs everything).

### 3. SSH into VM

```bash
vagrant ssh
```

### 4. Test YubiKey Detection

```bash
# Inside VM
~/yubikey-test.sh
```

Expected output:
```
=== YubiKey Detection Test ===

1. USB Devices:
Bus 002 Device 003: ID 1050:0407 Yubico.com Yubikey 5 NFC

2. YubiKey Devices:
Bus 002 Device 003: ID 1050:0407 Yubico.com Yubikey 5 NFC

3. USB Device Details:
[YubiKey details...]

=== Test Complete ===
```

### 5. Start Development Server

```bash
# Inside VM
cd /vagrant
pnpm dev
```

### 6. Access Application

Open browser on **host machine**:
- http://localhost:3000
- http://192.168.56.10:3000

---

## 📁 Project Structure

```
Bifrostvault/
├── Vagrantfile                    # VM configuration
├── vagrant/
│   └── provision.sh              # Automated setup script
├── docs/
│   └── developer/
│       └── VAGRANT_TESTING.md    # This file
└── [rest of project files]
```

---

## 🔧 Configuration

### VM Specifications

Default configuration in `Vagrantfile`:

```ruby
Memory: 4096 MB (4 GB)
CPUs: 2 cores
Disk: 25 GB (dynamic)
Network: Private (192.168.56.10)
USB: Enabled with YubiKey auto-connect
```

### Customize VM Resources

Edit `Vagrantfile`:

```ruby
config.vm.provider "vmware_desktop" do |vmware|
  vmware.vmx["memsize"] = "8192"    # 8GB RAM
  vmware.vmx["numvcpus"] = "4"      # 4 CPUs
end
```

### USB Passthrough Configuration

The Vagrantfile automatically configures USB passthrough for YubiKey:

```ruby
# Yubico vendor ID: 0x1050
vmware.vmx["usb.autoConnect.device0"] = "vid:1050"
vmware.vmx["usb.autoConnect.device1"] = "name:Yubico"
```

**Supported YubiKeys**:
- YubiKey 5 Series (all variants)
- YubiKey Bio - FIDO Edition
- Security Key Series
- All Yubico USB devices

---

## 🔑 YubiKey Testing

### Automatic USB Connection

1. **Insert YubiKey** into host machine
2. **VMware auto-connects** it to the VM
3. **Verify detection** inside VM:
   ```bash
   lsusb | grep -i yubico
   ```

### Manual USB Connection (if auto-connect fails)

1. **Insert YubiKey** into host
2. **VMware menu**: VM → Removable Devices → Yubico YubiKey → Connect
3. **Verify** in VM:
   ```bash
   lsusb | grep -i yubico
   ```

### Test YubiKey Registration

1. **Start dev server** in VM:
   ```bash
   cd /vagrant
   pnpm dev
   ```

2. **Open browser** on host:
   ```
   http://localhost:3000
   ```

3. **Navigate to** YubiKey setup:
   ```
   http://localhost:3000/setup-yubikey
   ```

4. **Register YubiKey**:
   - Click "Register YubiKey"
   - Browser prompts for security key
   - Touch YubiKey sensor
   - Registration complete!

### Test Authentication

1. **Logout** from application
2. **Login** with YubiKey:
   - Click "Sign In"
   - Touch YubiKey when prompted
   - Instant authentication!

---

## 🛠️ Helper Scripts

The provisioning script creates helper scripts in `/home/vagrant/`:

### 1. yubikey-test.sh

Test YubiKey detection:

```bash
~/yubikey-test.sh
```

Shows:
- USB devices
- YubiKey detection
- USB device details
- PC/SC daemon status
- Smart card readers

### 2. start-dev.sh

Start development server:

```bash
~/start-dev.sh
```

Equivalent to:
```bash
cd /vagrant && pnpm dev
```

### 3. db-reset.sh

Reset database:

```bash
~/db-reset.sh
```

Drops and recreates database schema.

---

## 📊 Vagrant Commands

### VM Management

```bash
# Start VM
vagrant up

# Stop VM
vagrant halt

# Restart VM
vagrant reload

# Delete VM
vagrant destroy

# SSH into VM
vagrant ssh

# Check VM status
vagrant status

# Provision (re-run setup script)
vagrant provision
```

### Troubleshooting Commands

```bash
# View VM details
vagrant ssh-config

# Reload with provisioning
vagrant reload --provision

# Destroy and recreate
vagrant destroy -f && vagrant up

# Check VMware plugin
vagrant plugin list
```

---

## 🐛 Troubleshooting

### Issue: YubiKey Not Detected

**Symptoms**: `lsusb` doesn't show YubiKey

**Solutions**:

1. **Check USB connection on host**:
   - YubiKey LED should light up when inserted
   - Try different USB port

2. **Manual USB connection**:
   - VMware menu → VM → Removable Devices → Yubico YubiKey → Connect

3. **Check VM USB settings**:
   ```bash
   vagrant halt
   # Edit Vagrantfile, ensure USB settings are correct
   vagrant up
   ```

4. **Verify udev rules** in VM:
   ```bash
   cat /etc/udev/rules.d/70-yubikey.rules
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

5. **Check user permissions**:
   ```bash
   groups vagrant  # Should include 'plugdev'
   ```

### Issue: VM Won't Start

**Symptoms**: `vagrant up` fails

**Solutions**:

1. **Check VMware is running**:
   - Ensure VMware Workstation/Fusion is installed
   - Check license is valid

2. **Verify Vagrant plugin**:
   ```bash
   vagrant plugin list
   # Should show vagrant-vmware-desktop
   ```

3. **Check logs**:
   ```bash
   vagrant up --debug
   ```

4. **Try different box**:
   Edit `Vagrantfile`:
   ```ruby
   config.vm.box = "generic/ubuntu2204"
   ```

### Issue: Slow Performance

**Symptoms**: VM is sluggish

**Solutions**:

1. **Increase resources** in `Vagrantfile`:
   ```ruby
   vmware.vmx["memsize"] = "8192"
   vmware.vmx["numvcpus"] = "4"
   ```

2. **Disable GUI** (already disabled by default):
   ```ruby
   vmware.gui = false
   ```

3. **Use linked clone** (already enabled):
   ```ruby
   vmware.linked_clone = true
   ```

4. **Check host resources**:
   - Close other VMs
   - Free up RAM
   - Check CPU usage

### Issue: Network Not Working

**Symptoms**: Can't access http://localhost:3000

**Solutions**:

1. **Check port forwarding**:
   ```bash
   vagrant reload
   ```

2. **Try private network IP**:
   ```
   http://192.168.56.10:3000
   ```

3. **Check firewall** in VM:
   ```bash
   vagrant ssh
   sudo ufw status
   # Should allow port 3000
   ```

4. **Check application is running**:
   ```bash
   vagrant ssh
   cd /vagrant
   pnpm dev
   ```

### Issue: Database Connection Failed

**Symptoms**: Application can't connect to MySQL

**Solutions**:

1. **Check MySQL is running**:
   ```bash
   vagrant ssh
   sudo systemctl status mysql
   ```

2. **Restart MySQL**:
   ```bash
   sudo systemctl restart mysql
   ```

3. **Verify credentials** in `.env`:
   ```bash
   cat /vagrant/.env
   # DATABASE_URL should be correct
   ```

4. **Test connection**:
   ```bash
   mysql -u bifrost -pvaultpass bifrostvault
   ```

---

## 🔍 Advanced Configuration

### Custom Provisioning

Edit `vagrant/provision.sh` to customize setup:

```bash
# Change MySQL password
readonly MYSQL_PASSWORD="your_secure_password"

# Change database name
readonly MYSQL_DATABASE="your_db_name"

# Add custom packages
sudo apt-get install -y your-package
```

### Multiple VMs

Create multiple VMs for testing:

```ruby
# In Vagrantfile
Vagrant.configure("2") do |config|
  config.vm.define "dev" do |dev|
    dev.vm.hostname = "bifrost-dev"
    dev.vm.network "private_network", ip: "192.168.56.10"
  end
  
  config.vm.define "staging" do |staging|
    staging.vm.hostname = "bifrost-staging"
    staging.vm.network "private_network", ip: "192.168.56.11"
  end
end
```

Start specific VM:
```bash
vagrant up dev
vagrant up staging
```

### Shared Folders

Customize synced folders in `Vagrantfile`:

```ruby
config.vm.synced_folder ".", "/vagrant", 
  type: "vmware",
  owner: "vagrant",
  group: "vagrant",
  mount_options: ["dmode=775,fmode=664"]

# Add additional shared folders
config.vm.synced_folder "./data", "/data"
```

---

## 📊 Performance Comparison

| Method | Setup Time | YubiKey Support | Performance | Complexity |
|--------|-----------|-----------------|-------------|------------|
| **Native** | 15 min | ✅ Perfect | ⭐⭐⭐⭐⭐ | Low |
| **Vagrant + VMware** | 15 min | ✅ Good | ⭐⭐⭐⭐ | Medium |
| **Docker** | 5 min | ❌ Poor | ⭐⭐⭐⭐⭐ | Low |

**Recommendation**:
- **Development**: Native (fastest, simplest)
- **Testing**: Vagrant + VMware (isolated, reproducible)
- **CI/CD**: Docker (fast, no YubiKey needed)

---

## 🎯 Use Cases

### When to Use Vagrant + VMware

✅ **Testing across different OS versions**
- Test on Ubuntu 20.04, 22.04, 24.04

✅ **Isolated testing environment**
- Clean VM for each test
- No impact on host system

✅ **Team collaboration**
- Share Vagrantfile for consistent environments
- Reproducible setup

✅ **YubiKey testing without native setup**
- Don't want to install Node.js on host
- Keep host system clean

### When NOT to Use

❌ **Daily development**
- Native is faster and simpler

❌ **Production deployment**
- Use bare metal or cloud VMs

❌ **CI/CD pipelines**
- Use Docker with WebAuthn mocks

---

## 📚 Additional Resources

- **Vagrant Documentation**: https://www.vagrantup.com/docs
- **VMware Documentation**: https://docs.vmware.com/
- **Vagrant VMware Plugin**: https://www.vagrantup.com/docs/providers/vmware
- **Bifrostvault Docs**: https://github.com/sir-william/Bifrostvault/tree/main/docs

---

## ✅ Testing Checklist

- [ ] Vagrant and VMware installed
- [ ] Vagrant VMware plugin installed
- [ ] Repository cloned
- [ ] `vagrant up` completed successfully
- [ ] VM accessible via SSH
- [ ] YubiKey detected in VM (`lsusb | grep yubico`)
- [ ] Development server starts (`pnpm dev`)
- [ ] Application accessible at http://localhost:3000
- [ ] YubiKey registration works
- [ ] YubiKey authentication works
- [ ] Database operations work
- [ ] E2E tests pass

---

## 🆘 Getting Help

If you encounter issues:

1. **Check logs**: `vagrant up --debug`
2. **Verify prerequisites**: Vagrant, VMware, plugin installed
3. **Test YubiKey on host**: Ensure it works before testing in VM
4. **Try manual USB connection**: VMware menu → Connect device
5. **GitHub Issues**: https://github.com/sir-william/Bifrostvault/issues

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0  
**Tested On**: VMware Workstation 17, VMware Fusion 13, Vagrant 2.4.0
