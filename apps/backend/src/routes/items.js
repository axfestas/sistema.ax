const express = require('express');
const items = require('../data/items.json');
const router = express.Router();

router.get('/', (req, res) => {
  res.json(items);
});

router.get('/:id', (req, res) => {
  const item = items.find(i => String(i.id) === req.params.id || i.slug === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

module.exports = router;
