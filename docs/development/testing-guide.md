# Testing Guide

## Overview

This guide covers how to run tests for the password reset functionality and RLS security features.

## Environment Configuration

### Test Environment Files

The project uses different environment files for different purposes:

- `.env.local` - Development environment
- `.env.test.local` - Testing environment (E2E tests)
- `.env.production` - Production environment (future)

### E2E Test Environment

E2E tests use the configuration in `.env.test.local` which contains the same Supabase instance as development. This allows testing against real database operations while keeping environments separate.

## Testing Modes

### Headless vs Headed Mode

**Headless Mode (Default - Recommended for servers)**
```bash
pnpm test:e2e --reporter=line
```
- Runs browser in background without GUI
- Faster execution, less resource usage
- **Required for Amazon Linux 2023 and server environments**
- Best for CI/CD and automated testing

**Headed Mode (Development only)**
```bash
pnpm test:e2e:headed
```
- Shows actual browser window during test execution
- Useful for debugging test failures locally
- **Not available on server environments without GUI**
- Only use on local development machines with display

### Server Environment Considerations

When running on **Amazon Linux 2023** or similar server environments:

- ❌ **Never use `--headed`** - servers don't have GUI/display
- ✅ **Use trace and screenshots for debugging**:
  ```bash
  pnpm test:e2e --trace=retain-on-failure
  pnpm test:e2e --screenshot=only-on-failure
  ```
- ✅ **Generate HTML reports**:
  ```bash
  pnpm test:e2e --reporter=html
  ```

### Debugging Failed Tests

**On Local Development:**
```bash
# Visual debugging (only on machines with display)
pnpm test:e2e:headed tests/e2e/auth.spec.ts

# Step-by-step debugging
playwright test --debug tests/e2e/auth.spec.ts
```

**On Server Environment:**
```bash
# Generate detailed trace files
pnpm test:e2e --trace=on

# Take screenshots on failure
pnpm test:e2e --screenshot=only-on-failure --reporter=line

# Create HTML report with all details
pnpm test:e2e --reporter=html
```

## Test Coverage

### E2E Tests (Playwright)

**File**: `tests/e2e/password-reset.spec.ts`

**Test Cases**:
1. ✅ Forgot password page renders correctly
2. ✅ Shows validation error for invalid email
3. ✅ Shows success message after sending reset email
4. ✅ Can navigate back to sign in from forgot password
5. ✅ Reset password page renders correctly
6. ✅ Shows validation error for short password
7. ✅ Shows error when passwords do not match
8. ✅ Redirects to sign in after successful password reset

### Unit Tests (Jest)

**File**: `tests/unit/forgotPasswordForm.test.tsx`

**Test Cases**:
1. ✅ Renders forgot password form
2. ✅ Shows error for invalid email
3. ✅ Sends reset email successfully
4. ✅ Shows error from Supabase
5. ✅ Disables form during submission

## Running Tests

### Prerequisites

Ensure you have installed all dependencies:

```bash
npm install
# or
pnpm install
```

### Run Unit Tests

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run specific test file
npm test forgotPasswordForm.test.tsx
```

### Run E2E Tests

```bash
# Install Playwright browsers (first time only)
npm run prepare

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific E2E test
npm run test:e2e password-reset.spec.ts
```

## Testing RLS Policies

### Prerequisites

1. Ensure Supabase is running and accessible
2. Apply RLS migrations:

```bash
supabase db push supabase/migrations/20250102_enable_rls.sql
supabase db push supabase/migrations/20250102_rls_policies.sql
```

### Manual RLS Testing

#### Test 1: Verify RLS is Enabled

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

**Expected Result**: All 4 tables (profiles, exercises, workouts, workout_entries) should show `rowsecurity = true`

#### Test 2: Verify All Policies Exist

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Result**: 16 policies total
- profiles: 3 policies
- exercises: 4 policies
- workouts: 4 policies
- workout_entries: 4 policies

#### Test 3: Test Data Isolation

**Setup**:
```sql
-- Create two test users (do this via Supabase Dashboard or Auth API)
-- User A: user-a-id
-- User B: user-b-id
```

**Test accessing other user's data**:
```sql
-- Sign in as User A
-- Try to access User B's workout
SELECT * FROM workouts WHERE user_id = 'user-b-id';
```

**Expected Result**: No rows returned (RLS blocks access)

**Test accessing own data**:
```sql
-- Sign in as User A
-- Access own workouts
SELECT * FROM workouts WHERE user_id = 'user-a-id';
```

**Expected Result**: User A's workouts returned

### Automated RLS Testing

Create a test file `tests/unit/rlsPolicies.test.ts` (to be implemented):

```typescript
// Test that users can only access their own data
// Test that unauthenticated users cannot access any data
// Test that all CRUD operations respect RLS
```

## Test Environment Setup

### Mock Supabase Configuration

Tests use mock Supabase client configured with:

```typescript
// In test files
const useMockSupabase = 
  process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === "true" ||
  process.env.USE_MOCK_SUPABASE === "true";
```

### Environment Variables for Testing

Create `.env.test.local` (gitignored):

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
NEXT_PUBLIC_USE_MOCK_SUPABASE=true
USE_MOCK_SUPABASE=true
```

## Continuous Integration

### GitHub Actions (Planned)

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run test:e2e
```

## Troubleshooting

### Common Issues

**Issue**: E2E tests fail with "Cannot find module @playwright/test"
**Solution**: Run `npm run prepare` to install Playwright browsers

**Issue**: Unit tests fail with mock errors
**Solution**: Clear Jest cache with `npm test -- --clearCache`

**Issue**: RLS tests show no data
**Solution**: Ensure you're authenticated and using the correct user ID

**Issue**: Password reset email not received
**Solution**: Check Supabase email settings and SMTP configuration

### Debug Mode

Enable debug mode for more detailed test output:

```bash
# E2E tests
DEBUG=pw:api npm run test:e2e

# Jest tests
npm test -- --verbose
```

## Coverage Reports

Generate test coverage reports:

```bash
# Unit test coverage
npm test -- --coverage

# View coverage report
open coverage/lcov-report/index.html
```

**Coverage Goals**:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

## Best Practices

1. **Write tests before fixing bugs** - Test-Driven Development
2. **Keep tests independent** - Each test should run in isolation
3. **Use descriptive test names** - Clear what is being tested
4. **Mock external dependencies** - Don't rely on real API calls
5. **Test edge cases** - Not just happy paths
6. **Maintain tests** - Update tests when functionality changes

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)

---

**Last Updated**: 2025-10-09
