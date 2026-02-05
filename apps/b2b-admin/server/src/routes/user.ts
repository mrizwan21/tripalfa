import express, { Request, Response } from 'express';
import multer from 'multer';
import type { Express } from 'express';
import path from 'path';

type MulterFile = Express.Multer.File;

const router = express.Router();

// Multer setup for credit card uploads
const cardStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/user-cards'));
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

export interface User {
  id: string;
  name: string;
  userType: 'B2B' | 'B2C';
  creditCards?: string[];
  preferences?: {
    flights?: string[];
    hotels?: string[];
    cars?: string[];
  };
  loyaltyPrograms?: LoyaltyProgram[];
}

const users: User[] = [];

// Create user with credit card upload, preferences, loyalty programs
router.post('/', cardUpload.array('creditCards', 5), (req: Request & { files?: MulterFile[] }, res: Response) => {
  const { name, userType, preferences, loyaltyPrograms } = req.body;
  if (!name || !userType) return res.status(400).json({ message: 'Name and userType required' });
  const creditCards = req.files ? req.files.map(f => '/uploads/user-cards/' + f.filename) : [];
  const newUser: User = {
    id: String(Date.now()),
    name,
    userType,
    creditCards,
    preferences: preferences ? JSON.parse(preferences) : {},
    loyaltyPrograms: loyaltyPrograms ? JSON.parse(loyaltyPrograms) : [],
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

// Update user
router.put('/:id', cardUpload.array('creditCards', 5), (req: Request & { files?: MulterFile[] }, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { name, userType, preferences, loyaltyPrograms } = req.body;
  if (name) user.name = name;
  if (userType) user.userType = userType;
  if (preferences !== undefined) user.preferences = JSON.parse(preferences);
  if (loyaltyPrograms !== undefined) user.loyaltyPrograms = JSON.parse(loyaltyPrograms);
  if (req.files) user.creditCards = req.files.map(f => '/uploads/user-cards/' + f.filename);
  res.json(user);
});

// Get all users
router.get('/', (req: Request, res: Response) => {
  res.json(users);
});

// Get user by id
router.get('/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

export default router;
