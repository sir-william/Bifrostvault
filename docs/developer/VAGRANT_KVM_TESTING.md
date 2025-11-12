# Vagrant + KVM/libvirt Testing Guide for Bifrostvault

Complete guide for testing Bifrostvault with YubiKey using Vagrant and KVM/libvirt hypervisor with automated USB passthrough.

---

## 🎯 Overview

This guide provides a **fully automated** Vagrant + KVM/libvirt setup for testing Bifrostvault with YubiKey detection.

**Why KVM/libvirt?**
- ✅ **Free and Open Source** (unlike VMware)
- ✅ **Native Linux performance** (kernel-based)
- ✅ **Excellent USB passthrough** for YubiKey
- ✅ **Lower resource usage** than VirtualBox
- ✅ **Production-grade** hypervisor

**Features**:
- ✅ Automated Ubuntu 22.04 VM creation
- ✅ USB passthrough for YubiKey (automatic)
- ✅ Complete Bifrostvault installation
- ✅ MySQL database setup
- ✅ Development environment ready-to-use
- ✅ Helper scripts for testing

---

## 📋 Prerequisites

### System Requirements

**Operating System**:
- ✅ Linux (Ubuntu, Debian, Fedora, Arch, etc.)
- ⚠️ macOS (limited support, use VMware instead)
- ❌ Windows (use VMware or VirtualBox instead)

**Hardware**:
- CPU with virtualization support (Intel VT-x or AMD-V)
- 8GB+ RAM (4GB for VM, 4GB for host)
- 30GB+ free disk space

### Required Software

1. **KVM/QEMU**
2. **libvirt**
3. **Vagrant**
4. **vagrant-libvirt plugin**

---

## 🚀 Installation

### Ubuntu/Debian

```bash
# 1. Install KVM, QEMU, and libvirt
sudo apt update
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils virt-manager

# 2. Add user to libvirt groups
sudo usermod -aG libvirt $USER
sudo usermod -aG kvm $USER

# 3. Start and enable libvirt
sudo systemctl start libvirtd
sudo systemctl enable libvirtd

# 4. Verify KVM installation
sudo kvm-ok
# Should show: KVM acceleration can be used

# 5. Install Vagrant
wget https://releases.hashicorp.com/vagrant/2.4.0/vagrant_2.4.0_linux_amd64.zip
unzip vagrant_2.4.0_linux_amd64.zip
sudo mv vagrant /usr/local/bin/

# Or use package manager
sudo apt install vagrant

# 6. Install vagrant-libvirt plugin
vagrant plugin install vagrant-libvirt

# 7. Install additional dependencies for vagrant-libvirt
sudo apt install -y libvirt-dev ruby-dev libguestfs-tools

# 8. Verify installation
vagrant plugin list
# Should show: vagrant-libvirt

# 9. Log out and log back in (for group changes)
```

### Fedora/RHEL/CentOS

```bash
# 1. Install KVM, QEMU, and libvirt
sudo dnf install -y @virtualization

# 2. Add user to libvirt group
sudo usermod -aG libvirt $USER

# 3. Start and enable libvirt
sudo systemctl start libvirtd
sudo systemctl enable libvirtd

# 4. Install Vagrant
sudo dnf install -y vagrant

# 5. Install vagrant-libvirt plugin
vagrant plugin install vagrant-libvirt

# 6. Install dependencies
sudo dnf install -y libvirt-devel ruby-devel libguestfs-tools-c

# 7. Log out and log back in
```

### Arch Linux

```bash
# 1. Install KVM, QEMU, and libvirt
sudo pacman -S qemu libvirt virt-manager bridge-utils dnsmasq

# 2. Add user to libvirt group
sudo usermod -aG libvirt $USER

# 3. Start and enable libvirt
sudo systemctl start libvirtd
sudo systemctl enable libvirtd

# 4. Install Vagrant
sudo pacman -S vagrant

# 5. Install vagrant-libvirt plugin
vagrant plugin install vagrant-libvirt

# 6. Install dependencies
sudo pacman -S libvirt ruby libguestfs

# 7. Log out and log back in
```

---

## ✅ Verification

### Check KVM Support

