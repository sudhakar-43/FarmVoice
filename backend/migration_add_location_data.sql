-- Migration: Add location_data column to crop_recommendations table
-- Run this in your Supabase SQL Editor if the column doesn't exist

-- Add location_data column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'crop_recommendations' 
        AND column_name = 'location_data'
    ) THEN
        ALTER TABLE crop_recommendations 
        ADD COLUMN location_data JSONB;
        
        RAISE NOTICE 'Added location_data column to crop_recommendations table';
    ELSE
        RAISE NOTICE 'location_data column already exists';
    END IF;
END $$;

-- Add pincode column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'crop_recommendations' 
        AND column_name = 'pincode'
    ) THEN
        ALTER TABLE crop_recommendations 
        ADD COLUMN pincode VARCHAR(10);
        
        RAISE NOTICE 'Added pincode column to crop_recommendations table';
    ELSE
        RAISE NOTICE 'pincode column already exists';
    END IF;
END $$;

-- Ensure selected_crops table exists (from main schema)
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

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_selected_crops_user_id ON selected_crops(user_id);
CREATE INDEX IF NOT EXISTS idx_selected_crops_status ON selected_crops(status);

-- Disable RLS for selected_crops if not already disabled
ALTER TABLE selected_crops DISABLE ROW LEVEL SECURITY;

