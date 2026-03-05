-- ============================================================
-- Migration: Enhance room tables for complete LiteAPI data import
-- Created: 2026-03-04
-- 
-- Changes:
--   1. Add external_room_id to hotel.rooms (for supplier-specific room references)
--   2. Add soft delete columns to hotel.rooms (is_deleted, deleted_at)
--   3. Add bed_type_id to hotel.room_bed_types (LiteAPI bed type identifier)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add external_room_id to hotel.rooms
-- ------------------------------------------------------------
ALTER TABLE hotel.rooms 
ADD COLUMN IF NOT EXISTS external_room_id VARCHAR(100) NULL;

COMMENT ON COLUMN hotel.rooms.external_room_id IS 'External/supplier-specific room identifier from LiteAPI (roomId field)';

-- Create index for external room ID lookups
CREATE INDEX IF NOT EXISTS idx_rooms_external_id ON hotel.rooms (external_room_id) 
WHERE external_room_id IS NOT NULL;

-- ------------------------------------------------------------
-- 2. Add soft delete columns to hotel.rooms (matching hotel.hotels pattern)
-- ------------------------------------------------------------
ALTER TABLE hotel.rooms 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN hotel.rooms.is_deleted IS 'Soft delete flag - TRUE if room has been removed from LiteAPI';
COMMENT ON COLUMN hotel.rooms.deleted_at IS 'Timestamp when room was marked as deleted';

-- Create index for filtering deleted rooms
CREATE INDEX IF NOT EXISTS idx_rooms_deleted ON hotel.rooms (is_deleted) 
WHERE is_deleted = FALSE;

-- ------------------------------------------------------------
-- 3. Add bed_type_id to hotel.room_bed_types
-- ------------------------------------------------------------
ALTER TABLE hotel.room_bed_types 
ADD COLUMN IF NOT EXISTS bed_type_id INTEGER NULL;

COMMENT ON COLUMN hotel.room_bed_types.bed_type_id IS 'LiteAPI bed type identifier (Id field from bedTypes array)';

-- Create index for bed type ID lookups
CREATE INDEX IF NOT EXISTS idx_room_bed_types_type_id ON hotel.room_bed_types (bed_type_id) 
WHERE bed_type_id IS NOT NULL;

-- ------------------------------------------------------------
-- Update views to include new columns
-- ------------------------------------------------------------

-- Refresh the room details view to include external_room_id
CREATE OR REPLACE VIEW hotel.v_room_details AS
SELECT
    r.id               AS room_id,
    r.external_room_id,
    r.hotel_id,
    r.room_name,
    r.description,
    r.size_sqm,
    r.size_unit,
    r.max_adults,
    r.max_children,
    r.max_occupancy,
    r.is_deleted,
    r.deleted_at,
    r.created_at,
    r.updated_at,
    -- Bed types as array
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'bed_type_id', rbt.bed_type_id,
                'bed_type', rbt.bed_type,
                'bed_size', rbt.bed_size,
                'quantity', rbt.quantity
            )
        ) FILTER (WHERE rbt.id IS NOT NULL),
        '[]'::jsonb
    ) AS bed_types,
    -- Amenities as array
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'amenity_id', ra.amenity_id,
                'name', ra.name,
                'sort_order', ram.sort_order
            )
        ) FILTER (WHERE ra.amenity_id IS NOT NULL),
        '[]'::jsonb
    ) AS amenities,
    -- Photos as array
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'url', rp.url,
                'url_hd', rp.url_hd,
                'description', rp.description,
                'is_main', rp.is_main,
                'score', rp.score
            )
        ) FILTER (WHERE rp.id IS NOT NULL),
        '[]'::jsonb
    ) AS photos
FROM   hotel.rooms r
LEFT   JOIN hotel.room_bed_types   rbt ON rbt.room_id   = r.id
LEFT   JOIN hotel.room_amenity_map ram ON ram.room_id   = r.id
LEFT   JOIN hotel.room_amenities   ra  ON ra.amenity_id = ram.amenity_id
LEFT   JOIN hotel.room_photos      rp  ON rp.room_id    = r.id
GROUP  BY r.id, r.external_room_id, r.hotel_id, r.room_name, r.description, 
          r.size_sqm, r.size_unit, r.max_adults, r.max_children, r.max_occupancy,
          r.is_deleted, r.deleted_at, r.created_at, r.updated_at;

COMMENT ON VIEW hotel.v_room_details IS 'Complete room details with bed types, amenities, and photos as JSON arrays';

-- ------------------------------------------------------------
-- Migration complete
-- ------------------------------------------------------------
SELECT 'Room table enhancements migration completed successfully' AS status;

