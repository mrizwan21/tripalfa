-- Migration: Rename rule engine fields for consistency
-- Created: 2025-03-03
-- Description: Renames fields in markup_rules and commission_rules tables to use consistent naming
--
-- IMPORTANT: This migration creates backup tables before making changes.
-- If migration fails, restore from:
--   - _backup_markup_rules
--   - _backup_commission_rules
--   - _backup_commission_settlements
--
-- To restore: INSERT INTO markup_rules SELECT * FROM _backup_markup_rules;

-- ============================================
-- PRE-MIGRATION BACKUP (Safety Rollback)
-- ============================================

-- Create backup of markup_rules if not exists
CREATE TABLE IF NOT EXISTS _backup_markup_rules AS SELECT * FROM markup_rules WHERE 1=0;

-- Create backup of commission_rules if not exists
CREATE TABLE IF NOT EXISTS _backup_commission_rules AS SELECT * FROM commission_rules WHERE 1=0;

-- Create backup of commission_settlements if not exists
CREATE TABLE IF NOT EXISTS _backup_commission_settlements AS SELECT * FROM commission_settlements WHERE 1=0;

-- Backup current data (only if tables have data and backups are empty)
DO $$
BEGIN
    -- Backup markup_rules
    IF EXISTS (SELECT 1 FROM markup_rules LIMIT 1) AND 
       NOT EXISTS (SELECT 1 FROM _backup_markup_rules LIMIT 1) THEN
        INSERT INTO _backup_markup_rules SELECT * FROM markup_rules;
        RAISE NOTICE 'Backed up markup_rules: % rows', (SELECT COUNT(*) FROM markup_rules);
    END IF;
    
    -- Backup commission_rules
    IF EXISTS (SELECT 1 FROM commission_rules LIMIT 1) AND 
       NOT EXISTS (SELECT 1 FROM _backup_commission_rules LIMIT 1) THEN
        INSERT INTO _backup_commission_rules SELECT * FROM commission_rules;
        RAISE NOTICE 'Backed up commission_rules: % rows', (SELECT COUNT(*) FROM commission_rules);
    END IF;
    
    -- Backup commission_settlements
    IF EXISTS (SELECT 1 FROM commission_settlements LIMIT 1) AND 
       NOT EXISTS (SELECT 1 FROM _backup_commission_settlements LIMIT 1) THEN
        INSERT INTO _backup_commission_settlements SELECT * FROM commission_settlements;
        RAISE NOTICE 'Backed up commission_settlements: % rows', (SELECT COUNT(*) FROM commission_settlements);
    END IF;
END $$;

-- ============================================
-- MARKUP_RULES TABLE MIGRATION
-- ============================================

-- Check if old columns exist and rename them
DO $$
BEGIN
    -- Rename markupValue to value
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'markup_rules' AND column_name = 'markupValue') THEN
        ALTER TABLE markup_rules RENAME COLUMN "markupValue" TO "value";
    END IF;

    -- Rename minMarkup to minValue
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'markup_rules' AND column_name = 'minMarkup') THEN
        ALTER TABLE markup_rules RENAME COLUMN "minMarkup" TO "minValue";
    END IF;

    -- Rename maxMarkup to maxValue
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'markup_rules' AND column_name = 'maxMarkup') THEN
        ALTER TABLE markup_rules RENAME COLUMN "maxMarkup" TO "maxValue";
    END IF;

    -- Rename applicableTo to targetType
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'markup_rules' AND column_name = 'applicableTo') THEN
        ALTER TABLE markup_rules RENAME COLUMN "applicableTo" TO "targetType";
    END IF;

    -- Rename markupType to ruleType
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'markup_rules' AND column_name = 'markupType') THEN
        ALTER TABLE markup_rules RENAME COLUMN "markupType" TO "ruleType";
    END IF;

    -- Convert serviceTypes array to serviceType single value (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'markup_rules' AND column_name = 'serviceTypes') THEN
        -- Add new column if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'markup_rules' AND column_name = 'serviceType') THEN
            ALTER TABLE markup_rules ADD COLUMN "serviceType" TEXT;
        END IF;
        
        -- Migrate first element of array to single value
        UPDATE markup_rules 
        SET "serviceType" = ("serviceTypes")[1] 
        WHERE "serviceTypes" IS NOT NULL AND array_length("serviceTypes", 1) > 0;
        
        -- Drop old column
        ALTER TABLE markup_rules DROP COLUMN IF EXISTS "serviceTypes";
    END IF;
