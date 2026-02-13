const mongoose = require('mongoose');
const Company = require('./src/models/Company');
const { DEFAULT_COMPANIES } = require('./src/utils/companySeed');
require('dotenv').config();

async function migrateCompanyLocalization() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    for (const company of DEFAULT_COMPANIES) {
      await Company.findOneAndUpdate(
        { companyId: company.companyId },
        {
          $set: {
            name: company.name,
            amharicName: company.amharicName || '',
            initials: company.initials,
            logo: company.logo || ''
          }
        },
        { upsert: true, new: true }
      );
    }

    console.log(`Updated ${DEFAULT_COMPANIES.length} companies`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrateCompanyLocalization();
