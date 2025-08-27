# Password Change Feature Documentation

## Overview
Users can now change their own passwords through the API with enforced minimum complexity requirements.

## Password Requirements
- **Minimum 8 characters**
- **At least one uppercase letter** (A-Z)
- **At least one lowercase letter** (a-z)
- **At least one number** (0-9)

## API Endpoints

### 1. Change Password (User)
**Endpoint:** `POST /api/auth/change-password`  
**Authentication:** Required (Bearer token)  
**Description:** Allows authenticated users to change their own password

**Request Body:**
```json
{
  "current_password": "CurrentPassword123",
  "new_password": "NewPassword456"
}
```

**Success Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Current password incorrect, new password same as current, or complexity requirements not met
- `401 Unauthorized`: Not authenticated

### 2. Create User with Password Validation (Admin)
**Endpoint:** `POST /api/admin/users`  
**Authentication:** Admin required  
**Description:** Admin creates new user with enforced password complexity

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "SecurePass123",
  "is_admin": false,
  "credits": 60.0
}
```

### 3. Update User Password (Admin)
**Endpoint:** `PATCH /api/admin/users/{user_id}`  
**Authentication:** Admin required  
**Description:** Admin can reset user passwords with enforced complexity

**Request Body:**
```json
{
  "password": "NewSecurePass456"
}
```

## Testing the Feature

### Using curl

1. **Login to get access token:**
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=YOUR_USERNAME&password=YOUR_PASSWORD"
```

2. **Change password:**
```bash
curl -X POST "http://localhost:8000/api/auth/change-password" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "current_password": "YourCurrentPassword123",
       "new_password": "YourNewPassword456"
     }'
```

### Example Valid Passwords
- `Password123` - Basic valid password
- `MySecure2024` - With year
- `Admin@2024` - With special character
- `TestUser99` - Simple but valid

### Example Invalid Passwords
- `short` - Too short (< 8 chars)
- `longenough` - No uppercase letter
- `LONGENOUGH` - No lowercase letter  
- `LongEnough` - No number
- `12345678` - Only numbers
- `password` - All lowercase, no number

## Implementation Files

- `/backend/app/auth.py`: Added `validate_password_complexity()` function
- `/backend/app/schemas.py`: Added `PasswordChange` and `PasswordChangeResponse` schemas
- `/backend/app/routers/auth.py`: Added `/change-password` endpoint
- `/backend/app/routers/admin.py`: Updated user creation and update endpoints with validation

## Security Notes

1. The current password must be verified before allowing a change
2. New password cannot be the same as the current password
3. Password complexity is enforced on:
   - User self-service password changes
   - Admin creating new users
   - Admin resetting user passwords
4. Passwords are hashed using bcrypt before storage
5. Password validation happens server-side for security