# YubiPass Manager Documentation

Welcome to the YubiPass Manager documentation. This comprehensive guide covers everything you need to know about using, developing, and securing your password manager with YubiKey hardware authentication.

## 📚 Documentation Structure

### For Users
- **[User Guide](./user/USER_GUIDE.md)** - Complete guide for end users
- **[YubiKey Setup](./yubikey/SETUP_GUIDE.md)** - Step-by-step YubiKey configuration
- **[YubiKey Bio Guide](./yubikey/BIO_GUIDE.md)** - Specific guide for YubiKey Bio users
- **[Security Key Guide](./yubikey/SECURITY_KEY_GUIDE.md)** - Guide for Security Key series
- **[Troubleshooting](./user/TROUBLESHOOTING.md)** - Common issues and solutions
- **[FAQ](./user/FAQ.md)** - Frequently asked questions

### For Developers
- **[Developer Guide](./developer/DEVELOPER_GUIDE.md)** - Development setup and workflow
- **[Architecture](./developer/ARCHITECTURE.md)** - System architecture overview
- **[API Documentation](./api/API_REFERENCE.md)** - Complete API reference
- **[Testing Guide](./developer/TESTING.md)** - Testing strategies and E2E tests
- **[Contributing](./developer/CONTRIBUTING.md)** - How to contribute to the project
- **[Deployment](./developer/DEPLOYMENT.md)** - Production deployment guide

### Security
- **[Security Overview](./security/SECURITY_OVERVIEW.md)** - Security architecture
- **[Encryption Details](./security/ENCRYPTION.md)** - Encryption implementation
- **[WebAuthn Implementation](./security/WEBAUTHN.md)** - WebAuthn/FIDO2 details
- **[Best Practices](./security/BEST_PRACTICES.md)** - Security best practices
- **[Threat Model](./security/THREAT_MODEL.md)** - Security threat analysis

### YubiKey Support
- **[YubiKey Overview](./yubikey/OVERVIEW.md)** - Supported YubiKey models
- **[YubiKey Bio](./yubikey/BIO_GUIDE.md)** - YubiKey Bio Series guide
- **[YubiKey 5](./yubikey/YUBIKEY5_GUIDE.md)** - YubiKey 5 Series guide
- **[Security Key](./yubikey/SECURITY_KEY_GUIDE.md)** - Security Key Series guide
- **[Compatibility Matrix](./yubikey/COMPATIBILITY.md)** - Device compatibility

## 🚀 Quick Start

### For Users
1. Read the [User Guide](./user/USER_GUIDE.md)
2. Follow the [YubiKey Setup Guide](./yubikey/SETUP_GUIDE.md)
3. Start using YubiPass Manager securely

### For Developers
1. Read the [Developer Guide](./developer/DEVELOPER_GUIDE.md)
2. Set up your development environment
3. Review the [Architecture](./developer/ARCHITECTURE.md)
4. Check the [Testing Guide](./developer/TESTING.md)

## 🔐 Security First

YubiPass Manager is built with security as the top priority:
- **Zero-Knowledge Architecture** - Server never sees your passwords
- **Client-Side Encryption** - AES-256-GCM encryption in browser
- **Hardware Authentication** - YubiKey FIDO2/WebAuthn support
- **Biometric Support** - YubiKey Bio fingerprint authentication

## 📖 Key Features

- ✅ **YubiKey Support** - Full support for YubiKey Bio, YubiKey 5, and Security Key series
- ✅ **Biometric Authentication** - Fingerprint authentication with YubiKey Bio
- ✅ **Zero-Knowledge Encryption** - Your data is encrypted before leaving your device
- ✅ **TOTP 2FA** - Time-based one-time password support
- ✅ **Vault Management** - Secure storage for passwords, notes, cards, and identities
- ✅ **Cross-Platform** - Works on desktop and mobile browsers
- ✅ **Open Source** - Transparent and auditable code

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Node.js, Express, tRPC 11
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: WebAuthn/FIDO2, OAuth
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Testing**: Playwright (E2E), Vitest (Unit)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sir-william/yubipass-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sir-william/yubipass-manager/discussions)
- **Email**: support@yubipass.example.com
- **Documentation**: [https://docs.yubipass.example.com](https://docs.yubipass.example.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- [Yubico](https://www.yubico.com/) for YubiKey hardware and WebAuthn libraries
- [SimpleWebAuthn](https://simplewebauthn.dev/) for excellent WebAuthn implementation
- [Bitwarden](https://bitwarden.com/) for password manager inspiration
- The open-source community for amazing tools and libraries

## 📚 Additional Resources

- [WebAuthn Guide](https://webauthn.guide/)
- [Yubico Developer Portal](https://developers.yubico.com/)
- [FIDO Alliance](https://fidoalliance.org/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0  
**Maintained by**: YubiPass Manager Team
