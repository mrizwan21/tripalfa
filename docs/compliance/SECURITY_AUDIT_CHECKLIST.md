# Security Audit Checklist - Production Payment Gateway Deployment

## Pre-Deployment Security Verification (MANDATORY)

### 1. API Key Security

#### Stripe

- [ ] API key is LIVE key (starts with `sk_live_`)
- [ ] API key has NEVER been used in staging/test environments
- [ ] API key is NOT visible in any logs, version control, or backups
- [ ] API key is stored ONLY in secrets management system
- [ ] API key rotation schedule established (quarterly minimum)
- [ ] Previous API keys have been revoked/disabled
- [ ] Restricted API keys created for limited operations
- [ ] API key access is logged and audited

#### PayPal

- [ ] Client ID is from production account
- [ ] Client Secret has NEVER been exposed in logs/version control
- [ ] Webhook ID is production webhook ID
- [ ] Account is fully merchants verified (not in restricted mode)
- [ ] Credentials stored ONLY in secrets management system
- [ ] Credential rotation schedule established (quarterly minimum)
- [ ] API credentials tested against production PayPal API

### 2. Database Security

- [ ] Database is managed RDS or equivalent (not local)
- [ ] Database uses encrypted RDS instance
- [ ] Database connection requires SSL/TLS (sslmode=require)
- [ ] Database password is strong (>16 characters, mixed case, symbols, numbers)
- [ ] Database password is stored in secrets management system
- [ ] Database user has minimal required permissions (principle of least privilege)
- [ ] Database has automated daily backups enabled
- [ ] Backup retention is set to >= 30 days
- [ ] Backup encryption is enabled
- [ ] Cross-region backup replication enabled
- [ ] Database read replicas configured for high availability
- [ ] Master-slave replication lag is monitored
- [ ] Regular backup restore tests documented and passed
- [ ] Recovery Time Objective (RTO) is <= 1 hour
- [ ] Recovery Point Objective (RPO) is <= 15 minutes

### 3. Network Security

- [ ] HTTPS/TLS enforced on all endpoints (no HTTP)
- [ ] SSL/TLS certificate from trusted CA (not self-signed)
- [ ] SSL/TLS certificate valid for correct domains
- [ ] SSL/TLS certificate will auto-renew before expiration
- [ ] TLS version 1.3 configured (minimum TLS 1.2)
- [ ] Weak ciphers disabled (only modern ciphers)
- [ ] DDoS protection enabled (CloudFlare, AWS Shield)
- [ ] Web Application Firewall (WAF) configured
- [ ] Reverse proxy (Nginx/Apache) configured
- [ ] Rate limiting configured at proxy level
- [ ] IP whitelisting for webhook sources enabled (Stripe/PayPal IPs)
- [ ] Firewall rules restrict database access to application servers only
- [ ] VPC security groups configured for zero-trust networking
- [ ] Network segmentation implemented (public/private subnets)
- [ ] No public internet access to database

### 4. Authentication & Authorization

- [ ] API authentication tokens/keys generated
- [ ] API authentication tokens have expiration
- [ ] API authentication tokens are rotated regularly
- [ ] Service-to-service authentication configured (wallet service)
- [ ] Internal service keys are different from external API keys
- [ ] Role-based access control (RBAC) implemented
- [ ] Admin access requires MFA (multi-factor authentication)
- [ ] User permissions audited (principle of least privilege)
- [ ] API key scope is limited to only required operations
- [ ] API key rotation before production deployment completed

### 5. Data Encryption

- [ ] Data in transit: TLS 1.3 encryption
- [ ] Data at rest: Database field-level encryption for sensitive data
- [ ] Encryption keys stored in secret management system
- [ ] Encryption key rotation schedule established
- [ ] Sensitive fields encrypted: card numbers, CVV, tokens
- [ ] Encryption algorithm: AES-256 minimum
- [ ] Key derivation function: PBKDF2, bcrypt, or Argon2

