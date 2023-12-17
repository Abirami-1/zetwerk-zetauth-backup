const DefaultController = require('@zetwerk/zetapp/controllers/DefaultController');
const mongoose = require('mongoose');

class WarehouseErpController extends DefaultController {
    constructor() {
        super('warehouse-erp');
    }

    async getWareHousesErpByQuery(req, res) {
        const {
            companyId,
            legalEntityCode,
            warehouseCode,
            siteId,
            category,
            warehouseName,
            recordsPerPage,
            searchText,
            pageNumber
        } = req.query;

        const pipeline = [];

        let categories;
        let warehouseIds;

        if (category) categories = Array.isArray(category) ? category : [category];

        if (req.query?.warehouseIds)
            warehouseIds = Array.isArray(req.query?.warehouseIds) ? req.query?.warehouseIds : [req.query?.warehouseIds];

        // Match stage
        const matchStage = {};
        if (companyId) {
            matchStage['company.companyId'] = new mongoose.Types.ObjectId(companyId);
        }
        if (legalEntityCode) {
            matchStage['company.uniqueCode'] = legalEntityCode;
        }
        if (siteId) {
            matchStage['siteId'] = new mongoose.Types.ObjectId(siteId);
        }
        if (categories) {
            matchStage['category'] = { $in: categories };
        }
        if (warehouseIds) {
            matchStage['_id'] = { $in: warehouseIds };
        }
        if (warehouseName) {
            matchStage['name'] = warehouseName;
        }
        if (warehouseCode) {
            matchStage['warehouseCode'] = warehouseCode;
        }
        pipeline.push({ $match: matchStage });

        // Populate stage
        pipeline.push({
            $lookup: { from: 'sites', localField: 'siteId', foreignField: '_id', as: 'siteDetails' }
        });

        // Add additional search filters
        if (searchText) {
            const searchFilter = {
                $or: [
                    { 'company.uniqueCode': { $regex: new RegExp(searchText, 'i') } },
                    { 'siteDetails.siteName': { $regex: new RegExp(searchText, 'i') } },
                    { name: { $regex: new RegExp(searchText, 'i') } }
                ]
            };
            pipeline.push({ $match: searchFilter });
        }

        let skip;
        // Count stage
        const countPipeline = [...pipeline];
        countPipeline.push({ $count: 'total' });
        const [countResult] = await this.resourceHandler.resourceModel.aggregate(countPipeline);

        if (recordsPerPage) {
            // Skip and limit stage
            skip = (parseInt(pageNumber) - 1) * parseInt(recordsPerPage);
            pipeline.push({ $skip: skip });
            const limit = parseInt(recordsPerPage);
            pipeline.push({ $limit: limit });
        }

        pipeline.push({ $unwind: '$siteDetails' });

        // Execute the main aggregation pipeline
        const warehouses = await this.resourceHandler.resourceModel
            .aggregate(pipeline)
            .allowDiskUse(true)
            .exec();

        const meta = {
            total: countResult ? countResult.total : 0,
            limit: recordsPerPage,
            offset: skip,
            nextStart: skip + parseInt(recordsPerPage) + 1
        };

        res.success({
            message: 'Warehouses-Erp fetched successfully',
            data: { allDocuments: warehouses, meta }
        });
    }

    async excelUpload(req, res) {
        const { file, company } = req.body;
        const userId = req?.user?._id;
        if (!file || !file.Key) {
            throw new Error('File information is required');
        }
        if (!userId) {
            throw new Error('User information is required');
        }
        if (!company) {
            throw new Error('Company information is required');
        }
        const agendaJob = await this.services.AgendaService.createJob({
            jobName: 'warehouse-excel-upload',
            payload: { fileKey: file.Key, fileUrl: file?.src, userId, company }
        });
        res.success({
            data: { taskId: agendaJob?.attrs?._id },
            message: 'Warehouse-Erp excel upload initiated successfully'
        });
    }

    async excelDownload(req, res) {
        const userId = req?.user?._id;

        if (!userId) {
            throw new Error('User information is required');
        }
        const agendaJob = await this.services.AgendaService.createJob({
            jobName: 'warehouse-erp-excel-download',
            payload: { userId }
        });
        res.success({
            data: { taskId: agendaJob?.attrs?._id },
            message: 'Warehouse excel download initiated successfully'
        });
    }
}

module.exports = WarehouseErpController;
