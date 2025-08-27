# Password Complexity: Admin Override Feature

## Overview
- **Users**: Must meet password complexity requirements when changing their own passwords
- **Admins**: Can override password complexity requirements but receive warnings

## Behavior Differences

### User Self-Service (`/api/auth/change-password`)
- **Strictly enforced** password requirements
- Returns `400 Bad Request` if password doesn't meet requirements
- No way to bypass the validation

### Admin Actions (`/api/admin/users`)
- **Warning only** - weak passwords are allowed
- Password is set even if it doesn't meet requirements
- Response includes a `warning` field when password is weak

## Example Responses

### Admin Creating User with Weak Password

**Request:**
```json
POST /api/admin/users
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "weak",
  "is_admin": false,
  "credits": 60
}
```

**Response (200 OK):**
```json
{
  "id": 5,
  "email": "test@example.com",
  "username": "testuser",
  "is_active": true,
  "is_admin": false,
  "credits": 60.0,
  "created_at": "2024-08-27T10:30:00",
  "created_by": 1,
  "warning": "WARNING: Weak password - Password must be at least 8 characters long. Password set anyway by admin override."
}
```

### Admin Updating User Password with Weak Password

**Request:**
```json
PATCH /api/admin/users/5
{
  "password": "12345678"
}
```

**Response (200 OK):**
```json
{
  "id": 5,
  "email": "test@example.com",
  "username": "testuser",
  "is_active": true,
  "is_admin": false,
  "credits": 60.0,
  "created_at": "2024-08-27T10:30:00",
  "created_by": 1,
  "warning": "WARNING: Weak password - Password must contain at least one uppercase letter. Password set anyway by admin override."
}
```

### User Trying to Set Weak Password (Self-Service)

**Request:**
```json
POST /api/auth/change-password
{
  "current_password": "CurrentPass123",
  "new_password": "weak"
}
```

**Response (400 Bad Request):**
```json
{
  "detail": "Password must be at least 8 characters long"
}
```

## Testing Commands

### Test Admin Override (Weak Password Allowed)
```bash
# Admin creates user with weak password
curl -X POST "http://localhost:8000/api/admin/users" \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "weak@test.com",
       "username": "weakuser",
       "password": "weak",
       "is_admin": false,
       "credits": 60
     }'
# Expected: 200 OK with warning field
```

### Test User Self-Service (Weak Password Blocked)
```bash
# User tries to set weak password
curl -X POST "http://localhost:8000/api/auth/change-password" \
     -H "Authorization: Bearer USER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "current_password": "CurrentPass123",
       "new_password": "weak"
     }'
# Expected: 400 Bad Request
```

## Summary

This implementation provides the best of both worlds:
- **Security**: Users are forced to use strong passwords when they change them themselves
- **Flexibility**: Admins can set temporary or specific passwords when needed (e.g., for support purposes)
- **Transparency**: Admins are warned when setting weak passwords, ensuring they're aware of the security implications