# SellerBooks Core

Standalone Core portal for SellerBooks clients and administrators.

## Architecture

- Separate Supabase project: `vrgiwzxwnfjhpmxcahwo`
- Client access approval: `PENDING` until reviewed by a Core administrator
- Superadmin account is provisioned in the new Supabase project
- No dependency on Core Adiimasa

## Current status

This repository is being initialized. The frontend must be configured with the public Supabase project URL and anon/publishable key before authentication can be tested.

## Security notes

- Never commit service-role keys, database passwords, or OAuth client secrets.
- Client-side access checks are for user experience only; enforce authorization with Supabase RLS and server-side functions.
- Validate all RLS policies and Edge Functions before production rollout.
