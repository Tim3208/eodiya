const service = require('./service');

async function searchLocations(req, res) {
  const { name } = req.query;
  const results = await service.searchByName(name || '');
  res.json(results);
}

async function getLocationById(req, res) {
  const location = await service.getById(req.params.id);
  if (!location) {
    return res.status(404).json({ message: 'Location not found' });
  }
  return res.json(location);
}

module.exports = {
  searchLocations,
  getLocationById,
};
