const mockLocations = require('./model');

async function searchByName(name) {
  const keyword = name.trim();
  if (!keyword) return mockLocations;
  return mockLocations.filter((loc) => loc.name.includes(keyword));
}

async function getById(id) {
  return mockLocations.find((loc) => loc.id === id);
}

module.exports = {
  searchByName,
  getById,
};
