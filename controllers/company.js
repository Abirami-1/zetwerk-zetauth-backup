const logger = require('../lib/utils/logger');
const CompanyService = require('../services/company');
const ObjectId = require('mongoose').Types.ObjectId;
const confluentKafka = require('../lib/utils/confluent-kafka');
const { CREATE_COMPANY, UPDATE_COMPANY, DELETE_COMPANY } = require('../lib/constants/kafka-events');

const companyService = new CompanyService();

class CompanyController {
    constructor() {}

    async createCompany(req, res) {
        try {
            const payload = req.body;

            if(req.user && req.user._id && ObjectId.isValid(req.user._id)) {
                payload['createdBy'] = req.user._id;
                payload['updatedBy'] = req.user._id;
            }
            const insertedData = await companyService.createCompany(payload, req.user);

            confluentKafka.sendMessage('ZET-COMPANY', {
                event: CREATE_COMPANY,
                message: 'New Company added',
                data: insertedData
            });

            logger.info({
                description: 'Create company success',
                insertedData,
                user: req.user
            });

            return res.status(201).json({
                success: true,
                message: 'Company added Successfully',
                data: insertedData
            });
        } catch (error) {
            logger.error({
                description: 'Create company failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }

    async getAllCompanies(req, res) {
        try {
            const data = await companyService.getAllCompanies();
            logger.info({
                description: 'Companies fetched successfully',
                data,
                user: req.user
            });

            return res.status(201).json({
                success: true,
                message: 'Companies fetched successfully',
                data
            });
        } catch (error) {
            logger.error({
                description: 'Companies fetched  failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }

    async getCompanyById(req, res) {
        try {
            const { companyId } = req.params;
            const data = await companyService.getCompanyById(companyId);

            logger.info({
                description: 'Company details fetched successfully',
                data,
                user: req.user
            });

            return res.status(201).json({
                success: true,
                message: 'Company details fetched successfully',
                data
            });
        } catch (error) {
            logger.error({
                description: 'Company details fetched  failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }

    async getCompanyBySlug(req, res) {
        try {
            const {
                slug
            } = req.params;
            const data = await companyService.getCompanyBySlug(slug);

            logger.info({
                description: 'Company details fetched successfully',
                data,
                user: req.user
            });

            return res.status(201).json({
                success: true,
                message: 'Company details fetched successfully',
                data
            });
        } catch (error) {
            logger.error({
                description: 'Company details fetched  failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }


    async getCompanyByUniqueCode(req, res) {
        try {
            const {
                uniqueCode
            } = req.params;
            const data = await companyService.getCompanyByUniqueCode(uniqueCode);

            logger.info({
                description: 'Company details fetched successfully',
                data,
                user: req.user
            });

            return res.status(201).json({
                success: true,
                message: 'Company details fetched successfully',
                data
            });
        } catch (error) {
            logger.error({
                description: 'Company details fetched  failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }

    async updateCompanyById(req, res) {
        try {
            const payload = req.body;
            delete payload['slug']; // If slug is passed, remove it - don't allow user to update slug
            const { companyId } = req.params;

            if(req.user && req.user._id && ObjectId.isValid(req.user._id)) {
                payload['updatedBy'] = req.user._id;
            }
            

            const data = await companyService.updateCompanyById(companyId, payload, req.user);

            confluentKafka.sendMessage('ZET-COMPANY', {
                event: UPDATE_COMPANY,
                message: 'Company details updated',
                data
            });

            logger.info({
                description: 'Company details updated successfully',
                data,
                user: req.user
            });

            return res.status(201).json({
                success: true,
                message: 'Company details updated successfully',
                data
            });
        } catch (error) {
            logger.error({
                description: 'Company details updated failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }

    async deleteCompanyById(req, res) {
        try {
            const { companyId } = req.params;
            const data = await companyService.deleteCompanyById(companyId, req.user);

            confluentKafka.sendMessage('ZET-COMPANY', {
                event: DELETE_COMPANY,
                message: 'Company deleted successfully',
                data
            });

            logger.info({
                description: 'Company deleted successfully',
                data,
                user: req.user
            });

            return res.status(201).json({
                success: true,
                message: 'Company deleted successfully',
                data
            });
        } catch (error) {
            logger.error({
                description: 'Company deletion failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }

    async getPaginatedCompanies(req, res) {
        try {
            const { pageNumber = 1, recordsPerPage = 10 } = req.query;
            const companies = await companyService.getPaginatedCompanies({ pageNumber, recordsPerPage });
            logger.info({
                description: 'Companies fetched successfully',
                user: req.user
            });

            return res.success({
                data: companies
            });
        } catch (error) {
            logger.error({
                description: 'Companies fetched  failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }
}

module.exports = CompanyController;
