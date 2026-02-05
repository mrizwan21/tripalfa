import express from 'express';
import userController from '../controllers/userController';

const router = express.Router();

router.use('/users', userController);

export default router;
