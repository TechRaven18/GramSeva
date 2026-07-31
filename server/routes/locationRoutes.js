const express = require('express');
const router = express.Router();
const {
  getDistricts,
  getBlocks,
  getPanchayats,
  getVillages,
  getAllJurisdictions,
  getTopPanchayats
} = require('../controllers/locationController');

router.get('/districts', getDistricts);
router.get('/blocks', getBlocks);
router.get('/panchayats', getPanchayats);
router.get('/villages', getVillages);
router.get('/all', getAllJurisdictions);
router.get('/top-panchayats', getTopPanchayats);

module.exports = router;
