# Data classification and retention map

| Class | Examples | Storage and access | Initial retention rule |
|---|---|---|---|
| Public | Published content, organization profile, sanitized timeline | Public projection/CDN only | Governed review and archive dates |
| Internal | Drafts, workflow metadata, aggregate operations | Authenticated scoped access | Period plus documented archive window |
| Confidential | D-DAS contact, case body/internal notes, moderation evidence | Encrypted fields, strict RLS, masked lists, audited reveal/export | Purpose-specific expiry or hold |
| Restricted | Peppers, encryption keys, recovery and break-glass material | Deployment secret manager only | Rotate and revoke; never routine export |

Prohibited telemetry fields: full ticket, tracking/deletion secret, email, display name when unnecessary, case body, raw comment, attachment URL, service-role key.
