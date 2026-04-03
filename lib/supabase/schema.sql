-- Golf Charity Subscription Platform Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  subscription_status TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'lapsed')),
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  subscription_end_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  selected_charity_id UUID,
  charity_percentage INTEGER NOT NULL DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Golf scores table
CREATE TABLE IF NOT EXISTS golf_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Charities table
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  image_url TEXT,
  website TEXT,
  total_raised DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Charity events table
CREATE TABLE IF NOT EXISTS charity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  charity_id UUID REFERENCES charities(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Draws table
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  draw_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'simulating', 'published', 'completed')),
  logic_type TEXT NOT NULL DEFAULT 'random' CHECK (logic_type IN ('random', 'algorithmic')),
  winning_numbers INTEGER[],
  prize_pool_5 DECIMAL(10,2) NOT NULL DEFAULT 0,
  prize_pool_4 DECIMAL(10,2) NOT NULL DEFAULT 0,
  prize_pool_3 DECIMAL(10,2) NOT NULL DEFAULT 0,
  jackpot_carried_over DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_pool DECIMAL(10,2) NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Draw entries table
CREATE TABLE IF NOT EXISTS draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score_snapshot INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- Winners table
CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('5-match', '4-match', '3-match')),
  matched_numbers INTEGER[] NOT NULL,
  prize_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'paid')),
  proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key for charity in profiles
ALTER TABLE profiles ADD CONSTRAINT fk_selected_charity 
  FOREIGN KEY (selected_charity_id) REFERENCES charities(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_golf_scores_user_id ON golf_scores(user_id);
CREATE INDEX idx_golf_scores_played_at ON golf_scores(played_at DESC);
CREATE INDEX idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON draw_entries(user_id);
CREATE INDEX idx_winners_draw_id ON winners(draw_id);
CREATE INDEX idx_winners_user_id ON winners(user_id);
CREATE INDEX idx_winners_status ON winners(status);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: users can read/update their own, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- Golf scores: users manage own, admins manage all
CREATE POLICY "Users can manage own scores" ON golf_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all scores" ON golf_scores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Draws: all authenticated can read published, admins manage all
CREATE POLICY "All can view published draws" ON draws FOR SELECT USING (status IN ('published', 'completed'));
CREATE POLICY "Admins can manage all draws" ON draws FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Draw entries: users manage own
CREATE POLICY "Users can manage own entries" ON draw_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all entries" ON draw_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Winners: users can see own, admins see all
CREATE POLICY "Users can view own winnings" ON winners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own proof" ON winners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all winners" ON winners FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Charities: anyone can read active, admins manage all
CREATE POLICY "Anyone can view active charities" ON charities FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage charities" ON charities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can view charity events" ON charity_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage charity events" ON charity_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charities_updated_at BEFORE UPDATE ON charities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed sample charities
INSERT INTO charities (name, description, long_description, is_featured, is_active) VALUES
(
  'Children''s Heart Foundation',
  'Supporting children with congenital heart disease through surgery, research, and family support.',
  'The Children''s Heart Foundation has been at the forefront of funding research and providing support to families affected by congenital heart disease. Every contribution goes directly toward life-saving surgeries and pioneering research.',
  true, true
),
(
  'Golf For Good',
  'Using the power of golf to transform communities and provide opportunities for underprivileged youth.',
  'Golf For Good believes that the game of golf can be a powerful vehicle for social change. We provide equipment, coaching, and mentorship to young people in underserved communities.',
  false, true
),
(
  'Green Earth Initiative',
  'Protecting natural landscapes and golf course ecosystems for future generations.',
  'We work with golf clubs and communities to restore natural habitats, reduce water usage, and create sustainable course management practices that benefit both the game and the environment.',
  false, true
),
(
  'Veterans on the Fairway',
  'Helping veterans find community, wellness, and purpose through the game of golf.',
  'Golf provides a therapeutic and social outlet for veterans dealing with the challenges of post-service life. We fund memberships, equipment, and professional coaching for veterans across the country.',
  true, true
),
(
  'Junior Golf Scholarship Fund',
  'Providing financial support for talented young golfers from low-income backgrounds.',
  'Talent should never be limited by finances. Our scholarship programme covers coaching fees, equipment costs, and tournament entry fees for promising junior golfers who cannot otherwise afford to compete.',
  false, true
);

-- Seed upcoming charity events
INSERT INTO charity_events (charity_id, title, description, event_date, location)
SELECT id, 'Charity Golf Day 2025', 'Annual fundraising golf day with celebrity guests', '2025-08-15', 'Royal Berkshire Golf Club'
FROM charities WHERE name = 'Children''s Heart Foundation';

INSERT INTO charity_events (charity_id, title, description, event_date, location)
SELECT id, 'Junior Open Tournament', 'Open tournament for under-18 golfers', '2025-09-20', 'Sunningdale Golf Club'
FROM charities WHERE name = 'Junior Golf Scholarship Fund';
