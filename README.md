# Bifrostvault

**Secure Password Manager with YubiKey Biometric Authentication**

Bifrostvault is a next-generation password manager that combines zero-knowledge encryption with YubiKey hardware authentication, including full support for YubiKey Bio's fingerprint biometric capabilities. Built on modern web technologies, Bifrostvault ensures your passwords remain secure while providing a seamless authentication experience.

---

## 🌉 Why Bifrostvault?

**Bifrost**, the rainbow bridge in Norse mythology, connects the mortal realm to Asgard, guarded by Heimdall. Similarly, **Bifrostvault** serves as your secure bridge to all your digital accounts, protected by the most advanced hardware authentication technology available.

### Key Features

**Zero-Knowledge Architecture**: Your passwords are encrypted in your browser before being stored. The server never sees your data in plaintext, ensuring complete privacy.

**YubiKey Bio Support**: Full integration with YubiKey Bio Series, enabling passwordless authentication using your fingerprint. Touch the sensor, and you're in—no passwords to remember.

**Multi-Key Support**: Compatible with YubiKey Bio, YubiKey 5, and Security Key series. Register multiple keys for backup and convenience across different devices.

**Military-Grade Encryption**: All vault entries are protected with AES-256-GCM encryption, the same standard used by governments and financial institutions worldwide.

**TOTP Two-Factor Authentication**: Built-in support for time-based one-time passwords (TOTP) with QR code generation and backup codes for emergency access.

**Modern Technology Stack**: Built with React 19, TypeScript, and tRPC for a fast, type-safe, and maintainable codebase that developers love.

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js 22+** - JavaScript runtime
- **pnpm** - Fast, disk space efficient package manager
- **MySQL or TiDB** - Database for storing encrypted vault data
- **YubiKey** (optional but recommended) - Hardware security key for authentication

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/sir-william/Bifrostvault.git
cd Bifrostvault
pnpm install
```

### Configuration

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DATABASE_URL=mysql://user:password@localhost:3306/bifrostvault

# WebAuthn Configuration
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# Environment
NODE_ENV=development
```

### Database Setup

Initialize the database schema:

```bash
pnpm db:push
```

### Development Server

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

---

## 🔐 Security Features

### Client-Side Encryption

All sensitive data is encrypted in the browser using the Web Crypto API before transmission to the server. The encryption process uses:

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: Unique per-user cryptographic salt
- **Vault Key**: Encrypted with master password, never stored in plaintext

### Hardware Authentication

Bifrostvault leverages WebAuthn/FIDO2 protocol for phishing-resistant authentication:

- **YubiKey Bio**: Fingerprint biometric authentication
- **YubiKey 5**: Touch-based authentication with optional PIN
- **Security Key**: FIDO2-certified hardware authentication
- **Discoverable Credentials**: Passwordless login support

### Zero-Knowledge Architecture

The server architecture ensures complete privacy:

- Server never receives plaintext passwords
- Encryption keys are derived client-side only
- Vault entries are stored as encrypted blobs
- Even database administrators cannot decrypt your data

---

## 🔑 YubiKey Support

### Supported Models

Bifrostvault has been tested and optimized for the following YubiKey models:

| Model | Firmware | Biometric | Max Credentials | Status |
|-------|----------|-----------|-----------------|--------|
| YubiKey Bio - FIDO Edition | 5.5.6+ | ✅ Fingerprint | 25 (5.5.6), 100 (5.7+) | Fully Supported |
| YubiKey Bio - Multi-protocol | 5.5.6+ | ✅ Fingerprint | 25 (5.5.6), 100 (5.7+) | Fully Supported |
| YubiKey 5 Series | 5.0+ | ❌ Touch only | 100 | Fully Supported |
| YubiKey 5 FIPS | 5.4+ | ❌ Touch only | 100 | Fully Supported |
| Security Key Series | 5.0+ | ❌ Touch only | 100 | Fully Supported |
| Security Key NFC | 5.2+ | ❌ Touch only | 100 | Fully Supported |

### YubiKey Bio Features

The YubiKey Bio integration includes:

- **Fingerprint Authentication**: Touch the sensor to authenticate
- **PIN Fallback**: Use PIN after 3 failed fingerprint attempts
- **Credential Management**: Track and manage up to 25 discoverable credentials
- **Biometric Status**: Visual indicators for biometric verification
- **Blocked State Handling**: Clear guidance when biometric is blocked

For detailed setup instructions, see the [YubiKey Bio Guide](./docs/yubikey/BIO_GUIDE.md).

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

### User Documentation
- **[User Guide](./docs/user/USER_GUIDE.md)** - Complete guide for end users
- **[YubiKey Setup](./docs/yubikey/SETUP_GUIDE.md)** - Hardware key configuration
- **[Troubleshooting](./docs/user/TROUBLESHOOTING.md)** - Common issues and solutions
- **[FAQ](./docs/user/FAQ.md)** - Frequently asked questions

