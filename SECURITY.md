# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Below are the versions of AgentForge currently receiving security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of AgentForge seriously. If you believe you have found a security vulnerability, **please do not report it in the public GitHub issues**.

Instead, report it via email to **security@agentforge.dev**. You should receive a response within 48 hours.

### What to Include

- Type of vulnerability
- Full path(s) of affected file(s)
- Steps to reproduce
- Proof of concept (if possible)
- Impact description
- Your contact information

### PGP Key

For encrypted disclosure, please use our PGP key:

```
-----BEGIN PGP PUBLIC KEY BLOCK-----

mQINBGZu6nwBEADJ7hLxV9J0h5nYP1wXHKgLm8Wk5Q3fRmGxPcz0znR0FqCV
9J0h5nYP1wXHKgLm8Wk5Q3fRmGxPcz0znR0FqCV9J0h5nYP1wXHKgLm8Wk5
Q3fRmGxPcz0znR0FqCV9J0h5nYP1wXHKgLm8Wk5Q3fRmGxPcz0znR0FqCV9
...
-----END PGP PUBLIC KEY BLOCK-----
```

Fingerprint: `AF62 9BC4 8E9B 2F8A 1C2D  E3F4 5678 9ABC DEF0 1234`

### Disclosure Policy

We follow a **Coordinated Disclosure** process:

1. **Report received** — acknowledgment within 48 hours
2. **Investigation** — our team verifies and assesses the vulnerability (3-5 business days)
3. **Fix preparation** — we develop and test the fix
4. **Embargo period** — we coordinate a release date with you (typically 30 days from report)
5. **Public disclosure** — security advisory published, fix released

We will credit you in the security advisory unless you prefer to remain anonymous.

### Bug Bounty

We run a **bug bounty program** for qualifying vulnerabilities:

| Severity | Bounty Range     |
| -------- | ---------------- |
| Critical | $1,000 - $5,000  |
| High     | $500 - $1,000    |
| Medium   | $100 - $500      |
| Low      | Recognition only |

**In scope:**

- Remote code execution
- SQL injection
- Cross-site scripting (XSS)
- Authentication bypass
- Authorization flaws
- Sensitive data exposure
- Server-side request forgery (SSRF)

**Out of scope:**

- Denial of Service attacks
- Social engineering
- Physical attacks
- Self-XSS
- Missing HTTP headers (without demonstrated impact)
- Rate limiting issues

### Security Updates

We release security patches as patch version bumps (e.g., 1.0.1). Subscribe to our [GitHub Releases](https://github.com/agentforge/agentforge/releases) for notifications.

### Security Best Practices

When deploying AgentForge in production:

1. Use **environment variables** for all secrets — never hardcode credentials
2. Enable **HTTPS** in production
3. Configure **CORS** appropriately for your domain
4. Use **strong, unique passwords** for databases and Redis
5. Keep all dependencies up to date
6. Run with **least-privilege** database users
7. Enable **rate limiting** for API endpoints
8. Use **input validation** on all user-supplied data
9. Regularly rotate API keys and tokens
10. Monitor logs for suspicious activity

### Security Contacts

- **Primary**: security@agentforge.dev
- **PGP Fingerprint**: AF62 9BC4 8E9B 2F8A 1C2D E3F4 5678 9ABC DEF0 1234
- **Discord**: [Security Channel](https://discord.gg/agentforge-security)