END $$;

-- ============================================
-- COMMISSION_RULES TABLE MIGRATION
-- ============================================

DO $$
BEGIN
    -- Rename markupValue to value
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'commission_rules' AND column_name = 'markupValue') THEN
        ALTER TABLE commission_rules RENAME COLUMN "markupValue" TO "value";
    END IF;

    -- Rename minMarkup to minValue
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'commission_rules' AND column_name = 'minMarkup') THEN
        ALTER TABLE commission_rules RENAME COLUMN "minMarkup" TO "minValue";
    END IF;

    -- Rename maxMarkup to maxValue
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'commission_rules' AND column_name = 'maxMarkup') THEN
        ALTER TABLE commission_rules RENAME COLUMN "maxMarkup" TO "maxValue";
    END IF;

    -- Rename applicableTo to targetType
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'commission_rules' AND column_name = 'applicableTo') THEN
        ALTER TABLE commission_rules RENAME COLUMN "applicableTo" TO "targetType";
    END IF;

    -- Rename markupType to ruleType
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'commission_rules' AND column_name = 'markupType') THEN
        ALTER TABLE commission_rules RENAME COLUMN "markupType" TO "ruleType";
    END IF;

    -- Convert serviceTypes array to serviceType single value (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'commission_rules' AND column_name = 'serviceTypes') THEN
        -- Add new column if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'commission_rules' AND column_name = 'serviceType') THEN
            ALTER TABLE commission_rules ADD COLUMN "serviceType" TEXT;
        END IF;
        
        -- Migrate first element of array to single value
        UPDATE commission_rules 
        SET "serviceType" = ("serviceTypes")[1] 
        WHERE "serviceTypes" IS NOT NULL AND array_length("serviceTypes", 1) > 0;
        
        -- Drop old column
        ALTER TABLE commission_rules DROP COLUMN IF EXISTS "serviceTypes";
    END IF;
END $$;

-- ============================================
-- COMMISSION_SETTLEMENTS TABLE MIGRATION
-- ============================================

DO $$
BEGIN
    -- Rename status to settlementStatus
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'commission_settlements' AND column_name = 'status') THEN
        ALTER TABLE commission_settlements RENAME COLUMN "status" TO "settlementStatus";
    END IF;

    -- Consolidate amount fields into single amount field
    -- If old separate fields exist, we need to handle the data migration
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'commission_settlements' AND column_name = 'commissionAmount') THEN
        
        -- Ensure amount column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'commission_settlements' AND column_name = 'amount') THEN
            ALTER TABLE commission_settlements ADD COLUMN "amount" DECIMAL(12, 2);
        END IF;
        
        -- Migrate commissionAmount to amount
        UPDATE commission_settlements 
        SET "amount" = "commissionAmount" 
        WHERE "amount" IS NULL AND "commissionAmount" IS NOT NULL;
        
        -- Drop old columns
        ALTER TABLE commission_settlements DROP COLUMN IF EXISTS "commissionAmount";
        ALTER TABLE commission_settlements DROP COLUMN IF EXISTS "baseAmount";
        ALTER TABLE commission_settlements DROP COLUMN IF EXISTS "bookingAmount";
        ALTER TABLE commission_settlements DROP COLUMN IF EXISTS "settledAmount";
    END IF;
END $$;

-- ============================================
-- SUPPLIER_DEALS TABLE MIGRATION
-- ============================================

DO $$
BEGIN
    -- Rename mappingRules to dealMappingRules if needed
    -- Note: This is a JSON field, so we just need to ensure the code handles both
    -- The schema already has the correct field name
    
    -- Any other supplier_deals field migrations would go here
END $$;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_markup_rules_target_type ON markup_rules("targetType");
CREATE INDEX IF NOT EXISTS idx_markup_rules_service_type ON markup_rules("serviceType");
CREATE INDEX IF NOT EXISTS idx_markup_rules_rule_type ON markup_rules("ruleType");

CREATE INDEX IF NOT EXISTS idx_commission_rules_target_type ON commission_rules("targetType");
CREATE INDEX IF NOT EXISTS idx_commission_rules_service_type ON commission_rules("serviceType");
CREATE INDEX IF NOT EXISTS idx_commission_rules_rule_type ON commission_rules("ruleType");

CREATE INDEX IF NOT EXISTS idx_commission_settlements_status ON commission_settlements("settlementStatus");
