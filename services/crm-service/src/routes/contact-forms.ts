import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface ContactForm {
  id: string;
  name: string;
  description?: string;
  fields: Array<{ name: string; type: 'TEXT' | 'EMAIL' | 'PHONE' | 'SELECT'; required: boolean }>;
  kycAutoTrigger: boolean;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  conversions: number;
  createdAt: string;
}

const forms: Map<string, ContactForm> = new Map();

/**
 * @swagger
 * /api/crm/contact-forms:
 *   get:
 *     tags: [Contact Forms]
 *     summary: List contact forms
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, DRAFT, ARCHIVED]
 *         description: Filter forms by status
 *     responses:
 *       200:
 *         description: List of forms
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
 *                     $ref: '#/components/schemas/ContactForm'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let filtered = Array.from(forms.values());

    if (status) filtered = filtered.filter(f => f.status === status);

    res.status(200).json({ success: true, data: filtered });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch forms' });
  }
});

/**
 * @swagger
 * /api/crm/contact-forms:
 *   post:
 *     tags: [Contact Forms]
 *     summary: Create a contact form
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
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [TEXT, EMAIL, PHONE, SELECT]
 *                     required:
 *                       type: boolean
 *               kycAutoTrigger:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Form created successfully
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
 *                     description:
 *                       type: string
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           required:
 *                             type: boolean
 *                     kycAutoTrigger:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                     conversions:
 *                       type: integer
 *                     createdAt:
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
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, fields = [], kycAutoTrigger = false } = req.body;

    if (!name) return res.status(400).json({ success: false, error: 'Name required' });

    const form: ContactForm = {
      id: uuidv4(),
      name,
      description,
      fields,
      kycAutoTrigger,
      status: 'DRAFT',
      conversions: 0,
      createdAt: new Date().toISOString(),
    };

    forms.set(form.id, form);

    res.status(201).json({ success: true, data: form });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to create form' });
  }
});

/**
 * @swagger
 * /api/crm/contact-forms/{id}/submit:
 *   post:
 *     tags: [Contact Forms]
 *     summary: Submit a contact form
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The form ID
 *     responses:
 *       200:
 *         description: Form submitted successfully
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
 *                     description:
 *                       type: string
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           required:
 *                             type: boolean
 *                     kycAutoTrigger:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                     conversions:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                 message:
 *                   type: string
 *       404:
 *         description: Form not found
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
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post('/:id/submit', (req: Request, res: Response) => {
  try {
    const form = forms.get(req.params.id as string);
    if (!form) return res.status(404).json({ success: false, error: 'Form not found' });

    form.conversions++;

    // If KYC auto-trigger is enabled, would emit event here
    if (form.kycAutoTrigger) {
      // Emit KYC_AUTO_ENROLLED event
    }

    res.status(200).json({ success: true, data: form, message: 'Form submitted successfully' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to submit form' });
  }
});

/**
 * @swagger
 * /api/crm/contact-forms/{id}/kyc-trigger:
 *   patch:
 *     tags: [Contact Forms]
 *     summary: Toggle KYC auto-trigger for a form
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The form ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enable]
 *             properties:
 *               enable:
 *                 type: boolean
 *                 description: Enable or disable KYC auto-trigger
 *     responses:
 *       200:
 *         description: KYC trigger updated successfully
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
 *                     description:
 *                       type: string
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           required:
 *                             type: boolean
 *                     kycAutoTrigger:
 *                       type: boolean
 *                     status:
 *                       type: string
 *                     conversions:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                 error:
 *                   type: string
 *       404:
 *         description: Form not found
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
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.patch('/:id/kyc-trigger', (req: Request, res: Response) => {
  try {
    const { enable } = req.body;
    const form = forms.get(req.params.id as string);
    if (!form) return res.status(404).json({ success: false, error: 'Form not found' });

    form.kycAutoTrigger = enable;

    res.status(200).json({ success: true, data: form });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to update KYC trigger' });
  }
});

export default router;
