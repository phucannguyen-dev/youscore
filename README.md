# YouScore

No need to estimate scores, just tell and let the AI do the work!

## Features

- 🔐 **User Authentication** - Secure login and signup with Supabase Auth
- 📊 **Score Tracking** - Track your academic scores with AI-powered input
- 🌙 **Dark Mode** - Beautiful dark mode support
- 📱 **Responsive Design** - Works on all devices
- 💾 **Cloud Storage** - Your data synced across devices with Supabase

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Run this SQL in your Supabase SQL Editor to create the scores table:

```sql
-- Create scores table
create table scores (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  subject text not null,
  score float8 not null,
  max_score float8 not null,
  exam_type text not null,
  original_text text,
  timestamp bigint not null,
  user_id uuid references auth.users(id) on delete cascade
);

-- Enable Row Level Security
alter table scores enable row level security;

-- Create policy to allow users to view only their own scores
create policy "Users can view own scores"
  on scores for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own scores
create policy "Users can insert own scores"
  on scores for insert
  with check (auth.uid() = user_id);

-- Create policy to allow users to update their own scores
create policy "Users can update own scores"
  on scores for update
  using (auth.uid() = user_id);

-- Create policy to allow users to delete their own scores
create policy "Users can delete own scores"
  on scores for delete
  using (auth.uid() = user_id);
```

3. Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings at:
`https://app.supabase.com/project/_/settings/api`

### 3. Run the App

```bash
npm run dev
```

## Authentication

The app uses Supabase Auth for user authentication:

- **Sign Up**: Create a new account with email and password
- **Sign In**: Log in with your credentials
- **Sign Out**: Log out from your account

All scores are private and only visible to the authenticated user who created them.

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```