```bash
# Check if KVM module is loaded
lsmod | grep kvm

# Should show:
# kvm_intel (for Intel CPUs)
# OR
# kvm_amd (for AMD CPUs)

# Check KVM acceleration
sudo kvm-ok

# Should show:
# INFO: /dev/kvm exists
# KVM acceleration can be used
```

### Check libvirt

```bash
# Check libvirt status
sudo systemctl status libvirtd

# Should show: active (running)

# List VMs (should be empty initially)
virsh list --all

# Check default network
virsh net-list --all

# Should show 'default' network
```

### Check Vagrant

```bash
# Check Vagrant version
vagrant --version

# Check vagrant-libvirt plugin
vagrant plugin list

# Should show:
# vagrant-libvirt (0.12.2, global)
```

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/sir-william/Bifrostvault.git
cd Bifrostvault
```

### 2. Use KVM Vagrantfile

```bash
# Copy KVM-specific Vagrantfile
cp Vagrantfile.kvm Vagrantfile

# Copy KVM-specific .vagrantrc
cp .vagrantrc.kvm .vagrantrc
```

### 3. Start VM (Automatic Setup)

```bash
# This will:
# - Download Ubuntu 22.04 box for libvirt
# - Create VM with 4GB RAM, 2 CPUs
# - Configure USB passthrough for YubiKey
# - Install all dependencies
# - Setup database
# - Configure application
vagrant up --provider=libvirt
```

**First run takes 10-15 minutes** (downloads box and installs everything).

### 4. SSH into VM

```bash
vagrant ssh
```

### 5. Test YubiKey Detection

```bash
# Inside VM
~/yubikey-test.sh
```

Expected output:
```
=== YubiKey Detection Test ===

1. USB Devices:
Bus 001 Device 002: ID 1050:0407 Yubico.com Yubikey 5 NFC

2. YubiKey Devices:
Bus 001 Device 002: ID 1050:0407 Yubico.com Yubikey 5 NFC

=== Test Complete ===
```

### 6. Start Development Server

```bash
# Inside VM
cd /vagrant
pnpm dev
```

### 7. Access Application

Open browser on **host machine**:
- http://localhost:3000
- http://192.168.121.10:3000

---

## 🔧 Configuration

### VM Specifications

Default configuration in `Vagrantfile.kvm`:

```ruby
Memory: 4096 MB (4 GB)
CPUs: 2 cores
Disk: 25 GB (qcow2 format)
Network: Private (192.168.121.10)
USB: Enabled with YubiKey auto-passthrough
```

### Customize VM Resources

Edit `Vagrantfile.kvm`:

```ruby
config.vm.provider :libvirt do |libvirt|
  libvirt.memory = 8192    # 8GB RAM
  libvirt.cpus = 4         # 4 CPUs
end
```

### USB Passthrough Configuration

The Vagrantfile automatically configures USB passthrough for YubiKey:

```ruby
# Yubico vendor ID: 0x1050
libvirt.usb :vendor => "0x1050", :product => "0x0407", :startupPolicy => "optional"
```

**Supported YubiKeys**:
- YubiKey 5 Series (all variants)
- YubiKey Bio - FIDO Edition
- Security Key Series
- All Yubico USB devices

### Synced Folder Options

**Option 1: NFS (Recommended for Linux)**
```ruby
config.vm.synced_folder ".", "/vagrant",
  type: "nfs",
  nfs_version: 4,
  nfs_udp: false
```

**Option 2: rsync (Alternative)**
```ruby
config.vm.synced_folder ".", "/vagrant",
  type: "rsync",
  rsync__auto: true
```

**Option 3: 9p/virtio-9p (Fallback)**
```ruby
config.vm.synced_folder ".", "/vagrant",
  type: "9p",
  accessmode: "mapped"
