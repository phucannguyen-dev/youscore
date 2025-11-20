# Quick Start - Supabase Authentication

## 🚀 Get Started in 3 Minutes

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the project to be ready (~2 minutes)

### 2. Get Your Keys
1. In your Supabase project, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

### 3. Configure Your App
```bash
# Create .env file
cp .env.example .env

# Edit .env and paste your keys:
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the App
```bash
npm install
npm run dev
```

That's it! Open the app and you'll see the login/signup page.

## 📧 Enable Email Authentication

In your Supabase dashboard:
1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it should be by default)
3. For development, you can disable email confirmation in **Authentication** → **Settings** → **Email Auth** → Disable "Enable email confirmations"

## 🎯 First User

Create your first user:
1. Click "Đăng ký" (Sign up) in the app
2. Enter an email and password (min 6 characters)
3. Click the signup button
4. If email confirmation is enabled, check your email
5. If disabled, you'll be logged in immediately

## 🔧 Troubleshooting

**"Invalid API key"**
- Make sure you copied the `anon` key, not the `service_role` key
- Check for extra spaces in your .env file

**"Can't connect to Supabase"**
- Verify your project URL is correct
- Make sure your Supabase project is running (green status)

**"Email not confirmed"**
- Check your spam folder
- Or disable email confirmation (see above)

## 📚 More Details

For advanced configuration and database setup, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
