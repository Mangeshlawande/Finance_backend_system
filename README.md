# Finance Backend — Postman API Reference

> Base URL: `http://localhost:3000/api/v1`  
> All protected routes require the `Authorization: Bearer <accessToken>` header **or** the `accessToken` cookie set at login.

---

## Quick-Start Checklist

1. Copy `.env.example` → `.env` and fill in your secrets
2. Start the server: `npm run dev`
3. In Postman, create a **Collection Variable** called `baseUrl` = `http://localhost:3000/api/v1`
4. Register an admin user → log in → copy the `accessToken` from the response → paste it into a **Collection Variable** called `token`
5. Set `Authorization: Bearer {{token}}` as a collection-level header

---

## Role Matrix

| Role | Auth | Users (admin only) | Records | Dashboard |
|------|------|--------------------|---------|-----------|
| **admin** | ✅ | ✅ Full access | ✅ Full CRUD | ✅ |
| **analyst** | ✅ | ❌ | ✅ Read only | ✅ |
| **viewer** | ✅ | ❌ | ❌ | ✅ |

> New users register as **viewer** by default. An admin must promote them.

---

## 1. Healthcheck

### GET /healthcheck

Verifies the server is running. No auth required.

**Request**
```
GET {{baseUrl}}/healthcheck
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "OK",
  "data": {}
}
```

---

## 2. Auth Routes

### POST /auth/register

Creates a new user account. Default role is `viewer`.

**Request**
```
POST {{baseUrl}}/auth/register
Content-Type: application/json
```

**Body**
```json
{
  "email": "john@example.com",
  "username": "johndoe",
  "password": "secret123",
  "fullName": "John Doe"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `email` | ✅ | Valid email format |
| `username` | ✅ | Lowercase, min 3 chars, unique |
| `password` | ✅ | Min 6 characters |
| `fullName` | ❌ | Any string |

**Expected Response** `201 Created`
```json
{
  "statusCode": 201,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "664abc...",
      "email": "john@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "role": "viewer",
      "isActive": true,
      "createdAt": "2026-04-01T10:00:00.000Z"
    }
  }
}
```

**Error Cases**
- `409` — Email or username already taken

---

### POST /auth/login

Authenticates a user and returns access + refresh tokens.

**Request**
```
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

**Body**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

> 💡 **Postman tip:** In the Tests tab, add:
> ```js
> const res = pm.response.json();
> pm.collectionVariables.set("token", res.data.accessToken);
> pm.collectionVariables.set("refreshToken", res.data.refreshToken);
> ```

**Error Cases**
- `400` — Invalid credentials
- `403` — Account deactivated

---

### POST /auth/logout

🔒 Requires auth. Clears the refresh token and cookies.

**Request**
```
POST {{baseUrl}}/auth/logout
Authorization: Bearer {{token}}
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Logged out successfully",
  "data": {}
}
```

---

### POST /auth/refresh-token

Issues a new access token using the refresh token. Can be sent via cookie or request body.

**Request**
```
POST {{baseUrl}}/auth/refresh-token
Content-Type: application/json
```

**Body** *(only needed if not using cookies)*
```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Tokens refreshed",
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

**Error Cases**
- `401` — Missing, invalid, or revoked refresh token

---

### GET /auth/me

🔒 Requires auth. Returns the currently authenticated user's profile.

**Request**
```
GET {{baseUrl}}/auth/me
Authorization: Bearer {{token}}
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Current user fetched",
  "data": {
    "user": {
      "_id": "664abc...",
      "email": "john@example.com",
      "username": "johndoe",
      "role": "admin",
      "isActive": true
    }
  }
}
```

---

### POST /auth/change-password

🔒 Requires auth. Changes password for the currently logged-in user.

**Request**
```
POST {{baseUrl}}/auth/change-password
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body**
```json
{
  "oldPassword": "secret123",
  "newPassword": "newSecret456"
}
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password changed successfully",
  "data": {}
}
```

**Error Cases**
- `400` — Old password is incorrect
- `400` — New password under 6 characters

---

## 3. User Management Routes

> 🔒 **All routes in this section require auth + `admin` role.**

---

### GET /users

Returns a paginated, filterable list of all users.

**Request**
```
GET {{baseUrl}}/users
Authorization: Bearer {{token}}
```

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |
| `role` | string | Filter by role: `admin`, `analyst`, `viewer` |
| `isActive` | boolean | Filter by status: `true` or `false` |
| `search` | string | Search by username, email, or fullName |

