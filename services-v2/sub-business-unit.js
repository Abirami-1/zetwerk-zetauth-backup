const DefaultService = require('@zetwerk/zetapp/services/DefaultService');
const { generateExcelBatch } = require('../lib/utils/excel');
const mongoose = require('mongoose');
const logger = require('../lib/utils/logger');
const { AUDIT_LOG_ACTIONS } = require('../lib/constants/audit-log');
class SubBusinessUnitService extends DefaultService {
    constructor() {
        super('sub-business-unit');
    }

    async getSubBusinessUnitByBuId(buId) {
        const bu = await this.models['business-unit'].findOne({ _id: buId }).lean();
        const subBUs = bu.subBusinessUnits.filter(sbu => !sbu.hidden);
        return subBUs;
    }

    async getSubBusinessUnits(query) {
        const draft = query.draft === 'true';
        const regex = new RegExp(query?.searchText, 'i');
        let subBUCondition = { $or: [{ deleted: { $exists: false } }, { deleted: false }], name: {$regex: regex} };
        const subbus = await this.resourceModel.find(subBUCondition).lean();

        let subBUs = [];

        for (let subbu of subbus) {
            const condition = {};
            if (query.company) {
                condition['company.slug'] = { $in: query.company };
            }
            if (query.businessUnit) {
                condition.name = { $in: query.businessUnit };
            }
            condition['subBusinessUnits._id'] = subbu._id;
            const businessUnits = await this.models['business-unit']
                .find(condition, { name: 1, company: 1, subBusinessUnits: 1 })
                .lean();

            for (const bu of businessUnits) {
                const subBu = bu?.subBusinessUnits.find(subBuUnit => subBuUnit?._id.equals(subbu?._id));
                if (draft && !subBu?.draft) {
                    continue;
                }
                subbu.draft = subBu?.draft || false;
                subbu.hidden = subBu?.hidden || false;
                const obj = {
                    ...subbu,
                    businessUnit: {
                        _id: bu._id,
                        name: bu.name
                    },
                    company: bu.company
                };
                subBUs.push(obj);
            }
        }
        const meta = {
            total: subBUs.length,
            limit: query.recordsPerPage,
            offset: parseInt(query.pageNumber) - 1,
            nextStart: parseInt(query.pageNumber) * parseInt(query.recordsPerPage) + 1
        };
        const startdoc = (parseInt(query.pageNumber) - 1) * parseInt(query.recordsPerPage);
        const endDoc = parseInt(query.pageNumber) * parseInt(query.recordsPerPage);
        subBUs = subBUs.sort((a, b) => b.draft - a.draft);
        return { allDocuments: subBUs.slice(startdoc, endDoc), meta };
    }

    async createSubBusinessUnit(subBuObj, user) {
        if (subBuObj.sequenceName) {
            const isSequenceNameUnique = await this.isSequenceNameUnique({
                sequenceName: subBuObj.sequenceName,
                companyId: subBuObj.company.id
            });
            if (!isSequenceNameUnique) {
                throw new Error('Entered Invoicing Code is already used');
            }
        }
        if (subBuObj.uniqueCode) {
            const isSubBuCodeUnique = await this.isSubBuCodeUnique({
                uniqueCode: subBuObj.uniqueCode,
                companyId: subBuObj.company.id,
                buId: subBuObj.businessUnit.uniqueCode
            });
            if (!isSubBuCodeUnique) {
                throw new Error('Entered MSD Code is already used');
            }
        }
        const obj = {
            name: subBuObj.name,
            uniqueCode: subBuObj.uniqueCode
        };
        if (subBuObj.sequenceName) {
            obj.sequenceName = subBuObj.sequenceName;
        }
        obj.createdBy = user._id;
        obj.updatedBy = user._id;
        let subBU = await this.resourceModel.create(obj);
        
        subBU.draft = subBuObj?.draft;
        if (subBU.draft) {
            subBU.hidden = true;
        }
        const oldBusinessUnitData = await this.models['business-unit'].findById(subBuObj.businessUnit.id);

        const newBusinessUnitData = await this.models['business-unit'].updateById(subBuObj.businessUnit.id, {
            $addToSet: { subBusinessUnits: subBU }
        });

        // Making audit log entry for business unit that gets updated
        await this.services.AuditLogService.createAuditLog({
            oldData: oldBusinessUnitData,
            newData: newBusinessUnitData,
            user,
            model: this.models['business-unit'],
            actionType: AUDIT_LOG_ACTIONS.UPDATE,
            action: 'ADD_SBU_TO_BU'
        });

        return subBU;
    }

