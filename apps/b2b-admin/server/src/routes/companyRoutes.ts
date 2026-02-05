import express from 'express';
import { companyService } from '../services/companyService.js';
import { authService } from '../services/authService.js';
import { SecurityMiddleware } from '../middleware/security.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Apply security middleware to all routes
router.use(SecurityMiddleware.sanitizeInput);
router.use(SecurityMiddleware.getSecurityHeaders);

/**
 * GET /api/companies
 * Get all companies with pagination and search
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    // Check permissions
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Super admin can see all companies, others can only see their own
    const userCompanyId = decoded.companyId;
    const canViewAll = decoded.role === 'SUPER_ADMIN';
    
    const result = await companyService.getCompanies(
      page, 
      limit, 
      search, 
      canViewAll ? undefined : userCompanyId
    );

    res.json(result);
  } catch (error) {
    logger.error('Failed to get companies', error);
    res.status(500).json({ error: 'Failed to retrieve companies' });
  }
});

/**
 * GET /api/companies/:id
 * Get company by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user can access this company
    const userCompanyId = decoded.companyId;
    const canViewAll = decoded.role === 'SUPER_ADMIN';
    
    if (!canViewAll && userCompanyId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const company = await companyService.getCompanyById(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    logger.error('Failed to get company', error);
    res.status(500).json({ error: 'Failed to retrieve company' });
  }
});

/**
 * POST /api/companies
 * Create a new company
 */
router.post('/', async (req, res) => {
  try {
    const companyData = req.body;

    // Check permissions (only super admin can create companies)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const company = await companyService.createCompany(companyData);
    res.status(201).json(company);
  } catch (error) {
    logger.error('Failed to create company', error);
    res.status(400).json({ error: error.message || 'Failed to create company' });
  }
});

/**
 * PUT /api/companies/:id
 * Update company
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check permissions
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user can update this company
    const userCompanyId = decoded.companyId;
    const canUpdateAll = decoded.role === 'SUPER_ADMIN';
    
    if (!canUpdateAll && userCompanyId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const company = await companyService.updateCompany(id, updates);
    res.json(company);
  } catch (error) {
    logger.error('Failed to update company', error);
    res.status(400).json({ error: error.message || 'Failed to update company' });
  }
});

/**
 * DELETE /api/companies/:id
 * Delete company (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions (only super admin can delete companies)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await companyService.deleteCompany(id);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete company', error);
    res.status(400).json({ error: error.message || 'Failed to delete company' });
  }
});

/**
 * GET /api/companies/:id/branches
 * Get branches for a company
 */
router.get('/:id/branches', async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user can access this company's branches
    const userCompanyId = decoded.companyId;
    const canViewAll = decoded.role === 'SUPER_ADMIN';
    
    if (!canViewAll && userCompanyId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const branches = await companyService.getBranchesByCompany(id);
    res.json(branches);
  } catch (error) {
    logger.error('Failed to get branches', error);
    res.status(500).json({ error: 'Failed to retrieve branches' });
  }
});

/**
 * POST /api/companies/:id/branches
 * Create branch for a company
 */
router.post('/:id/branches', async (req, res) => {
  try {
    const { id } = req.params;
    const branchData = { ...req.body, companyId: id };

    // Check permissions
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user can create branches for this company
    const userCompanyId = decoded.companyId;
    const canCreateAll = decoded.role === 'SUPER_ADMIN';
    
    if (!canCreateAll && userCompanyId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const branch = await companyService.createBranch(branchData);
    res.status(201).json(branch);
  } catch (error) {
    logger.error('Failed to create branch', error);
    res.status(400).json({ error: error.message || 'Failed to create branch' });
  }
});

/**
 * PUT /api/companies/:companyId/branches/:branchId
 * Update branch
 */
router.put('/:companyId/branches/:branchId', async (req, res) => {
  try {
    const { companyId, branchId } = req.params;
    const updates = req.body;

    // Check permissions
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = authService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user can update this branch
    const userCompanyId = decoded.companyId;
    const canUpdateAll = decoded.role === 'SUPER_ADMIN';
    
    if (!canUpdateAll && userCompanyId !== companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const branch = await companyService.updateBranch(branchId, updates);
    res.json(branch);
  } catch (error) {
    logger.error('Failed to update branch', error);
    res.status(400).json({ error: error.message || 'Failed to update branch' });
  }
});

export default router;