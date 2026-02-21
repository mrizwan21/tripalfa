#!/usr/bin/env python3
"""
import-country-codes.py
=======================
Imports ISO 2/3-digit codes, UN numeric codes and international dialling codes
from the Kaggle dataset into the PostgreSQL Country table.

Dataset: migeruj/country-2iso3un-digit-code-and-dialing-code
Columns: COUNTRY, A2, A3, NUM, DIALINGCODE

Updates in Country table:
  code         → already present (A2, used as join key)
  alpha3       → A3  (e.g. AFG, GBR, USA …)
  numericCode  → NUM (e.g. 4, 826, 840 …)
  phonePrefix  → DIALINGCODE prefixed with '+' (e.g. +93, +44, +1-684 …)
"""

import csv
import os
import sys
import psycopg2

# ── Config ────────────────────────────────────────────────────────────────────

CSV_PATH = (
    "/Users/mohamedrizwan/.cache/kagglehub/datasets/"
    "migeruj/country-2iso3un-digit-code-and-dialing-code/"
    "versions/3/Country_2-3_Digits_Codes.csv"
)

DB_DSN = "postgresql://postgres:postgres@localhost:5433/staticdatabase"

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: CSV not found at {CSV_PATH}")
        sys.exit(1)

    conn = psycopg2.connect(DB_DSN)
    cur  = conn.cursor()

    updated = 0
    skipped = 0
    inserted_new = 0

    with open(CSV_PATH, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            a2   = (row.get('A2')  or '').strip().upper()
            a3   = (row.get('A3')  or '').strip().upper()
            num  = (row.get('NUM') or '').strip()
            dial = (row.get('DIALINGCODE') or '').strip()
            name = (row.get('COUNTRY') or '').strip()

            if not a2:
                skipped += 1
                continue

            # Format phone prefix: prepend '+' if not already present
            phone_prefix = None
            if dial:
                phone_prefix = f"+{dial}" if not dial.startswith('+') else dial

            # Parse numeric code
            try:
                numeric_code = int(num) if num else None
            except ValueError:
                numeric_code = None

            # Update existing row (matched by A2 code)
            cur.execute(
                """
                UPDATE "Country"
                SET
                    "alpha3"      = %s,
                    "numericCode" = %s,
                    "phonePrefix" = %s
                WHERE code = %s
                """,
                (a3 or None, numeric_code, phone_prefix, a2)
            )

            if cur.rowcount == 0:
                # Country not yet in DB → insert it
                cur.execute(
                    """
                    INSERT INTO "Country" (id, code, name, "alpha3", "numericCode", "phonePrefix", "isActive", "createdAt")
                    VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, true, NOW())
                    ON CONFLICT (code) DO NOTHING
                    """,
                    (a2, name, a3 or None, numeric_code, phone_prefix)
                )
                inserted_new += 1
            else:
                updated += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"✅ Import complete:")
    print(f"   Updated  : {updated}")
    print(f"   Inserted : {inserted_new}")
    print(f"   Skipped  : {skipped}")

    # Quick verification
    conn2 = psycopg2.connect(DB_DSN)
    cur2  = conn2.cursor()
    cur2.execute("""
        SELECT COUNT(*) AS total,
               COUNT("phonePrefix") AS with_prefix,
               COUNT("alpha3")      AS with_alpha3,
               COUNT("numericCode") AS with_numeric
        FROM "Country"
        WHERE "isActive" = true
    """)
    row = cur2.fetchone()
    print(f"\nVerification:")
    print(f"   Total countries        : {row[0]}")
    print(f"   With phonePrefix       : {row[1]}")
    print(f"   With alpha3 code       : {row[2]}")
    print(f"   With numeric code      : {row[3]}")

    # Sample
    cur2.execute("""
        SELECT code, "alpha3", "numericCode", "phonePrefix", name
        FROM "Country"
        WHERE "phonePrefix" IS NOT NULL
        ORDER BY name LIMIT 10
    """)
    print(f"\nSample rows:")
    print(f"  {'A2':<4} {'A3':<5} {'NUM':<5} {'Prefix':<10} Name")
    print(f"  {'--':<4} {'--':<5} {'---':<5} {'------':<10} ----")
    for r in cur2.fetchall():
        print(f"  {r[0]:<4} {r[1] or '':<5} {str(r[2] or ''):<5} {r[3] or '':<10} {r[4]}")

    cur2.close()
    conn2.close()

if __name__ == '__main__':
    main()
