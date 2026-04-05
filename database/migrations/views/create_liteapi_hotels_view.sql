-- Create view public.liteapi_hotels mapping from hotel.hotels and hotel.hotel_details
CREATE OR REPLACE VIEW public.liteapi_hotels AS
SELECT
    h.liteapi_id AS id,
    h.name,
    h.stars AS star_rating,
    h.address,
    h.city_name AS city,
    h.iso2_country_code AS country_code,
    h.latitude,
    h.longitude,
    NULL::VARCHAR(50) AS timezone,
    hd.description AS hotel_description,
    h.phone,
    h.email,
    hd.checkin_time,
    hd.checkout_time,
    h.chain_id,
    h.type_id AS hotel_type_id,
    h.rating,
    h.review_count,
    h.main_photo_url AS main_photo,
    h.created_at,
    h.updated_at
FROM hotel.hotels h
LEFT JOIN hotel.hotel_details hd ON h.id = hd.hotel_id;

COMMENT ON VIEW public.liteapi_hotels IS 'Mapping of hotel.hotels to legacy liteapi_hotels schema for compatibility';