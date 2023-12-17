const express = require('express');
const router = express.Router();

const CompanyController = require('../../../controllers/company');

const companyController = new CompanyController();

router.post('/company', companyController.createCompany);
router.get('/company', companyController.getAllCompanies);
router.get('/company-by-slug/:slug', companyController.getCompanyBySlug);
router.get('/company-by-uniqueCode/:uniqueCode', companyController.getCompanyByUniqueCode);
router.get('/company/:companyId', companyController.getCompanyById);
router.put('/company/:companyId', companyController.updateCompanyById);
router.delete('/company/:companyId', companyController.deleteCompanyById);
router.get('/companyV2', companyController.getPaginatedCompanies);

module.exports = router;
