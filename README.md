# YouScore

No need to estimate scores, just tell and let the AI do the work!

## Features

- 🔐 **User Authentication** - Secure login and signup with Supabase Auth
- 📊 **Score Tracking** - Track your academic scores with AI-powered input
- 🎯 **Bulk Input** - Add multiple test scores in one go! Example: "Have physics 10 and math 8 in mid-semester"
- 🔍 **Smart Search** - Quickly find scores by subject, exam type, or score value
- 🌙 **Dark Mode** - Beautiful dark mode support with theme-neutral design
- 📱 **Responsive Design** - Works on all devices
- 💾 **Cloud Storage** - Your data synced across devices with Supabase
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS

## How to Use

### Single Score Entry
Simply type in natural language:
- "I got 10 in Math final exam"
- "Physics score was 8.5"
- "Có 9 điểm Văn học kỳ"

### Bulk Score Entry (NEW!)
Enter multiple scores at once:
- "Have physics 10 and math 8 in mid-semester"
- "Got English 9, Chemistry 8.5, and Biology 9.5 in final exam"
- "Có Toán 10, Lý 9, và Hóa 8 trong kiểm tra 15 phút"

The AI will automatically parse each subject and create separate entries with the same exam type!

### Search & Filter
Use the search bar to:
- Filter by subject name
- Find scores by exam type
- Search by score value
- Look up scores by original text

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Run this SQL in your Supabase SQL Editor to create the required tables:

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

-- Create user_profiles table
create table user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  full_name text,
  avatar_url text,
  language text default 'vi' not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create user_settings table
create table user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  settings jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table scores enable row level security;
alter table user_profiles enable row level security;
alter table user_settings enable row level security;

-- Policies for scores table
create policy "Users can view own scores"
  on scores for select
  using (auth.uid() = user_id);

create policy "Users can insert own scores"
  on scores for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scores"
  on scores for update
  using (auth.uid() = user_id);

create policy "Users can delete own scores"
  on scores for delete
  using (auth.uid() = user_id);

-- Policies for user_profiles table
create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = user_id);

-- Policies for user_settings table
create policy "Users can view own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);
```

3. Create and update `.env.local` with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings at:
`https://app.supabase.com/project/_/settings/api`

### 3. Configure Gemini AI (Optional)

For AI-powered score parsing, you need a Gemini API key:

1. Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Add to `.env.local`:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the App

```bash
npm run dev
```

## Authentication

The app uses Supabase Auth for user authentication:

- **Sign Up**: Create a new account with email and password
- **Sign In**: Log in with your credentials
- **Sign Out**: Log out from your account

All scores are private and only visible to the authenticated user who created them.

## Tips & Tricks

### Using Bulk Input Effectively
- You can add multiple subjects in one sentence
- The AI will detect all subjects and their scores
- All entries will share the same exam type if mentioned once
- Supports both English and Vietnamese

### Search Feature
- The search bar appears above all content for easy access
- Search works across subjects, exam types, and original text
- Real-time results as you type
- Clear button to quickly reset search

### Managing Scores
- Select multiple scores for batch deletion
- Sort by date, subject, or score value
- Filter by semester to view specific periods
- Export and print your score reports

## UI Design System

YouScore uses [shadcn/ui](https://ui.shadcn.com/) components built on top of Tailwind CSS v3 for a modern, accessible, and theme-neutral design system.

### Theme Customization

The application uses CSS variables for all colors, making it easy to customize the theme:

```css
/* Edit index.css to customize colors */
:root {
  --primary: 238 83% 60%;        /* Primary brand color */
  --secondary: 210 40% 96.1%;    /* Secondary elements */
  --background: 0 0% 100%;        /* Page background */
  --foreground: 222.2 84% 4.9%;  /* Text color */
  /* ... and more */
}
```

### Available Components

The app includes reusable shadcn/ui components:
- **Button** - Multiple variants (default, destructive, outline, secondary, ghost, link)
- **Input** - Form inputs with accessibility features
- **Card** - Content containers with headers and footers
- **Badge** - Status indicators
- **Select** - Dropdown menus
- **Switch** - Toggle controls
- **Label** - Form field labels

See `MIGRATION_SUMMARY.md` for complete documentation on the UI system.

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: Google Gemini for natural language processing
- **Build Tool**: Vite
