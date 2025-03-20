const InstaAccount = require('../models/instaAccounts');

// Get all Instagram accounts
const getAllInstaAccounts = async (req, res) => {
    try {
        const accounts = await InstaAccount.find({});
        console.log('Found Instagram accounts:', accounts);
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching Instagram accounts:', error);
        res.status(500).json({ message: 'Error fetching Instagram accounts' });
    }
};

// Get Instagram account by ID
const getInstaAccountById = async (req, res) => {
    try {
        const account = await InstaAccount.findById(req.params.id);
        console.log('Found Instagram account by ID:', account);
        if (!account) {
            return res.status(404).json({ message: 'Instagram account not found' });
        }
        res.json({
            handle: account.handle,
            events: account.events
        });
    } catch (error) {
        console.error('Error fetching Instagram account:', error);
        res.status(500).json({ message: 'Error fetching Instagram account' });
    }
};

module.exports = {
    getAllInstaAccounts,
    getInstaAccountById
}; 