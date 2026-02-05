--
-- PostgreSQL database dump
--

\restrict cNWNQH8k06vvs7XzfQjvgtNOhbrkftkeMlTzJtWa9QjcVJo4YaYGCEq803z8Wkx

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aircraft; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aircraft (
    id text NOT NULL,
    iata_code text,
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    category character varying(50),
    cruise_speed_kmh integer,
    icao_code character varying(5),
    manufacturer text,
    max_range_km integer,
    model text,
    passenger_capacity integer
);


ALTER TABLE public.aircraft OWNER TO postgres;

--
-- Name: airlines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.airlines (
    id integer NOT NULL,
    iata_code text NOT NULL,
    icao_code text,
    name text NOT NULL,
    country text,
    logo_url text,
    website text,
    alliance text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.airlines OWNER TO postgres;

--
-- Name: airlines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.airlines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.airlines_id_seq OWNER TO postgres;

--
-- Name: airlines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.airlines_id_seq OWNED BY public.airlines.id;


--
-- Name: airport_terminals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.airport_terminals (
    id integer NOT NULL,
    airport_id integer NOT NULL,
    name text NOT NULL,
    gates jsonb,
    services jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.airport_terminals OWNER TO postgres;

--
-- Name: airport_terminals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.airport_terminals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.airport_terminals_id_seq OWNER TO postgres;

--
-- Name: airport_terminals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.airport_terminals_id_seq OWNED BY public.airport_terminals.id;


--
-- Name: airports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.airports (
    id integer NOT NULL,
    iata_code text NOT NULL,
    icao_code text,
    name text NOT NULL,
    city text NOT NULL,
    country text NOT NULL,
    country_code text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    timezone text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.airports OWNER TO postgres;

--
-- Name: airports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.airports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.airports_id_seq OWNER TO postgres;

--
-- Name: airports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.airports_id_seq OWNED BY public.airports.id;


--
-- Name: amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.amenities (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    name text NOT NULL,
    category character varying(50),
    icon text,
    applies_to character varying(20) DEFAULT 'both'::character varying NOT NULL,
    is_popular boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.amenities OWNER TO postgres;

--
-- Name: amenities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.amenities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.amenities_id_seq OWNER TO postgres;

--
-- Name: amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.amenities_id_seq OWNED BY public.amenities.id;


--
-- Name: api_endpoint_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_endpoint_mappings (
    id text NOT NULL,
    vendor_id text NOT NULL,
    action text NOT NULL,
    path text NOT NULL,
    method text DEFAULT 'POST'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.api_endpoint_mappings OWNER TO postgres;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_keys (
    id text NOT NULL,
    user_id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    permissions jsonb,
    last_used_at timestamp(3) without time zone,
    expires_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.api_keys OWNER TO postgres;

--
-- Name: api_vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_vendors (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    base_url text NOT NULL,
    auth_type text NOT NULL,
    credentials jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.api_vendors OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    user_id text,
    tenant_id text,
    action text NOT NULL,
    resource text NOT NULL,
    resource_id text,
    "oldValues" jsonb,
    "newValues" jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    partner_id text,
    product_id text
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: booking_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_details (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    passenger_info jsonb,
    payment_info jsonb,
    addons jsonb,
    special_requests jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.booking_details OWNER TO postgres;

--
-- Name: booking_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.booking_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.booking_details_id_seq OWNER TO postgres;

--
-- Name: booking_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.booking_details_id_seq OWNED BY public.booking_details.id;


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    user_id text NOT NULL,
    flight_route_id integer,
    hotel_id integer,
    status text DEFAULT 'pending'::text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    booking_id text,
    partner_id text,
    product_id text,
    tenant_id text,
    company_id text
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bookings_id_seq OWNER TO postgres;

--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id text NOT NULL,
    company_id text NOT NULL,
    name text NOT NULL,
    code text,
    address jsonb,
    phone text,
    email text,
    manager_id text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: cache_performance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache_performance (
    id text NOT NULL,
    cache_key text NOT NULL,
    hit_count integer DEFAULT 0 NOT NULL,
    miss_count integer DEFAULT 0 NOT NULL,
    hit_rate numeric(5,4) NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cache_performance OWNER TO postgres;

--
-- Name: canonical_flight_routes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.canonical_flight_routes (
    id integer NOT NULL,
    origin_iata character varying(10) NOT NULL,
    destination_iata character varying(10) NOT NULL,
    airline_iata character varying(10),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.canonical_flight_routes OWNER TO postgres;

--
-- Name: canonical_flight_routes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.canonical_flight_routes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.canonical_flight_routes_id_seq OWNER TO postgres;

--
-- Name: canonical_flight_routes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.canonical_flight_routes_id_seq OWNED BY public.canonical_flight_routes.id;


--
-- Name: canonical_hotel_translations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.canonical_hotel_translations (
    canonical_hotel_id integer NOT NULL,
    language_code character varying(10) NOT NULL,
    name text,
    description text,
    short_description text,
    address text,
    source_supplier character varying(50),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.canonical_hotel_translations OWNER TO postgres;

--
-- Name: canonical_hotels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.canonical_hotels (
    id integer NOT NULL,
    name text NOT NULL,
    slug text,
    address text,
    postal_code text,
    city text,
    city_id integer,
    country text,
    country_code character varying(3),
    latitude numeric(10,8),
    longitude numeric(11,8),
    timezone text,
    star_rating numeric(2,1),
    hotel_type_id integer,
    chain_id integer,
    description text,
    short_description text,
    website text,
    phone text,
    email text,
    checkin_time time without time zone,
    checkout_time time without time zone,
    policies jsonb,
    user_rating numeric(3,2),
    review_count integer DEFAULT 0 NOT NULL,
    content_score integer DEFAULT 0 NOT NULL,
    primary_source character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    amenities jsonb,
    images jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.canonical_hotels OWNER TO postgres;

--
-- Name: canonical_hotels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.canonical_hotels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.canonical_hotels_id_seq OWNER TO postgres;

--
-- Name: canonical_hotels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.canonical_hotels_id_seq OWNED BY public.canonical_hotels.id;


--
-- Name: canonical_room_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.canonical_room_types (
    id integer NOT NULL,
    canonical_hotel_id integer NOT NULL,
    name text NOT NULL,
    standardized_name text,
    slug text,
    room_class character varying(50),
    room_type character varying(50),
    description text,
    max_occupancy integer,
    max_adults integer,
    max_children integer,
    bed_type text,
    bed_count integer DEFAULT 1 NOT NULL,
    room_size_sqm numeric(6,2),
    view_type text,
    is_accessible boolean DEFAULT false NOT NULL,
    is_smoking_allowed boolean DEFAULT false NOT NULL,
    amenities jsonb,
    images jsonb,
    content_score integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.canonical_room_types OWNER TO postgres;

--
-- Name: canonical_room_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.canonical_room_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.canonical_room_types_id_seq OWNER TO postgres;

--
-- Name: canonical_room_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.canonical_room_types_id_seq OWNED BY public.canonical_room_types.id;


--
-- Name: cities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    name text NOT NULL,
    country text NOT NULL,
    country_code text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    population integer,
    timezone text,
    is_popular boolean DEFAULT false NOT NULL,
    image_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    country_id integer
);


ALTER TABLE public.cities OWNER TO postgres;

--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cities_id_seq OWNER TO postgres;

--
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name text NOT NULL,
    legal_name text,
    registration_number text,
    tax_id text,
    iata_code text,
    office_id text,
    tier text DEFAULT 'standard'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    address jsonb,
    phone text,
    email text,
    website text,
    logo_url text,
    settings jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: connection_pool_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.connection_pool_config (
    id text NOT NULL,
    min_connections integer DEFAULT 2 NOT NULL,
    max_connections integer DEFAULT 20 NOT NULL,
    idle_timeout_ms integer DEFAULT 30000 NOT NULL,
    acquire_timeout_ms integer DEFAULT 60000 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.connection_pool_config OWNER TO postgres;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    id text NOT NULL,
    supplier_id text NOT NULL,
    name text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    credit_limit numeric(15,2) NOT NULL,
    commission numeric(5,2) DEFAULT 0.00 NOT NULL,
    valid_from timestamp(3) without time zone NOT NULL,
    valid_to timestamp(3) without time zone,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    document_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: cost_centers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cost_centers (
    id text NOT NULL,
    company_id text NOT NULL,
    name text NOT NULL,
    code text,
    description text,
    budget numeric(15,2),
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cost_centers OWNER TO postgres;

--
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    iso_code text,
    continent text,
    currency text,
    phone_code text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.countries OWNER TO postgres;

--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.countries_id_seq OWNER TO postgres;

--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.currencies (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    symbol text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    decimal_places integer DEFAULT 2 NOT NULL
);


ALTER TABLE public.currencies OWNER TO postgres;

--
-- Name: currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.currencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.currencies_id_seq OWNER TO postgres;

--
-- Name: currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.currencies_id_seq OWNED BY public.currencies.id;


--
-- Name: data_imports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_imports (
    id integer NOT NULL,
    source text NOT NULL,
    entity_type text NOT NULL,
    total_records integer NOT NULL,
    imported_records integer NOT NULL,
    failed_records integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    started_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp(3) without time zone,
    error_details text,
    metadata jsonb
);


ALTER TABLE public.data_imports OWNER TO postgres;

--
-- Name: data_imports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.data_imports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.data_imports_id_seq OWNER TO postgres;

--
-- Name: data_imports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.data_imports_id_seq OWNED BY public.data_imports.id;


--
-- Name: data_sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_sources (
    id integer NOT NULL,
    name text NOT NULL,
    source_type text NOT NULL,
    endpoint text,
    api_key text,
    is_active boolean DEFAULT true NOT NULL,
    last_sync_at timestamp(3) without time zone,
    sync_interval_minutes integer DEFAULT 1440 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.data_sources OWNER TO postgres;

--
-- Name: data_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.data_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.data_sources_id_seq OWNER TO postgres;

--
-- Name: data_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.data_sources_id_seq OWNED BY public.data_sources.id;


--
-- Name: data_suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_suppliers (
    code text NOT NULL,
    name text NOT NULL,
    api_type text,
    base_url text,
    provides_hotels boolean DEFAULT false NOT NULL,
    provides_flights boolean DEFAULT false NOT NULL,
    provides_content boolean DEFAULT false NOT NULL,
    content_priority integer DEFAULT 100 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_full_sync_at timestamp(3) without time zone,
    last_incremental_sync_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.data_suppliers OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id text NOT NULL,
    company_id text NOT NULL,
    name text NOT NULL,
    code text,
    parent_department_id text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: designations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.designations (
    id text NOT NULL,
    company_id text NOT NULL,
    name text NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.designations OWNER TO postgres;

--
-- Name: flight_amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flight_amenities (
    id integer NOT NULL,
    route_id integer NOT NULL,
    cabin_class text NOT NULL,
    amenity_type text NOT NULL,
    description text,
    is_available boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.flight_amenities OWNER TO postgres;

--
-- Name: flight_amenities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flight_amenities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flight_amenities_id_seq OWNER TO postgres;

--
-- Name: flight_amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flight_amenities_id_seq OWNED BY public.flight_amenities.id;


--
-- Name: flight_base_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flight_base_prices (
    id integer NOT NULL,
    route_id integer NOT NULL,
    cabin_class text NOT NULL,
    base_price numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    valid_from timestamp(3) without time zone NOT NULL,
    valid_to timestamp(3) without time zone,
    minimum_stay integer DEFAULT 0 NOT NULL,
    maximum_stay integer,
    cancellation_policy text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.flight_base_prices OWNER TO postgres;

--
-- Name: flight_base_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flight_base_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flight_base_prices_id_seq OWNER TO postgres;

--
-- Name: flight_base_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flight_base_prices_id_seq OWNED BY public.flight_base_prices.id;


--
-- Name: flight_routes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flight_routes (
    id integer NOT NULL,
    airline_id integer NOT NULL,
    flight_number text NOT NULL,
    origin_airport_id integer NOT NULL,
    destination_airport_id integer NOT NULL,
    departure_time timestamp(3) without time zone NOT NULL,
    arrival_time timestamp(3) without time zone NOT NULL,
    duration_minutes integer NOT NULL,
    distance_km integer,
    aircraft_type text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.flight_routes OWNER TO postgres;

--
-- Name: flight_routes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flight_routes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flight_routes_id_seq OWNER TO postgres;

--
-- Name: flight_routes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flight_routes_id_seq OWNED BY public.flight_routes.id;


--
-- Name: flight_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flight_schedules (
    id integer NOT NULL,
    route_id integer NOT NULL,
    day_of_week integer NOT NULL,
    is_operational boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.flight_schedules OWNER TO postgres;

--
-- Name: flight_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flight_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flight_schedules_id_seq OWNER TO postgres;

--
-- Name: flight_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flight_schedules_id_seq OWNED BY public.flight_schedules.id;


--
-- Name: hotel_amenity_instances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_amenity_instances (
    canonical_hotel_id integer NOT NULL,
    amenity_id integer NOT NULL,
    source_supplier character varying(50)
);


ALTER TABLE public.hotel_amenity_instances OWNER TO postgres;

--
-- Name: hotel_base_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_base_rates (
    id integer NOT NULL,
    room_type_id integer NOT NULL,
    season_start timestamp(3) without time zone NOT NULL,
    season_end timestamp(3) without time zone NOT NULL,
    base_rate numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    minimum_stay integer DEFAULT 1 NOT NULL,
    maximum_stay integer,
    cancellation_policy text,
    breakfast_included boolean DEFAULT false NOT NULL,
    refundable boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hotel_base_rates OWNER TO postgres;

--
-- Name: hotel_base_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_base_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotel_base_rates_id_seq OWNER TO postgres;

--
-- Name: hotel_base_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_base_rates_id_seq OWNED BY public.hotel_base_rates.id;


--
-- Name: hotel_chains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_chains (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    website text,
    logo_url text,
    country text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    loyalty_program text,
    parent_chain_id integer,
    tier character varying(20)
);


ALTER TABLE public.hotel_chains OWNER TO postgres;

--
-- Name: hotel_chains_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_chains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotel_chains_id_seq OWNER TO postgres;

--
-- Name: hotel_chains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_chains_id_seq OWNED BY public.hotel_chains.id;


--
-- Name: hotel_facilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_facilities (
    id integer NOT NULL,
    name text NOT NULL,
    category text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    description text,
    is_common boolean DEFAULT false NOT NULL
);


ALTER TABLE public.hotel_facilities OWNER TO postgres;

--
-- Name: hotel_facilities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_facilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotel_facilities_id_seq OWNER TO postgres;

--
-- Name: hotel_facilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_facilities_id_seq OWNED BY public.hotel_facilities.id;


--
-- Name: hotel_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_images (
    id integer NOT NULL,
    canonical_hotel_id integer NOT NULL,
    url text NOT NULL,
    url_hash text NOT NULL,
    thumbnail_url text,
    small_url text,
    medium_url text,
    large_url text,
    caption text,
    category character varying(50),
    is_primary boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    source_supplier character varying(50),
    source_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.hotel_images OWNER TO postgres;

--
-- Name: hotel_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotel_images_id_seq OWNER TO postgres;

--
-- Name: hotel_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_images_id_seq OWNED BY public.hotel_images.id;


--
-- Name: hotel_reviews_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_reviews_summary (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    total_reviews integer DEFAULT 0 NOT NULL,
    average_rating numeric(3,2) DEFAULT 0.00 NOT NULL,
    rating_breakdown jsonb,
    common_amenities_rating numeric(3,2),
    location_rating numeric(3,2),
    service_rating numeric(3,2),
    cleanliness_rating numeric(3,2),
    value_rating numeric(3,2),
    last_updated timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.hotel_reviews_summary OWNER TO postgres;

--
-- Name: hotel_reviews_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_reviews_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotel_reviews_summary_id_seq OWNER TO postgres;

--
-- Name: hotel_reviews_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_reviews_summary_id_seq OWNED BY public.hotel_reviews_summary.id;


--
-- Name: hotel_room_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_room_types (
    id integer NOT NULL,
    hotel_id integer NOT NULL,
    name text NOT NULL,
    description text,
    max_occupancy integer NOT NULL,
    bed_type text,
    room_size_sqm numeric(6,2),
    view_type text,
    amenities jsonb,
    images jsonb,
    is_accessible boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hotel_room_types OWNER TO postgres;

--
-- Name: hotel_room_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_room_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotel_room_types_id_seq OWNER TO postgres;

--
-- Name: hotel_room_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_room_types_id_seq OWNED BY public.hotel_room_types.id;


--
-- Name: hotel_supplier_references; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_supplier_references (
    id integer NOT NULL,
    canonical_hotel_id integer NOT NULL,
    supplier_code character varying(50) NOT NULL,
    supplier_hotel_id text NOT NULL,
    match_confidence numeric(3,2) DEFAULT 1.00,
    match_method character varying(50),
    raw_data jsonb,
    last_synced_at timestamp(3) without time zone,
    sync_status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hotel_supplier_references OWNER TO postgres;

--
-- Name: hotel_supplier_references_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_supplier_references_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotel_supplier_references_id_seq OWNER TO postgres;

--
-- Name: hotel_supplier_references_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_supplier_references_id_seq OWNED BY public.hotel_supplier_references.id;


--
-- Name: hotel_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotel_types (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    description text
);


ALTER TABLE public.hotel_types OWNER TO postgres;

--
-- Name: hotel_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotel_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotel_types_id_seq OWNER TO postgres;

--
-- Name: hotel_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotel_types_id_seq OWNED BY public.hotel_types.id;


--
-- Name: hotels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotels (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    address text NOT NULL,
    city text NOT NULL,
    country text NOT NULL,
    postal_code text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    star_rating numeric(2,1),
    website text,
    phone text,
    email text,
    checkin_time timestamp(3) without time zone DEFAULT '1970-01-01 15:00:00'::timestamp without time zone NOT NULL,
    checkout_time timestamp(3) without time zone DEFAULT '1970-01-01 11:00:00'::timestamp without time zone NOT NULL,
    amenities jsonb,
    images jsonb,
    policies jsonb,
    nearby_attractions jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    chain_id integer
);


ALTER TABLE public.hotels OWNER TO postgres;

--
-- Name: hotels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotels_id_seq OWNER TO postgres;

--
-- Name: hotels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotels_id_seq OWNED BY public.hotels.id;


--
-- Name: hotelston_cities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotelston_cities (
    id integer NOT NULL,
    name text NOT NULL,
    country text NOT NULL,
    country_code text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    population integer,
    timezone text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hotelston_cities OWNER TO postgres;

--
-- Name: hotelston_cities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotelston_cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotelston_cities_id_seq OWNER TO postgres;

--
-- Name: hotelston_cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotelston_cities_id_seq OWNED BY public.hotelston_cities.id;


--
-- Name: hotelston_countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotelston_countries (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hotelston_countries OWNER TO postgres;

--
-- Name: hotelston_countries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotelston_countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotelston_countries_id_seq OWNER TO postgres;

--
-- Name: hotelston_countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotelston_countries_id_seq OWNED BY public.hotelston_countries.id;


--
-- Name: hotelston_hotel_chains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotelston_hotel_chains (
    id integer NOT NULL,
    name text NOT NULL,
    code text,
    website text,
    logo_url text,
    country text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hotelston_hotel_chains OWNER TO postgres;

--
-- Name: hotelston_hotel_chains_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotelston_hotel_chains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotelston_hotel_chains_id_seq OWNER TO postgres;

--
-- Name: hotelston_hotel_chains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotelston_hotel_chains_id_seq OWNED BY public.hotelston_hotel_chains.id;


--
-- Name: hotelston_hotel_facilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotelston_hotel_facilities (
    id integer NOT NULL,
    name text NOT NULL,
    category text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hotelston_hotel_facilities OWNER TO postgres;

--
-- Name: hotelston_hotel_facilities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotelston_hotel_facilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotelston_hotel_facilities_id_seq OWNER TO postgres;

--
-- Name: hotelston_hotel_facilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotelston_hotel_facilities_id_seq OWNED BY public.hotelston_hotel_facilities.id;


--
-- Name: hotelston_hotel_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotelston_hotel_types (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hotelston_hotel_types OWNER TO postgres;

--
-- Name: hotelston_hotel_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotelston_hotel_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hotelston_hotel_types_id_seq OWNER TO postgres;

--
-- Name: hotelston_hotel_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotelston_hotel_types_id_seq OWNED BY public.hotelston_hotel_types.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    invoice_number text NOT NULL,
    issue_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    due_date timestamp(3) without time zone,
    total_amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status text DEFAULT 'unpaid'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    partner_id text,
    tenant_id text
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.invoices_id_seq OWNER TO postgres;

--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: ledger_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_accounts (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    currency text NOT NULL,
    balance numeric(19,4) DEFAULT 0.00 NOT NULL,
    entity_type text,
    entity_id text,
    allow_overdraft boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.ledger_accounts OWNER TO postgres;

--
-- Name: ledger_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_entries (
    id text NOT NULL,
    transaction_id text NOT NULL,
    account_id text NOT NULL,
    amount numeric(19,4) NOT NULL,
    direction text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ledger_entries OWNER TO postgres;

--
-- Name: ledger_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ledger_transactions (
    id text NOT NULL,
    description text,
    reference text,
    type text NOT NULL,
    status text NOT NULL,
    metadata jsonb,
    posted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ledger_transactions OWNER TO postgres;

--
-- Name: loyalty_programs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loyalty_programs (
    name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    airline_id integer NOT NULL,
    code text NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.loyalty_programs OWNER TO postgres;

--
-- Name: loyalty_programs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.loyalty_programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.loyalty_programs_id_seq OWNER TO postgres;

--
-- Name: loyalty_programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.loyalty_programs_id_seq OWNED BY public.loyalty_programs.id;


--
-- Name: nationalities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nationalities (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    country text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.nationalities OWNER TO postgres;

--
-- Name: nationalities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nationalities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.nationalities_id_seq OWNER TO postgres;

--
-- Name: nationalities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nationalities_id_seq OWNED BY public.nationalities.id;


--
-- Name: partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partners (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    commission numeric(5,2) DEFAULT 0.00 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    settings jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.partners OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    payment_method text NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    transaction_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    gateway text,
    gateway_response jsonb
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: pricing_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_rules (
    id text NOT NULL,
    name text NOT NULL,
    target_type text NOT NULL,
    target_id text,
    service_type text NOT NULL,
    markup_type text NOT NULL,
    markup_value numeric(15,2) NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    criteria jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pricing_rules OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    pricing jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    settings jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: query_performance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.query_performance (
    id text NOT NULL,
    query_text text NOT NULL,
    execution_time_ms integer NOT NULL,
    rows_returned integer NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.query_performance OWNER TO postgres;

--
-- Name: queues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queues (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    queue_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    error text,
    priority integer DEFAULT 0 NOT NULL,
    processed_at timestamp(3) without time zone,
    "retryCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.queues OWNER TO postgres;

--
-- Name: queues_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.queues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.queues_id_seq OWNER TO postgres;

--
-- Name: queues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.queues_id_seq OWNED BY public.queues.id;


--
-- Name: room_supplier_references; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.room_supplier_references (
    id integer NOT NULL,
    canonical_room_id integer NOT NULL,
    supplier_code character varying(50) NOT NULL,
    supplier_room_id text NOT NULL,
    match_confidence numeric(3,2) DEFAULT 1.00,
    raw_data jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.room_supplier_references OWNER TO postgres;

--
-- Name: room_supplier_references_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.room_supplier_references_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.room_supplier_references_id_seq OWNER TO postgres;

--
-- Name: room_supplier_references_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.room_supplier_references_id_seq OWNED BY public.room_supplier_references.id;


--
-- Name: search_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.search_history (
    id integer NOT NULL,
    user_id text,
    session_id text,
    search_type text NOT NULL,
    search_query jsonb NOT NULL,
    results_count integer DEFAULT 0 NOT NULL,
    search_duration_ms integer,
    user_agent text,
    ip_address text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.search_history OWNER TO postgres;

--
-- Name: search_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.search_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.search_history_id_seq OWNER TO postgres;

--
-- Name: search_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.search_history_id_seq OWNED BY public.search_history.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    category text NOT NULL,
    vendor_id text,
    is_active boolean DEFAULT true NOT NULL,
    settings jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: system_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_metrics (
    id text NOT NULL,
    name text NOT NULL,
    value numeric(15,2) NOT NULL,
    unit text NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    category text NOT NULL
);


ALTER TABLE public.system_metrics OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id text NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    description text,
    category text NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id text NOT NULL,
    name text NOT NULL,
    domain text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    settings jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: user_search_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_search_preferences (
    id integer NOT NULL,
    user_id text NOT NULL,
    preferred_airlines jsonb,
    preferred_hotel_chains jsonb,
    preferred_cabin_class text DEFAULT 'economy'::text,
    preferred_hotel_star_rating numeric(2,1),
    budget_range jsonb,
    preferred_destinations jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_search_preferences OWNER TO postgres;

--
-- Name: user_search_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_search_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_search_preferences_id_seq OWNER TO postgres;

--
-- Name: user_search_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_search_preferences_id_seq OWNED BY public.user_search_preferences.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    password text,
    phone text,
    role text DEFAULT 'user'::text NOT NULL,
    tenant_id text,
    branch_id text,
    company_id text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: wallet_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallet_accounts (
    id text NOT NULL,
    user_id text NOT NULL,
    currency text NOT NULL,
    balance numeric(15,2) DEFAULT 0.00 NOT NULL,
    pending numeric(15,2) DEFAULT 0.00 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.wallet_accounts OWNER TO postgres;

--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wallet_transactions (
    id text NOT NULL,
    account_id text NOT NULL,
    type text NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency text NOT NULL,
    reference text,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.wallet_transactions OWNER TO postgres;

--
-- Name: airlines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.airlines ALTER COLUMN id SET DEFAULT nextval('public.airlines_id_seq'::regclass);


--
-- Name: airport_terminals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.airport_terminals ALTER COLUMN id SET DEFAULT nextval('public.airport_terminals_id_seq'::regclass);


--
-- Name: airports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.airports ALTER COLUMN id SET DEFAULT nextval('public.airports_id_seq'::regclass);


--
-- Name: amenities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities ALTER COLUMN id SET DEFAULT nextval('public.amenities_id_seq'::regclass);


--
-- Name: booking_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_details ALTER COLUMN id SET DEFAULT nextval('public.booking_details_id_seq'::regclass);


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: canonical_flight_routes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.canonical_flight_routes ALTER COLUMN id SET DEFAULT nextval('public.canonical_flight_routes_id_seq'::regclass);


--
-- Name: canonical_hotels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.canonical_hotels ALTER COLUMN id SET DEFAULT nextval('public.canonical_hotels_id_seq'::regclass);


--
-- Name: canonical_room_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.canonical_room_types ALTER COLUMN id SET DEFAULT nextval('public.canonical_room_types_id_seq'::regclass);


--
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- Name: currencies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currencies ALTER COLUMN id SET DEFAULT nextval('public.currencies_id_seq'::regclass);


--
-- Name: data_imports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_imports ALTER COLUMN id SET DEFAULT nextval('public.data_imports_id_seq'::regclass);


--
-- Name: data_sources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_sources ALTER COLUMN id SET DEFAULT nextval('public.data_sources_id_seq'::regclass);


--
-- Name: flight_amenities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flight_amenities ALTER COLUMN id SET DEFAULT nextval('public.flight_amenities_id_seq'::regclass);


--
-- Name: flight_base_prices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flight_base_prices ALTER COLUMN id SET DEFAULT nextval('public.flight_base_prices_id_seq'::regclass);


--
-- Name: flight_routes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flight_routes ALTER COLUMN id SET DEFAULT nextval('public.flight_routes_id_seq'::regclass);


--
-- Name: flight_schedules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flight_schedules ALTER COLUMN id SET DEFAULT nextval('public.flight_schedules_id_seq'::regclass);


--
-- Name: hotel_base_rates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_base_rates ALTER COLUMN id SET DEFAULT nextval('public.hotel_base_rates_id_seq'::regclass);


--
-- Name: hotel_chains id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_chains ALTER COLUMN id SET DEFAULT nextval('public.hotel_chains_id_seq'::regclass);


--
-- Name: hotel_facilities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_facilities ALTER COLUMN id SET DEFAULT nextval('public.hotel_facilities_id_seq'::regclass);


--
-- Name: hotel_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_images ALTER COLUMN id SET DEFAULT nextval('public.hotel_images_id_seq'::regclass);


--
-- Name: hotel_reviews_summary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_reviews_summary ALTER COLUMN id SET DEFAULT nextval('public.hotel_reviews_summary_id_seq'::regclass);


--
-- Name: hotel_room_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_room_types ALTER COLUMN id SET DEFAULT nextval('public.hotel_room_types_id_seq'::regclass);


--
-- Name: hotel_supplier_references id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_supplier_references ALTER COLUMN id SET DEFAULT nextval('public.hotel_supplier_references_id_seq'::regclass);


--
-- Name: hotel_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_types ALTER COLUMN id SET DEFAULT nextval('public.hotel_types_id_seq'::regclass);


--
-- Name: hotels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotels ALTER COLUMN id SET DEFAULT nextval('public.hotels_id_seq'::regclass);


--
-- Name: hotelston_cities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotelston_cities ALTER COLUMN id SET DEFAULT nextval('public.hotelston_cities_id_seq'::regclass);


--
-- Name: hotelston_countries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotelston_countries ALTER COLUMN id SET DEFAULT nextval('public.hotelston_countries_id_seq'::regclass);


--
-- Name: hotelston_hotel_chains id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotelston_hotel_chains ALTER COLUMN id SET DEFAULT nextval('public.hotelston_hotel_chains_id_seq'::regclass);


--
-- Name: hotelston_hotel_facilities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotelston_hotel_facilities ALTER COLUMN id SET DEFAULT nextval('public.hotelston_hotel_facilities_id_seq'::regclass);


--
-- Name: hotelston_hotel_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotelston_hotel_types ALTER COLUMN id SET DEFAULT nextval('public.hotelston_hotel_types_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: loyalty_programs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_programs ALTER COLUMN id SET DEFAULT nextval('public.loyalty_programs_id_seq'::regclass);


--
-- Name: nationalities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nationalities ALTER COLUMN id SET DEFAULT nextval('public.nationalities_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: queues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues ALTER COLUMN id SET DEFAULT nextval('public.queues_id_seq'::regclass);


--
-- Name: room_supplier_references id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_supplier_references ALTER COLUMN id SET DEFAULT nextval('public.room_supplier_references_id_seq'::regclass);


--
-- Name: search_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history ALTER COLUMN id SET DEFAULT nextval('public.search_history_id_seq'::regclass);


--
-- Name: user_search_preferences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_search_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_search_preferences_id_seq'::regclass);


--
-- Name: aircraft aircraft_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aircraft
    ADD CONSTRAINT aircraft_pkey PRIMARY KEY (id);


--
-- Name: airlines airlines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.airlines
    ADD CONSTRAINT airlines_pkey PRIMARY KEY (id);


--
-- Name: airport_terminals airport_terminals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.airport_terminals
    ADD CONSTRAINT airport_terminals_pkey PRIMARY KEY (id);


--
-- Name: airports airports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.airports
    ADD CONSTRAINT airports_pkey PRIMARY KEY (id);


--
-- Name: amenities amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_pkey PRIMARY KEY (id);


--
-- Name: api_endpoint_mappings api_endpoint_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_endpoint_mappings
    ADD CONSTRAINT api_endpoint_mappings_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: api_vendors api_vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_vendors
    ADD CONSTRAINT api_vendors_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: booking_details booking_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_details
    ADD CONSTRAINT booking_details_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: cache_performance cache_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache_performance
    ADD CONSTRAINT cache_performance_pkey PRIMARY KEY (id);


--
-- Name: canonical_flight_routes canonical_flight_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.canonical_flight_routes
    ADD CONSTRAINT canonical_flight_routes_pkey PRIMARY KEY (id);


--
-- Name: canonical_hotel_translations canonical_hotel_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.canonical_hotel_translations
    ADD CONSTRAINT canonical_hotel_translations_pkey PRIMARY KEY (canonical_hotel_id, language_code);


--
-- Name: canonical_hotels canonical_hotels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.canonical_hotels
    ADD CONSTRAINT canonical_hotels_pkey PRIMARY KEY (id);


--
-- Name: canonical_room_types canonical_room_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.canonical_room_types
    ADD CONSTRAINT canonical_room_types_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: connection_pool_config connection_pool_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connection_pool_config
    ADD CONSTRAINT connection_pool_config_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: cost_centers cost_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cost_centers
    ADD CONSTRAINT cost_centers_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: data_imports data_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_imports
    ADD CONSTRAINT data_imports_pkey PRIMARY KEY (id);


--
-- Name: data_sources data_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT data_sources_pkey PRIMARY KEY (id);


--
-- Name: data_suppliers data_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_suppliers
    ADD CONSTRAINT data_suppliers_pkey PRIMARY KEY (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: designations designations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.designations
    ADD CONSTRAINT designations_pkey PRIMARY KEY (id);


--
-- Name: flight_amenities flight_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flight_amenities
    ADD CONSTRAINT flight_amenities_pkey PRIMARY KEY (id);


--
-- Name: flight_base_prices flight_base_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flight_base_prices
    ADD CONSTRAINT flight_base_prices_pkey PRIMARY KEY (id);


--
-- Name: flight_routes flight_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flight_routes
    ADD CONSTRAINT flight_routes_pkey PRIMARY KEY (id);


--
-- Name: flight_schedules flight_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flight_schedules
    ADD CONSTRAINT flight_schedules_pkey PRIMARY KEY (id);


--
-- Name: hotel_amenity_instances hotel_amenity_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_amenity_instances
    ADD CONSTRAINT hotel_amenity_instances_pkey PRIMARY KEY (canonical_hotel_id, amenity_id);


--
-- Name: hotel_base_rates hotel_base_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_base_rates
    ADD CONSTRAINT hotel_base_rates_pkey PRIMARY KEY (id);


--
-- Name: hotel_chains hotel_chains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_chains
    ADD CONSTRAINT hotel_chains_pkey PRIMARY KEY (id);


--
-- Name: hotel_facilities hotel_facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_facilities
    ADD CONSTRAINT hotel_facilities_pkey PRIMARY KEY (id);


--
-- Name: hotel_images hotel_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_images
    ADD CONSTRAINT hotel_images_pkey PRIMARY KEY (id);


--
-- Name: hotel_reviews_summary hotel_reviews_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_reviews_summary
    ADD CONSTRAINT hotel_reviews_summary_pkey PRIMARY KEY (id);


--
-- Name: hotel_room_types hotel_room_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_room_types
    ADD CONSTRAINT hotel_room_types_pkey PRIMARY KEY (id);


--
-- Name: hotel_supplier_references hotel_supplier_references_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_supplier_references
    ADD CONSTRAINT hotel_supplier_references_pkey PRIMARY KEY (id);


--
-- Name: hotel_types hotel_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotel_types
    ADD CONSTRAINT hotel_types_pkey PRIMARY KEY (id);


--
-- Name: hotels hotels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotels
    ADD CONSTRAINT hotels_pkey PRIMARY KEY (id);


--
-- Name: hotelston_cities hotelston_cities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotelston_cities
    ADD CONSTRAINT hotelston_cities_pkey PRIMARY KEY (id);


--
-- Name: hotelston_countries hotelston_countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotelston_countries
    ADD CONSTRAINT hotelston_countries_pkey PRIMARY KEY (id);


--
-- Name: hotelston_hotel_chains hotelston_hotel_chains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotelston_hotel_chains
    ADD CONSTRAINT hotelston_hotel_chains_pkey PRIMARY KEY (id);


--
-- Name: hotelston_hotel_facilities hotelston_hotel_facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotelston_hotel_facilities
    ADD CONSTRAINT hotelston_hotel_facilities_pkey PRIMARY KEY (id);


--
-- Name: hotelston_hotel_types hotelston_hotel_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotelston_hotel_types
    ADD CONSTRAINT hotelston_hotel_types_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: ledger_accounts ledger_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_accounts
    ADD CONSTRAINT ledger_accounts_pkey PRIMARY KEY (id);


--
-- Name: ledger_entries ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: ledger_transactions ledger_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ledger_transactions
    ADD CONSTRAINT ledger_transactions_pkey PRIMARY KEY (id);


--
-- Name: loyalty_programs loyalty_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loyalty_programs
    ADD CONSTRAINT loyalty_programs_pkey PRIMARY KEY (id);


--
-- Name: nationalities nationalities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nationalities
    ADD CONSTRAINT nationalities_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pricing_rules pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: query_performance query_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.query_performance
    ADD CONSTRAINT query_performance_pkey PRIMARY KEY (id);


--
-- Name: queues queues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_pkey PRIMARY KEY (id);


--
-- Name: room_supplier_references room_supplier_references_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.room_supplier_references
    ADD CONSTRAINT room_supplier_references_pkey PRIMARY KEY (id);


--
-- Name: search_history search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_metrics system_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_metrics
    ADD CONSTRAINT system_metrics_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: user_search_preferences user_search_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_search_preferences
    ADD CONSTRAINT user_search_preferences_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallet_accounts wallet_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_accounts
    ADD CONSTRAINT wallet_accounts_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: aircraft_iata_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX aircraft_iata_code_key ON public.aircraft USING btree (iata_code);


--
-- Name: airlines_iata_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX airlines_iata_code_key ON public.airlines USING btree (iata_code);


--
-- Name: airport_terminals_airport_id_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX airport_terminals_airport_id_name_key ON public.airport_terminals USING btree (airport_id, name);


--
-- Name: airports_iata_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX airports_iata_code_key ON public.airports USING btree (iata_code);


--
-- Name: amenities_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX amenities_code_key ON public.amenities USING btree (code);


--
-- Name: api_endpoint_mappings_vendor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX api_endpoint_mappings_vendor_id_idx ON public.api_endpoint_mappings USING btree (vendor_id);


--
-- Name: api_keys_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX api_keys_key_key ON public.api_keys USING btree (key);


--
-- Name: api_vendors_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX api_vendors_code_key ON public.api_vendors USING btree (code);


--
-- Name: cache_performance_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_performance_timestamp_idx ON public.cache_performance USING btree ("timestamp");


--
-- Name: canonical_flight_routes_destination_iata_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX canonical_flight_routes_destination_iata_idx ON public.canonical_flight_routes USING btree (destination_iata);


--
-- Name: canonical_flight_routes_origin_iata_destination_iata_airlin_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX canonical_flight_routes_origin_iata_destination_iata_airlin_key ON public.canonical_flight_routes USING btree (origin_iata, destination_iata, airline_iata);


--
-- Name: canonical_flight_routes_origin_iata_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX canonical_flight_routes_origin_iata_idx ON public.canonical_flight_routes USING btree (origin_iata);


--
-- Name: canonical_hotels_chain_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX canonical_hotels_chain_id_idx ON public.canonical_hotels USING btree (chain_id);


--
-- Name: canonical_hotels_city_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX canonical_hotels_city_idx ON public.canonical_hotels USING btree (city);


--
-- Name: canonical_hotels_country_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX canonical_hotels_country_code_idx ON public.canonical_hotels USING btree (country_code);


--
-- Name: canonical_hotels_country_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX canonical_hotels_country_idx ON public.canonical_hotels USING btree (country);


--
-- Name: canonical_hotels_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX canonical_hotels_is_active_idx ON public.canonical_hotels USING btree (is_active);


--
-- Name: canonical_hotels_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX canonical_hotels_slug_key ON public.canonical_hotels USING btree (slug);


--
-- Name: canonical_hotels_star_rating_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX canonical_hotels_star_rating_idx ON public.canonical_hotels USING btree (star_rating);


--
-- Name: canonical_room_types_canonical_hotel_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX canonical_room_types_canonical_hotel_id_idx ON public.canonical_room_types USING btree (canonical_hotel_id);


--
-- Name: canonical_room_types_canonical_hotel_id_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX canonical_room_types_canonical_hotel_id_slug_key ON public.canonical_room_types USING btree (canonical_hotel_id, slug);


--
-- Name: contracts_supplier_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX contracts_supplier_id_idx ON public.contracts USING btree (supplier_id);


--
-- Name: countries_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX countries_code_key ON public.countries USING btree (code);


--
-- Name: currencies_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX currencies_code_key ON public.currencies USING btree (code);


--
-- Name: flight_base_prices_route_id_cabin_class_valid_from_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX flight_base_prices_route_id_cabin_class_valid_from_key ON public.flight_base_prices USING btree (route_id, cabin_class, valid_from);


--
-- Name: flight_routes_airline_id_flight_number_origin_airport_id_de_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX flight_routes_airline_id_flight_number_origin_airport_id_de_key ON public.flight_routes USING btree (airline_id, flight_number, origin_airport_id, destination_airport_id);


--
-- Name: flight_schedules_route_id_day_of_week_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX flight_schedules_route_id_day_of_week_key ON public.flight_schedules USING btree (route_id, day_of_week);


--
-- Name: hotel_chains_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX hotel_chains_code_key ON public.hotel_chains USING btree (code);


--
-- Name: hotel_chains_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX hotel_chains_name_key ON public.hotel_chains USING btree (name);


--
-- Name: hotel_images_canonical_hotel_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX hotel_images_canonical_hotel_id_idx ON public.hotel_images USING btree (canonical_hotel_id);


--
-- Name: hotel_images_canonical_hotel_id_url_hash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX hotel_images_canonical_hotel_id_url_hash_key ON public.hotel_images USING btree (canonical_hotel_id, url_hash);


--
-- Name: hotel_reviews_summary_hotel_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX hotel_reviews_summary_hotel_id_key ON public.hotel_reviews_summary USING btree (hotel_id);


--
-- Name: hotel_supplier_references_canonical_hotel_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX hotel_supplier_references_canonical_hotel_id_idx ON public.hotel_supplier_references USING btree (canonical_hotel_id);


--
-- Name: hotel_supplier_references_supplier_code_supplier_hotel_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX hotel_supplier_references_supplier_code_supplier_hotel_id_key ON public.hotel_supplier_references USING btree (supplier_code, supplier_hotel_id);


--
-- Name: hotel_supplier_references_sync_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX hotel_supplier_references_sync_status_idx ON public.hotel_supplier_references USING btree (sync_status);


--
-- Name: hotel_types_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX hotel_types_name_key ON public.hotel_types USING btree (name);


--
-- Name: hotelston_countries_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX hotelston_countries_code_key ON public.hotelston_countries USING btree (code);


--
-- Name: idx_ledger_transaction_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_transaction_id ON public.ledger_entries USING btree (transaction_id);


--
-- Name: invoices_invoice_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX invoices_invoice_number_key ON public.invoices USING btree (invoice_number);


--
-- Name: ledger_accounts_entity_type_entity_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ledger_accounts_entity_type_entity_id_idx ON public.ledger_accounts USING btree (entity_type, entity_id);


--
-- Name: ledger_entries_account_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ledger_entries_account_id_idx ON public.ledger_entries USING btree (account_id);


--
-- Name: ledger_entries_transaction_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ledger_entries_transaction_id_idx ON public.ledger_entries USING btree (transaction_id);


--
-- Name: loyalty_programs_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX loyalty_programs_code_key ON public.loyalty_programs USING btree (code);


--
-- Name: nationalities_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX nationalities_code_key ON public.nationalities USING btree (code);


--
-- Name: payments_transaction_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_transaction_id_key ON public.payments USING btree (transaction_id);


--
-- Name: query_performance_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX query_performance_timestamp_idx ON public.query_performance USING btree ("timestamp");


--
-- Name: room_supplier_references_canonical_room_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX room_supplier_references_canonical_room_id_idx ON public.room_supplier_references USING btree (canonical_room_id);


--
-- Name: room_supplier_references_supplier_code_supplier_room_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX room_supplier_references_supplier_code_supplier_room_id_key ON public.room_supplier_references USING btree (supplier_code, supplier_room_id);


--
-- Name: suppliers_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX suppliers_code_key ON public.suppliers USING btree (code);


--
-- Name: suppliers_vendor_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX suppliers_vendor_id_idx ON public.suppliers USING btree (vendor_id);


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: tenants_domain_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenants_domain_key ON public.tenants USING btree (domain);


--
-- Name: user_search_preferences_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_search_preferences_user_id_key ON public.user_search_preferences USING btree (user_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- PostgreSQL database dump complete
--

\unrestrict cNWNQH8k06vvs7XzfQjvgtNOhbrkftkeMlTzJtWa9QjcVJo4YaYGCEq803z8Wkx

