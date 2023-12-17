const DefaultService = require('@zetwerk/zetapp/services/DefaultService');
const { queryGenerator } = require('../lib/utils/index');
const { AUDIT_LOG_ACTIONS } = require('../lib/constants/audit-log');
const mongoose = require('mongoose');
class SegmentService extends DefaultService {
    constructor() {
        super('segment');
    }

    async getSegmentByQuery({ query }) {
        if (query.companyId) {
            const segments = [];
            const company = await this.models['company'].findOne({ _id: query.companyId }).lean();
            for (const seg of company.segments) {
                const cond = {
                    _id: seg._id,
                    $or: [{ deleted: { $exists: false } }, { deleted: false }] // for the document which don't have deleted field or whose deleted is set to false
                };
                const segment = await this.resourceModel.count(cond);
                if (segment) {
                    segments.push(seg);
                }
            }
            return segments;
        } else {
            return this.resourceModel.find(queryGenerator(query));
        }
    }

    async getSegments(query) {
        const regex = new RegExp(query?.searchText, 'i');

        const segments = await this.resourceModel
            .find({ $or: [{ deleted: { $exists: false } }, { deleted: false }], name: regex })
            .lean();
        let docs = [];
        for (const segment of segments) {
            const segmentQuery = {
                'segments._id': segment._id
            };
            if (query.company) {
                segmentQuery.slug = { $in: query.company };
            }
            const companies = await this.models['company'].find(segmentQuery);
            if (companies.length) {
                docs.push({ ...segment, company: companies });
            }
        }
        const meta = {
            total: docs.length,
            limit: query.recordsPerPage,
            offset: parseInt(query.pageNumber) - 1,
            nextStart: parseInt(query.pageNumber) * parseInt(query.recordsPerPage) + 1
        };
        const startdoc = (parseInt(query.pageNumber) - 1) * parseInt(query.recordsPerPage);
        const endDoc = parseInt(query.pageNumber) * parseInt(query.recordsPerPage);
        return { allDocuments: docs.slice(startdoc, endDoc), meta };
    }

    async createSegment(segmentObj, user) {
        if (user) {
            segmentObj.createdBy = user._id;
            segmentObj.updatedBy = user._id;
        }
        const segment = await this.resourceModel.create(segmentObj);
        if (!Array.isArray(segmentObj.company)) {
            segmentObj.company = [segmentObj.company];
        }
        const companyIds = segmentObj.company.map(cmpny => cmpny._id);
        await this.models['company'].updateMany({ _id: { $in: companyIds } }, { $addToSet: { segments: segment } });
        return segment;
    }

    async getAllValuesOfFilter({ filter }) {
        const filterArr = [];
        if (filter === 'company') {
            const filterValues = await this.models['company'].distinct('slug');
            for (const value of filterValues) {
                filterArr.push({ _id: value, name: value });
            }
        }
        return filterArr;
    }

    async addCompanyToSegment(segmentId, segmentObj) {
        const segment = await this.resourceModel.findOne({ _id: segmentId });
        const companyIds = segmentObj.company.map(cmpny => cmpny._id);

        const oldCompaniesData = await this.models['company']._findMany({ findConditions: { _id: { $in: companyIds } } });
        
        const existingCompanyWithSegment = await this.models['company']._findMany({ findConditions: {'segments._id': segmentId, _id: { $nin: companyIds} } });
        
        let removeSegmentFromCompanyIds = [];
        if(existingCompanyWithSegment?.allDocuments?.length > 0) {
            removeSegmentFromCompanyIds = existingCompanyWithSegment?.allDocuments.map(doc => doc._id);
        }

        const matchSegmentToRemove = (({ _id, uniqueCode, name }) => ({ _id, uniqueCode, name }))(segment);

        await this.models['company'].updateMany({_id: {$in: removeSegmentFromCompanyIds}}, { $pull: { segments: matchSegmentToRemove }});

        await this.models['company'].updateMany({_id: {$in: companyIds}}, {$addToSet: { segments: segment }});
        
        const batchId = new mongoose.Types.ObjectId;
        const allUpdatedCompanies = [...companyIds, ...removeSegmentFromCompanyIds];

        for(const companyId of allUpdatedCompanies) {
            const newCompanyData = await this.models['company']._findOne({_id: {$in: companyId}});
            // Making audit log entry for multiple company objects
            await this.services.AuditLogService.createAuditLog({
                newData: newCompanyData,
                oldData: oldCompaniesData.allDocuments.find(company => company._id == companyId ),
                user: newCompanyData.updatedBy,
                model: this.models['company'],
                actionType: AUDIT_LOG_ACTIONS.UPDATE,
                action: AUDIT_LOG_ACTIONS.UPDATE,
                batchId
            });
        }

        return segment;
    }
}

module.exports = SegmentService;
