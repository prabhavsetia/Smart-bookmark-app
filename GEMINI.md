# Smart Bookmark App

## Project Overview
A private, real-time bookmark manager built with **Next.js 15+**, **Supabase**, and **Tailwind CSS**.

## Key Features
- **Authentication**: Google OAuth only (via Supabase).
- **Database**: PostgreSQL with Row Level Security (RLS) to ensure bookmarks are private to each user.
- **Real-time**: Real-time updates across multiple sessions using Supabase Realtime.
- **UI**: Modern, responsive dashboard built with Tailwind CSS and Lucide icons.

## Tech Stack
- **Frontend**: Next.js (App Router), React, TypeScript.
- **Styling**: Tailwind CSS.
- **Backend/Database**: Supabase (Auth, PostgreSQL, Realtime).

## Core Files
- `src/app/page.tsx`: Main dashboard for viewing, adding, and deleting bookmarks.
- `src/app/login/page.tsx`: Secure Google OAuth sign-in page.
- `src/app/auth/callback/route.ts`: Server-side handler for the OAuth redirect.
- `src/middleware.ts`: Manages session refreshing and authentication flow.
- `src/utils/supabase/`: Supabase client and server-side utilities.
- `SUPABASE_SETUP.sql`: SQL commands for database setup (tables, RLS policies, Realtime).

## Deployment (TODO)
- **Live Vercel URL**: [Insert your Vercel URL here]
- **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Setup Checklist
- [x] Scaffold Next.js project.
- [x] Configure Supabase client and server utils.
- [x] Implement Google OAuth.
- [x] Build Dashboard with real-time support.
- [x] Secure database with RLS policies.
- [x] Update documentation (README.md, GEMINI.md).