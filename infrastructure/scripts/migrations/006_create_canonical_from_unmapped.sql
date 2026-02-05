-- Bulk Canonicalization of Unmapped Hotels (Optimized)
-- Version: 1.1

DO $$
BEGIN
    RAISE NOTICE '🚀 Starting optimized bulk canonicalization...';

    -- 1. Disable user triggers temporarily for performance boost
    ALTER TABLE canonical_hotels DISABLE TRIGGER USER;

    -- 2. Add temporary hint columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'tmp_ext_id') THEN
        ALTER TABLE canonical_hotels ADD COLUMN tmp_ext_id TEXT;
        ALTER TABLE canonical_hotels ADD COLUMN tmp_ext_src TEXT;
    END IF;

    -- 3. Perform the bulk insert
    RAISE NOTICE 'Inserting into canonical_hotels...';
    INSERT INTO canonical_hotels (
        name, address, city, country, star_rating, latitude, longitude, 
        amenities, images, policies, primary_source, content_score, 
        tmp_ext_id, tmp_ext_src, created_at
    )
    SELECT 
        h.name, h.address, h.city, h.country, 
        COALESCE(h.star_rating, 0.0), 
        h.latitude, h.longitude,
        h.amenities, h.images, h.policies,
        h.external_source,
        (
            (CASE WHEN h.name IS NOT NULL THEN 20 ELSE 0 END) +
            (CASE WHEN h.address IS NOT NULL THEN 15 ELSE 0 END) +
            (CASE WHEN h.city IS NOT NULL THEN 10 ELSE 0 END) +
            (CASE WHEN h.country IS NOT NULL THEN 10 ELSE 0 END) +
            (CASE WHEN h.latitude IS NOT NULL THEN 10 ELSE 0 END) +
            (CASE WHEN h.images IS NOT NULL AND h.images != '[]'::jsonb THEN 15 ELSE 0 END) +
            (CASE WHEN h.amenities IS NOT NULL AND h.amenities != '[]'::jsonb THEN 15 ELSE 0 END) +
            (CASE WHEN h.star_rating > 0 THEN 5 ELSE 0 END)
        ) as content_score,
        h.external_id,
        h.external_source,
        NOW()
    FROM 
        hotels h
    LEFT JOIN 
        hotel_supplier_references m ON m.supplier_hotel_id = h.external_id AND m.supplier_code = h.external_source
    WHERE 
        m.canonical_hotel_id IS NULL
        AND h.name IS NOT NULL AND h.name != ''
        AND (h.city IS NOT NULL OR h.country IS NOT NULL);

    RAISE NOTICE '✅ Bulk insert complete.';

    -- 4. Create supplier references using the hints
    RAISE NOTICE 'Creating supplier references...';
    INSERT INTO hotel_supplier_references (
        canonical_hotel_id, supplier_code, supplier_hotel_id, match_confidence, match_method, created_at
    )
    SELECT 
        id, tmp_ext_src, tmp_ext_id, 1.00, 'BULK_IMPORT', NOW()
    FROM 
        canonical_hotels
    WHERE 
        tmp_ext_id IS NOT NULL;

    RAISE NOTICE '✅ Supplier references created.';

    -- 5. Cleanup hints and enable triggers
    ALTER TABLE canonical_hotels DROP COLUMN tmp_ext_id;
    ALTER TABLE canonical_hotels DROP COLUMN tmp_ext_src;
    ALTER TABLE canonical_hotels ENABLE TRIGGER USER;

    -- 6. Update slugs (this might be slow, but manageable)
    RAISE NOTICE 'Updating slugs...';
    UPDATE canonical_hotels
    SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || id::text
    WHERE slug IS NULL;

    RAISE NOTICE '✅ Slugs updated.';

    -- 7. Manually trigger search vector update for missing ones
    RAISE NOTICE 'Updating search vectors...';
    UPDATE canonical_hotels
    SET search_vector = 
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(city, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(country, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(address, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'D')
    WHERE search_vector IS NULL;

    RAISE NOTICE '✅ Search vectors updated.';

END $$;
