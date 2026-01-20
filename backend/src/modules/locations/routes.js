const express = require('express');
const controller = require('./controller');

const router = express.Router();

router.get('/', controller.searchLocations);
router.get('/:id', controller.getLocationById);

module.exports = router;
