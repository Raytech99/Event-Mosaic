const express = require('express');
const router = express.Router();
const { getAllInstaAccounts, getInstaAccountById } = require('../controllers/instaAccountsController');

// Get all Instagram accounts
router.get('/', getAllInstaAccounts);

// Get Instagram account by ID
router.get('/:id', getInstaAccountById);

module.exports = router; 