**Example**
```
GET {{baseUrl}}/users?role=analyst&isActive=true&page=1&limit=10
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Users fetched",
  "data": {
    "data": [ { ...user }, { ...user } ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### GET /users/:userId

Returns a single user by their MongoDB ObjectId.

**Request**
```
GET {{baseUrl}}/users/664abc123def456789012345
Authorization: Bearer {{token}}
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User fetched",
  "data": {
    "user": { "_id": "664abc...", "email": "...", "role": "analyst", ... }
  }
}
```

**Error Cases**
- `404` — User not found

---

### PATCH /users/:userId/role

Updates another user's role. Admins cannot change their own role.

**Request**
```
PATCH {{baseUrl}}/users/664abc123def456789012345/role
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body**
```json
{
  "role": "analyst"
}
```

| `role` values | |
|---|---|
| `admin` | Full access |
| `analyst` | Read records + dashboard |
| `viewer` | Dashboard only |

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User role updated",
  "data": { "user": { ...updatedUser } }
}
```

**Error Cases**
- `400` — Trying to change own role
- `404` — User not found

---

### PATCH /users/:userId/status

Activates or deactivates a user account. Admins cannot deactivate themselves.

**Request**
```
PATCH {{baseUrl}}/users/664abc123def456789012345/status
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body**
```json
{
  "isActive": false
}
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User deactivated successfully",
  "data": { "user": { ...updatedUser } }
}
```

**Error Cases**
- `400` — Trying to deactivate own account
- `404` — User not found

---

## 4. Financial Record Routes

> 🔒 All record routes require auth. Write operations require `admin`. Read operations require `admin` or `analyst`.

---

### GET /records

Returns a paginated, filtered, sorted list of financial records.

**Request**
```
GET {{baseUrl}}/records
Authorization: Bearer {{token}}
```

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |
| `type` | string | `income` or `expense` |
| `category` | string | See category list below |
| `startDate` | ISO 8601 | Filter from this date, e.g. `2026-01-01` |
| `endDate` | ISO 8601 | Filter to this date, e.g. `2026-03-31` |
| `sortBy` | string | Field to sort by (default: `date`) |
| `order` | string | `asc` or `desc` (default: `desc`) |

**Example**
```
GET {{baseUrl}}/records?type=expense&category=groceries&startDate=2026-01-01&endDate=2026-03-31&page=1&limit=20
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Records fetched successfully",
  "data": {
    "data": [ { ...record }, { ...record } ],
    "total": 48,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Error Cases**
- `403` — `viewer` role attempting access

---

### GET /records/:recordId

Returns a single financial record by ID.

**Request**
```
GET {{baseUrl}}/records/664def123abc456789012345
Authorization: Bearer {{token}}
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Record fetched",
  "data": {
    "record": {
      "_id": "664def...",
      "amount": 2500,
      "type": "income",
      "category": "salary",
      "date": "2026-03-31T00:00:00.000Z",
      "description": "March salary",
      "createdBy": { "username": "johndoe", "fullName": "John Doe" }
    }
  }
}
```

**Error Cases**
- `404` — Record not found (or soft-deleted)

---

### POST /records

🔒 **Admin only.** Creates a new financial record.

**Request**
```
POST {{baseUrl}}/records
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body**
```json
{
  "amount": 5000,
  "type": "income",
  "category": "salary",
  "date": "2026-04-01",
  "description": "April salary payment"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `amount` | ✅ | Positive number (> 0) |
| `type` | ✅ | `income` or `expense` |
| `category` | ❌ | See category list below (defaults to `other`) |
| `date` | ❌ | ISO 8601 date (defaults to today) |
| `description` | ❌ | Max 500 characters |

**Available Categories**
`salary`, `freelance`, `investment`, `rent`, `utilities`, `groceries`, `transport`, `healthcare`, `education`, `entertainment`, `other`

**Expected Response** `201 Created`
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Financial record created successfully",
  "data": {
    "record": { "_id": "...", "amount": 5000, "type": "income", ... }
  }
}
```

---

### PUT /records/:recordId

🔒 **Admin only.** Updates an existing financial record (only supplied fields are changed).

**Request**
```
PUT {{baseUrl}}/records/664def123abc456789012345
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body** *(all fields optional)*
```json
{
  "amount": 5500,
  "description": "April salary — revised"
}
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Record updated successfully",
  "data": { "record": { ...updatedRecord } }
}
```

**Error Cases**
- `404` — Record not found

---

### DELETE /records/:recordId

🔒 **Admin only.** Soft-deletes a financial record (sets `isDeleted: true`, record is not permanently removed).

**Request**
```
DELETE {{baseUrl}}/records/664def123abc456789012345
Authorization: Bearer {{token}}
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Record deleted successfully",
  "data": {}
}
```

**Error Cases**
- `404` — Record not found (or already deleted)

---

## 5. Dashboard Routes

> 🔒 All dashboard routes require auth. Accessible to **all roles** (`admin`, `analyst`, `viewer`).

---

### GET /dashboard/summary

Returns total income, total expenses, net balance, and record count. Supports optional date filtering.

**Request**
```
GET {{baseUrl}}/dashboard/summary
Authorization: Bearer {{token}}
```

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `startDate` | ISO 8601 | Optional start date |
| `endDate` | ISO 8601 | Optional end date |

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Summary fetched",
  "data": {
    "totalIncome": 85000,
    "totalExpenses": 32000,
    "netBalance": 53000,
    "recordCount": 47
  }
}
```

