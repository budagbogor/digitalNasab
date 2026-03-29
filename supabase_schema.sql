-- Create users table
CREATE TABLE users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  display_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = uid);

-- Policy: Admins can read all users
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE uid = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update roles
CREATE POLICY "Admins can update roles" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE uid = auth.uid() AND role = 'admin'
    )
  );

-- Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  is_alive BOOLEAN DEFAULT TRUE,
  birth_date DATE,
  death_date DATE,
  address TEXT,
  parent_id UUID REFERENCES members(id),
  mother_id UUID REFERENCES members(id),
  spouse_id UUID REFERENCES members(id),
  photo_url TEXT,
  phone TEXT,
  occupation TEXT,
  education TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read members (if authenticated)
CREATE POLICY "Authenticated users can read members" ON members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Admins can do anything
CREATE POLICY "Admins can manage members" ON members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE uid = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Owners can manage their own members (if needed, but usually admin only for data integrity)
-- CREATE POLICY "Owners can manage their own members" ON members
--   FOR ALL USING (auth.uid() = owner_id);

-- Function to handle user creation on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (uid, email, display_name, photo_url, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    CASE WHEN new.email = 'mobeng.ho@gmail.com' THEN 'admin' ELSE 'viewer' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
