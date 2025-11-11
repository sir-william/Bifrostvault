# Vagrant with VMware - Complete Setup Guide

This guide ensures Vagrant uses **VMware** (not VirtualBox) as the default provider for Bifrostvault.

---

## 🎯 Quick Fix - Force VMware

### Method 1: Use .vagrantrc (Included)

The project includes a `.vagrantrc` file that forces VMware:

```bash
# Just run vagrant up - VMware will be used automatically
vagrant up
```

### Method 2: Command Line Flag

Always specify `--provider`:

```bash
vagrant up --provider=vmware_desktop
```

### Method 3: Environment Variable

Set environment variable before running vagrant:

**Linux/macOS**:
```bash
export VAGRANT_DEFAULT_PROVIDER=vmware_desktop
vagrant up
```

**Windows (PowerShell)**:
```powershell
$env:VAGRANT_DEFAULT_PROVIDER="vmware_desktop"
vagrant up
```

**Windows (CMD)**:
```cmd
set VAGRANT_DEFAULT_PROVIDER=vmware_desktop
vagrant up
```

### Method 4: Global Vagrant Configuration

Create `~/.vagrant.d/Vagrantfile`:

```ruby
Vagrant.configure("2") do |config|
  config.vm.provider "vmware_desktop"
end
```

---

## 🔧 VMware Provider Detection

The Vagrantfile automatically detects your VMware version:

- **VMware Workstation** (Windows/Linux) → `vmware_workstation`
- **VMware Fusion** (macOS) → `vmware_fusion`
- **Generic** → `vmware_desktop`

All three are configured in the Vagrantfile!

---

## 📋 Prerequisites

### 1. Install VMware

**Windows/Linux - VMware Workstation**:
- Download: https://www.vmware.com/products/workstation-pro.html
- Install and activate license

**macOS - VMware Fusion**:
- Download: https://www.vmware.com/products/fusion.html
- Install and activate license

### 2. Install Vagrant

**All Platforms**:
```bash
# Download from: https://www.vagrantup.com/downloads
# Or use package manager:

# macOS
brew install vagrant

# Windows (Chocolatey)
choco install vagrant

# Linux (Debian/Ubuntu)
wget https://releases.hashicorp.com/vagrant/2.4.0/vagrant_2.4.0_linux_amd64.zip
unzip vagrant_2.4.0_linux_amd64.zip
sudo mv vagrant /usr/local/bin/
```

### 3. Install Vagrant VMware Plugin

**IMPORTANT**: This is a **paid plugin** ($79 one-time fee)

```bash
# Purchase license from:
# https://www.vagrantup.com/vmware

# Install plugin
vagrant plugin install vagrant-vmware-desktop

# Install license
vagrant plugin license vagrant-vmware-desktop ~/path/to/license.lic

# Verify installation
vagrant plugin list
```

**Expected output**:
```
vagrant-vmware-desktop (3.0.3, global)
  - Version Constraint: > 0
  - License: valid
```

---

## 🚀 Usage

### Start VM with VMware

```bash
cd Bifrostvault

# Method 1: Automatic (uses .vagrantrc)
vagrant up

# Method 2: Explicit provider
vagrant up --provider=vmware_desktop

# Method 3: With environment variable
export VAGRANT_DEFAULT_PROVIDER=vmware_desktop
vagrant up
```

### Verify VMware is Used

```bash
# Check VM status
vagrant status

# Should show:
# Current machine states:
# default                   running (vmware_desktop)
```

### Common Commands

```bash
# Start VM
vagrant up --provider=vmware_desktop

# SSH into VM
vagrant ssh

# Stop VM
vagrant halt

# Restart VM
vagrant reload

# Destroy VM
vagrant destroy

# Re-provision (re-run setup script)
vagrant provision

# Check status
vagrant status
```

---

## 🐛 Troubleshooting

### Issue: "VirtualBox is being used instead of VMware"

**Symptoms**:
```
Bringing machine 'default' up with 'virtualbox' provider...
```

**Solutions**:

1. **Check .vagrantrc exists**:
   ```bash
   ls -la .vagrantrc
   # Should show the file
   ```

2. **Use explicit provider**:
   ```bash
   vagrant up --provider=vmware_desktop
   ```

3. **Set environment variable**:
   ```bash
   export VAGRANT_DEFAULT_PROVIDER=vmware_desktop
   vagrant up
   ```

4. **Remove VirtualBox provider**:
   ```bash
   # Edit Vagrantfile and remove any VirtualBox config
   # Or uninstall VirtualBox
   ```

### Issue: "VMware plugin not found"

**Symptoms**:
```
The provider 'vmware_desktop' could not be found
```

**Solutions**:

1. **Install plugin**:
   ```bash
   vagrant plugin install vagrant-vmware-desktop
   ```

2. **Verify installation**:
   ```bash
   vagrant plugin list
   ```

3. **Check license**:
   ```bash
   vagrant plugin license vagrant-vmware-desktop ~/license.lic
   ```

### Issue: "VMware utility not found"

