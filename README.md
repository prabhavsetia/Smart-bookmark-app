# Smart Bookmark App

A private, real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS.

## 🚀 Live Demo
[Insert your Vercel URL here after deployment]

## ✨ Features
- **Google OAuth Only**: Simple and secure login using Google.
- **Private Bookmarks**: Each user only sees their own bookmarks, protected by Row Level Security (RLS).
- **Real-time Updates**: Bookmark list updates instantly across multiple tabs/sessions without page refreshes.
- **Responsive Design**: Clean, modern UI built with Tailwind CSS and Lucide icons.
- **CRUD Operations**: Add and delete bookmarks with a single click.

## 🛠 Tech Stack
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Authentication**: [Supabase Auth](https://supabase.com/auth) (Google OAuth)
- **Database**: [Supabase PostgreSQL](https://supabase.com/database)
- **Real-time**: [Supabase Realtime](https://supabase.com/realtime)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠 Setup Instructions

### 1. Supabase Project Configuration
- Create a new project on [Supabase](https://supabase.com/).
- Navigate to the **SQL Editor** and run the contents of the `SUPABASE_SETUP.sql` file provided in this repository. This will:
  - Create the `bookmarks` table.
  - Enable Row Level Security (RLS).
  - Set up access policies for users.
  - Enable Realtime for the table.
- Go to **Authentication > Providers** and enable **Google**. 
  - Add your Google Client ID and Secret.
  - Set the Redirect URL to: `http://localhost:3000/auth/callback` (for local dev) and your Vercel URL (for production).

### 2. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Installation and Development
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## 🧠 Problems Encountered & Solutions

### 1. Persistent Session Management in Middleware
**Problem**: Maintaining a consistent authentication state between Server Components and Client Components in the Next.js App Router can be complex, especially ensuring the session cookie is refreshed before it expires.
**Solution**: Implemented the `@supabase/ssr` middleware pattern. This ensures that every request to the server checks for a valid session and refreshes the cookie if necessary, passing it back in the response headers to the browser.

### 2. Real-time Synchronization Across Tabs
**Problem**: The requirement was for the bookmark list to update in real-time without a manual page refresh when changes occur in another tab.
**Solution**: Utilized Supabase Realtime. I set up a subscription to the `bookmarks` table in the main dashboard component. When any `INSERT` or `DELETE` event is detected, a callback triggers a re-fetch of the user's bookmarks, keeping all open tabs in sync.

### 3. Securing Private User Data
**Problem**: Ensuring that User A cannot see or modify User B's bookmarks, even if they know the bookmark ID or try to use the API directly.
**Solution**: Leveraged PostgreSQL **Row Level Security (RLS)** in Supabase. I created policies that explicitly check if the `user_id` of a row matches the `auth.uid()` of the authenticated user. This moves the security layer from the application code directly to the database level, making it much more robust.

### 4. External Asset Reliability (Google Logo)
**Problem**: The Google logo used for the sign-in button was initially linked via external URLs which failed to load due to various reasons (CORS or broken links), leading to a poor UI experience.
**Solution**: Replaced the external `<img>` tag with a hardcoded **inline SVG**. This ensures the logo is always bundled with the code, loads instantly, and removes any external dependency.

### 5. Database Replication for Real-time
**Problem**: Even with the correct frontend code, the bookmark list wasn't updating automatically in other tabs.
**Solution**: Discovered that Supabase requires tables to be explicitly added to the `supabase_realtime` publication via the dashboard or SQL commands (`ALTER PUBLICATION`). Enabling this "Replication" setting allowed the database to broadcast changes to all active listeners.

---
Built as part of a 72-hour technical challenge.