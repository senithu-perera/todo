# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New project"
4. Choose your organization and fill in project details
5. Wait for the project to be set up

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL and anon/public API key
3. Update the `src/lib/supabase.js` file with your credentials:

```javascript
const supabaseUrl = "YOUR_PROJECT_URL_HERE";
const supabaseAnonKey = "YOUR_ANON_KEY_HERE";
```

## 3. Create the Database Table

1. In your Supabase dashboard, go to the SQL Editor
2. Run this SQL to create the todos table:

```sql
-- Create the todos table (shared for all users)
CREATE TABLE todos (
    id UUID PRIMARY KEY,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_by TEXT, -- stores the creator's email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write todos
CREATE POLICY "Authenticated can view todos" ON todos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert todos" ON todos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update todos" ON todos
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete todos" ON todos
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

## 4. Enable Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Make sure "Enable email confirmations" is enabled if you want email verification
3. You can also set up additional auth providers (Google, GitHub, etc.) if desired

## 5. Enable Realtime (Optional)

1. In your Supabase dashboard, go to Database > Replication
2. Enable realtime for the `todos` table if you want real-time updates

## 6. Update Your App

Make sure you've updated the `src/lib/supabase.js` file with your actual Supabase credentials before running the app.

## Environment Variables (Recommended)

For production, create a `.env` file in your project root:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then update `src/lib/supabase.js` to use these:

```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Testing

1. Start your React app: `npm run dev`
2. Try signing up with a new email
3. Check your email for confirmation (if enabled)
4. Sign in and create some todos
5. Sign out and sign in with a different account to verify shared access

Your todo app now has:

- ✅ User authentication
- ✅ Persistent data storage
- ✅ Real-time updates
- ✅ Row-level security (all authenticated users share the same list)
- ✅ Each todo shows who created it
- ✅ Responsive design

---

## Users table for app-managed profiles (optional but recommended)

If you want to manage your own user profiles in addition to Supabase Auth, create a `users` table and simple policies. The app will automatically create a profile row on first sign-in and use `display_name` for UI.

Run this SQL in the SQL Editor:

```sql
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    display_name text not null,
    created_at timestamp with time zone default now()
);

alter table public.users enable row level security;

-- Read own profile
create policy if not exists "read own profile" on public.users
    for select using (auth.uid() = id);

-- Create own profile (used on first login)
create policy if not exists "insert own profile" on public.users
    for insert with check (auth.uid() = id);

-- Update own profile
create policy if not exists "update own profile" on public.users
    for update using (auth.uid() = id);
```

You can later expand this table with fields like avatar_url, preferences, roles, etc. The app reads `display_name` and falls back to the first 7 chars of the email prefix when missing.