    async isSequenceNameUnique({ sequenceName, companyId }) {
        const bus = await this.models['business-unit'].find({
            'company.companyId': companyId,
            $or: [
                { sequenceName: { $regex: `${sequenceName}`, $options: 'i' } },
                { 'subBusinessUnits.sequenceName': { $regex: `${sequenceName}`, $options: 'i' } }
            ]
        });
        if (bus.length > 0) return false;
        return true;
    }

    async isSubBuCodeUnique({ uniqueCode, companyId, buId }) {
        const subBu = await this.models['business-unit'].find({
            'company.companyId': companyId,
            uniqueCode: buId,
            'subBusinessUnits.uniqueCode': { $regex: `${uniqueCode}`, $options: 'i' }
        });
        if (subBu.length > 0) return false;
        return true;
    }

    async getAllValuesOfFilter(filter) {
        let filterValues;
        switch (filter) {
            case 'company':
                filterValues = await this.models['company'].distinct('slug');
                return filterValues?.map(value => {
                    return { _id: value, name: value };
                });
            case 'businessUnit':
                filterValues = await this.models['business-unit'].distinct('name');
                return filterValues?.map(value => {
                    return { _id: value, name: value };
                });
            case 'draft':
                return [
                    { _id: true, name: 'Draft' },
                    { _id: false, name: 'All Sub bu' }
                ];
            default:
                logger.info({ description: `${filter} is a invalid case.` });
                return [];
        }
    }

    async toggleSubBuVisibility(req, user) {
        const { subBuId, buId } = req.query;
        const businessUnit = await this.models['business-unit']
            .findOne({ _id: new mongoose.Types.ObjectId(buId) }, { subBusinessUnits: 1 })
            .lean();

        const updatedSubBUs = businessUnit.subBusinessUnits.map(sbu => {
            if (sbu._id.equals(new mongoose.Types.ObjectId(subBuId))) {
                return { ...sbu, hidden: req.body.hidden };
            }
            return sbu;
        });

        const updateObj = { subBusinessUnits: updatedSubBUs };

        if (req.body.hidden && updatedSubBUs.filter(sbu => !sbu.hidden) < 1) {
            // hide BU if all SBUs are hidden
            updateObj['hidden'] = true;
        }

        const oldBusinessUnitData = await this.models['business-unit'].findById(buId);
        
        const updatedBusinessUnit = await this.models['business-unit'].updateById(
            buId,
            { $set: { ...updateObj } }
        );

        // Making audit log entry for business unit that gets updated
        await this.services.AuditLogService.createAuditLog({
            oldData: oldBusinessUnitData,
            newData: updatedBusinessUnit,
            user,
            model: this.models['business-unit'],
            actionType: AUDIT_LOG_ACTIONS.UPDATE,
            action: 'UPDATE_SBU_VISIBILITY'
        });
    }

    async getSubBusinessUnitBySubBuId({ subBuId, buId, companyId }) {
        const subBu = await this.resourceModel.findOne({ _id: subBuId }).lean();
        const bu = await this.models['business-unit']
            .findOne({ _id: new mongoose.Types.ObjectId(buId) }, { _id: 1, name: 1, subBusinessUnits: 1 })
            .lean();
        const isDraft = bu?.subBusinessUnits.find(subBuUnit => subBuUnit?._id.equals(subBuId))?.draft;
        subBu.draft = isDraft || false;
        const company = await this.models['company']
            .findOne({ _id: new mongoose.Types.ObjectId(companyId) }, { _id: 1, slug: 1, uniqueCode: 1 })
            .lean();

        subBu['businessUnit'] = bu;
        subBu['company'] = { companyId: company._id, slug: company.slug, uniqueCode: company.uniqueCode };
        return subBu;
    }

