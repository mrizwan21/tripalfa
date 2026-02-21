#!/usr/bin/env python3
"""
import-airlines-logos.py
========================
Imports airlines + airports from the Kaggle dataset and sets logo URLs.
Dataset: sinhaafroz16/airport-and-airlines-dataset-with-airline-logos

- Airlines: 806 records with IATA code + name, matched to 722 logo PNGs
- Airports: 9,224 records with IATA code, city, airport name, country

Logo files were copied to: /apps/booking-engine/public/airline-logos/{CODE}.png
Accessible at runtime as: /airline-logos/{CODE}.png
"""

from __future__ import annotations
import json
import os
import psycopg2
from typing import Optional, Set

# ── Config ────────────────────────────────────────────────────────────────────

BASE = '/Users/mohamedrizwan/.cache/kagglehub/datasets/sinhaafroz16/airport-and-airlines-dataset-with-airline-logos/versions/2'
AIRLINES_JSON = f'{BASE}/airlineNames.json'
AIRPORTS_JSON = f'{BASE}/airportNames.json'
LOGOS_DIR = '/Users/mohamedrizwan/Documents/TripAlfa - Node/apps/booking-engine/public/airline-logos'

DB_DSN = 'postgresql://postgres:postgres@localhost:5433/staticdatabase'

LOGO_BASE_URL = '/airline-logos'  # Public URL path (served from /public)

# ── Helpers ────────────────────────────────────────────────────────────────────

def get_logo_url(code: str, available_logos: Set[str]) -> Optional[str]:
    """Return logo URL if PNG exists for the airline IATA code."""
    if not code:
        return None
    filename = f'{code.upper()}.png'
    if filename in available_logos:
        return f'{LOGO_BASE_URL}/{filename}'
    return None

# ── Main ────────────────────────────────────────────────────────────────────────

def main():
    # Load JSON data
    with open(AIRLINES_JSON) as f:
        airlines = json.load(f)
    with open(AIRPORTS_JSON) as f:
        airports = json.load(f)

    # Get available logo files
    available_logos = set(os.listdir(LOGOS_DIR)) if os.path.isdir(LOGOS_DIR) else set()
    print(f'📊 Dataset: {len(airlines)} airlines, {len(airports)} airports, {len(available_logos)} logos')

    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()

    # ── AIRLINES ─────────────────────────────────────────────────────────────────
    airlines_inserted = 0
    airlines_updated = 0
    logos_linked = 0

    for a in airlines:
        code = (a.get('code') or '').strip().upper()
        name = (a.get('name') or '').strip()
        if not code or not name:
            continue

        logo_url = get_logo_url(code, available_logos)

        # Check if exists
        cur.execute('SELECT id FROM "Airline" WHERE iata_code = %s', (code,))
        row = cur.fetchone()

        if row:
            # Update name + logo_url
            cur.execute('''
                UPDATE "Airline"
                SET name = %s, logo_url = COALESCE(%s, logo_url), "updatedAt" = NOW()
                WHERE iata_code = %s
            ''', (name, logo_url, code))
            airlines_updated += 1
        else:
            # Insert new
            cur.execute('''
                INSERT INTO "Airline" (id, iata_code, name, logo_url, is_active, "createdAt", "updatedAt")
                VALUES (gen_random_uuid()::text, %s, %s, %s, true, NOW(), NOW())
            ''', (code, name, logo_url))
            airlines_inserted += 1

        if logo_url:
            logos_linked += 1

    print(f'✅ Airlines: {airlines_inserted} inserted, {airlines_updated} updated, {logos_linked} logos linked')

    # ── AIRPORTS ──────────────────────────────────────────────────────────────────
    airports_inserted = 0
    airports_updated = 0

    for a in airports:
        iata = (a.get('IataCode') or '').strip().upper()
        city = (a.get('City') or '').strip()
        name = (a.get('Airport') or '').strip()
        country = (a.get('Country') or '').strip()
        if not iata:
            continue

        # Check if exists
        cur.execute('SELECT id FROM "Airport" WHERE iata_code = %s', (iata,))
        row = cur.fetchone()

        if row:
            # Update fields if missing
            cur.execute('''
                UPDATE "Airport"
                SET name = COALESCE(NULLIF(name, ''), %s),
                    city = COALESCE(NULLIF(city, ''), %s),
                    country = COALESCE(NULLIF(country, ''), %s),
                    "updatedAt" = NOW()
                WHERE iata_code = %s
            ''', (name or None, city or None, country or None, iata))
            airports_updated += 1
        else:
            # Insert new
            cur.execute('''
                INSERT INTO "Airport" (id, iata_code, name, city, country, is_active, "createdAt", "updatedAt")
                VALUES (gen_random_uuid()::text, %s, %s, %s, %s, true, NOW(), NOW())
            ''', (iata, name or city, city, country))
            airports_inserted += 1

    print(f'✅ Airports: {airports_inserted} inserted, {airports_updated} updated')

    conn.commit()
    cur.close()
    conn.close()

    # ── Verification ───────────────────────────────────────────────────────────────
    conn2 = psycopg2.connect(DB_DSN)
    cur2 = conn2.cursor()

    cur2.execute('SELECT COUNT(*), COUNT(logo_url) FROM "Airline" WHERE is_active = true')
    row = cur2.fetchone()
    print(f'\n📊 Verification:')
    print(f'   Airlines total: {row[0]}, with logo_url: {row[1]}')

    cur2.execute('SELECT COUNT(*) FROM "Airport" WHERE is_active = true')
    row = cur2.fetchone()
    print(f'   Airports total: {row[0]}')

    # Sample airlines with logos
    cur2.execute('''
        SELECT iata_code, name, logo_url FROM "Airline"
        WHERE logo_url IS NOT NULL
        ORDER BY name LIMIT 10
    ''')
    print(f'\n   Sample airlines with logos:')
    for r in cur2.fetchall():
        print(f'     {r[0]}: {r[1]} → {r[2]}')

    cur2.close()
    conn2.close()

if __name__ == '__main__':
    main()