### 6. PCI Compliance

- [ ] PCI-DSS compliance assessment completed
- [ ] PCI-DSS version 3.2.1+ implemented
- [ ] Card data never stored (tokenization only)
- [ ] Stripe/PayPal handles card processing (not local)
- [ ] No card data in logs or error messages
- [ ] PCI Qualified Security Assessor (QSA) audit scheduled
- [ ] Vulnerability scanning enabled (ASV - Approved Scanning Vendor)
- [ ] Penetration testing scheduled annually
- [ ] Security patches applied within 30 days
- [ ] Intrusion detection system enabled

### 7. Secrets Management

- [ ] AWS Secrets Manager or HashiCorp Vault in use
- [ ] All credentials stored in secrets management (NOT in .env files)
- [ ] Secrets have automated rotation enabled
- [ ] Audit logging for all secret access enabled
- [ ] Access to secrets is restricted (least privilege)
- [ ] Secrets encryption uses KMS keys
- [ ] KMS key rotation enabled
- [ ] No secrets in git history
- [ ] .gitignore includes all sensitive files
- [ ] Secret scanning tools enabled on repository

### 8. Logging & Monitoring

- [ ] Structured logging (JSON format) implemented
- [ ] Sensitive data redaction enabled (PII, card data)
- [ ] ALL payment transactions logged
- [ ] ALL webhook events logged
- [ ] Log aggregation to CloudWatch/ELK enabled
- [ ] Log retention set to >= 90 days
- [ ] Log analysis and alerting configured
- [ ] Anomaly detection enabled
- [ ] Failed authentication attempts logged and alerting
- [ ] Large transaction alerts configured
- [ ] Failed payment retry alerts configured
- [ ] Webhook failure alerts configured

### 9. Error Handling

- [ ] Generic error messages shown to users (no sensitive data)
- [ ] Detailed errors logged server-side for debugging
- [ ] Error codes don't reveal internal system details
- [ ] Stack traces NEVER shown to users
- [ ] Error logging doesn't include card numbers/CVV
- [ ] 500 errors trigger automatic Sentry alerts
- [ ] Webhook signature validation failures logged
- [ ] Database connection errors handled gracefully

### 10. Monitoring & Alerting

- [ ] Sentry configured for error tracking
- [ ] DataDog/CloudWatch configured for metrics
- [ ] PagerDuty configured for incident escalation
- [ ] Slack integration for team notifications
- [ ] Alert thresholds tuned and tested
- [ ] On-call schedule established
- [ ] Runbooks created for common issues
- [ ] Escalation paths documented
- [ ] Incident communication procedures defined
- [ ] Post-incident review process established

### 11. Disaster Recovery

- [ ] Disaster recovery plan documented
- [ ] RTO (Recovery Time Objective) defined: <= 1 hour
- [ ] RPO (Recovery Point Objective) defined: <= 15 minutes
- [ ] Backup strategy documented
- [ ] Backup testing performed >= quarterly
- [ ] Database restore procedures tested
- [ ] Data restoration time measured and documented
- [ ] Failover procedures tested
- [ ] Cross-region replication tested
- [ ] Cold standby/warm standby infrastructure prepared

### 12. Compliance & Audit

- [ ] Privacy policy updated for payment processing
- [ ] Terms of service updated for payment terms
- [ ] Data retention policy defined and implemented
- [ ] GDPR compliance for EU users
- [ ] CCPA compliance for CA users
- [ ] Right to erasure (forget me) implemented (if required)
- [ ] Audit trail for all transactions >= 7 years
- [ ] Audit trail immutable (append-only logs)
- [ ] Annual audit scheduled
- [ ] Compliance framework: SOC 2, PCI-DSS, GDPR, etc.

### 13. Development Best Practices

