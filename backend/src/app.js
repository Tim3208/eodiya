const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const locationsRoutes = require('./modules/locations/routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/locations', locationsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
