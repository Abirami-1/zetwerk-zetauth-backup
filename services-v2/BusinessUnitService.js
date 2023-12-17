const DefaultService = require('@zetwerk/zetapp/services/DefaultService');
const logger = require('../lib/utils/logger');
const BusinessUnit = require('../models/business-unit');
const companyModel = require('../models/company');
const ProjectTypeModel = require('../models/project-type');
const confluentKafka = require('../lib/utils/confluent-kafka');
const {
    CREATE_BUSINESS_UNIT,
    UPDATE_BUSINESS_UNIT,
    DELETE_BUSINESS_UNIT,
    CREATE_PROJECT_TYPE
} = require('../lib/constants/kafka-events');
const { generateExcelBatch } = require('../lib/utils/excel');
const FIELDS_TO_POPULATE = ['createdByDetails', 'updatedByDetails', 'companyDetails', 'projectTypeDetails'];
const { AUDIT_LOG_ACTIONS } = require('../lib/constants/audit-log');
class BusinessUnitService extends DefaultService {
    constructor() {
        super('business-unit');
    }

    async _createBusinessUnit({ payload, user }) {
        let data = await BusinessUnit.create(payload);
        confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
            event: CREATE_BUSINESS_UNIT,
            message: 'New business unit created',
            data: {
                _id: data._id
            }
        });
        logger.info({
            description: 'Business unit created',
            data,
            user: user
        });
        return data;
    }

    async _getAllBusinessUnits() {
        let data = await BusinessUnit.findAll({ fieldsToPopulate: FIELDS_TO_POPULATE });

        return data;
    }

    async createBusinessUnit({ payload, user }) {
        const projectType = await this.getOrCreateProjectType({ name: payload.name, user });
        payload.slug = `${payload.company.slug}-${projectType.slug}`;
        payload.projectTypeIds = [projectType._id];
        let newBu = await BusinessUnit.create(payload);
        confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
            event: CREATE_BUSINESS_UNIT,
            message: 'New business unit created',
            data: {
                _id: newBu._id
            }
        });
        logger.info({
            description: 'Business unit created',
            newBu,
            user: user
        });
        return newBu;
    }

    async getOrCreateProjectType({ name }) {
        let projectType = await ProjectTypeModel.findOne({ name });
        if (projectType) return projectType;
        let slug = name.replace(/[^A-Z0-9]+/gi, '-');
        slug = slug.toLowerCase();
        projectType = await ProjectTypeModel.create({ name, slug });
        confluentKafka.sendMessage('ZET-PROJECT_TYPE', {
            event: CREATE_PROJECT_TYPE,
            message: 'New project type created',
            data: {
                _id: projectType._id
            }
        });
        return projectType;
    }

    async getPaginatedBusinessUnits({ pageNumber, recordsPerPage, findConditions, user }) {
        const businessUnits = await BusinessUnit._findMany({ pageNumber, recordsPerPage, findConditions });
        logger.info({
            description: 'Business units fetched successfully',
            businessUnits,
            user: user
        });
        return businessUnits;
    }

    async getAllValuesOfFilter({ filter }) {
        const filterArr = [];
        if (filter === 'company') {
            const filterValues = await companyModel.distinct('slug');
            for (const value of filterValues) {
                filterArr.push({ _id: value, name: value });
            }
        } else {
            const filterValues = await BusinessUnit.distinct(filter);
            for (const value of filterValues) {
                filterArr.push({ _id: value, name: value });
            }
        }
        return filterArr;
    }

    async _getBusinessUnitById(businessUnitId) {
        const businessUnit = await BusinessUnit.findById(businessUnitId, FIELDS_TO_POPULATE);
        return businessUnit;
    }

    async _updateBusinessUnitById({ businessUnitId, payload, user }) {
        const oldBusinessUnitData = await BusinessUnit.findById(businessUnitId);
        let data = await BusinessUnit.updateById(businessUnitId, payload);

        // Making audit log entry for business unit that gets updated
        await this.services.AuditLogService.createAuditLog({
            oldData: oldBusinessUnitData,
            newData: data,
            user,
            model: BusinessUnit,
            actionType: AUDIT_LOG_ACTIONS.UPDATE,
            action: AUDIT_LOG_ACTIONS.UPDATE
        });
        confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
            event: UPDATE_BUSINESS_UNIT,
            message: 'Business unit updated',
            data: {
                _id: data._id
            }
        });

        logger.info({
            description: 'Business unit updated',
            data,
            user: user
        });

        return data;
    }

    async _deleteBusinessUnitById({ businessUnitId, user }) {
        let data = await BusinessUnit.deleteById(businessUnitId);
        // Making audit log entry for business unit that gets deleted
        await this.services.AuditLogService.createAuditLog({
            newData: data,
            user,
            model: BusinessUnit,
            actionType: AUDIT_LOG_ACTIONS.DELETE,
            action: AUDIT_LOG_ACTIONS.DELETE
        });
        confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
            event: DELETE_BUSINESS_UNIT,
            message: 'Business unit deleted',
            data: { _id: businessUnitId }
        });

        logger.info({
            description: 'Business unit deleted',
            deleted: data,
            user: user
        });
        return data;
    }

    async _getBusinessUnitByQueryParams({ findConditions }) {
        let data = await BusinessUnit.find({ ...findConditions, deleted: false });
        return data;
    }

    async toggleBusinessUnitVisibility({ buId, payload, user }) {
        const oldBusinessUnitData = await BusinessUnit.findById(buId);
        let data = await BusinessUnit.updateById(buId, payload);

        // Making audit log entry for business unit that gets updated
        await this.services.AuditLogService.createAuditLog({
            oldData: oldBusinessUnitData,
            newData: data,
            user,
            model: BusinessUnit,
            actionType: AUDIT_LOG_ACTIONS.UPDATE,
            action: 'UPDATE_BU_VISIBILITY'
        });

        confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
            event: UPDATE_BUSINESS_UNIT,
            message: 'Business unit updated',
            data: {
                _id: data._id
            }
        });

        logger.info({
            description: 'Business unit visibilty updated',
            user: user
        });
        return data;
    }

    async excelDownload(job) {
        const BATCH_SIZE = 1000;
        const batchWriter = await generateExcelBatch({
            headers: [
                { title: 'BUSINESS UNIT', name: 'name' },
                { title: 'BUSINESS MSD CODE', name: 'uniqueCode' },
                { title: 'INVOICIN CODE', name: 'sequenceName' },
                { title: 'LEGAL ENTITY', name: 'legalEntity' },
                { title: 'SEGMENTS NAME', name: 'segmentsName' },
                { title: 'HIDDEN', name: 'hidden' }
            ],
            sheetName: 'BusinessUnit'
        });
        const BUCursor = await this.findMany({
            getAllDocuments: true,
            getCursor: true,
            batchSizeForCursor: BATCH_SIZE
        });
        let doc = await BUCursor.next();
        while (doc) {
            doc.legalEntity = doc?.company?.slug;
            const segmentsName = doc?.segments?.map(segment => segment?.name);
            doc.segmentsName = segmentsName?.join(',');
            await batchWriter.next([doc]);
            doc = await BUCursor.next();
        }
        const s3DownloadUrl = await batchWriter.end();
        await this.services.AgendaService.updateJob({
            job: job,
            updateAttrs: { jobStats: { downloadUrl: s3DownloadUrl } }
        });
        return { s3DownloadUrl };
    }
}

module.exports = BusinessUnitService;
