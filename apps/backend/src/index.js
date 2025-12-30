const express = require('express');
const cors = require('cors');
const itemsRouter = require('./routes/items');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/items', itemsRouter);

const port = process.env.PORT || 3333;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
