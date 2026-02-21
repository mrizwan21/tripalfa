-- Migration: Add image classification fields
-- Description: Adds confidence and classification metadata fields to HotelImage and RoomImage tables

-- Add confidence field to hotel_images table
ALTER TABLE "hotel_images" 
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3, 2) DEFAULT 0.50;

-- Add classification_source field to hotel_images table
ALTER TABLE "hotel_images" 
ADD COLUMN IF NOT EXISTS classification_source VARCHAR(50) DEFAULT 'url';

-- Add confidence field to room_images table
ALTER TABLE "room_images" 
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3, 2) DEFAULT 0.50;

-- Add classification_source field to room_images table
ALTER TABLE "room_images" 
ADD COLUMN IF NOT EXISTS classification_source VARCHAR(50) DEFAULT 'url';

-- Create index for faster queries on classification fields
CREATE INDEX IF NOT EXISTS idx_hotel_images_classification 
ON "hotel_images"(image_type, confidence);

CREATE INDEX IF NOT EXISTS idx_room_images_classification 
ON "room_images"(image_type, confidence);

-- Create a staging table for pending room image classifications
-- (Images that need to be linked to room types)
CREATE TABLE IF NOT EXISTS "pending_room_image_classifications" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    url_hash VARCHAR(32) UNIQUE NOT NULL,
    image_type VARCHAR(100),
    confidence DECIMAL(3, 2) DEFAULT 0.50,
    classification_source VARCHAR(50) DEFAULT 'url',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_room_images_status 
ON "pending_room_image_classifications"(status);

-- Create a checkpoint table for tracking classification progress
CREATE TABLE IF NOT EXISTS "image_classification_progress" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(100) UNIQUE NOT NULL,
    last_processed_file VARCHAR(255),
    last_processed_index INTEGER DEFAULT 0,
    total_processed INTEGER DEFAULT 0,
    hotel_images_count INTEGER DEFAULT 0,
    room_images_count INTEGER DEFAULT 0,
    pending_room_images_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'in_progress'
);

-- Add comment
COMMENT ON COLUMN "hotel_images".confidence IS 'Classification confidence score (0.00-1.00)';
COMMENT ON COLUMN "hotel_images".classification_source IS 'Source of classification: url, ai, manual';
COMMENT ON COLUMN "room_images".confidence IS 'Classification confidence score (0.00-1.00)';
COMMENT ON COLUMN "room_images".classification_source IS 'Source of classification: url, ai, manual';
