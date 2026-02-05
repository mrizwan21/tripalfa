import express, { Request, Response } from 'express';
import multer from 'multer';
import type { Express } from 'express';
import path from 'path';

type MulterFile = Express.Multer.File;

const router = express.Router();

// Multer setup for credit card uploads
const cardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/company-cards'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const cardUpload = multer({ storage: cardStorage });

export interface LoyaltyProgram {
  type: 'flight' | 'hotel' | 'car';
  programName: string;
  membershipNumber: string;
}

export interface Company {
  id: string;
  name: string;
  creditCards?: string[];
  preferences?: {
    flights?: string[];
    hotels?: string[];
    cars?: string[];
  };
  loyaltyPrograms?: LoyaltyProgram[];
}

const companies: Company[] = [];

// Create company with credit card upload, preferences, loyalty programs
router.post('/', cardUpload.array('creditCards', 5), (req: Request & { files?: MulterFile[] }, res: Response) => {
  const { name, preferences, loyaltyPrograms } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  const creditCards = req.files ? req.files.map(f => '/uploads/company-cards/' + f.filename) : [];
  const newCompany: Company = {
    id: String(Date.now()),
    name,
    creditCards,
    preferences: preferences ? JSON.parse(preferences) : {},
    loyaltyPrograms: loyaltyPrograms ? JSON.parse(loyaltyPrograms) : [],
  };
  companies.push(newCompany);
  res.status(201).json(newCompany);
});

// Update company
router.put('/:id', cardUpload.array('creditCards', 5), (req: Request & { files?: MulterFile[] }, res: Response) => {
  const company = companies.find(c => c.id === req.params.id);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  const { name, preferences, loyaltyPrograms } = req.body;
  if (name) company.name = name;
  if (preferences !== undefined) company.preferences = JSON.parse(preferences);
  if (loyaltyPrograms !== undefined) company.loyaltyPrograms = JSON.parse(loyaltyPrograms);
  if (req.files) company.creditCards = req.files.map(f => '/uploads/company-cards/' + f.filename);
  res.json(company);
});

// Get all companies
router.get('/', (req: Request, res: Response) => {
  res.json(companies);
});

// Get company by id
router.get('/:id', (req: Request, res: Response) => {
  const company = companies.find(c => c.id === req.params.id);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json(company);
});

export default router;