---

### GET /dashboard/category-breakdown

Returns per-category totals split by income/expense type.

**Request**
```
GET {{baseUrl}}/dashboard/category-breakdown
Authorization: Bearer {{token}}
```

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `startDate` | ISO 8601 | Optional start date |
| `endDate` | ISO 8601 | Optional end date |
| `type` | string | Optional: `income` or `expense` |

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Category breakdown fetched",
  "data": {
    "breakdown": [
      { "category": "salary", "type": "income", "total": 60000, "count": 3 },
      { "category": "rent", "type": "expense", "total": 15000, "count": 3 }
    ]
  }
}
```

---

### GET /dashboard/monthly-trends

Returns monthly income and expense totals for a full year (12-month matrix, easy to chart).

**Request**
```
GET {{baseUrl}}/dashboard/monthly-trends
Authorization: Bearer {{token}}
```

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `year` | number | Year to fetch (default: current year) |

**Example**
```
GET {{baseUrl}}/dashboard/monthly-trends?year=2026
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Monthly trends fetched",
  "data": {
    "year": 2026,
    "trends": [
      { "month": 1, "income": 20000, "expense": 8000 },
      { "month": 2, "income": 20000, "expense": 9500 },
      { "month": 3, "income": 22000, "expense": 7200 },
      ...
      { "month": 12, "income": 0, "expense": 0 }
    ]
  }
}
```

---

### GET /dashboard/weekly-trends

Returns daily income and expense totals for the last N days (max 30).

**Request**
```
GET {{baseUrl}}/dashboard/weekly-trends
Authorization: Bearer {{token}}
```

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `days` | number | Number of days to look back (default: 7, max: 30) |

**Example**
```
GET {{baseUrl}}/dashboard/weekly-trends?days=14
```

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Weekly/daily trends fetched",
  "data": {
    "days": 14,
    "trends": [
      { "date": "2026-03-23", "type": "income", "total": 5000, "count": 1 },
      { "date": "2026-03-23", "type": "expense", "total": 1200, "count": 3 }
    ]
  }
}
```

---

### GET /dashboard/recent-activity

Returns the N most recent financial records across all types and categories.

**Request**
```
GET {{baseUrl}}/dashboard/recent-activity
Authorization: Bearer {{token}}
```

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Number of records to return (default: 10, max: 50) |

**Expected Response** `200 OK`
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Recent activity fetched",
  "data": {
    "records": [
      {
        "_id": "664def...",
        "amount": 1200,
        "type": "expense",
        "category": "groceries",
        "date": "2026-04-03T00:00:00.000Z",
        "description": "Weekly groceries",
        "createdBy": { "username": "johndoe", "fullName": "John Doe" }
      }
    ]
  }
}
```

---

## Common Error Response Format

All errors follow this shape:

```json
{
  "statusCode": 404,
  "success": false,
  "message": "User not found",
  "errors": []
}
```

| Status Code | Meaning |
|-------------|---------|
| `400` | Bad request / validation failed |
| `401` | Missing or invalid token |
| `403` | Authenticated but insufficient role |
| `404` | Resource not found |
| `409` | Conflict (duplicate email/username) |
| `500` | Internal server error |

---

## Suggested Postman Testing Flow

1. **Register** a new user via `POST /auth/register`
2. **Login** via `POST /auth/login` — save `accessToken` to collection variable `token`
3. **Check profile** via `GET /auth/me`
4. As admin, **promote yourself** or another user via `PATCH /users/:userId/role`
5. **Create records** via `POST /records` (admin only)
6. **List and filter records** via `GET /records?type=expense&category=rent`
7. **Update a record** via `PUT /records/:recordId`
8. **Check the dashboard** — `/summary`, `/category-breakdown`, `/monthly-trends`, `/weekly-trends`, `/recent-activity`
9. **Delete a record** via `DELETE /records/:recordId`
10. **Refresh token** via `POST /auth/refresh-token` when access token expires
11. **Change password** via `POST /auth/change-password`
12. **Logout** via `POST /auth/logout`



## Postman Collection
link to Postman collection: [Finance Backend API.postman_collection](https://mangeshlawande511-6208082.postman.co/workspace/BackendDevMangesh's-Workspace~851b0605-d012-4812-889d-b03925aed595/collection/53762344-f95947ea-41e8-43e6-aa16-a4474d427c0e?action=share&source=copy-link&creator=53762344)