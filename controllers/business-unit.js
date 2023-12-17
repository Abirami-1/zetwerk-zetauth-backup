const DefaultController = require('@zetwerk/zetapp/controllers/DefaultController');
const SubBusinessUnitService = new (require('../services-v2/sub-business-unit'))();
const BusinessUnitService = new (require('../services-v2/BusinessUnitService'))();
const ObjectId = require('mongoose').Types.ObjectId;
const { queryGenerator } = require('../lib/utils');
class BusinessUnitController extends DefaultController {
    constructor() {
        super('business-unit');
    }
    /**
     * Create a new business unit
     * @param {*} req request object
     * @param {*} res response
     */
    async _createBusinessUnit(req, res) {
        let payload = req.body;

        if (req.user && req.user._id && ObjectId.isValid(req.user._id)) {
            payload.createdBy = req.user._id;
            payload.updatedBy = req.user._id;
        }

        let data = await BusinessUnitService._createBusinessUnit({ payload, user: req?.user });

        return res.status(201).json({
            success: true,
            message: 'Business unit has been created successfully',
            data
        });
    }

    /**
     * Get a list of all business units
     * @param {*} req request object
     * @param {*} res response
     */
    async _getAllBusinessUnits(req, res) {
        let data = await BusinessUnitService._getAllBusinessUnits();

        return res.status(200).json({
            success: true,
            message: 'Business units fetched successfully',
            data
        });
    }

    async createBusinessUnit(req, res) {
        let payload = req.body;

        if (req.user && req.user._id && ObjectId.isValid(req.user._id)) {
            payload.createdBy = req.user._id;
            payload.updatedBy = req.user._id;
        }
        const isSequenceNameUnique = await SubBusinessUnitService.isSequenceNameUnique({
            sequenceName: payload.sequenceName,
            companyId: payload.company.companyId
        });
        if (!isSequenceNameUnique) {
            throw new Error('Entered Invoicing Code is already used');
        }

        let data;

        try {
            data = await this.services.BusinessUnitService.createBusinessUnit({ payload, user: req?.user });
        } catch (error) {
            if (error.errors?.uniqueCode?.properties?.type === 'unique') {
                res.status(400).json({
                    success: false,
                    message: 'MSD code is already used'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: error?.message
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Business unit has been created successfully',
            data
        });
    }

    async getPaginatedBusinessUnits(req, res) {
        const { pageNumber, recordsPerPage, searchText } = req.query;
        const findConditions = {
            $or: [{ deleted: { $exists: false } }, { deleted: false }]
        };
        if (req.query.company) {
            findConditions['company.slug'] = { $in: req.query.company };
        }
        if (searchText) {
            const regex = new RegExp(searchText, 'i');
            findConditions['name'] = regex;
        }

        const data = await this.services.BusinessUnitService.getPaginatedBusinessUnits({
            pageNumber,
            recordsPerPage,
            findConditions,
            user: req?.user
        });

        return res.status(200).json({
            success: true,
            message: 'Business units fetched successfully',
            data
        });
    }

    async getAllValuesOfFilter(req, res) {
        const filter = req.query.filter;

        const filterArr = await this.services.BusinessUnitService.getAllValuesOfFilter({ filter });
        return res.status(200).json({
            success: true,
            message: 'All filters fetched successfully',
            data: filterArr
        });
    }
    /**
     * Get a specific business unit by id
     * @param {*} req request object
     * @param {*} res response
     */
    async _getBusinessUnitById(req, res) {
        let businessUnitId = req.params.businessUnitId;

        const data = await BusinessUnitService._getBusinessUnitById(businessUnitId);

        if (data) {
            return res.status(200).json({
                success: true,
                message: 'Business unit fetched successfully',
                data
            });
        } else {
            return res.status(200).json({
                success: false,
                message: 'Business unit not found'
            });
        }
    }

    /**
     * Update a specific business unit by id
     * @param {*} req request object
     * @param {*} res response
     */
    async _updateBusinessUnitById(req, res) {
        let payload = req.body;
        delete payload['slug']; // If slug is passed, remove it - don't allow user to update slug

        if (req.user && req.user._id && ObjectId.isValid(req.user._id)) {
            payload.updatedBy = req.user._id;
        }

        const data = await BusinessUnitService._updateBusinessUnitById({
            businessUnitId: req?.params?.businessUnitId,
            payload,
            user: req?.user
        });

        return res.status(200).json({
            success: true,
            message: 'Business unit updated successfully',
            data
        });
    }

    /**
     * Delete a specific business unit by id
     * @param {*} req request object
     * @param {*} res response
     */
    async _deleteBusinessUnitById(req, res) {
        let businessUnitId = req.params.businessUnitId;

        const data = await BusinessUnitService._deleteBusinessUnitById({
            businessUnitId,
            user: req?.user
        });

        return res.status(200).json({
            success: true,
            message: 'Business unit deleted successfully',
            data
        });
    }

    /**
     * Get a specific business unit by id
     * @param {*} req request object
     * @param {*} res response
     */
    async _getBusinessUnitByQueryParams(req, res) {
        const findConditions = queryGenerator(req?.query);
        let data = await BusinessUnitService._getBusinessUnitByQueryParams({ findConditions });
        if (data) {
            return res.status(200).json({
                success: true,
                message: 'Business unit fetched successfully',
                data
            });
        } else {
            return res.status(200).json({
                success: false,
                message: 'Business unit not found'
            });
        }
    }

    async toggleBusinessUnitVisibility(req, res) {
        const buId = req.params.buId;

        const payload = { hidden: req.body.hidden };

        if (req.user && req.user._id && ObjectId.isValid(req.user._id)) {
            payload.updatedBy = req.user._id;
        }
        const data = await this.services.BusinessUnitService.toggleBusinessUnitVisibility({ buId, payload, user: req.user });
        return res.status(200).json({
            success: true,
            message: 'Business unit visibilty updated successfully',
            data
        });
    }

    async excelDownload(req, res) {
        const userId = req?.user?._id;

        if (!userId) {
            throw new Error('User information is required');
        }
        const agendaJob = await this.services.AgendaService.createJob({
            jobName: 'business-unit-excel-download',
            payload: { userId }
        });
        res.success({
            data: { taskId: agendaJob?.attrs?._id },
            message: 'Business unit excel download initiated successfully'
        });
    }
}

module.exports = BusinessUnitController;
