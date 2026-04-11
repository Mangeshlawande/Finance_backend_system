# Finance Backend — Postman API Reference

> Base URL: `http://localhost:3002/api/v1`  
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

### GET /health

Verifies the server is running. No auth required.

**Request**
```
GET {{baseUrl}}/health
```

**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Service is healthy",
    "data": {
        "status": "OK",
        "timestamp": "2026-04-07T13:17:56.240Z",
        "uptime": 47.372532238
    }
}

```

---

## 2. Auth Routes

### POST /auth/register

Creates a new user account. Default role is `viewer`.

**Request**
```
POST {{baseUrl}}/auth/sign-up

Content-Type: application/json

```

**Body**
```json
{
  "name": "apple",
  "email": "apple@example.com",
  "password": "apple123",
  "role":"viewer"
}

```

| Field | Required | Rules |
|-------|----------|-------|
| `email` | ✅ | Valid email format |
| `name` | ✅ | Lowercase, min 3 chars, unique |
| `password` | ✅ | Min 6 characters |
| `role` | ❌ | enum |

**Expected Response** `201 Created`
```json
{
    "statusCode": 201,
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "id": "83013864-9260-4f71-93e2-a01b30ad0207",
            "name": "lime",
            "email": "lime@example.com",
            "role": "analyst"
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
POST {{baseUrl}}/auth/sign-in

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
    "message": "Signed in successfully",
    "data": {
        "user": {
            "id": "83013864-9260-4f71-93e2-a01b30ad0207",
            "name": "lime",
            "email": "lime@example.com",
            "role": "analyst",
            "is_active": true,
            "created_at": "2026-04-07T13:34:17.674Z",
            "updated_at": "2026-04-07T13:34:17.674Z"
        }
    }
}

```


**Error Cases**
- `400` — Invalid credentials
- `403` — Account deactivated

---

### POST /auth/logout

🔒 Requires auth. Clears the refresh token and cookies.

**Request**
```
POST {{baseUrl}}/auth/sign-out
Authorization: Bearer {{token}}
```

**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Signed out successfully",
    "data": {}
}

```

---

### GET /auth/me

🔒 Requires auth. Returns the currently authenticated user's profile.

**Request**
```
GET {{baseUrl}}/auth/me
```

**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Current user fetched",
    "data": {
        "user": {
            "id": "48d7442e-9c4a-4aab-a0d9-6cec13a04413",
            "email": "master@example.com",
            "role": "admin",
            "iat": 1775881220,
            "exp": 1775967620
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

Returns a  list of all users.

**Request**
```
GET {{baseUrl}}/users
Authorization: Bearer {{token}}
```
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Users retrieved",
    "data": {
        "users": [
            {
                "id": "349479e7-d460-4f4a-b826-46893ae70aea",
                "name": "System Admin",
                "email": "admin@finance.dev",
                "role": "admin",
                "is_active": true,
                "created_at": "2026-04-04T17:51:23.685Z",
                "updated_at": "2026-04-04T17:51:23.685Z"
            },
            {
                "id": "523f1687-3638-4292-8895-9bfdcc358ac8",
                "name": "mango",
                "email": "mango@example.com",
                "role": "analyst",
                "is_active": true,
                "created_at": "2026-04-05T08:32:57.506Z",
                "updated_at": "2026-04-05T08:45:57.845Z"
            },
            {
                "id": "5a9732bb-7169-4a27-ab71-56170f6155d2",
                "name": "orange",
                "email": "orange@example.com",
                "role": "analyst",
                "is_active": true,
                "created_at": "2026-04-05T08:34:16.442Z",
                "updated_at": "2026-04-05T08:34:16.442Z"
            },
            {
                "id": "48d7442e-9c4a-4aab-a0d9-6cec13a04413",
                "name": "master",
                "email": "master@example.com",
                "role": "admin",
                "is_active": true,
                "created_at": "2026-04-05T08:36:09.372Z",
                "updated_at": "2026-04-07T13:40:26.681Z"
            },
            {
                "id": "83013864-9260-4f71-93e2-a01b30ad0207",
                "name": "lime",
                "email": "lime@example.com",
                "role": "analyst",
                "is_active": true,
                "created_at": "2026-04-07T13:34:17.674Z",
                "updated_at": "2026-04-07T13:34:17.674Z"
            }
        ],
        "count": 5
    }
}
```

---

### GET /users/:userId

Returns a single user by their MongoDB ObjectId.

**Request**
```
GET {{baseUrl}}/users/user-id/: 349479e7-d460-4f4a-b826-46893ae70aea

```

**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "User retrieved",
    "data": {
        "user": {
            "id": "349479e7-d460-4f4a-b826-46893ae70aea",
            "name": "System Admin",
            "email": "admin@finance.dev",
            "role": "admin",
            "is_active": true,
            "created_at": "2026-04-04T17:51:23.685Z",
            "updated_at": "2026-04-04T17:51:23.685Z"
        }
    }
}

```

**Error Cases**
- `404` — User not found

---

### PATCH /users/:userId

Updates another user's role. Admins cannot change their own role.

**Request**
```
PUT {{baseUrl}}/users/user-id/: 63101b53-b359-4298-9fbe-5adde21d71c0

Content-Type: application/json
```

**Body**
```json
{
    "name": "Apple",
    "email": "apple@example.com",
    "role": "viewer"
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
    "message": "User updated",
    "data": {
        "user": {
            "id": "63101b53-b359-4298-9fbe-5adde21d71c0",
            "name": "Apple",
            "email": "apple@example.com",
            "role": "viewer",
            "is_active": true,
            "created_at": "2026-04-05T08:35:13.687Z",
            "updated_at": "2026-04-07T13:44:38.835Z"
        }
    }
}

```

**Error Cases**
- `400` — Trying to change own role
- `404` — User not found

---

### DELETE /users/:userId

Delete another user's Admins can delete

**Request**
```
DELETE {{baseUrl}}/users/:63101b53-b359-4298-9fbe-5adde21d71c0

```




**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "User deleted",
    "data": {
        "user": {
            "id": "63101b53-b359-4298-9fbe-5adde21d71c0",
            "email": "apple@example.com"
        }
    }
}

