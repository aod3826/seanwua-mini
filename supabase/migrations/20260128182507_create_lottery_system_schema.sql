/*
  # Lottery System Database Schema
  
  ## Overview
  Complete lottery betting system with user management, betting, and admin risk management.
  
  ## New Tables
  
  ### 1. profiles
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'user' or 'admin'
  - `balance` (numeric) - User's balance for betting
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. lottery_draws
  - `id` (uuid, primary key) - Draw period identifier
  - `draw_date` (date) - Date of lottery draw
  - `draw_number` (text) - Draw number/period (e.g., "01/67")
  - `status` (text) - Status: 'open', 'closed', 'resulted'
  - `close_time` (timestamptz) - Betting close time
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 3. bets
  - `id` (uuid, primary key) - Bet identifier
  - `user_id` (uuid) - User who placed the bet
  - `draw_id` (uuid) - Draw period
  - `total_amount` (numeric) - Total bet amount
  - `status` (text) - Status: 'pending', 'won', 'lost'
  - `payout_amount` (numeric) - Payout amount if won
  - `created_at` (timestamptz) - Bet placement time
  
  ### 4. bet_numbers
  - `id` (uuid, primary key) - Bet number identifier
  - `bet_id` (uuid) - Parent bet
  - `number` (text) - Lottery number (2-3 digits)
  - `bet_type` (text) - Type: '3_top', '3_tod', '2_top', '2_bottom', 'run_top', 'run_bottom'
  - `amount` (numeric) - Amount bet on this number
  - `payout_rate` (numeric) - Payout multiplier
  - `is_winner` (boolean) - Whether this number won
  
  ### 5. lottery_results
  - `id` (uuid, primary key) - Result identifier
  - `draw_id` (uuid) - Draw period
  - `three_digit_top` (text) - 3-digit top prize
  - `three_digit_tod` (text[]) - 3-digit tod prizes
  - `two_digit_top` (text) - 2-digit top prize
  - `two_digit_bottom` (text) - 2-digit bottom prize
  - `created_at` (timestamptz) - Result announcement time
  
  ## Security
  
  All tables have RLS enabled with appropriate policies:
  - Users can only view/modify their own data
  - Admins have full access
  - Public can view open lottery draws
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  balance numeric(10, 2) NOT NULL DEFAULT 1000.00 CHECK (balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lottery_draws table
CREATE TABLE IF NOT EXISTS lottery_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_date date NOT NULL,
  draw_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resulted')),
  close_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  draw_id uuid NOT NULL REFERENCES lottery_draws(id) ON DELETE CASCADE,
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  payout_amount numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create bet_numbers table
CREATE TABLE IF NOT EXISTS bet_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id uuid NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  number text NOT NULL,
  bet_type text NOT NULL CHECK (bet_type IN ('3_top', '3_tod', '2_top', '2_bottom', 'run_top', 'run_bottom')),
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  payout_rate numeric(5, 2) NOT NULL DEFAULT 1.00,
  is_winner boolean DEFAULT false
);

-- Create lottery_results table
CREATE TABLE IF NOT EXISTS lottery_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES lottery_draws(id) ON DELETE CASCADE UNIQUE,
  three_digit_top text,
  three_digit_tod text[],
  two_digit_top text,
  two_digit_bottom text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_draw_id ON bets(draw_id);
CREATE INDEX IF NOT EXISTS idx_bet_numbers_bet_id ON bet_numbers(bet_id);
CREATE INDEX IF NOT EXISTS idx_lottery_draws_status ON lottery_draws(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_results ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Lottery draws policies
CREATE POLICY "Anyone can view lottery draws"
  ON lottery_draws FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage lottery draws"
  ON lottery_draws FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bets policies
CREATE POLICY "Users can view own bets"
  ON bets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bets"
  ON bets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bets"
  ON bets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all bets"
  ON bets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bet numbers policies
CREATE POLICY "Users can view own bet numbers"
  ON bet_numbers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = bet_numbers.bet_id
      AND bets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own bet numbers"
  ON bet_numbers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bets
      WHERE bets.id = bet_numbers.bet_id
      AND bets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all bet numbers"
  ON bet_numbers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all bet numbers"
  ON bet_numbers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Lottery results policies
CREATE POLICY "Anyone can view lottery results"
  ON lottery_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage lottery results"
  ON lottery_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample lottery draw
INSERT INTO lottery_draws (draw_date, draw_number, status, close_time)
VALUES (
  CURRENT_DATE + INTERVAL '1 day',
  '01/67',
  'open',
  CURRENT_TIMESTAMP + INTERVAL '1 day'
) ON CONFLICT (draw_number) DO NOTHING;
