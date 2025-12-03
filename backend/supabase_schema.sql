-- FarmVoice Complete Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farmer profiles table (extends users)
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    location_address TEXT,
    pincode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    region VARCHAR(100),
    state VARCHAR(100),
    district VARCHAR(100),
    acres_of_land DECIMAL(10, 2),
    soil_type VARCHAR(50),
    climate_type VARCHAR(50),
    location_permission BOOLEAN DEFAULT false,
    microphone_permission BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Selected crops table (crops farmer is currently growing)
CREATE TABLE IF NOT EXISTS selected_crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    crop_variety VARCHAR(100),
    planting_date DATE,
    expected_harvest_date DATE,
    acres_allocated DECIMAL(10, 2),
    suitability_score INTEGER,
    is_suitable BOOLEAN DEFAULT true,
    crop_details JSONB,
    farming_guide JSONB,
    disease_predictions JSONB,
    profit_estimation JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for selected_crops
CREATE INDEX IF NOT EXISTS idx_selected_crops_user_id ON selected_crops(user_id);
CREATE INDEX IF NOT EXISTS idx_selected_crops_status ON selected_crops(status);
CREATE INDEX IF NOT EXISTS idx_selected_crops_crop_name ON selected_crops(crop_name);

-- Daily tasks/routine table
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    crop_id UUID REFERENCES selected_crops(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    task_description TEXT,
    task_type VARCHAR(50),
    scheduled_date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'medium',
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crop health tracking table
CREATE TABLE IF NOT EXISTS crop_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    crop_id UUID REFERENCES selected_crops(id) ON DELETE CASCADE,
    health_score INTEGER,
    growth_stage VARCHAR(50),
    notes TEXT,
    images JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crop recommendations table
CREATE TABLE IF NOT EXISTS crop_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pincode VARCHAR(10),
    soil_type VARCHAR(50) NOT NULL,
    climate VARCHAR(50) NOT NULL,
    season VARCHAR(50) NOT NULL,
    recommendations JSONB NOT NULL,
    location_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure pincode and location_data columns exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crop_recommendations' AND column_name = 'pincode'
    ) THEN
        ALTER TABLE crop_recommendations ADD COLUMN pincode VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crop_recommendations' AND column_name = 'location_data'
    ) THEN
        ALTER TABLE crop_recommendations ADD COLUMN location_data JSONB;
    END IF;
END $$;

-- Disease diagnoses table
CREATE TABLE IF NOT EXISTS disease_diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    crop VARCHAR(100) NOT NULL,
    symptoms TEXT NOT NULL,
    diagnosis JSONB NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice queries table
CREATE TABLE IF NOT EXISTS voice_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market prices table
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    change_percent DECIMAL(5, 2),
    trend VARCHAR(10) CHECK (trend IN ('up', 'down', 'stable')),
    market VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id ON farmer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_selected_crops_user_id ON selected_crops(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id ON daily_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_scheduled_date ON daily_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_crop_health_crop_id ON crop_health(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_recommendations_user_id ON crop_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_disease_diagnoses_user_id ON disease_diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_queries_user_id ON voice_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_crop ON market_prices(crop);

-- Disable RLS for now (backend uses custom JWT auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE selected_crops DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE crop_health DISABLE ROW LEVEL SECURITY;
ALTER TABLE crop_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE disease_diagnoses DISABLE ROW LEVEL SECURITY;
ALTER TABLE voice_queries DISABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices DISABLE ROW LEVEL SECURITY;

