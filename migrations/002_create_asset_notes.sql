-- Create asset_notes table for storing building notes
CREATE TABLE IF NOT EXISTS asset_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_asset_notes_asset_id ON asset_notes(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_notes_created_at ON asset_notes(created_at DESC);

-- Enable RLS
ALTER TABLE asset_notes ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your auth setup)
CREATE POLICY "Enable read access for all users" ON asset_notes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON asset_notes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON asset_notes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON asset_notes
    FOR DELETE USING (true);