**Symptoms**:
```
The VMware Vagrant plugin requires the VMware Utility to be installed
```

**Solutions**:

1. **Download VMware Utility**:
   - https://www.vagrantup.com/vmware/downloads

2. **Install for your OS**:
   
   **macOS**:
   ```bash
   # Download .dmg and install
   ```
   
   **Windows**:
   ```powershell
   # Download .exe and install
   ```
   
   **Linux**:
   ```bash
   wget https://releases.hashicorp.com/vagrant-vmware-utility/1.0.21/vagrant-vmware-utility_1.0.21_linux_amd64.zip
   unzip vagrant-vmware-utility_1.0.21_linux_amd64.zip
   sudo mv vagrant-vmware-utility /usr/local/bin/
   ```

3. **Verify installation**:
   ```bash
   vagrant-vmware-utility --version
   ```

### Issue: "USB passthrough not working"

**Symptoms**: YubiKey not detected in VM

**Solutions**:

1. **Check VMware USB settings**:
   - Open VMware
   - VM → Settings → USB Controller
   - Ensure "USB 3.0" is selected
   - Check "Automatically connect new USB devices"

2. **Manual USB connection**:
   - Insert YubiKey
   - VMware menu → VM → Removable Devices → Yubico YubiKey → Connect

3. **Check Vagrantfile USB config**:
   ```ruby
   vmware.vmx["usb.present"] = "TRUE"
   vmware.vmx["usb_xhci.present"] = "TRUE"
   vmware.vmx["usb.autoConnect.device0"] = "vid:1050"
   ```

4. **Verify in VM**:
   ```bash
   vagrant ssh
   lsusb | grep -i yubico
   ```

### Issue: "VM is slow"

**Symptoms**: VM performance is poor

**Solutions**:

1. **Increase resources** in Vagrantfile:
   ```ruby
   vmware.vmx["memsize"] = "8192"    # 8GB RAM
   vmware.vmx["numvcpus"] = "4"      # 4 CPUs
   ```

2. **Enable hardware virtualization**:
   - Check BIOS/UEFI settings
   - Enable VT-x (Intel) or AMD-V (AMD)

3. **Close other VMs**:
   ```bash
   # Stop other running VMs
   ```

4. **Use linked clone** (already enabled):
   ```ruby
   vmware.linked_clone = true
   ```

---

## 🆚 VMware vs VirtualBox

| Feature | VMware | VirtualBox |
|---------|--------|------------|
| **USB Passthrough** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good |
| **Performance** | ⭐⭐⭐⭐⭐ Fast | ⭐⭐⭐⭐ Good |
| **YubiKey Support** | ⭐⭐⭐⭐⭐ Perfect | ⭐⭐⭐ OK |
| **Cost** | $79 (plugin) | Free |
| **Stability** | ⭐⭐⭐⭐⭐ Very stable | ⭐⭐⭐⭐ Stable |

**For YubiKey testing, VMware is HIGHLY RECOMMENDED.**

---

## 📊 Verification Checklist

After `vagrant up`, verify:

- [ ] VM is running with VMware provider
  ```bash
  vagrant status
  # Should show: running (vmware_desktop)
  ```

- [ ] Can SSH into VM
  ```bash
  vagrant ssh
  ```

- [ ] YubiKey is detected
  ```bash
  vagrant ssh
  lsusb | grep -i yubico
  ```

- [ ] Application is accessible
  ```
  http://localhost:3000
  ```

- [ ] Database is running
  ```bash
  vagrant ssh
  sudo systemctl status mysql
  ```

---

## 🎯 Quick Reference

### Force VMware - Choose One Method

**Option 1: Use included .vagrantrc (Easiest)**
```bash
vagrant up
```

**Option 2: Command line flag**
```bash
vagrant up --provider=vmware_desktop
```

**Option 3: Environment variable**
```bash
export VAGRANT_DEFAULT_PROVIDER=vmware_desktop
vagrant up
```

**Option 4: Global config**
```bash
echo 'ENV["VAGRANT_DEFAULT_PROVIDER"] = "vmware_desktop"' >> ~/.vagrant.d/Vagrantfile
vagrant up
```

---

## 📚 Additional Resources

- **Vagrant VMware Plugin**: https://www.vagrantup.com/docs/providers/vmware
- **VMware Documentation**: https://docs.vmware.com/
- **Vagrant Documentation**: https://www.vagrantup.com/docs
- **YubiKey USB Passthrough**: https://kb.vmware.com/s/article/1021345

---

## ✅ Summary

**To use VMware with Vagrant for Bifrostvault**:

1. ✅ Install VMware Workstation/Fusion
2. ✅ Install Vagrant
3. ✅ Install vagrant-vmware-desktop plugin ($79)
4. ✅ Install VMware Utility
5. ✅ Use `.vagrantrc` (included) OR specify `--provider=vmware_desktop`
6. ✅ Run `vagrant up`
7. ✅ Insert YubiKey and test!

**The project is pre-configured for VMware** - just run `vagrant up`!

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0  
**Tested On**: VMware Workstation 17, VMware Fusion 13
