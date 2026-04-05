import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface FavoriteItem {
  id: string;
  entityId: string;
  type: 'CONTACT' | 'COMPANY' | 'BOOKING' | 'KYC_APPLICANT';
  name: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  folderId?: string;
  tags: string[];
  lastViewed: string;
}

interface FavoriteFolder {
  id: string;
  name: string;
  itemCount: number;
}

const favorites: Map<string, FavoriteItem> = new Map();
const folders: Map<string, FavoriteFolder> = new Map();

/**
 * @swagger
 * /api/crm/favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: List favorites
 *     parameters:
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: string
 *         description: Filter by folder ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by type
 *     responses:
 *       200:
 *         description: List of favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { folderId, type } = req.query;
    let filtered = Array.from(favorites.values());

    if (folderId) filtered = filtered.filter(f => f.folderId === folderId);
    if (type) filtered = filtered.filter(f => f.type === type);

    res.status(200).json({ success: true, data: filtered });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch favorites' });
  }
});

/**
 * @swagger
 * /api/crm/favorites/folders:
 *   get:
 *     tags: [Favorites]
 *     summary: List folders
 *     responses:
 *       200:
 *         description: List of folders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       itemCount:
 *                         type: number
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.get('/folders', (req: Request, res: Response) => {
  try {
    const data = Array.from(folders.values());
    res.status(200).json({ success: true, data });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch folders' });
  }
});

/**
 * @swagger
 * /api/crm/favorites:
 *   post:
 *     tags: [Favorites]
 *     summary: Add favorite
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entityId, name]
 *             properties:
 *               entityId:
 *                 type: string
 *               type:
 *                 type: string
 *                 default: CONTACT
 *               name:
 *                 type: string
 *               priority:
 *                 type: string
 *               folderId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Favorite added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     entityId:
 *                       type: string
 *                     type:
 *                       type: string
 *                     name:
 *                       type: string
 *                     priority:
 *                       type: string
 *                     folderId:
 *                       type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     lastViewed:
 *                       type: string
 *                 error:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { entityId, type = 'CONTACT', name, priority, folderId, tags = [] } = req.body;

    if (!entityId || !name) {
      return res.status(400).json({ success: false, error: 'entityId and name required' });
    }

    const item: FavoriteItem = {
      id: uuidv4(),
      entityId,
      type,
      name,
      priority,
      folderId,
      tags,
      lastViewed: new Date().toISOString(),
    };

    favorites.set(item.id, item);

    res.status(201).json({ success: true, data: item });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to add favorite' });
  }
});

/**
 * @swagger
 * /api/crm/favorites/folders:
 *   post:
 *     tags: [Favorites]
 *     summary: Create folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Folder created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     itemCount:
 *                       type: number
 *                 error:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.post('/folders', (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ success: false, error: 'Name required' });

    const folder: FavoriteFolder = {
      id: uuidv4(),
      name,
      itemCount: 0,
    };

    folders.set(folder.id, folder);

    res.status(201).json({ success: true, data: folder });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to create folder' });
  }
});

/**
 * @swagger
 * /api/crm/favorites/{id}:
 *   delete:
 *     tags: [Favorites]
 *     summary: Remove favorite
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Favorite ID
 *     responses:
 *       200:
 *         description: Favorite removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *       404:
 *         description: Favorite not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    if (!favorites.has(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Favorite not found' });
    }
    favorites.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Favorite removed' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to remove favorite' });
  }
});

export default router;
