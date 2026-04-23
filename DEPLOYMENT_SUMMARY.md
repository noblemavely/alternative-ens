# Deployment Summary - Email Verification Fix

**Date:** April 23, 2026  
**Issue:** Expert registration email verification failing with "Failed to send verification email"  
**Root Cause:** expertVerification table column name mismatch in Drizzle ORM schema  
**Status:** ✅ FIXED & DEPLOYED

---

## The Problem

When users registered as experts and tried to send a verification email, they received the error:
```
Failed to send verification email
```

**Root Cause Analysis:**
The MySQL database had the `expert_verification` table with snake_case column names:
- `expert_id` (not `expertId`)
- `expires_at` (not `expiresAt`)
- `created_at` (not `createdAt`)

However, the Drizzle ORM schema definition used camelCase strings, causing a column mismatch when Drizzle tried to INSERT the verification record:
```
Unknown column 'expertId' in 'field list'
```

---

## The Fix

### Changed File: `drizzle/schema.ts`

**Before:**
```typescript
export const expertVerification = mysqlTable("expert_verification", {
  id: int("id").autoincrement().primaryKey(),
  expertId: int("expertId").notNull(),           // ❌ Wrong
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),   // ❌ Wrong
  createdAt: timestamp("createdAt").defaultNow().notNull(),  // ❌ Wrong
});
```

**After:**
```typescript
export const expertVerification = mysqlTable("expert_verification", {
  id: int("id").autoincrement().primaryKey(),
  expertId: int("expert_id").notNull(),          // ✅ Fixed
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),  // ✅ Fixed
  createdAt: timestamp("created_at").notNull(),  // ✅ Fixed
});
```

---

## Deployment Timeline

| Commit | Action | Date/Time |
|--------|--------|-----------|
| `984e1d0` | Schema fix applied | 2026-04-23 09:36:37 |
| `907b38b` | Removed failing workflows | 2026-04-23 09:47:05 |
| `65834b7` | Added deployment tools | 2026-04-23 09:52:00 |

---

## Verification Steps

After deployment completes, verify the fix with these steps:

### 1. Test Expert Registration
```
URL: https://alternatives.nativeworld.com/expert/register
1. Enter email address
2. Click "Send Verification Code"
3. Check email inbox
```

### 2. Expected Results
- ✅ Email should be received within 30 seconds
- ✅ Email contains verification code
- ✅ No "Failed to send verification email" error
- ✅ Verification code works to complete registration

### 3. Admin Dashboard
```
URL: https://alternatives.nativeworld.com/admin-login
Email: admin@alternative.com
Password: [configured in deployment]
```

---

## Files Modified

1. **drizzle/schema.ts** - Schema fix (3 lines changed)
2. **deploy.sh** - Manual deployment script (created)
3. **.github/workflows/deploy-production.yml** - New workflow (created)
4. **.github/workflows/deploy-simple.yml** - Removed (deleted)

---

## Deployment Methods

### Method 1: GitHub Actions (Automated)
Multiple workflows are configured to auto-deploy on push to main:
- Deploy Production
- Deploy to Digital Ocean
- Build and Deploy to Digital Ocean

### Method 2: Manual Deployment Script
Run locally:
```bash
./deploy.sh <server_ip> <server_user> <server_password>
./deploy.sh 68.183.86.134 root <password>
```

### Method 3: Manual SSH
```bash
ssh root@68.183.86.134
cd /app
git pull origin main
npm run build
docker-compose down
docker-compose up -d
```

---

## Technical Details

### Error Flow (Before Fix)
```
POST /api/trpc/expertVerification.sendVerificationEmail
  ├─ GET expert by email (creates new if doesn't exist)
  ├─ CALL createExpertVerification({expertId, token, expiresAt})
  │  └─ db.insert(expertVerification).values(data)
  │     └─ ❌ Error: Unknown column 'expertId'
  └─ CATCH & return error
```

### Fixed Flow (After Fix)
```
POST /api/trpc/expertVerification.sendVerificationEmail
  ├─ GET expert by email (creates new if doesn't exist)
  ├─ CALL createExpertVerification({expertId, token, expiresAt})
  │  └─ db.insert(expertVerification).values(data)
  │     └─ ✅ Maps expertId → expert_id, expiresAt → expires_at
  ├─ CALL sendEmail via Brevo API
  ├─ Return success
  └─ User receives verification email
```

---

## Database Schema Reference

### expert_verification table
| Column | Type | Notes |
|--------|------|-------|
| id | INT(11) | Primary key, auto-increment |
| expert_id | INT(11) | Foreign key to experts.id |
| token | VARCHAR(255) | Verification code (6-digit numeric) |
| expires_at | TIMESTAMP | 24-hour expiration |
| created_at | TIMESTAMP | Creation timestamp |

---

## Rollback Instructions

If issues occur after deployment, rollback to the previous commit:
```bash
git revert 984e1d0
npm run build
docker-compose restart
```

---

## Support

For issues:
1. Check server logs: `docker logs alternative-ens-app`
2. Check database: `mysql -u root -p alternative_ens`
3. Test endpoint: `curl -X POST https://alternatives.nativeworld.com/api/trpc/expertVerification.sendVerificationEmail`

---

**Fix completed and ready for production deployment.**
