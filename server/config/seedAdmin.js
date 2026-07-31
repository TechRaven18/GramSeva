const User = require('../models/User');
const Jurisdiction = require('../models/Jurisdiction');
const bcrypt = require('bcryptjs');

/**
 * Seeds hardcoded test Admin, Staff, and Citizen accounts into MongoDB if they do not exist.
 */
const seedHardcodedUsers = async () => {
  try {
    // Drop legacy mobile_1 index if it exists in MongoDB Atlas
    try {
      await User.collection.dropIndex('mobile_1');
      console.log('✓ [INDEX CLEANUP] Dropped legacy mobile_1 index from MongoDB Atlas.');
    } catch (e) {
      // Index already dropped or does not exist
    }

    // 1. Seed Hardcoded Admin User from .env
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gramseva.in';
    const adminPass = process.env.ADMIN_PASSWORD || 'AdminPass@123';
    const hashedAdminPass = await bcrypt.hash(adminPass, 10);

    let adminExists = await User.findOne({ email: adminEmail, role: 'ADMIN' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin (Panchayat HQ)',
        email: adminEmail,
        password: hashedAdminPass,
        role: 'ADMIN',
        address: {
          district: 'Ranchi',
          block: 'Ranchi Sadar',
          panchayat: 'Headquarters',
          village: 'HQ Central',
          pincode: '834001',
          state: 'Jharkhand'
        }
      });
      console.log(`✅ [HARDCODED TEST ACCOUNT] Created Admin: ${adminEmail} / ${adminPass}`);
    } else {
      adminExists.password = hashedAdminPass;
      await adminExists.save();
      console.log(`✓ [HARDCODED TEST ACCOUNT] Updated & Verified Admin: ${adminEmail} / ${adminPass}`);
    }

    // 2. Seed Hardcoded Staff User
    const staffPass = 'Password@123';
    const hashedStaffPass = await bcrypt.hash(staffPass, 10);
    let staffExists = await User.findOne({ email: 'staff@gramseva.in', role: 'STAFF' });
    if (!staffExists) {
      let jur = await Jurisdiction.findOne({ district: 'Ranchi', block: 'Ranchi Sadar' });
      if (!jur) {
        jur = await Jurisdiction.create({
          district: 'Ranchi',
          districtCode: 'RAN',
          block: 'Ranchi Sadar',
          blockCode: 'RAN-SAD',
          panchayat: 'Ranchi Sadar',
          panchayatCode: 'RAN-SAD-01',
          type: 'PANCHAYAT',
          villages: ['Morabadi', 'Kanke Road', 'Bariatu', 'Lalpur']
        });
      }

      await User.create({
        name: 'Subrata Kumar (Field Staff)',
        email: 'staff@gramseva.in',
        password: hashedStaffPass,
        role: 'STAFF',
        jurisdiction: {
          district: 'Ranchi',
          block: 'Ranchi Sadar',
          panchayat: 'Ranchi Sadar',
          jurisdictionId: jur._id
        },
        address: {
          district: 'Ranchi',
          block: 'Ranchi Sadar',
          panchayat: 'Ranchi Sadar',
          village: 'Kanke Road',
          pincode: '834008',
          state: 'Jharkhand'
        }
      });
      console.log('✅ [HARDCODED TEST ACCOUNT] Created Staff: staff@gramseva.in / Password@123');
    } else {
      staffExists.password = hashedStaffPass;
      await staffExists.save();
      console.log('✓ [HARDCODED TEST ACCOUNT] Updated & Verified Staff: staff@gramseva.in / Password@123');
    }

    // 3. Seed Hardcoded Citizen User
    const citizenPass = 'Password@123';
    const hashedCitizenPass = await bcrypt.hash(citizenPass, 10);
    let citizenExists = await User.findOne({ email: 'citizen@gramseva.in', role: 'CITIZEN' });
    if (!citizenExists) {
      await User.create({
        name: 'Neeraj Sharma',
        email: 'citizen@gramseva.in',
        password: hashedCitizenPass,
        role: 'CITIZEN',
        rewardCoins: 40,
        address: {
          district: 'Ranchi',
          block: 'Ranchi Sadar',
          panchayat: 'Ranchi Sadar',
          village: 'Morabadi',
          pincode: '834008',
          state: 'Jharkhand'
        }
      });
      console.log('✅ [HARDCODED TEST ACCOUNT] Created Citizen: citizen@gramseva.in / Password@123');
    } else {
      citizenExists.password = hashedCitizenPass;
      await citizenExists.save();
      console.log('✓ [HARDCODED TEST ACCOUNT] Updated & Verified Citizen: citizen@gramseva.in / Password@123');
    }
  } catch (error) {
    console.error('❌ [SEED ERROR]', error.message);
  }
};

module.exports = seedHardcodedUsers;
