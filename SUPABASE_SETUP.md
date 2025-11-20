# Supabase Authentication Setup Guide

## Prerequisites

1. A Supabase account (create one at [supabase.com](https://supabase.com))
2. A Supabase project

## Setup Instructions

### 1. Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (the `anon` `public` key)

### 2. Configure Environment Variables

1. Create a `.env` file in the root directory of the project:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 3. Configure Supabase Authentication

In your Supabase dashboard:

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email settings:
   - You can use the default Supabase email service for development
   - For production, configure your own SMTP settings

### 4. Optional: Set Up Email Templates

1. Go to **Authentication** > **Email Templates**
2. Customize the email templates for:
   - Confirmation email
   - Magic Link
   - Password reset
   - Email change

### 5. Run the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Features

The authentication system includes:

- **User Registration**: Email and password sign up
- **User Login**: Email and password sign in
- **Session Management**: Automatic session handling with Supabase
- **Sign Out**: Logout functionality
- **Protected Routes**: Only authenticated users can access the app
- **Loading States**: Proper loading indicators during authentication

## Security Notes

- Never commit the `.env` file to version control
- The `.env` file is already added to `.gitignore`
- Use strong passwords in production
- Enable email confirmation for production environments
- Consider enabling RLS (Row Level Security) policies in Supabase for data protection

## Database Schema (Optional)

If you want to store scores in Supabase instead of localStorage, you can create a table:

```sql
-- Create scores table
create table scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  subject text not null,
  exam_type text not null,
  score numeric not null,
  max_score numeric not null,
  original_text text,
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table scores enable row level security;

-- Create policy: Users can only see their own scores
create policy "Users can view their own scores"
  on scores for select
  using (auth.uid() = user_id);

-- Create policy: Users can insert their own scores
create policy "Users can insert their own scores"
  on scores for insert
  with check (auth.uid() = user_id);

-- Create policy: Users can update their own scores
create policy "Users can update their own scores"
  on scores for update
  using (auth.uid() = user_id);

-- Create policy: Users can delete their own scores
create policy "Users can delete their own scores"
  on scores for delete
  using (auth.uid() = user_id);
```

## Troubleshooting

### Issue: "Invalid API key"
- Verify your `VITE_SUPABASE_ANON_KEY` is correct
- Make sure you're using the `anon` key, not the `service_role` key

### Issue: "Can't reach Supabase"
- Check your `VITE_SUPABASE_URL` is correct
- Ensure your Supabase project is active

### Issue: "Email not confirmed"
- Check your email for the confirmation link
- In development, you can disable email confirmation in Supabase settings

## Next Steps

1. Customize the authentication UI in `components/AuthPage.tsx`
2. Add password reset functionality
3. Implement social login (Google, GitHub, etc.)
4. Migrate data storage from localStorage to Supabase database
5. Add user profile management
