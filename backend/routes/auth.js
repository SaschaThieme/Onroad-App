const express = require('express');
const router  = express.Router();
const dem     = require('../dem-api');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    const result = await dem.login(username, password);
    if (!result.success) return res.status(401).json({ error: 'Ungültige Zugangsdaten' });
    res.json({ success: true, user: result.user, token: result.token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
