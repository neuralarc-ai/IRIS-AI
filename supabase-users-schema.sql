-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  pin VARCHAR(4) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Create policy for users to update their own data
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policy for admins to manage all users (you can customize this based on your role system)
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample users (optional)
INSERT INTO users (name, email, pin, role) VALUES
  ('Admin User', 'admin@example.com', '1234', 'admin'),
  ('John Doe', 'john@example.com', '5678', 'user'),
  ('Jane Smith', 'jane@example.com', '9012', 'user')
ON CONFLICT (email) DO NOTHING; 