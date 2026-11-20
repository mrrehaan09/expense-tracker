import express from 'express';
import {
  getExpenses,
  createExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All expense routes require valid JWT auth
router.use(protect);

router.get('/', getExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

export default router;