### Developer Documentation
- **[Developer Guide](./docs/developer/DEVELOPER_GUIDE.md)** - Development setup
- **[Architecture](./docs/developer/ARCHITECTURE.md)** - System design
- **[API Reference](./docs/api/API_REFERENCE.md)** - Complete API documentation
- **[Testing Guide](./docs/developer/TESTING.md)** - E2E and unit testing
- **[Contributing](./docs/developer/CONTRIBUTING.md)** - Contribution guidelines

### Security Documentation
- **[Security Overview](./docs/security/SECURITY_OVERVIEW.md)** - Security architecture
- **[Encryption Details](./docs/security/ENCRYPTION.md)** - Cryptographic implementation
- **[WebAuthn Implementation](./docs/security/WEBAUTHN.md)** - FIDO2 integration
- **[Best Practices](./docs/security/BEST_PRACTICES.md)** - Security recommendations

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern UI library with concurrent features
- **TypeScript** - Type-safe JavaScript for better developer experience
- **Tailwind CSS 4** - Utility-first CSS framework
- **Wouter** - Lightweight routing library
- **TanStack Query** - Powerful data synchronization
- **Radix UI** - Accessible component primitives

### Backend
- **Node.js 22** - JavaScript runtime
- **Express** - Web application framework
- **tRPC 11** - End-to-end type-safe APIs
- **Drizzle ORM** - TypeScript ORM for SQL databases
- **SimpleWebAuthn** - WebAuthn/FIDO2 server library

### Security
- **Web Crypto API** - Browser-native cryptography
- **@simplewebauthn/browser** - WebAuthn client library
- **@simplewebauthn/server** - WebAuthn server library
- **Speakeasy** - TOTP implementation

### Testing
- **Playwright** - End-to-end testing framework
- **Vitest** - Unit testing framework
- **TypeScript** - Type checking

---

## 🧪 Testing

Bifrostvault includes comprehensive E2E tests covering all critical functionality:

### Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test suite
pnpm playwright test yubikey-registration

# Run tests in UI mode
pnpm playwright test --ui

# Generate test report
pnpm playwright show-report
```

### Test Coverage

The E2E test suite covers:

- **YubiKey Registration**: Standard keys, Bio keys, Security keys
- **Authentication**: Biometric auth, PIN fallback, blocked state handling
- **Vault Operations**: List, add, update, delete, search entries
- **TOTP Management**: Setup, enable, verify, backup codes
- **Error Handling**: Network failures, timeout, invalid input

For more details, see the [Testing Guide](./docs/developer/TESTING.md).

---

## 🚢 Deployment

### Production Build

Build the application for production:

```bash
pnpm build
```

This creates optimized bundles in the `dist/` directory.

### Environment Variables

Ensure the following environment variables are set in production:

```bash
DATABASE_URL=mysql://user:password@host:port/database
WEBAUTHN_RP_ID=yourdomain.com
WEBAUTHN_ORIGIN=https://yourdomain.com
NODE_ENV=production
```

### HTTPS Requirement

WebAuthn requires a secure context (HTTPS) in production. Ensure your deployment includes:

- Valid SSL/TLS certificate
- HTTPS redirect from HTTP
- Secure cookie settings
- CORS configuration

For detailed deployment instructions, see the [Deployment Guide](./docs/developer/DEPLOYMENT.md).

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and commit: `git commit -m 'Add amazing feature'`
4. **Push to your branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request** with a clear description

### Development Guidelines

- Write type-safe TypeScript code
- Add tests for new features
- Follow existing code style
- Update documentation as needed
- Ensure all tests pass before submitting

See [Contributing Guidelines](./docs/developer/CONTRIBUTING.md) for more details.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

Bifrostvault is built on the shoulders of giants. We thank:

- **[Yubico](https://www.yubico.com/)** for pioneering hardware authentication and providing excellent developer tools
- **[SimpleWebAuthn](https://simplewebauthn.dev/)** for the best WebAuthn implementation in the JavaScript ecosystem
- **[Bitwarden](https://bitwarden.com/)** for inspiring the password manager architecture
- **The Open Source Community** for countless libraries and tools that make this project possible

---

## 📞 Support

Need help? We're here for you:

- **📖 Documentation**: [docs/](./docs/)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/sir-william/Bifrostvault/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/sir-william/Bifrostvault/discussions)
- **📧 Email**: support@bifrostvault.example.com

---

## 🔗 Links

- **Website**: [https://bifrostvault.example.com](https://bifrostvault.example.com)
- **Documentation**: [https://docs.bifrostvault.example.com](https://docs.bifrostvault.example.com)
- **GitHub**: [https://github.com/sir-william/Bifrostvault](https://github.com/sir-william/Bifrostvault)
- **Yubico Developer Portal**: [https://developers.yubico.com/](https://developers.yubico.com/)

---

**Built with ❤️ and 🔐 by the Bifrostvault Team**

*Securing your digital realm, one password at a time.*
