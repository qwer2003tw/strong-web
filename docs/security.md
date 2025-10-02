# Security Documentation

## Overview

This document outlines the security measures implemented in Strong Web to protect user data and ensure system integrity.

## Authentication & Authorization

### Authentication Methods

1. **Email/Password Authentication**
   - Passwords must be at least 8 characters long
   - Password hashing handled by Supabase Auth
   - Email verification available

2. **OAuth Providers**
   - GitHub OAuth
   - Google OAuth
   - Apple OAuth (planned)

3. **Password Reset Flow**
   - Secure token-based password reset
   - Reset links expire after a set time period
   - Email verification required

### Session Management

- Sessions managed by Supabase Auth
- Secure HTTP-only cookies
- Automatic session refresh
- Protected routes redirect unauthenticated users

## Row Level Security (RLS)

### Overview

Row Level Security is enabled on all main tables to ensure users can only access their own data.

### Affected Tables

1. **profiles** - User profile information
2. **exercises** - User's custom exercises
3. **workouts** - User's workout plans
4. **workout_entries** - Individual workout entries

### RLS Policies

#### profiles Table

- **SELECT**: Users can view only their own profile
- **INSERT**: Users can create only their own profile
- **UPDATE**: Users can update only their own profile
- **DELETE**: Not allowed (profiles should be soft-deleted)

#### exercises Table

- **SELECT**: Users can view only their own exercises
- **INSERT**: Users can create exercises for themselves
- **UPDATE**: Users can update only their own exercises
- **DELETE**: Users can delete only their own exercises

#### workouts Table

- **SELECT**: Users can view only their own workouts
- **INSERT**: Users can create workouts for themselves
- **UPDATE**: Users can update only their own workouts
- **DELETE**: Users can delete only their own workouts

#### workout_entries Table

- **SELECT**: Users can view entries for their own workouts
- **INSERT**: Users can create entries for their own workouts
- **UPDATE**: Users can update entries for their own workouts
- **DELETE**: Users can delete entries for their own workouts

Note: workout_entries policies check ownership through the parent workout record.

## Data Privacy

### Personal Information

- Email addresses are stored in Supabase Auth
- User profiles contain minimal personal information
- No sensitive health data is collected without consent

### Data Export

- Users can export their data in CSV/JSON format
- Export includes all workouts, exercises, and entries
- Export requests are processed securely through authenticated API

### Data Retention

- User data is retained while account is active
- Account deletion removes all associated data
- Backup retention follows Supabase policies

## API Security

### Rate Limiting

- Rate limiting implemented on sensitive endpoints (planned)
- Prevents brute force attacks
- API abuse protection

### Input Validation

- All user inputs are validated
- Email format validation
- Password strength requirements
- SQL injection prevention through parameterized queries

### CORS Policy

- Restricted to allowed origins
- Prevents unauthorized cross-origin requests

## Audit Logging

### Planned Features

- User authentication events
- Data modification tracking
- Security event monitoring
- Compliance audit trails

## Deployment Security

### Environment Variables

- Sensitive keys stored in environment variables
- Never committed to version control
- Different keys for development/production

### HTTPS/TLS

- All traffic encrypted with TLS
- Automatic HTTPS enforcement
- Secure cookie transmission

## Security Best Practices

### For Developers

1. Never commit secrets or API keys
2. Always use environment variables for sensitive data
3. Test RLS policies thoroughly
4. Keep dependencies updated
5. Follow secure coding guidelines

### For Users

1. Use strong, unique passwords
2. Enable two-factor authentication (when available)
3. Be cautious with OAuth permissions
4. Regularly review account activity

## Incident Response

### Security Incidents

1. Identify and contain the incident
2. Assess the impact
3. Notify affected users if necessary
4. Implement fixes
5. Document lessons learned

### Reporting Security Issues

If you discover a security vulnerability, please email security@example.com (update with actual email).

## Compliance

### GDPR Compliance

- User data export capability
- Right to deletion
- Transparent data usage
- Consent management

### Data Processing

- Data processed in accordance with privacy policy
- Third-party services vetted for security
- Regular security audits

## Migration Scripts

### Applying RLS

```bash
# Apply RLS migrations in order
supabase db push supabase/migrations/20250102_enable_rls.sql
supabase db push supabase/migrations/20250102_rls_policies.sql
```

### Rolling Back RLS

```bash
# Only use in case of issues
supabase db push supabase/migrations/20250102_rollback_rls.sql
```

### Verifying RLS

```sql
-- Check enabled RLS tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Testing Security

### RLS Testing

1. Test as different users
2. Attempt to access other users' data
3. Verify all CRUD operations
4. Check policy performance

### Authentication Testing

1. Test password reset flow
2. Verify OAuth integrations
3. Test session expiration
4. Check route protection

## Security Checklist

- [x] Row Level Security enabled on all tables
- [x] RLS policies created and tested
- [x] Password reset functionality implemented
- [x] Input validation on all forms
- [ ] Rate limiting on API endpoints
- [ ] Audit logging system
- [ ] Two-factor authentication
- [ ] Security headers configured
- [ ] Penetration testing completed
- [ ] Security documentation complete

## Updates

This document should be reviewed and updated whenever:
- New security features are added
- Security policies change
- Vulnerabilities are discovered and fixed
- Compliance requirements change

---

**Last Updated**: 2025-10-02  
**Next Review**: 2025-11-02
