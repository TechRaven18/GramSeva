const Jurisdiction = require('../models/Jurisdiction');

// @desc    Get list of unique districts
// @route   GET /api/locations/districts
const getDistricts = async (req, res) => {
  try {
    const districts = await Jurisdiction.distinct('district');
    res.json({ success: true, districts: districts.sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get list of blocks in a district
// @route   GET /api/locations/blocks?district=...
const getBlocks = async (req, res) => {
  try {
    const { district } = req.query;
    if (!district) {
      return res.status(400).json({ success: false, message: 'District query parameter is required.' });
    }
    const blocks = await Jurisdiction.find({ district }).distinct('block');
    res.json({ success: true, blocks: blocks.sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Panchayats / Municipalities in a block
// @route   GET /api/locations/panchayats?district=...&block=...
const getPanchayats = async (req, res) => {
  try {
    const { district, block } = req.query;
    if (!district || !block) {
      return res.status(400).json({ success: false, message: 'District and block parameters are required.' });
    }
    const jurisdictions = await Jurisdiction.find({ district, block }).select('panchayat panchayatCode type villages _id');
    res.json({ success: true, panchayats: jurisdictions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get villages/localities for a specific Panchayat
// @route   GET /api/locations/villages?jurisdictionId=...
const getVillages = async (req, res) => {
  try {
    const { jurisdictionId } = req.query;
    if (!jurisdictionId) {
      return res.status(400).json({ success: false, message: 'jurisdictionId is required.' });
    }
    const jurisdiction = await Jurisdiction.findById(jurisdictionId);
    if (!jurisdiction) {
      return res.status(404).json({ success: false, message: 'Jurisdiction not found.' });
    }
    res.json({ success: true, villages: jurisdiction.villages || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all jurisdictions master list
// @route   GET /api/locations/all
const getAllJurisdictions = async (req, res) => {
  try {
    const data = await Jurisdiction.find({}).sort({ district: 1, block: 1, panchayat: 1 });
    res.json({ success: true, count: data.length, jurisdictions: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get top 10 panchayats with highest completed complaint resolutions (Public Endpoint)
// @route   GET /api/locations/top-panchayats
const getTopPanchayats = async (req, res) => {
  try {
    const Complaint = require('../models/Complaint');
    
    // 1. Aggregate real complaint stats from DB per panchayat
    const complaintStats = await Complaint.aggregate([
      {
        $group: {
          _id: {
            panchayat: '$location.panchayat',
            block: '$location.block',
            district: '$location.district'
          },
          totalComplaints: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          }
        }
      }
    ]);

    // Map real complaint stats by panchayat name (lowercase)
    const statsMap = new Map();
    complaintStats.forEach(item => {
      if (item._id && item._id.panchayat) {
        statsMap.set(item._id.panchayat.trim().toLowerCase(), {
          totalComplaints: item.totalComplaints,
          completedCount: item.completedCount
        });
      }
    });

    // 2. Fetch all registered jurisdictions from DB
    const allJurisdictions = await Jurisdiction.find({});
    
    // 3. Build real performance metrics for each Panchayat
    let rankings = allJurisdictions.map(jur => {
      const key = jur.panchayat.trim().toLowerCase();
      const stats = statsMap.get(key) || { totalComplaints: 0, completedCount: 0 };
      const totalComplaints = stats.totalComplaints;
      const completedCount = stats.completedCount;
      const rateNumber = totalComplaints > 0 ? Math.round((completedCount / totalComplaints) * 100) : 0;
      
      return {
        panchayat: jur.panchayat,
        block: jur.block,
        district: jur.district,
        type: jur.type || 'Gram Panchayat',
        totalComplaints,
        completedCount,
        resolutionRate: `${rateNumber}%`,
        villagesCount: jur.villages ? jur.villages.length : 0
      };
    });

    // 4. Prioritize & sort strictly by total completed complaints descending
    rankings.sort((a, b) => {
      if (b.completedCount !== a.completedCount) {
        return b.completedCount - a.completedCount;
      }
      return b.totalComplaints - a.totalComplaints;
    });

    // 5. Slice top 10 Panchayats
    const top10 = rankings.slice(0, 10).map((item, idx) => ({
      rank: idx + 1,
      ...item
    }));

    res.json({ success: true, count: top10.length, topPanchayats: top10 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDistricts,
  getBlocks,
  getPanchayats,
  getVillages,
  getAllJurisdictions,
  getTopPanchayats
};
