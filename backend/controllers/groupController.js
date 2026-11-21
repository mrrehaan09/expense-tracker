import mongoose from 'mongoose';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';

// ─── Helper: Compute Group Metrics from Transaction List ────────────────────
const computeGroupStats = (transactions = [], groupCreatedAt = new Date()) => {
  let totalIncome = 0;
  let totalExpense = 0;
  let lastActivity = groupCreatedAt;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }

    const txDate = new Date(tx.date || tx.createdAt);
    if (txDate > lastActivity) {
      lastActivity = txDate;
    }
  });

  return {
    totalExpense,
    totalIncome,
    netBalance: totalIncome - totalExpense,
    transactionCount: transactions.length,
    lastActivityDate: lastActivity,
  };
};

// ─── @route  GET /api/groups ─────────────────────────────────────────────────
// @desc   Get all groups owned by the authenticated user with aggregate stats
export const getGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user groups, newest first
    const groups = await Group.find({ user: userId }).sort({ createdAt: -1 });

    if (groups.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        groups: [],
      });
    }

    const groupIds = groups.map((g) => g._id);

    // Fetch all transactions assigned to these groups in one indexed query
    const transactions = await Expense.find({
      user: userId,
      group: { $in: groupIds },
    });

    // Group transactions by group ID in memory
    const txByGroup = new Map();
    transactions.forEach((tx) => {
      const gId = tx.group.toString();
      if (!txByGroup.has(gId)) {
        txByGroup.set(gId, []);
      }
      txByGroup.get(gId).push(tx);
    });

    // Combine group docs with stats
    const groupsWithStats = groups.map((group) => {
      const groupTx = txByGroup.get(group._id.toString()) || [];
      const stats = computeGroupStats(groupTx, group.createdAt);
      return {
        ...group.toObject(),
        ...stats,
      };
    });

    res.status(200).json({
      success: true,
      count: groupsWithStats.length,
      groups: groupsWithStats,
    });
  } catch (err) {
    console.error('[getGroups error]:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch expense groups' });
  }
};

// ─── @route  POST /api/groups ────────────────────────────────────────────────
// @desc   Create a new expense group for the authenticated user
export const createGroup = async (req, res) => {
  try {
    const { title, description, color } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Group title is required' });
    }

    if (title.trim().length > 60) {
      return res.status(400).json({ success: false, message: 'Group title cannot exceed 60 characters' });
    }

    if (description && description.trim().length > 200) {
      return res.status(400).json({ success: false, message: 'Description cannot exceed 200 characters' });
    }

    const group = await Group.create({
      user: req.user.id,
      title: title.trim(),
      description: description ? description.trim() : '',
      color: color && color.trim() ? color.trim() : '#4f46e5',
    });

    res.status(201).json({
      success: true,
      message: 'Expense group created successfully',
      group: {
        ...group.toObject(),
        totalExpense: 0,
        totalIncome: 0,
        netBalance: 0,
        transactionCount: 0,
        lastActivityDate: group.createdAt,
      },
    });
  } catch (err) {
    console.error('[createGroup error]:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create expense group' });
  }
};

// ─── @route  GET /api/groups/:id ─────────────────────────────────────────────
// @desc   Get single group details and its transaction history
export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await Group.findOne({ _id: id, user: req.user.id });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found or unauthorized' });
    }

    // Fetch transactions strictly belonging to this group and user
    const transactions = await Expense.find({
      user: req.user.id,
      group: id,
    }).sort({ date: -1, createdAt: -1 });

    const stats = computeGroupStats(transactions, group.createdAt);

    res.status(200).json({
      success: true,
      group: {
        ...group.toObject(),
        ...stats,
      },
      transactions,
    });
  } catch (err) {
    console.error('[getGroupById error]:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch group details' });
  }
};

// ─── @route  PUT /api/groups/:id ──────────────────────────────────────────────
// @desc   Update group title, description, or color
export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, color } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await Group.findOne({ _id: id, user: req.user.id });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found or unauthorized' });
    }

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: 'Group title cannot be empty' });
      }
      if (title.trim().length > 60) {
        return res.status(400).json({ success: false, message: 'Group title cannot exceed 60 characters' });
      }
      group.title = title.trim();
    }

    if (description !== undefined) {
      if (description.trim().length > 200) {
        return res.status(400).json({ success: false, message: 'Description cannot exceed 200 characters' });
      }
      group.description = description.trim();
    }

    if (color !== undefined && color.trim()) {
      group.color = color.trim();
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      group,
    });
  } catch (err) {
    console.error('[updateGroup error]:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update group' });
  }
};

// ─── @route  DELETE /api/groups/:id ───────────────────────────────────────────
// @desc   Delete group safely: preserves transactions by resetting their group to null
export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid group ID format' });
    }

    const group = await Group.findOne({ _id: id, user: req.user.id });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found or unauthorized' });
    }

    // Preserve all financial records: disassociate without deleting transactions
    const updateResult = await Expense.updateMany(
      { user: req.user.id, group: id },
      { $set: { group: null } }
    );

    // Delete the group document
    await Group.deleteOne({ _id: id, user: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully. Associated expenses were preserved as personal records.',
      preservedTransactionsCount: updateResult.modifiedCount,
      id,
    });
  } catch (err) {
    console.error('[deleteGroup error]:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete group' });
  }
};
