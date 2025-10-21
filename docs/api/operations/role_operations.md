# Role Operations API Documentation

This document describes all role administration endpoints available in the Auth API.

## Overview

The role operations provide REST API endpoints for managing Discord roles in the authentication system. These endpoints allow administrators to create, read, update, and delete roles, as well as configure which roles grant access to the system.

All role endpoints are prefixed with `/api/admin/roles` and require appropriate admin authentication.

## Endpoints

### 1. Get All Roles

**Endpoint**: `GET /api/admin/roles`

**Purpose**: Retrieve a list of all roles in the system.

**Authentication**: Required (Admin)

**Request Parameters**: None

**Response**: 
```json
[
  {
    "role_id": 1,
    "role_discord_id": "1234567890",
    "role_name": "Admin",
    "role_description": "Administrator role",
    "grants_access": true,
    "created_at": "2025-08-13T11:02:53.219959-05:00",
    "updated_at": "2025-08-13T11:02:53.219959-05:00"
  },
  {
    "role_id": 2,
    "role_discord_id": "0987654321",
    "role_name": "Member",
    "role_description": "Regular member role",
    "grants_access": true,
    "created_at": "2025-08-13T11:02:53.219959-05:00",
    "updated_at": "2025-08-13T11:02:53.219959-05:00"
  }
]
```

**Status Codes**:
- `200 OK`: Successfully retrieved roles

---

### 2. Get Role by ID

**Endpoint**: `GET /api/admin/roles/{role_id}`

**Purpose**: Retrieve a specific role by its database ID.

**Authentication**: Required (Admin)

**Path Parameters**:
- `role_id` (int): The internal database ID of the role

**Response**:
```json
{
  "role_id": 1,
  "role_discord_id": "1234567890",
  "role_name": "Admin",
  "role_description": "Administrator role",
  "grants_access": true,
  "created_at": "2025-08-13T11:02:53.219959-05:00",
  "updated_at": "2025-08-13T11:02:53.219959-05:00"
}
```

**Status Codes**:
- `200 OK`: Successfully retrieved role
- `404 Not Found`: Role with specified ID does not exist

---

### 3. Create Role

**Endpoint**: `POST /api/admin/roles`

**Purpose**: Create a new role in the system.

**Authentication**: Required (Admin)

**Request Body**:
```json
{
  "role_discord_id": "1234567890",
  "role_name": "New Role",
  "role_description": "Description of the role (optional)",
  "grants_access": true
}
```

**Field Descriptions**:
- `role_discord_id` (string, required): The Discord role ID (20 characters max)
- `role_name` (string, required): The name of the role (32 characters max)
- `role_description` (string, optional): A description of the role (255 characters max)
- `grants_access` (boolean, optional): Whether this role grants system access (defaults to `false`)

**Response**:
```json
{
  "role_id": 3,
  "role_discord_id": "1234567890",
  "role_name": "New Role",
  "role_description": "Description of the role",
  "grants_access": true,
  "created_at": "2025-10-21T17:27:00.000000-05:00",
  "updated_at": "2025-10-21T17:27:00.000000-05:00"
}
```

**Status Codes**:
- `201 Created`: Role successfully created
- `400 Bad Request`: Role with this Discord ID or name already exists
- `422 Unprocessable Entity`: Invalid request body format

**Error Response Example**:
```json
{
  "detail": "Role with this Discord ID or name already exists"
}
```

---

### 4. Update Role

**Endpoint**: `PATCH /api/admin/roles/{role_id}`

**Purpose**: Update an existing role. All fields are optional—only include the fields you want to update.

**Authentication**: Required (Admin)

**Path Parameters**:
- `role_id` (int): The internal database ID of the role to update

**Request Body** (all fields optional):
```json
{
  "role_name": "Updated Role Name",
  "role_description": "Updated description",
  "grants_access": false
}
```

**Field Descriptions**:
- `role_name` (string, optional): New name for the role
- `role_description` (string, optional): New description for the role
- `grants_access` (boolean, optional): Update whether this role grants access

**Response**:
```json
{
  "role_id": 3,
  "role_discord_id": "1234567890",
  "role_name": "Updated Role Name",
  "role_description": "Updated description",
  "grants_access": false,
  "created_at": "2025-10-21T17:27:00.000000-05:00",
  "updated_at": "2025-10-21T17:30:00.000000-05:00"
}
```

**Status Codes**:
- `200 OK`: Role successfully updated
- `400 Bad Request`: Role name already exists (when updating name)
- `404 Not Found`: Role with specified ID does not exist
- `422 Unprocessable Entity`: Invalid request body format

**Notes**:
- The `role_discord_id` cannot be updated through this endpoint
- The `updated_at` timestamp is automatically updated

---

### 5. Delete Role

**Endpoint**: `DELETE /api/admin/roles/{role_id}`

**Purpose**: Delete a role from the system.

**Authentication**: Required (Admin)

**Path Parameters**:
- `role_id` (int): The internal database ID of the role to delete

**Response**:
```json
{
  "success": true,
  "message": "Role 3 deleted successfully"
}
```

**Status Codes**:
- `200 OK`: Role successfully deleted
- `404 Not Found`: Role with specified ID does not exist

**Warning**: Deleting a role may affect users who have this role assigned. Consider the impact on user access before deletion.

---

## Role Model

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `role_id` | Integer | Internal database ID | Primary key, auto-increment |
| `role_discord_id` | String(20) | Discord role ID | Unique, not null, indexed |
| `role_name` | String(32) | Role name | Unique, not null |
| `role_description` | String(255) | Role description | Optional |
| `grants_access` | Boolean | Whether role grants system access | Not null, defaults to false |
| `created_at` | DateTime | When the role was created | Automatically set |
| `updated_at` | DateTime | When the role was last updated | Automatically updated |

### Access Control

The `grants_access` field is critical for system security:
- When `true`, users with this role can access the system
- When `false`, the role exists in the database but does not grant access
- Users must have at least one role with `grants_access=true` to authenticate

## Usage Examples

### Postman Testing

**Create a new role:**
```
POST http://localhost:8000/api/admin/roles
Content-Type: application/json

{
  "role_discord_id": "1234567890",
  "role_name": "Test Role",
  "role_description": "This is a test role",
  "grants_access": true
}
```

**Update a role:**
```
PATCH http://localhost:8000/api/admin/roles/1
Content-Type: application/json

{
  "role_name": "Updated Role Name",
  "grants_access": false
}
```

**Get all roles:**
```
GET http://localhost:8000/api/admin/roles
```

**Delete a role:**
```
DELETE http://localhost:8000/api/admin/roles/3
```

## Related Operations

- User role assignments are managed through the `users_roles` junction table
- Role access checks are performed in `services/role_access.py`
- Role syncing with Discord occurs in `services/sync_user_roles.py`
