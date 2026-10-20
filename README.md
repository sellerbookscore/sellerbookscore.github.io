# SellerBooks Core

Standalone Core portal for SellerBooks clients and administrators.

## Architecture

- Separate Supabase project: `vrgiwzxwnfjhpmxcahwo`
- Client access approval: `PENDING` until reviewed by a Core administrator
- Superadmin account is provisioned in the new Supabase project
- No dependency on Core Adiimasa

## Current status

The frontend is configured at build time using the GitHub Actions variables `VITE_SUPABASE_URL` and secret `VITE_SUPABASE_ANON_KEY`. Authentication can be tested after a successful deployment with both values available to the build.

## Security notes

- Never commit service-role keys, database passwords, or OAuth client secrets.
- Client-side access checks are for user experience only; enforce authorization with Supabase RLS and server-side functions.
- Validate all RLS policies and Edge Functions before production rollout.
