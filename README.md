# YouScore

No need to estimate scores, just tell and let the AI do the work!

## Features

- Track your academic scores with AI-powered score parsing
- Dark/Light mode support
- Sync your data across devices with Supabase authentication
- Upload score images for automatic parsing
- Customizable exam types and scoring factors
- Dashboard with analytics and trends

## Setup

### Prerequisites

- Node.js and npm installed
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- A Supabase account and project (for authentication and data sync)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

You can use `.env.example` as a template.

### Supabase Setup

1. Create a new project on [Supabase](https://supabase.com)
2. Go to Project Settings > API to get your project URL and anon key
3. Run the following SQL in the SQL Editor to create necessary tables:

```sql
-- Create user_scores table
CREATE TABLE user_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own scores
CREATE POLICY "Users can manage their own scores"
ON user_scores
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create user_settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own settings
CREATE POLICY "Users can manage their own settings"
ON user_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

4. Enable Email authentication in Authentication > Providers

### Installation

```bash
npm install
npm run dev
```

## Usage

1. Click the login icon in the header to create an account or sign in
2. Once logged in, your scores and settings will automatically sync across devices
3. Add scores by typing (e.g., "Được 10 điểm Toán cuối học kỳ") or uploading an image
4. View your dashboard for analytics and trends

## Technologies

- React 19
- TypeScript
- Vite
- Supabase (Authentication & Database)
- Google Gemini AI
- Tailwind CSS
- Lucide Icons