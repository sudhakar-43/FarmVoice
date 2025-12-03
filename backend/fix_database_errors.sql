-- Migration: Fix database errors for FarmVoice
-- Run this SQL in your Supabase SQL Editor to fix missing tables and columns

-- 1. Ensure selected_crops table exists
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

-- 2. Add pincode column to crop_recommendations if it doesn't exist
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
        RAISE NOTICE 'pincode column already exists in crop_recommendations';
    END IF;
END $$;

-- 3. Add location_data column to crop_recommendations if it doesn't exist
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
        RAISE NOTICE 'location_data column already exists in crop_recommendations';
    END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_selected_crops_user_id ON selected_crops(user_id);
CREATE INDEX IF NOT EXISTS idx_selected_crops_status ON selected_crops(status);
CREATE INDEX IF NOT EXISTS idx_selected_crops_crop_name ON selected_crops(crop_name);
CREATE INDEX IF NOT EXISTS idx_crop_recommendations_pincode ON crop_recommendations(pincode);

-- 5. Disable RLS for selected_crops (backend uses custom JWT auth)
ALTER TABLE selected_crops DISABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions
GRANT ALL ON selected_crops TO authenticated;
GRANT ALL ON selected_crops TO anon;
GRANT ALL ON crop_recommendations TO authenticated;
GRANT ALL ON crop_recommendations TO anon;

-- 7. Refresh PostgREST schema cache
-- Note: After running this, you may need to:
-- 1. Go to Supabase Dashboard > Settings > API
-- 2. Click "Reload Schema" or restart your Supabase project
-- 3. Or wait a few minutes for auto-refresh

-- Verification queries (run these to verify everything is set up correctly)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'selected_crops';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'crop_recommendations' AND column_name IN ('pincode', 'location_data');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'selected_crops';

