const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/demo', express.static(path.join(__dirname, 'demo')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'maf-viewer' });
});

app.listen(PORT, () => {
  console.log(`MAF Viewer running at http://localhost:${PORT}`);
});