```

---

## 🔑 YubiKey Testing

### Automatic USB Connection

1. **Insert YubiKey** into host machine
2. **libvirt auto-connects** it to the VM
3. **Verify detection** inside VM:
   ```bash
   lsusb | grep -i yubico
   ```

### Manual USB Connection (if auto-connect fails)

1. **Find YubiKey USB device**:
   ```bash
   lsusb | grep -i yubico
   # Note the bus and device numbers
   ```

2. **Attach to VM**:
   ```bash
   # Get VM name
   virsh list --all
   
   # Attach USB device (replace bus/device numbers)
   virsh attach-device bifrostvault-dev_default --file yubikey-usb.xml --live
   ```

3. **Create yubikey-usb.xml**:
   ```xml
   <hostdev mode='subsystem' type='usb'>
     <source>
       <vendor id='0x1050'/>
       <product id='0x0407'/>
     </source>
   </hostdev>
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

---

## 🛠️ Vagrant Commands

### VM Management

```bash
# Start VM
vagrant up --provider=libvirt

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

### libvirt-specific Commands

```bash
# List all VMs
virsh list --all

# Start VM
virsh start bifrostvault-dev_default

# Stop VM
virsh shutdown bifrostvault-dev_default

# Force stop VM
virsh destroy bifrostvault-dev_default

# Delete VM
virsh undefine bifrostvault-dev_default

# List networks
virsh net-list --all

# List storage pools
virsh pool-list --all
```

---

## 🐛 Troubleshooting

### Issue: "libvirt is not available"

**Symptoms**: `vagrant up` fails with libvirt error

**Solutions**:

1. **Check libvirt is running**:
   ```bash
   sudo systemctl status libvirtd
   sudo systemctl start libvirtd
   ```

2. **Check user permissions**:
   ```bash
   groups
   # Should include 'libvirt' and 'kvm'
   
   # If not:
   sudo usermod -aG libvirt $USER
   sudo usermod -aG kvm $USER
   # Log out and log back in
   ```

3. **Verify KVM support**:
   ```bash
   sudo kvm-ok
   ls -l /dev/kvm
   # Should be accessible
   ```

### Issue: "NFS mount failed"

**Symptoms**: Synced folder doesn't work

**Solutions**:

1. **Install NFS server**:
   ```bash
   sudo apt install nfs-kernel-server
   sudo systemctl start nfs-server
   sudo systemctl enable nfs-server
   ```

2. **Configure firewall**:
   ```bash
   sudo ufw allow from 192.168.121.0/24
   ```

3. **Use rsync instead**:
   Edit `Vagrantfile.kvm`, uncomment rsync option

### Issue: YubiKey Not Detected

**Symptoms**: `lsusb` doesn't show YubiKey in VM

**Solutions**:

1. **Check USB on host**:
   ```bash
   lsusb | grep -i yubico
   # Should show YubiKey
   ```

2. **Check libvirt USB config**:
   ```bash
   virsh dumpxml bifrostvault-dev_default | grep -A 5 hostdev
   # Should show USB passthrough config
   ```

3. **Manual USB attachment**:
   ```bash
   # Create yubikey-usb.xml
   cat > yubikey-usb.xml << EOF
   <hostdev mode='subsystem' type='usb'>
     <source>
       <vendor id='0x1050'/>
       <product id='0x0407'/>
     </source>
   </hostdev>
   EOF
   
   # Attach to VM
   virsh attach-device bifrostvault-dev_default yubikey-usb.xml --live
   ```

4. **Check udev rules** in VM:
   ```bash
   vagrant ssh
   cat /etc/udev/rules.d/70-yubikey.rules
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

### Issue: VM Won't Start

**Symptoms**: `vagrant up` fails

**Solutions**:

1. **Check libvirt logs**:
   ```bash
   sudo journalctl -u libvirtd -f
   ```

2. **Check Vagrant logs**:
   ```bash
   vagrant up --provider=libvirt --debug
   ```

3. **Clean up old VMs**:
   ```bash
   vagrant destroy -f
   virsh list --all
   virsh undefine bifrostvault-dev_default
   ```

4. **Restart libvirt**:
   ```bash
   sudo systemctl restart libvirtd
   ```

### Issue: Slow Performance

**Symptoms**: VM is sluggish

**Solutions**:

1. **Increase resources**:
   ```ruby
   libvirt.memory = 8192
   libvirt.cpus = 4
   ```

2. **Use host CPU passthrough**:
   ```ruby
   libvirt.cpu_mode = "host-passthrough"
   ```

3. **Enable nested virtualization**:
   ```ruby
   libvirt.nested = true
   ```

