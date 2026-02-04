---
title: Security (CVE and Validation)
category: Features
source: https://github.com/ruvnet/claude-flow/blob/main/v3/@claude-flow/security/README.md
---

# Security (@claude-flow/security)

CVE remediation, input/path validation, and secure credential handling.

## Addressed Issues

- **CVE-2**: Weak password hashing → bcrypt, 12+ rounds.
- **CVE-3**: Hardcoded credentials → crypto-secure generation.
- **HIGH-1**: Command injection → allowlist-based execution.
- **HIGH-2**: Path traversal → path validator and symlink handling.

## API Overview

```typescript
import { createSecurityModule } from '@claude-flow/security'

const security = createSecurityModule({
  projectRoot: '/workspaces/project',
  hmacSecret: process.env.HMAC_SECRET!,
  bcryptRounds: 12,
  allowedCommands: ['git', 'npm', 'npx', 'node'],
})

const hash = await security.passwordHasher.hash('userPassword123')
const pathResult = await security.pathValidator.validate('/workspaces/project/src/file.ts')
const output = await security.safeExecutor.execute('git', ['status'])
const creds = await security.credentialGenerator.generate()
```

## AIDefence (Threat Detection)

Separate layer for prompt injection, jailbreak, PII: sub-10ms detection, HNSW for similar threats, self-learning from feedback. Use `isSafe()`, `checkThreats()`, or MCP tools (e.g. `aidefence_scan`) at system boundaries.