- [ ] Code review process mandatory (peer review)
- [ ] Static code analysis enabled (ESLint, SonarQube)
- [ ] Dependency vulnerability scanning enabled (npm audit)
- [ ] Security testing in CI/CD pipeline
- [ ] Secrets not stored in code/config files
- [ ] No hardcoded URLs, passwords, or keys
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Cross-site scripting (XSS) prevention
- [ ] Cross-site request forgery (CSRF) protection
- [ ] Session security (secure, httpOnly, sameSite cookies)

### 14. Third-Party Security

- [ ] Stripe security practices reviewed
- [ ] PayPal security practices reviewed
- [ ] AWS/Cloud provider security reviewed
- [ ] Third-party dependencies audited
- [ ] Outdated dependencies updated
- [ ] Vulnerable dependencies identified and patched
- [ ] License compliance verified

### 15. Incident Response

- [ ] Security incident response plan documented
- [ ] Incident reporting procedures defined
- [ ] Critical asset inventory maintained
- [ ] Incident communication template created
- [ ] Post-incident review process established
- [ ] Breach notification procedures documented
- [ ] Data breach notification timeline: <= 72 hours
- [ ] Regulatory breach reporting procedures established

### 16. Testing & Validation

- [ ] Penetration testing scheduled annually
- [ ] Red team exercise scheduled annually
- [ ] Load testing completed (capacity verified)
- [ ] Failure mode analysis (FMEA) completed
- [ ] Security regression tests automated
- [ ] API security tests included in CI/CD
- [ ] Error scenario testing completed
- [ ] Webhook validation testing completed
- [ ] Rate limiting tested and verified
- [ ] Idempotency tested and verified

### 17. Operational Security

- [ ] Change control procedures established
- [ ] Deployment approval required (multiple stakeholders)
- [ ] Staged rollout planned (not all users at once)
- [ ] Rollback procedure documented and tested
- [ ] Zero-downtime deployment possible
- [ ] Blue-green deployment strategy analyzed
- [ ] Canary deployment strategy analyzed
- [ ] Infrastructure as Code (IaC) used
- [ ] Automated testing in deployment pipeline
- [ ] Manual sanity checks before production deployment

### 18. Team & Training

- [ ] Security training completed by all team members
- [ ] PCI-DSS training completed by relevant team members
- [ ] Payment processor API training completed
- [ ] Incident response training completed
- [ ] On-call rotation established
- [ ] Escalation procedures understood by team
- [ ] Security best practices documented
- [ ] Code security guidelines established

---

## Sign-Off

**All 18 sections must be completed (all checkboxes checked) before production deployment:**

| Section | Reviewer | Date | Approved |
|---------|----------|------|----------|
| 1. API Key Security | | | ☐ |
| 2. Database Security | | | ☐ |
| 3. Network Security | | | ☐ |
| 4. Authentication & Authorization | | | ☐ |
| 5. Data Encryption | | | ☐ |
| 6. PCI Compliance | | | ☐ |
| 7. Secrets Management | | | ☐ |
| 8. Logging & Monitoring | | | ☐ |
| 9. Error Handling | | | ☐ |
| 10. Monitoring & Alerting | | | ☐ |
| 11. Disaster Recovery | | | ☐ |
| 12. Compliance & Audit | | | ☐ |
| 13. Development Best Practices | | | ☐ |
| 14. Third-Party Security | | | ☐ |
| 15. Incident Response | | | ☐ |
| 16. Testing & Validation | | | ☐ |
| 17. Operational Security | | | ☐ |
| 18. Team & Training | | | ☐ |

---

## Executive Approval

**MUST be signed before production deployment:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Lead | _________________ | _________ | _________________ |
| Infrastructure Lead | _________________ | _________ | _________________ |
| Payment Systems Lead | _________________ | _________ | _________________ |
| CTO/VP Engineering | _________________ | _________ | _________________ |

---

**Document Version**: 4.4.0  
**Last Updated**: March 2, 2026  
**Status**: Security Audit Checklist for Production Deployment
