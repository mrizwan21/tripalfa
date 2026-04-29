-- Migration script: Add validFrom/validTo backward compatibility columns
-- This script adds virtual/computed columns that map validFrom -> startDate and validTo -> endDate
-- Run this migration to ensure backward compatibility with existing code
-- that uses validFrom/validTo while the new schema uses startDate/endDate

-- ============================================================================
-- Migration: Add backward compatibility columns for validFrom/validTo
-- Database: tripalfa_finance
-- Purpose: Allow existing code using validFrom/validTo to work with new schema
-- that uses startDate/endDate
-- ============================================================================

-- Add validFrom column as alias for startDate (for corporate_contract table)
ALTER TABLE corporate_contract 
ADD COLUMN IF NOT EXISTS validFrom TIMESTAMPTZ;

UPDATE corporate_contract 
SET validFrom = startDate 
WHERE validFrom IS NULL AND startDate IS NOT NULL;

-- Add validTo column as alias for endDate (for corporate_contract table)
ALTER TABLE corporate_contract 
ADD COLUMN IF NOT EXISTS validTo TIMESTAMPTZ;

UPDATE corporate_contract 
SET validTo = endDate 
WHERE validTo IS NULL AND endDate IS NOT NULL;

-- Add validFrom column as alias for startDate (for pricing_rule table)
ALTER TABLE pricing_rule 
ADD COLUMN IF NOT EXISTS validFrom TIMESTAMPTZ;

UPDATE pricing_rule 
SET validFrom = startDate 
WHERE validFrom IS NULL AND startDate IS NOT NULL;

-- Add validTo column as alias for endDate (for pricing_rule table)
ALTER TABLE pricing_rule 
ADD COLUMN IF NOT EXISTS validTo TIMESTAMPTZ;

UPDATE pricing_rule 
SET validTo = endDate 
WHERE validTo IS NULL AND endDate IS NOT NULL;

-- Add validFrom column as alias for startDate (for deal table)
ALTER TABLE deal 
ADD COLUMN IF NOT EXISTS validFrom TIMESTAMPTZ;

UPDATE deal 
SET validFrom = startDate 
WHERE validFrom IS NULL AND startDate IS NOT NULL;

-- Add validTo column as alias for endDate (for deal table)
ALTER TABLE deal 
ADD COLUMN IF NOT EXISTS validTo TIMESTAMPTZ;

UPDATE deal 
SET validTo = endDate 
WHERE validTo IS NULL AND endDate IS NOT NULL;

-- Add validFrom column as alias for startDate (for coupon table)
ALTER TABLE coupon 
ADD COLUMN IF NOT EXISTS validFrom TIMESTAMPTZ;

UPDATE coupon 
SET validFrom = startDate 
WHERE validFrom IS NULL AND startDate IS NOT NULL;

-- Add validTo column as alias for endDate (for coupon table)
ALTER TABLE coupon 
ADD COLUMN IF NOT EXISTS validTo TIMESTAMPTZ;

UPDATE coupon 
SET validTo = endDate 
WHERE validTo IS NULL AND endDate IS NOT NULL;

-- Add validFrom column as alias for startDate (for markup_rule table)
ALTER TABLE markup_rule 
ADD COLUMN IF NOT EXISTS validFrom TIMESTAMPTZ;

UPDATE markup_rule 
SET validFrom = startDate 
WHERE validFrom IS NULL AND startDate IS NOT NULL;

-- Add validTo column as alias for endDate (for markup_rule table)
ALTER TABLE markup_rule 
ADD COLUMN IF NOT EXISTS validTo TIMESTAMPTZ;

UPDATE markup_rule 
SET validTo = endDate 
WHERE validTo IS NULL AND endDate IS NOT NULL;

-- Add validFrom column as alias for startDate (for commission_rule table)
ALTER TABLE commission_rule 
ADD COLUMN IF NOT EXISTS validFrom TIMESTAMPTZ;

UPDATE commission_rule 
SET validFrom = startDate 
WHERE validFrom IS NULL AND startDate IS NOT NULL;

-- Add validTo column as alias for endDate/expiryDate (for commission_rule table)
ALTER TABLE commission_rule 
ADD COLUMN IF NOT EXISTS validTo TIMESTAMPTZ;

UPDATE commission_rule 
SET validTo = COALESCE(endDate, expiryDate) 
WHERE validTo IS NULL AND (endDate IS NOT NULL OR expiryDate IS NOT NULL);

-- Add validFrom column as alias for startDate (for loyalty_tier table)
ALTER TABLE loyalty_tier 
ADD COLUMN IF NOT EXISTS validFrom TIMESTAMPTZ;

UPDATE loyalty_tier 
SET validFrom = startDate 
WHERE validFrom IS NULL AND startDate IS NOT NULL;

-- Add validTo column as alias for expiryDate (for loyalty_tier table)
ALTER TABLE loyalty_tier 
ADD COLUMN IF NOT EXISTS validTo TIMESTAMPTZ;

UPDATE loyalty_tier 
SET validTo = expiryDate 
WHERE validTo IS NULL AND expiryDate IS NOT NULL;

