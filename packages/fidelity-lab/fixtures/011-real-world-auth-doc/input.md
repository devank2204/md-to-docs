# Authentication Architecture

## Overview

This document describes the authentication and authorization system for the Platform API. The system uses JWT-based authentication with refresh token rotation.

> [!IMPORTANT]
> All API endpoints require authentication starting with v2.0. Legacy API keys will be deprecated on January 1, 2027.

## System Architecture

The authentication flow involves three primary services:

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **API Gateway** | Node.js + Express | Request routing, rate limiting |
| **Auth Service** | Go | Token issuance, validation, revocation |
| **User Store** | PostgreSQL | User credentials, sessions, audit log |

## Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Auth Service validates credentials against User Store
3. On success, Auth Service issues:
   - Access token (JWT, 15-minute expiry)
   - Refresh token (opaque, 7-day expiry)
4. Client stores tokens securely
5. Client includes access token in `Authorization` header

### Token Refresh

When the access token expires:

1. Client sends refresh token to `/api/auth/refresh`
2. Auth Service validates the refresh token
3. Old refresh token is revoked (rotation)
4. New access + refresh tokens are issued

> [!WARNING]
> Refresh token reuse after rotation indicates a potential token theft. The system will revoke all tokens for the affected user.

## API Endpoints

| Endpoint | Method | Auth | Rate Limit | Description |
| :--- | :---: | :---: | ---: | :--- |
| `/auth/login` | POST | None | 10/min | Authenticate user |
| `/auth/refresh` | POST | Refresh | 20/min | Rotate tokens |
| `/auth/logout` | POST | JWT | 100/min | Revoke session |
| `/auth/sessions` | GET | JWT | 50/min | List active sessions |
| `/users/me` | GET | JWT | 200/min | Current user profile |

## Implementation

### Login Handler

```typescript
async function handleLogin(req: LoginRequest): Promise<AuthResponse> {
  const { email, password } = req.body;

  // Validate credentials
  const user = await userStore.findByEmail(email);
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Check account status
  if (user.status === 'locked') {
    throw new AuthenticationError('Account is locked');
  }

  // Issue tokens
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: '15m' }
  );

  const refreshToken = await tokenStore.createRefreshToken(user.id);

  // Audit log
  await auditLog.record('login', { userId: user.id, ip: req.ip });

  return { accessToken, refreshToken, expiresIn: 900 };
}
```

### Middleware

```typescript
function requireAuth(requiredRole?: UserRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Missing authentication' });
    }

    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = payload;

      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
```

## Security Considerations

> [!CAUTION]
> Never store JWTs in `localStorage`. Use `httpOnly` cookies or secure in-memory storage.

Key security measures:

- [x] Password hashing with bcrypt (cost factor 12)
- [x] Refresh token rotation on every use
- [x] Rate limiting on authentication endpoints
- [x] Account lockout after 5 failed attempts
- [ ] Implement PKCE for OAuth flows
- [ ] Add WebAuthn/passkey support
- [ ] Implement certificate pinning for mobile clients

## Migration Guide

For teams migrating from legacy API keys:

1. Generate a service account in the admin console
2. Exchange your API key for OAuth credentials
3. Update your client to use the new token flow:

```python
import httpx

class PlatformClient:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self._token = None

    async def authenticate(self):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.platform.com/auth/token",
                json={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                }
            )
            self._token = response.json()["access_token"]

    async def get_users(self):
        async with httpx.AsyncClient() as client:
            return await client.get(
                "https://api.platform.com/users",
                headers={"Authorization": f"Bearer {self._token}"}
            )
```

> **Note:** The legacy API key system will continue to work in read-only mode until the deprecation date.

---

*Last updated: September 2026 · Author: Platform Engineering Team*
