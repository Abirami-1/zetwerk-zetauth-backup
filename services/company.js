const Company = require('../models/company');
const FIELDS_TO_POPULATE = ['createdByDetails', 'updatedByDetails'];
const AuditLogService = new (require('../services-v2/AuditLogService'))();
const { AUDIT_LOG_ACTIONS } = require('../lib/constants/audit-log');
class CompanyService {
    cosntructor() {}

    async createCompany(payload) {
        const data = await Company.create(payload);

        if (!data) {
            throw new Error('Unable to create company');
        }

        return data;
    }

    async getAllCompanies() {
        return await Company.find({ deleted: false }).sort({ name: -1 });
    }

    async getCompanyById(companyId) {
        return await Company.findById(companyId, FIELDS_TO_POPULATE);
    }

    async getCompanyByUniqueCode(uniqueCode) {
        return Company.findOne({ uniqueCode: new RegExp(uniqueCode, 'i') });
    }

    async getCompanyBySlug(slug) {
        return Company.findOne({
            slug
        });
    }

    async updateCompanyById(companyId, payload, user) {
        const oldCompanyData = await Company.findOne({ _id: companyId });
        const updatedCompany = await Company.updateById(companyId, payload);

        // Making audit log entry for Company
        await AuditLogService.createAuditLog({
            newData: updatedCompany,
            oldData: oldCompanyData,
            user,
            model: Company,
            actionType: AUDIT_LOG_ACTIONS.UPDATE,
            action: AUDIT_LOG_ACTIONS.UPDATE
        });

        return updatedCompany;
    }

    async deleteCompanyById(companyId, user) {
        const deletedCompany = await Company.deleteById(companyId);

        // Making audit log entry for company
        await AuditLogService.createAuditLog({
            newData: deletedCompany,
            user,
            model: Company,
            actionType: AUDIT_LOG_ACTIONS.DELETE,
            action: AUDIT_LOG_ACTIONS.DELETE
        });

        return deletedCompany;
    }

    async getPaginatedCompanies({ pageNumber, recordsPerPage }) {
        return await Company._findMany({ pageNumber, recordsPerPage });
    }
}

module.exports = CompanyService;
