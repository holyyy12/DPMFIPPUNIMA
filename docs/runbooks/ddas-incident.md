# D-DAS incident response

- Sev-1 examples: confirmed cross-ticket access, tracking secret in logs/cache/analytics, acknowledged submission loss.
- Acknowledge within 15 minutes, contain access immediately, preserve evidence, rotate exposed secrets, and disable affected feature flag.
- Do not include case body, contact, secret, or full ticket in incident chat, status page, or telemetry.
- Reconcile durable cases against receipts, restore only into an isolated environment, and document counts/checksums.
- Resume after privacy/security owner approves remediation and negative tests pass.
