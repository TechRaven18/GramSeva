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
    const adminPass = process.env.ADMIN_PASSWORD || '123456';
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
      const match = await bcrypt.compare(adminPass, adminExists.password);
      if (!match) {
        adminExists.password = hashedAdminPass;
        await adminExists.save();
        console.log(`✓ [ADMIN ACCOUNT] Password updated: ${adminEmail}`);
      }
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
          state: 'Jharkhand'
        });
      }

      await User.create({
        name: 'Jurisdiction Officer (Ranchi Sadar)',
        email: 'staff@gramseva.in',
        mobile: '8888888888',
        password: hashedStaffPass,
        role: 'STAFF',
        assignedJurisdictions: [jur._id],
        address: {
          district: 'Ranchi',
          block: 'Ranchi Sadar',
          panchayat: 'Ranchi Sadar',
          village: 'Kanke Road',
          pincode: '834008',
          state: 'Jharkhand'
        }
      });
      console.log('✅ [TEST ACCOUNT] Created Staff: staff@gramseva.in');
    } else {
      const match = await bcrypt.compare(staffPass, staffExists.password);
      if (!match) {
        staffExists.password = hashedStaffPass;
        await staffExists.save();
        console.log('✓ [TEST ACCOUNT] Updated Staff password: staff@gramseva.in');
      }
    }

    // 3. Seed Hardcoded Citizen User
    const citizenPass = 'Password@123';
    const hashedCitizenPass = await bcrypt.hash(citizenPass, 10);
    let citizenExists = await User.findOne({ email: 'citizen@gramseva.in', role: 'CITIZEN' });
    if (!citizenExists) {
      await User.create({
        name: 'Citizen Demo User',
        email: 'citizen@gramseva.in',
        mobile: '7777777777',
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
      console.log('✅ [TEST ACCOUNT] Created Citizen: citizen@gramseva.in');
    } else {
      const match = await bcrypt.compare(citizenPass, citizenExists.password);
      if (!match) {
        citizenExists.password = hashedCitizenPass;
        await citizenExists.save();
        console.log('✓ [TEST ACCOUNT] Updated Citizen password: citizen@gramseva.in');
      }
    }
  } catch (error) {
    console.error('❌ [SEED ERROR]', error.message);
  }
};

module.exports = seedHardcodedUsers;
