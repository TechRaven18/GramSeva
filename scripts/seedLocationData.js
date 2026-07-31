const path = require('path');
const fs = require('fs');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require(path.join(__dirname, '../server/node_modules/mongoose'));
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });

const Jurisdiction = require(path.join(__dirname, '../server/models/Jurisdiction'));

const seedLocations = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/panchayat_db';
    console.log(`Connecting to MongoDB Atlas at: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri, { family: 4 });

    console.log('Clearing existing location records...');
    await Jurisdiction.deleteMany({});

    const jsonPath = path.join(__dirname, 'wb_location_data.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Dataset JSON not found at ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const districtsData = JSON.parse(rawData);

    let count = 0;

    for (const dItem of districtsData) {
      const districtName = dItem.district;
      const districtCode = 'DIS-' + districtName.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);

      for (const bItem of (dItem.blocks || [])) {
        const blockName = bItem.name;
        const blockCode = 'BLK-' + blockName.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);

        for (const pItem of (bItem.panchayats || [])) {
          const panchayatName = pItem.name;
          const isMunicipality = blockName.toLowerCase().includes('municipality') || panchayatName.toLowerCase().includes('ward');
          const type = isMunicipality ? 'MUNICIPALITY' : 'PANCHAYAT';
          
          count++;
          const pCode = (isMunicipality ? 'MNC-' : 'PNC-') + `${districtCode}-${blockCode}-${count}`;

          await Jurisdiction.create({
            district: districtName,
            districtCode: districtCode,
            block: blockName,
            blockCode: blockCode,
            panchayat: panchayatName,
            panchayatCode: pCode,
            type: type,
            villages: pItem.villages || []
          });

          console.log(`✓ Seeded [${count}] (${type}): ${panchayatName} | ${blockName} | ${districtName}`);
        }
      }
    }

    console.log(`\n✓ Successfully imported ALL ${count} Panchayat & Municipality jurisdictions into MongoDB Atlas!`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding location error:', error.message);
    process.exit(1);
  }
};

seedLocations();