```

**Error Cases**
- `400` — Trying to change own role
- `404` — User not found

---


## 4. Financial Record Routes

> 🔒 All record routes require auth. Write operations require `admin`. Read operations require `admin` or `analyst`.

---

### GET /records

Returns a paginated, filtered, sorted list of financial records.

**Request**
```
GET {{baseUrl}}/records/get-records/
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



**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Records retrieved",
    "data": {
        "records": [
            {
                "id": 5,
                "amount": "800.00",
                "type": "expense",
                "category": "entertainment",
                "date": "2026-04-05T10:04:33.014Z",
                "description": "Movie and dinner",
                "created_by": "48d7442e-9c4a-4aab-a0d9-6cec13a04413",
                "created_at": "2026-04-05T10:04:35.948Z",
                "updated_at": "2026-04-05T10:04:35.948Z"
            },
            {
                "id": 4,
                "amount": "3000.00",
                "type": "expense",
                "category": "freelance",
                "date": "2026-04-05T10:03:59.764Z",
                "description": "Freelance project payment",
                "created_by": "48d7442e-9c4a-4aab-a0d9-6cec13a04413",
                "created_at": "2026-04-05T10:04:02.344Z",
                "updated_at": "2026-04-05T10:12:57.478Z"
            },
            {
                "id": 3,
                "amount": "1200.00",
                "type": "expense",
                "category": "transport",
                "date": "2026-04-05T10:03:41.791Z",
                "description": "Cab fare",
                "created_by": "48d7442e-9c4a-4aab-a0d9-6cec13a04413",
                "created_at": "2026-04-05T10:03:45.141Z",
                "updated_at": "2026-04-05T10:03:45.141Z"
            },
            {
                "id": 1,
                "amount": "5000.00",
                "type": "income",
                "category": "salary",
                "date": "2026-04-05T09:57:48.347Z",
                "description": "April salary payment",
                "created_by": "48d7442e-9c4a-4aab-a0d9-6cec13a04413",
                "created_at": "2026-04-05T09:57:50.883Z",
                "updated_at": "2026-04-05T09:57:50.883Z"
            }
        ],
        "pagination": {
            "total": 4,
            "page": "1",
            "limit": "20",
            "totalPages": 1,
            "hasNextPage": false
        }
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
GET {{baseUrl}}/records/recordby-id/: 6
```

**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Record retrieved",
    "data": {
        "record": {
            "id": 6,
            "amount": "8000.00",
            "type": "income",
            "category": "freelance",
            "date": "2026-04-07T14:04:09.881Z",
            "description": "web dev and tech-stack",
            "created_by": "48d7442e-9c4a-4aab-a0d9-6cec13a04413",
            "created_at": "2026-04-07T14:04:12.169Z",
            "updated_at": "2026-04-07T14:04:12.169Z"
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
POST {{baseUrl}}/records/create-record/

Content-Type: application/json
```

**Body**
```json
{

  "amount": 8000,
    "type": "income",
    "category": "freelance",
    "description": "web dev and tech-stack"
}

```

| Field | Required | Rules |
|-------|----------|-------|
| `amount` | ✅ | Positive number (> 0) |
| `type` | ✅ | `income` or `expense` |
| `category` | ❌ | See category list below (defaults to `other`) |
| `description` | ❌ | Max 500 characters |

**Available Categories**
`salary`, `freelance`, `investment`, `rent`, `utilities`, `groceries`, `transport`, `healthcare`, `education`, `entertainment`, `other`

**Expected Response** `201 Created`
```json
{
    "statusCode": 201,
    "success": true,
    "message": "Record created",
    "data": {
        "record": {
            "id": 6,
            "amount": "8000.00",
            "type": "income",
            "category": "freelance",
            "date": "2026-04-07T14:04:09.881Z",
            "description": "web dev and tech-stack",
            "created_by": "48d7442e-9c4a-4aab-a0d9-6cec13a04413",
            "created_at": "2026-04-07T14:04:12.169Z",
            "updated_at": "2026-04-07T14:04:12.169Z"
        }
    }
}
```

---

### PUT /records/:recordId

🔒 **Admin only.** Updates an existing financial record (only supplied fields are changed).

**Request**
```
PUT {{baseUrl}}/records/update-record/: 7

Content-Type: application/json
```

**Body** *(all fields optional)*
```json
{
    "amount": "1000.00",
    "type":"expense",
    "category": "utilities",
    "description": "snacks and others "
    
}

```

**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Record updated",
    "data": {
        "record": {
            "id": 7,
            "amount": "1000.00",
            "type": "expense",
            "category": "utilities",
            "date": "2026-04-07T14:04:33.991Z",
            "description": "snacks and others",
            "created_by": "48d7442e-9c4a-4aab-a0d9-6cec13a04413",
            "created_at": "2026-04-07T14:04:36.328Z",
            "updated_at": "2026-04-07T14:09:22.767Z"
        }
    }
}
```

**Error Cases**
- `404` — Record not found

---

### DELETE /records/:recordId

🔒 **Admin only.** Soft-deletes a financial record (sets `isDeleted: true`, record is not permanently removed).

**Request**
```
DELETE {{baseUrl}}/records/delete-record/: 5
```

**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Record deleted",
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
```