    async updateSubBuDraft({ subBuId, buId, draft, user }) {
        const businessUnit = await this.models['business-unit']
            .findOne({ _id: new mongoose.Types.ObjectId(buId) }, { subBusinessUnits: 1 })
            .lean();

        const updatedSubBUs = businessUnit.subBusinessUnits.map(sbu => {
            if (sbu._id.equals(new mongoose.Types.ObjectId(subBuId))) {
                return { ...sbu, draft: draft };
            }
            return sbu;
        });
        const updateObj = { subBusinessUnits: updatedSubBUs };

        const oldBusinessUnitData = await this.models['business-unit'].findById(buId);

        const updatedBusinessUnit = await this.models['business-unit'].updateById(
            buId,
            { $set: { ...updateObj } }
        );
        // Making audit log entry for business unit that gets updated
        await this.services.AuditLogService.createAuditLog({
            oldData: oldBusinessUnitData,
            newData: updatedBusinessUnit,
            user,
            model: this.models['business-unit'],
            actionType: AUDIT_LOG_ACTIONS.UPDATE,
            action: 'UPDATE_SBU_DRAFT'
        });

    }

    async excelDownload(job) {
        const BATCH_SIZE = 1000;
        const batchWriter = await generateExcelBatch({
            headers: [
                { title: 'SUB BUSINESS UNIT', name: 'subBusinessName' },
                { title: 'SUB BUSINESS MSD CODE', name: 'subBusinessUniqueCode' },
                { title: 'MAPPED BUSINESS UNIT', name: 'businessUnitName' },
                { title: 'INVOICIN CODE', name: 'sequenceName' },
                { title: 'LEGAL ENTITY', name: 'legalEntity' },
                { title: 'DRAFT', name: 'draft' },
                { title: 'HIDDEN', name: 'hidden' },
                { title: 'CONFIG ENABLED', name: 'realItemsRequired' }
            ],
            sheetName: 'SubBusinessUnit'
        });
        const subBUCursor = await this.findMany({
            getAllDocuments: true,
            getCursor: true,
            batchSizeForCursor: BATCH_SIZE
        });
        const masterConfig = await this.services.CommonMasterIPCService.getMasterConfig();
        let doc = await subBUCursor.next();
        while (doc) {
            await this.batchExcelWriter(doc, batchWriter, masterConfig);
            doc = await subBUCursor.next();
        }
        const s3DownloadUrl = await batchWriter.end();
        await this.services.AgendaService.updateJob({
            job: job,
            updateAttrs: { jobStats: { downloadUrl: s3DownloadUrl } }
        });
        return { s3DownloadUrl };
    }

    async batchExcelWriter(subbu, batchWriter, masterConfig) {
        const condition = {};
        condition['subBusinessUnits._id'] = subbu._id;
        const businessUnits = await this.models['business-unit']
            .find(condition, { name: 1, company: 1, subBusinessUnits: 1 })
            .lean();

        for (const bu of businessUnits) {
            const subBu = bu?.subBusinessUnits.find(subBuUnit => subBuUnit?._id.equals(subbu?._id));
            subbu.draft = subBu?.draft || false;
            subbu.hidden = subBu?.hidden || false;
            const obj = {
                ...subbu,
                businessUnit: {
                    _id: bu._id,
                    name: bu.name
                },
                company: bu.company
            };
            subbu.subBusinessName = obj?.name;
            subbu.subBusinessUniqueCode = obj?.uniqueCode;
            subbu.businessUnitName = obj?.businessUnit?.name;
            subbu.sequenceName = obj?.sequenceName;
            subbu.legalEntity = obj?.company?.slug;
            subbu.draft = obj?.draft;
            subbu.realItemsRequired = await this.getRealItemsRequired({
                subBuId: obj?._id,
                buId: obj?.businessUnit?._id,
                companyId: obj?.company?.companyId,
                masterConfig
            });
            await batchWriter.next([subbu]);
        }
    }

    async getRealItemsRequired({ subBuId, buId, companyId, masterConfig }) {
        for (const config of masterConfig) {
            const { subBuId: configSubBuId, buId: configBuId, companyId: configCompanyId } = config.configFields;
            if ( configSubBuId === subBuId.toString() && configBuId === buId.toString() && configCompanyId === companyId.toString() && config?.configData?.realItemsRequired) {
                return true;
            }
        }
        return false;
    }
}

module.exports = SubBusinessUnitService;
