-- Comprehensive Normalization and Sanity Fix
-- Version: 1.4

DO $$
BEGIN
    RAISE NOTICE '🚀 Starting final normalization pass...';

    -- 1. Disable user triggers for performance
    ALTER TABLE canonical_hotels DISABLE TRIGGER USER;

    -- 2. Flatten JSONB structures in canonical_hotels if they are objects
    RAISE NOTICE 'Flattening amenities JSONB...';
    UPDATE canonical_hotels 
    SET amenities = CASE 
        WHEN jsonb_typeof(amenities) = 'object' AND amenities ? 'list' THEN amenities->'list' 
        WHEN jsonb_typeof(amenities) = 'object' AND amenities ? 'tags' THEN amenities->'tags' 
        ELSE amenities 
    END 
    WHERE jsonb_typeof(amenities) = 'object';

    RAISE NOTICE 'Flattening images JSONB...';
    UPDATE canonical_hotels 
    SET images = CASE 
        WHEN jsonb_typeof(images) = 'object' AND images ? 'images' THEN images->'images' 
        ELSE images 
    END 
    WHERE jsonb_typeof(images) = 'object';

    -- 3. Expand Amenities Master List
    RAISE NOTICE 'Expanding amenities master list...';
    INSERT INTO amenities (name, code)
    SELECT DISTINCT 
        raw_amenity as name,
        LEFT(UPPER(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(raw_amenity, '\s+', '_', 'g'), '/', '_', 'g'), '-', '_', 'g')), 255) as code
    FROM 
        canonical_hotels h,
        jsonb_array_elements_text(h.amenities) as raw_amenity
    ON CONFLICT (code) DO NOTHING;

    RAISE NOTICE '✅ Amenities master list expanded.';

    -- 4. Normalize Amenities
    RAISE NOTICE 'Normalizing amenities...';
    INSERT INTO hotel_amenity_instances (canonical_hotel_id, amenity_id)
    SELECT 
        h.id as canonical_hotel_id,
        a.id as amenity_id
    FROM 
        canonical_hotels h,
        jsonb_array_elements_text(h.amenities) as raw_amenity
    JOIN 
        amenities a ON a.code = LEFT(UPPER(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(raw_amenity, '\s+', '_', 'g'), '/', '_', 'g'), '-', '_', 'g')), 255)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Amenity normalization completed.';

    -- 5. Normalize Images
    RAISE NOTICE 'Normalizing images...';
    INSERT INTO hotel_images (
        canonical_hotel_id, 
        url, 
        url_hash, 
        caption, 
        is_primary, 
        sort_order, 
        source_supplier
    )
    SELECT 
        h.id as canonical_hotel_id,
        COALESCE(img->>'url', img_text) as url,
        md5(COALESCE(img->>'url', img_text)) as url_hash,
        img->>'caption' as caption,
        (ordinality = 1) as is_primary,
        (ordinality - 1) as sort_order,
        h.primary_source
    FROM 
        canonical_hotels h,
        jsonb_array_elements(h.images) WITH ORDINALITY as img_data(img, ordinality)
    LEFT JOIN LATERAL (
        SELECT CASE WHEN jsonb_typeof(img) = 'string' THEN img #>> '{}' ELSE NULL END as img_text
    ) s ON true
    WHERE COALESCE(img->>'url', img_text) IS NOT NULL
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Image normalization completed.';

    -- 6. Re-enable triggers
    ALTER TABLE canonical_hotels ENABLE TRIGGER USER;

END $$;

-- Summary
DO $$
DECLARE
    v_amenities_total INTEGER;
    v_instances INTEGER;
    v_images INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_amenities_total FROM amenities;
    SELECT COUNT(*) INTO v_instances FROM hotel_amenity_instances;
    SELECT COUNT(*) INTO v_images FROM hotel_images;
    
    RAISE NOTICE '=== Final Normalization Summary ===';
    RAISE NOTICE 'Total Master Amenities: %', v_amenities_total;
    RAISE NOTICE 'Amenity Instances: %', v_instances;
    RAISE NOTICE 'Hotel Images: %', v_images;
    RAISE NOTICE '====================================';
END $$;