**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Summary retrieved",
    "data": {
        "totalIncome": 13000,
        "totalExpenses": 5200,
        "netBalance": 7800,
        "recordCount": 5
    }
}
```

---

### GET /dashboard/category-breakdown

Returns per-category totals split by income/expense type.

**Request**
```
GET {{baseUrl}}/dashboard/category-breakdown
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
    "message": "Category breakdown retrieved",
    "data": {
        "breakdown": [
            {
                "category": "freelance",
                "type": "income",
                "total": 8000,
                "count": 1
            },
            {
                "category": "salary",
                "type": "income",
                "total": 5000,
                "count": 1
            },
            {
                "category": "freelance",
                "type": "expense",
                "total": 3000,
                "count": 1
            },
            {
                "category": "transport",
                "type": "expense",
                "total": 1200,
                "count": 1
            },
            {
                "category": "utilities",
                "type": "expense",
                "total": 1000,
                "count": 1
            }
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

```

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `year` | number | Year to fetch (default: current year) |

**Example**
```
GET {{baseUrl}}/dashboard/monthly-trends
```

**Expected Response** `200 OK`
```json
{
    "statusCode": 200,
    "success": true,
    "message": "Monthly trends retrieved",
    "data": {
        "year": 2026,
        "trends": [
            {
                "month": 1,
                "income": 0,
                "expense": 0
            },
            {
                "month": 2,
                "income": 0,
                "expense": 0
            },
            {
                "month": 3,
                "income": 0,
                "expense": 0
            },
            {
                "month": 4,
                "income": 13000,
                "expense": 5200
            },
            {
                "month": 5,
                "income": 0,
                "expense": 0
            },
            {
                "month": 6,
                "income": 0,
                "expense": 0
            },
            {
                "month": 7,
                "income": 0,
                "expense": 0
            },
            {
                "month": 8,
                "income": 0,
                "expense": 0
            },
            {
                "month": 9,
                "income": 0,
                "expense": 0
            },
            {
                "month": 10,
                "income": 0,
                "expense": 0
            },
            {
                "month": 11,
                "income": 0,
                "expense": 0
            },
            {
                "month": 12,
                "income": 0,
                "expense": 0
            }
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
    "message": "Recent activity retrieved",
    "data": {
        "records": [
            {
                "id": 7,
                "amount": "1000.00",
                "type": "expense",
                "category": "utilities",
                "date": "2026-04-07T14:04:33.991Z",
                "description": "snacks and others",
                "created_at": "2026-04-07T14:04:36.328Z"
            },
            {
                "id": 6,
                "amount": "8000.00",
                "type": "income",
                "category": "freelance",
                "date": "2026-04-07T14:04:09.881Z",
                "description": "web dev and tech-stack",
                "created_at": "2026-04-07T14:04:12.169Z"
            },
            {
                "id": 4,
                "amount": "3000.00",
                "type": "expense",
                "category": "freelance",
                "date": "2026-04-05T10:03:59.764Z",
                "description": "Freelance project payment",
                "created_at": "2026-04-05T10:04:02.344Z"
            },
            {
                "id": 3,
                "amount": "1200.00",
                "type": "expense",
                "category": "transport",
                "date": "2026-04-05T10:03:41.791Z",
                "description": "Cab fare",
                "created_at": "2026-04-05T10:03:45.141Z"
            },
            {
                "id": 1,
                "amount": "5000.00",
                "type": "income",
                "category": "salary",
                "date": "2026-04-05T09:57:48.347Z",
                "description": "April salary payment",
                "created_at": "2026-04-05T09:57:50.883Z"
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