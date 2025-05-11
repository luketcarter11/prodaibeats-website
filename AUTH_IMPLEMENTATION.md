# Authentication System Rebuild

This document outlines the authentication system rebuild for the PRODAI BEATS website. The previous Supabase-based authentication system has been completely removed to allow for a fresh implementation.

## Files Removed

The following files related to the previous authentication system have been removed:

### Authentication Pages
- `/app/auth/signin/page.tsx` (replaced with placeholder)
- `/app/auth/signup/page.tsx` (replaced with placeholder)
- `/app/auth/callback/page.tsx`
- `/app/auth/forgot-password/page.tsx`
- `/app/debug-auth/page.tsx`
- `/app/debug-signup/page.tsx`
- `/app/account/page.tsx` (replaced with placeholder)

### Authentication API Routes
- `/app/api/auth/route.ts`
- `/app/api/auth/signin/route.ts`
- `/app/api/auth/signup/route.ts`
- `/app/api/auth/signout/route.ts`
- `/app/api/auth/session/route.ts`
- `/app/api/auth/reset-session/route.ts`
- `/app/api/auth/create-profile/route.ts`
- `/app/api/auth/profile/route.ts`
- `/app/api/auth/debug/route.ts`
- `/app/api/debug-auth/route.ts`

### Authentication Utilities
- `/lib/authUtils.ts`
- `/lib/supabaseClient.ts`
- `/lib/getUserProfile.ts`
- `/middleware.ts`
- `/src/components/LoginPopup.tsx`
- `/src/context/AuthContext.tsx`

## Modified Files

The following files have been modified to remove authentication dependencies:

- `app/layout.tsx` - Removed AuthProvider
- `src/components/Header.tsx` - Replaced authentication functionality with placeholders
- `app/api/orders/route.ts` - Replaced Supabase calls with placeholder that returns empty array

## Placeholder Pages

Simple placeholder pages have been created for:
- `/app/auth/signin/page.tsx`
- `/app/auth/signup/page.tsx`
- `/app/account/page.tsx`

These pages display a message indicating the authentication system is being rebuilt.

## Components That Will Need Updates

The following components currently depend on authentication data and will need to be updated when the new authentication system is implemented:

- `components/OrdersList.tsx` - Currently expects a user ID parameter

## API Endpoints That Need Reimplementation

The following API endpoints are now placeholders and will need to be reimplemented:

- `/app/api/orders/route.ts` - Currently returns an empty array
- Any other API routes that required authentication

## Documentation References

The following documentation files exist in the `/docs` folder and contain information about the previous Supabase implementation:

- `SUPABASE_PROJECT_ISSUES.md`
- `SUPABASE_SETUP.md`
- `SUPABASE_TROUBLESHOOTING.md`
- `SUPABASE_USAGE.md`

These files can be referenced for architectural decisions but should not influence the new implementation directly.

## Implementation Requirements

The new authentication system should implement the following features:

1. **User Authentication**
   - Sign up with email and password
   - Sign in with email and password
   - Password reset functionality
   - Email verification
   - Sign out

2. **User Profile Management**
   - View and edit profile information
   - Upload profile picture
   - Manage account settings

3. **Authentication State Management**
   - Create a new AuthContext to manage authentication state
   - Implement protected routes with middleware
   - Proper session management with secure cookies

4. **Integration Points**
   - Update the Header component with proper authentication state
   - Implement account page functionality
   - Handle orders and purchases for authenticated users

## Implementation Approach

You have complete freedom to choose the authentication approach. Some options include:

1. **Custom Authentication** - Build your own with JWT and secure cookies
2. **Auth.js / NextAuth** - Popular authentication solution for Next.js
3. **Firebase Authentication** - Google's authentication service
4. **Custom Supabase** - Re-implement Supabase but with your own custom logic

## Getting Started

1. Choose your authentication strategy
2. Implement the core authentication API routes
3. Create the authentication context provider
4. Implement the UI components
5. Add route protection with middleware
6. Test the complete flow

## Security Considerations

When implementing your authentication system, keep these security considerations in mind:

- Use HTTPS for all authentication requests
- Implement proper CSRF protection
- Store passwords securely (hashed with a strong algorithm like bcrypt)
- Use secure, HTTP-only cookies for session management
- Implement proper validation for all user inputs
- Consider rate limiting to prevent brute force attacks
- Implement secure token handling and validation 