import { OrganizationService } from '../services/organizationService.js';
import { DatabaseConnection } from '../utils/database.js';
import { SecurityMiddleware } from '../middleware/security.js';
import { createLogger } from '@tripalfa/shared-utils';
const logger = createLogger({ serviceName: 'organization-service' });
import {
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  CreateDesignationRequest,
  CreateCostCenterRequest,
  UpdateCostCenterRequest,
  OrganizationQueryParams,
} from '../types/organization.js';

import { Router } from 'express';
const router: Router = Router();

/**
 * Department Routes
 */

/**
 * @swagger
 * /api/organization/departments:
 *   get:
 *     summary: List departments with pagination and filtering
 *     tags: [Organizations]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get(
  '/departments',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN', 'B2B']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const params: OrganizationQueryParams = {
        companyId: req.user.companyId,
        status: req.query.status as any,
        search: req.query.search as string,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const result = await service.getDepartments(params, req.user.id, req.user.role);

      res.json(result);
    } catch (error) {
      logger.error(error as Error, 'Error getting departments');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /api/organization/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Department not found
 *       500:
 *         description: Server error
 */
router.get(
  '/departments/:id',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN', 'B2B']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const department = await service.getDepartmentById(
        req.params.id as string,
        req.user.id,
        req.user.role
      );

      res.json(department);
    } catch (error) {
      logger.error(error as Error, 'Error getting department');
      if (error.message === 'Department not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * @swagger
 * /api/organization/departments:
 *   post:
 *     summary: Create new department
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               headId:
 *                 type: string
 *               parentDepartmentId:
 *                 type: string
 *               level:
 *                 type: integer
 *               budget:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post(
  '/departments',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const departmentData: CreateDepartmentRequest = {
        companyId: req.user.companyId,
        name: req.body.name,
        code: req.body.code,
        description: req.body.description,
        headId: req.body.headId,
        parentDepartmentId: req.body.parentDepartmentId,
        level: req.body.level,
        budget: req.body.budget,
        status: req.body.status,
      };

      const department = await service.createDepartment(departmentData, req.user.id, req.user.role);

      res.status(201).json(department);
    } catch (error) {
      logger.error(error as Error, 'Error creating department');
      if (
        error.message.includes('already exists') ||
        error.message.includes('belongs to a different company')
      ) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * @swagger
 * /api/organization/departments/{id}:
 *   put:
 *     summary: Update department
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               headId:
 *                 type: string
 *               parentDepartmentId:
 *                 type: string
 *               level:
 *                 type: integer
 *               budget:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put(
  '/departments/:id',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const updateData: UpdateDepartmentRequest = {
        id: req.params.id as string,
        name: req.body.name,
        code: req.body.code,
        description: req.body.description,
        headId: req.body.headId,
        parentDepartmentId: req.body.parentDepartmentId,
        level: req.body.level,
        budget: req.body.budget,
        status: req.body.status,
      };

      const department = await service.updateDepartment(
        req.params.id as string,
        updateData,
        req.user.id,
        req.user.role
      );

      res.json(department);
    } catch (error) {
      logger.error(error as Error, 'Error updating department');
      if (error.message.includes('already exists') || error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('No fields to update')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * @swagger
 * /api/organization/departments/{id}:
 *   delete:
 *     summary: Delete department
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.delete(
  '/departments/:id',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      await service.deleteDepartment(req.params.id as string, req.user.id, req.user.role);

      res.json({ message: 'Department deleted successfully' });
    } catch (error) {
      logger.error(error as Error, 'Error deleting department');
      if (error.message.includes('Cannot delete') || error.message.includes('not found')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * Designation Routes
 */

/**
 * @swagger
 * /api/organization/designations:
 *   get:
 *     summary: List designations with pagination and filtering
 *     tags: [Organizations]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get(
  '/designations',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN', 'B2B']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const params: OrganizationQueryParams = {
        companyId: req.user.companyId,
        status: req.query.status as any,
        departmentId: req.query.departmentId as string,
        search: req.query.search as string,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const result = await service.getDesignations(params, req.user.id, req.user.role);

      res.json(result);
    } catch (error) {
      logger.error(error as Error, 'Error getting designations');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /api/organization/designations:
 *   post:
 *     summary: Create new designation
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               level:
 *                 type: integer
 *               description:
 *                 type: string
 *               departmentId:
 *                 type: string
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               salaryRange:
 *                 type: object
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post(
  '/designations',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const designationData: CreateDesignationRequest = {
        companyId: req.user.companyId,
        name: req.body.name,
        level: req.body.level,
        description: req.body.description,
        departmentId: req.body.departmentId,
        responsibilities: req.body.responsibilities,
        requirements: req.body.requirements,
        salaryRange: req.body.salaryRange,
        status: req.body.status,
      };

      const designation = await service.createDesignation(
        designationData,
        req.user.id,
        req.user.role
      );

      res.status(201).json(designation);
    } catch (error) {
      logger.error(error as Error, 'Error creating designation');
      if (error.message.includes('already exists')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * Cost Center Routes
 */

/**
 * @swagger
 * /api/organization/cost-centers:
 *   get:
 *     summary: List cost centers with pagination and filtering
 *     tags: [Organizations]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get(
  '/cost-centers',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN', 'B2B']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const params: OrganizationQueryParams = {
        companyId: req.user.companyId,
        status: req.query.status as any,
        departmentId: req.query.departmentId as string,
        branchId: req.query.branchId as string,
        search: req.query.search as string,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const result = await service.getCostCenters(params, req.user.id, req.user.role);

      res.json(result);
    } catch (error) {
      logger.error(error as Error, 'Error getting cost centers');
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /api/organization/cost-centers:
 *   post:
 *     summary: Create new cost center
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               departmentId:
 *                 type: string
 *               branchId:
 *                 type: string
 *               budget:
 *                 type: number
 *               currency:
 *                 type: string
 *               status:
 *                 type: string
 *               managerId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post(
  '/cost-centers',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const costCenterData: CreateCostCenterRequest = {
        companyId: req.user.companyId,
        name: req.body.name,
        code: req.body.code,
        description: req.body.description,
        departmentId: req.body.departmentId,
        branchId: req.body.branchId,
        budget: req.body.budget,
        currency: req.body.currency,
        status: req.body.status,
        managerId: req.body.managerId,
      };

      const costCenter = await service.createCostCenter(costCenterData, req.user.id, req.user.role);

      res.status(201).json(costCenter);
    } catch (error) {
      logger.error(error as Error, 'Error creating cost center');
      if (error.message.includes('already exists')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * @swagger
 * /api/organization/cost-centers/{id}:
 *   put:
 *     summary: Update cost center
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               departmentId:
 *                 type: string
 *               branchId:
 *                 type: string
 *               budget:
 *                 type: number
 *               currency:
 *                 type: string
 *               status:
 *                 type: string
 *               managerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put(
  '/cost-centers/:id',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const updateData: UpdateCostCenterRequest = {
        id: req.params.id as string,
        name: req.body.name,
        code: req.body.code,
        description: req.body.description,
        departmentId: req.body.departmentId,
        branchId: req.body.branchId,
        budget: req.body.budget,
        currency: req.body.currency,
        status: req.body.status,
        managerId: req.body.managerId,
      };

      const costCenter = await service.updateCostCenter(
        req.params.id as string,
        updateData,
        req.user.id,
        req.user.role
      );

      res.json(costCenter);
    } catch (error) {
      logger.error(error as Error, 'Error updating cost center');
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * @swagger
 * /api/organization/cost-centers/{id}:
 *   delete:
 *     summary: Delete cost center
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.delete(
  '/cost-centers/:id',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN']),
  async (req, res) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      await service.deleteCostCenter(req.params.id as string, req.user.id, req.user.role);

      res.json({ message: 'Cost center deleted successfully' });
    } catch (error) {
      logger.error(error as Error, 'Error deleting cost center');
      if (error.message.includes('Cannot delete') || error.message.includes('not found')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

export default router;
