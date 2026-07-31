const path = require('path');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require(path.join(__dirname, '../server/node_modules/mongoose'));
const bcrypt = require(path.join(__dirname, '../server/node_modules/bcryptjs'));
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });

const User = require(path.join(__dirname, '../server/models/User'));
const Jurisdiction = require(path.join(__dirname, '../server/models/Jurisdiction'));

const seedUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/panchayat_db';
    console.log(`Connecting to MongoDB Atlas at: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri, { family: 4 });

    console.log('Seeding System Users (Admin, Staff, Citizen)...');

    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('Password@123', salt);
    const adminPasswordHash = await bcrypt.hash('AdminPass@123', salt);

    // 1. Seed System Admin
    await User.findOneAndUpdate(
      { mobile: '9999999999' },
      {
        name: 'Chief Panchayat Administrator',
        mobile: '9999999999',
        email: 'admin@panchayat.gov.in',
        password: adminPasswordHash,
        role: 'ADMIN',
        isActive: true
      },
      { upsert: true, new: true }
    );
    console.log('✓ Admin Account: mobile `9999999999`, pass `AdminPass@123`');

    // 2. Fetch first available Panchayat from DB
    let sampleJur = await Jurisdiction.findOne({});
    if (!sampleJur) {
      sampleJur = await Jurisdiction.create({
        district: 'Darjeeling',
        districtCode: 'DIS-DARJ',
        block: 'Darjeeling Pulbazar',
        blockCode: 'BLK-DARJ',
        panchayat: 'Pulbazar GP',
        panchayatCode: 'PNC-PULBAZAR',
        type: 'PANCHAYAT',
        villages: ['Pulbazar', 'Tung']
      });
    }

    // 3. Seed Staff Account
    await User.findOneAndUpdate(
      { mobile: '8888888888' },
      {
        name: 'Rajesh Kumar (Panchayat Secretary)',
        mobile: '8888888888',
        email: 'rajesh.boreya@authority.gov.in',
        password: defaultPasswordHash,
        role: 'STAFF',
        jurisdiction: {
          district: sampleJur.district,
          block: sampleJur.block,
          panchayat: sampleJur.panchayat,
          jurisdictionId: sampleJur._id
        },
        isActive: true
      },
      { upsert: true, new: true }
    );
    console.log(`✓ Staff Account: mobile \`8888888888\`, pass \`Password@123\` (Assigned to ${sampleJur.panchayat})`);

    // 4. Seed Demo Citizen Account
    await User.findOneAndUpdate(
      { mobile: '7777777777' },
      {
        name: 'Amit Sharma (Citizen)',
        mobile: '7777777777',
        email: 'amit.sharma@gmail.com',
        password: defaultPasswordHash,
        role: 'CITIZEN',
        rewardCoins: 40,
        address: {
          district: sampleJur.district,
          block: sampleJur.block,
          panchayat: sampleJur.panchayat,
          village: sampleJur.villages[0] || 'Main Area',
          landmark: 'Near Bus Stand'
        },
        isActive: true
      },
      { upsert: true, new: true }
    );
    console.log('✓ Citizen Account: mobile `7777777777`, pass `Password@123` (40 reward coins)');

    console.log('\n✓ User Accounts seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding users error:', error.message);
    process.exit(1);
  }
};

seedUsers();