-- Create indexes on the new columns for performance
CREATE INDEX IF NOT EXISTS idx_corporate_contract_validFrom ON corporate_contract(validFrom);
CREATE INDEX IF NOT EXISTS idx_corporate_contract_validTo ON corporate_contract(validTo);
CREATE INDEX IF NOT EXISTS idx_pricing_rule_validFrom ON pricing_rule(validFrom);
CREATE INDEX IF NOT EXISTS idx_pricing_rule_validTo ON pricing_rule(validTo);
CREATE INDEX IF NOT EXISTS idx_deal_validFrom ON deal(validFrom);
CREATE INDEX IF NOT EXISTS idx_deal_validTo ON deal(validTo);
CREATE INDEX IF NOT EXISTS idx_coupon_validFrom ON coupon(validFrom);
CREATE INDEX IF NOT EXISTS idx_coupon_validTo ON coupon(validTo);
CREATE INDEX IF NOT EXISTS idx_markup_rule_validFrom ON markup_rule(validFrom);
CREATE INDEX IF NOT EXISTS idx_markup_rule_validTo ON markup_rule(validTo);
CREATE INDEX IF NOT EXISTS idx_commission_rule_validFrom ON commission_rule(validFrom);
CREATE INDEX IF NOT EXISTS idx_commission_rule_validTo ON commission_rule(validTo);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_validFrom ON loyalty_tier(validFrom);
CREATE INDEX IF NOT EXISTS idx_loyalty_tier_validTo ON loyalty_tier(validTo);

-- Set default values for new columns to maintain compatibility
ALTER TABLE corporate_contract ALTER COLUMN validFrom SET DEFAULT NULL;
ALTER TABLE corporate_contract ALTER COLUMN validTo SET DEFAULT NULL;
ALTER TABLE pricing_rule ALTER COLUMN validFrom SET DEFAULT NULL;
ALTER TABLE pricing_rule ALTER COLUMN validTo SET DEFAULT NULL;
ALTER TABLE deal ALTER COLUMN validFrom SET DEFAULT NULL;
ALTER TABLE deal ALTER COLUMN validTo SET DEFAULT NULL;
ALTER TABLE coupon ALTER COLUMN validFrom SET DEFAULT NULL;
ALTER TABLE coupon ALTER COLUMN validTo SET DEFAULT NULL;
ALTER TABLE markup_rule ALTER COLUMN validFrom SET DEFAULT NULL;
ALTER TABLE markup_rule ALTER COLUMN validTo SET DEFAULT NULL;
ALTER TABLE commission_rule ALTER COLUMN validFrom SET DEFAULT NULL;
ALTER TABLE commission_rule ALTER COLUMN validTo SET DEFAULT NULL;
ALTER TABLE loyalty_tier ALTER COLUMN validFrom SET DEFAULT NULL;
ALTER TABLE loyalty_tier ALTER COLUMN validTo SET DEFAULT NULL;

-- Add comments to document the migration
COMMENT ON COLUMN corporate_contract.validFrom IS 'Backward compatibility column - mirrors startDate';
COMMENT ON COLUMN corporate_contract.validTo IS 'Backward compatibility column - mirrors endDate';
COMMENT ON COLUMN pricing_rule.validFrom IS 'Backward compatibility column - mirrors startDate';
COMMENT ON COLUMN pricing_rule.validTo IS 'Backward compatibility column - mirrors endDate';
COMMENT ON COLUMN deal.validFrom IS 'Backward compatibility column - mirrors startDate';
COMMENT ON COLUMN deal.validTo IS 'Backward compatibility column - mirrors endDate';
COMMENT ON COLUMN coupon.validFrom IS 'Backward compatibility column - mirrors startDate';
COMMENT ON COLUMN coupon.validTo IS 'Backward compatibility column - mirrors endDate';
COMMENT ON COLUMN markup_rule.validFrom IS 'Backward compatibility column - mirrors startDate';
COMMENT ON COLUMN markup_rule.validTo IS 'Backward compatibility column - mirrors endDate';
COMMENT ON COLUMN commission_rule.validFrom IS 'Backward compatibility column - mirrors startDate';
COMMENT ON COLUMN commission_rule.validTo IS 'Backward compatibility column - mirrors endDate or expiryDate';
COMMENT ON COLUMN loyalty_tier.validFrom IS 'Backward compatibility column - mirrors startDate';
COMMENT ON COLUMN loyalty_tier.validTo IS 'Backward compatibility column - mirrors expiryDate';

-- Verify the migration
SELECT 'corporate_contract' as table_name, COUNT(*) as rows_with_validFrom 
FROM corporate_contract WHERE validFrom IS NOT NULL
UNION ALL
SELECT 'pricing_rule', COUNT(*) FROM pricing_rule WHERE validFrom IS NOT NULL
UNION ALL
SELECT 'deal', COUNT(*) FROM deal WHERE validFrom IS NOT NULL
UNION ALL
SELECT 'coupon', COUNT(*) FROM coupon WHERE validFrom IS NOT NULL
UNION ALL
SELECT 'markup_rule', COUNT(*) FROM markup_rule WHERE validFrom IS NOT NULL
UNION ALL
SELECT 'commission_rule', COUNT(*) FROM commission_rule WHERE validFrom IS NOT NULL
UNION ALL
SELECT 'loyalty_tier', COUNT(*) FROM loyalty_tier WHERE validFrom IS NOT NULL;
