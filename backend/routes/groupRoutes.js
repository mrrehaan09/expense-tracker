import express from 'express';
import {
  getGroups,
  createGroup,
  getGroupById,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All group routes are protected and strictly user-scoped
router.use(protect);

router.get('/', getGroups);
router.post('/', createGroup);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

export default router;
