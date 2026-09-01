# Threat model baseline

| Threat | Asset | Mandatory controls | Verification |
|---|---|---|---|
| D-DAS enumeration or ticket leakage | Cases, contact, timeline | Independent high-entropy secret, generic response, rate limit, no-store/noindex, sanitized projection | Cross-ticket, cache, referer, log, and brute-force negative tests |
| Stored XSS | Public readers and admins | Versioned block schema, write/render sanitization, CSP, safe links/embeds | Payload corpus and DAST |
| Privilege escalation | IAM, content, cases, audit | Server authorization, deny-by-default RLS, explicit deny, AAL2, no self-approval | Role/unit/expired/suspended matrix |
| Malicious upload | Readers, storage, staff | Signature/MIME/size validation, quarantine, malware scan, short signed URL | Upload bypass tests |
| Audit tampering | Institutional evidence | Append-only grants, chained hashes, restricted read, daily integrity job | UPDATE/DELETE denial and chain verification |
| Data loss after receipt | D-DAS trust | Transactional idempotent commit before receipt, reconciliation, PITR/exports | Retry/failure injection and restore drill |
| Analytics privacy leak | PII and secrets | Property allowlist and redaction; never send raw case/comment/contact data | Telemetry payload audit |

Trust boundaries: public browser → CDN/WAF → server contract/policy layer → Supabase Auth/Postgres/Storage. UI visibility is never an authorization boundary.
