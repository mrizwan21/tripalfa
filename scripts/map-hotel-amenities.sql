-- Map hotel amenities from canonical_hotels metadata to hotel_amenity_mapping table
-- This creates the relationship between hotels and their amenities

-- First, create a temporary function to extract and map facility IDs
DO $$
DECLARE
    hotel_record RECORD;
    facility_id INT;
    amenity_record RECORD;
    supplier_id VARCHAR;
    insert_count INT := 0;
    skip_count INT := 0;
    batch_size INT := 10000;
    processed INT := 0;
BEGIN
    -- Get the supplier ID
    SELECT id INTO supplier_id FROM suppliers WHERE code = 'liteapi' LIMIT 1;
    
    IF supplier_id IS NULL THEN
        RAISE NOTICE 'Supplier liteapi not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Starting amenity mapping for hotels...';
    
    -- Process hotels in batches
    FOR hotel_record IN 
        SELECT id, metadata->'facilityIds' as facility_ids 
        FROM canonical_hotels 
        WHERE metadata->'facilityIds' IS NOT NULL 
        AND jsonb_array_length(metadata->'facilityIds') > 0
    LOOP
        processed := processed + 1;
        
        -- Loop through each facility ID in the array
        FOR facility_id IN 
            SELECT jsonb_array_elements_text(hotel_record.facility_ids)::INT
        LOOP
            -- Try to find matching hotel amenity
            SELECT ha.id, ha.code INTO amenity_record
            FROM hotel_amenity ha
            WHERE ha.code = 'FAC_' || facility_id;
            
            IF amenity_record IS NOT NULL THEN
                -- Insert mapping (ignore if already exists)
                BEGIN
                    INSERT INTO hotel_amenity_mapping (id, canonical_hotel_id, amenity_id, is_free, supplier_id, supplier_amenity_code, created_at, updated_at)
                    VALUES (gen_random_uuid(), hotel_record.id, amenity_record.id, true, supplier_id, facility_id::text, NOW(), NOW());
                    insert_count := insert_count + 1;
                EXCEPTION WHEN unique_violation THEN
                    skip_count := skip_count + 1;
                END;
            ELSE
                -- Try room amenity
                SELECT ra.id, ra.code INTO amenity_record
                FROM room_amenity ra
                WHERE ra.code = 'FAC_' || facility_id;
                
                IF amenity_record IS NOT NULL THEN
                    -- For room amenities, we'll still add to hotel_amenity_mapping for now
                    -- since we don't have room types yet
                    BEGIN
                        INSERT INTO hotel_amenity_mapping (id, canonical_hotel_id, amenity_id, is_free, supplier_id, supplier_amenity_code, created_at, updated_at)
                        VALUES (gen_random_uuid(), hotel_record.id, amenity_record.id, true, supplier_id, facility_id::text, NOW(), NOW());
                        insert_count := insert_count + 1;
                    EXCEPTION WHEN unique_violation THEN
                        skip_count := skip_count + 1;
                    END;
                END IF;
            END IF;
        END LOOP;
        
        -- Progress update
        IF processed % batch_size = 0 THEN
            RAISE NOTICE 'Processed % hotels, % mappings created', processed, insert_count;
            COMMIT;
        END IF;
    END LOOP;
    
    RAISE NOTICE '=== Mapping Complete ===';
    RAISE NOTICE 'Hotels processed: %', processed;
    RAISE NOTICE 'Mappings created: %', insert_count;
    RAISE NOTICE 'Duplicates skipped: %', skip_count;
END $$;