4. **Check host resources**:
   ```bash
   htop
   # Ensure host has enough free resources
   ```

### Issue: Network Not Working

**Symptoms**: Can't access http://localhost:3000

**Solutions**:

1. **Check libvirt network**:
   ```bash
   virsh net-list --all
   # 'default' should be active
   
   # If not:
   virsh net-start default
   virsh net-autostart default
   ```

2. **Check port forwarding**:
   ```bash
   vagrant reload
   ```

3. **Try private network IP**:
   ```
   http://192.168.121.10:3000
   ```

4. **Check firewall**:
   ```bash
   sudo ufw status
   # Allow port 3000 if needed
   ```

---

## 🆚 Hypervisor Comparison

| Feature | KVM/libvirt | VMware | VirtualBox |
|---------|-------------|--------|------------|
| **Cost** | ✅ Free | ❌ $79 plugin | ✅ Free |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **USB Passthrough** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **YubiKey Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Linux Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **macOS Support** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Windows Support** | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Resource Usage** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Recommendation**:
- **Linux hosts**: KVM/libvirt (best performance, free)
- **macOS hosts**: VMware Fusion (best compatibility)
- **Windows hosts**: VMware Workstation or VirtualBox

---

## 📊 Performance Tips

### 1. Use host CPU passthrough

```ruby
libvirt.cpu_mode = "host-passthrough"
```

### 2. Allocate adequate resources

```ruby
libvirt.memory = 8192  # 8GB for better performance
libvirt.cpus = 4       # More cores = faster
```

### 3. Use qcow2 storage

```ruby
libvirt.storage :file, :size => '25G', :type => 'qcow2'
```

### 4. Enable nested virtualization

```ruby
libvirt.nested = true
```

### 5. Use NFS for synced folders

```ruby
config.vm.synced_folder ".", "/vagrant", type: "nfs"
```

---

## 🎯 Use Cases

### When to Use KVM/libvirt

✅ **Linux development machine**
- Native performance
- Free and open source
- Excellent USB passthrough

✅ **Server/production-like testing**
- Same hypervisor as production KVM servers
- Realistic performance characteristics

✅ **Cost-conscious development**
- No licensing fees
- Professional-grade virtualization

### When NOT to Use

❌ **macOS or Windows host**
- Limited or no support
- Use VMware or VirtualBox instead

❌ **Need GUI management**
- Command-line focused
- Use virt-manager for GUI

---

## 📚 Additional Resources

- **KVM Documentation**: https://www.linux-kvm.org/
- **libvirt Documentation**: https://libvirt.org/docs.html
- **vagrant-libvirt Plugin**: https://github.com/vagrant-libvirt/vagrant-libvirt
- **Vagrant Documentation**: https://www.vagrantup.com/docs
- **virt-manager**: https://virt-manager.org/

---

## ✅ Testing Checklist

- [ ] KVM/QEMU installed
- [ ] libvirt installed and running
- [ ] User in libvirt and kvm groups
- [ ] Vagrant installed
- [ ] vagrant-libvirt plugin installed
- [ ] Repository cloned
- [ ] Vagrantfile.kvm copied to Vagrantfile
- [ ] `vagrant up --provider=libvirt` completed successfully
- [ ] VM accessible via SSH
- [ ] YubiKey detected in VM (`lsusb | grep yubico`)
- [ ] Development server starts (`pnpm dev`)
- [ ] Application accessible at http://localhost:3000
- [ ] YubiKey registration works
- [ ] YubiKey authentication works
- [ ] Database operations work

---

## 🆘 Getting Help

If you encounter issues:

1. **Check logs**: `vagrant up --provider=libvirt --debug`
2. **Verify prerequisites**: KVM, libvirt, plugin installed
3. **Check libvirt status**: `sudo systemctl status libvirtd`
4. **Test YubiKey on host**: Ensure it works before testing in VM
5. **Try manual USB attachment**: Use `virsh attach-device`
6. **GitHub Issues**: https://github.com/sir-william/Bifrostvault/issues

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0  
**Tested On**: Ubuntu 22.04, Fedora 38, Arch Linux (KVM 7.2, libvirt 9.0)
