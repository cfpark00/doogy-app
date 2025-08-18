-- Complete Database Reset Script
-- This is idempotent - safe to run multiple times
-- Run this at the beginning of dev cycles to purge and rebuild the entire database

-- Drop all existing tables (CASCADE to handle dependencies)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS veterinary_records CASCADE;
DROP TABLE IF EXISTS dog_activities CASCADE;
DROP TABLE IF EXISTS dogs CASCADE;
DROP TABLE IF EXISTS breeds CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop all existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Note: Triggers are automatically dropped when tables are dropped with CASCADE
-- Only drop the auth.users trigger since that table persists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table (extends Supabase auth.users)
-- This table stores custom user settings and preferences
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    onboarded BOOLEAN DEFAULT FALSE,
    dog_ownership_status TEXT CHECK (dog_ownership_status IN ('owner', 'looking', 'none')),
    dog_count INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to handle new user registration
-- Automatically creates a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate profile creation
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create breeds table (populated separately via script)
CREATE TABLE breeds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- breed_id like GOLDEN_RETRIEVER
    display_name TEXT NOT NULL, -- clean name from metadata
    alt_names TEXT[], -- alternative names for search
    breed_info TEXT, -- markdown content from md files
    breed_nutrition_info TEXT, -- nutrition information (to be filled)
    breed_social_info TEXT, -- social behavior info (to be filled)
    breed_activity_info TEXT, -- activity/exercise info (to be filled)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dogs table
CREATE TABLE dogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    breed_id UUID REFERENCES breeds(id),
    breed_name TEXT, -- denormalized for quick access
    age INTEGER,
    weight DECIMAL(5,2), -- weight in kg, max 999.99
    photo_url TEXT,
    personality_traits TEXT[],
    medical_notes TEXT,
    training_level TEXT CHECK (training_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dog_activities table (daily tracking)
CREATE TABLE dog_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('walk', 'feeding', 'play', 'grooming', 'bathroom', 'medication', 'other')),
    duration_minutes INTEGER, -- for walks, play sessions
    distance_km DECIMAL(4,2), -- for walks
    food_amount TEXT, -- for feeding
    notes TEXT,
    activity_date DATE DEFAULT CURRENT_DATE,
    activity_time TIME DEFAULT CURRENT_TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create veterinary_records table
CREATE TABLE veterinary_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visit_type TEXT NOT NULL CHECK (visit_type IN ('checkup', 'vaccination', 'emergency', 'surgery', 'dental', 'other')),
    veterinarian TEXT,
    clinic_name TEXT,
    diagnosis TEXT,
    treatment TEXT,
    medications TEXT[],
    follow_up_date DATE,
    cost DECIMAL(10,2),
    documents_url TEXT[], -- store URLs to uploaded documents
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_sessions table
CREATE TABLE training_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
    session_date DATE DEFAULT CURRENT_DATE,
    duration_minutes INTEGER,
    commands_practiced TEXT[],
    success_rate INTEGER CHECK (success_rate >= 0 AND success_rate <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('medication', 'vaccination', 'grooming', 'vet_appointment', 'training', 'feeding', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    due_time TIME,
    frequency TEXT CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'yearly')),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table (for chat history)
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_breeds_name ON breeds(name);
CREATE INDEX idx_dogs_user_id ON dogs(user_id);
CREATE INDEX idx_dogs_breed_id ON dogs(breed_id);
CREATE INDEX idx_dog_activities_dog_id ON dog_activities(dog_id);
CREATE INDEX idx_dog_activities_date ON dog_activities(activity_date);
CREATE INDEX idx_veterinary_records_dog_id ON veterinary_records(dog_id);
CREATE INDEX idx_training_sessions_dog_id ON training_sessions(dog_id);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_dog_id ON reminders(dog_id);
CREATE INDEX idx_reminders_due_date ON reminders(due_date);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breeds_updated_at BEFORE UPDATE ON breeds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dogs_updated_at BEFORE UPDATE ON dogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dog_activities_updated_at BEFORE UPDATE ON dog_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_veterinary_records_updated_at BEFORE UPDATE ON veterinary_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for breeds (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view all breeds"
    ON breeds FOR SELECT
    TO authenticated
    USING (true);

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create RLS policies for dogs
CREATE POLICY "Users can view own dogs"
    ON dogs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own dogs"
    ON dogs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dogs"
    ON dogs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dogs"
    ON dogs FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for dog_activities
CREATE POLICY "Users can view activities for their dogs"
    ON dog_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = dog_activities.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create activities for their dogs"
    ON dog_activities FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = dog_activities.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update activities for their dogs"
    ON dog_activities FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = dog_activities.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete activities for their dogs"
    ON dog_activities FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = dog_activities.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

-- Create RLS policies for veterinary_records
CREATE POLICY "Users can view vet records for their dogs"
    ON veterinary_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = veterinary_records.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create vet records for their dogs"
    ON veterinary_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = veterinary_records.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update vet records for their dogs"
    ON veterinary_records FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = veterinary_records.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete vet records for their dogs"
    ON veterinary_records FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = veterinary_records.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

-- Create RLS policies for training_sessions
CREATE POLICY "Users can view training sessions for their dogs"
    ON training_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = training_sessions.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create training sessions for their dogs"
    ON training_sessions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = training_sessions.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update training sessions for their dogs"
    ON training_sessions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = training_sessions.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete training sessions for their dogs"
    ON training_sessions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM dogs 
            WHERE dogs.id = training_sessions.dog_id 
            AND dogs.user_id = auth.uid()
        )
    );

-- Create RLS policies for reminders
CREATE POLICY "Users can view own reminders"
    ON reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders"
    ON reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
    ON reminders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
    ON reminders FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for conversations
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
    ON conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
    ON conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
    ON messages FOR DELETE
    USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON breeds TO authenticated; -- Read-only access to breeds
GRANT ALL ON dogs TO authenticated;
GRANT ALL ON dog_activities TO authenticated;
GRANT ALL ON veterinary_records TO authenticated;
GRANT ALL ON training_sessions TO authenticated;
GRANT ALL ON reminders TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;

-- Grant usage on sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database reset completed successfully!';
END $$;