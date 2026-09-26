Simple table:

| Name | Role | Team |
| --- | --- | --- |
| Alice | Engineer | Platform |
| Bob | Designer | Product |
| Carol | Manager | Engineering |

Table with alignment:

| Left | Center | Right |
| :--- | :---: | ---: |
| L1 | C1 | R1 |
| L2 | C2 | R2 |
| L3 | C3 | R3 |

Table with inline formatting:

| Feature | Status | Notes |
| --- | --- | --- |
| **Authentication** | ✅ Done | Uses `JWT` tokens |
| *Authorization* | 🔄 In Progress | [RBAC](https://example.com) based |
| ~~Legacy Auth~~ | ❌ Removed | Deprecated in v2 |

Wide table (many columns):

| API | Method | Auth | Rate Limit | Cache | Response | Status |
| --- | --- | --- | --- | --- | --- | --- |
| /users | GET | JWT | 100/min | 5min | JSON | Active |
| /users/:id | GET | JWT | 200/min | 2min | JSON | Active |
| /auth/login | POST | None | 10/min | None | JSON | Active |
| /auth/refresh | POST | Refresh | 20/min | None | JSON | Active |
