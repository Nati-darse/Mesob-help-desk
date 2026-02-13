const Company = require('../models/Company');

// GET /api/companies
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({}).sort({ companyId: 1 }).lean();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
};

// PUT /api/companies/:id
exports.updateCompany = async (req, res) => {
  try {
    const companyId = Number(req.params.id);
    const updates = req.body || {};
    const company = await Company.findOneAndUpdate(
      { companyId },
      updates,
      { new: true }
    );
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update company' });
  }
};

// POST /api/companies
exports.createCompany = async (req, res) => {
  try {
    const data = req.body || {};
    if (!data.companyId || !data.name || !data.initials) {
      return res.status(400).json({ message: 'companyId, name, and initials are required' });
    }
    const company = await Company.create(data);
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create company' });
  }
};
