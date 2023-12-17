const logger = require('../lib/utils/logger');
const DefaultController = require('@zetwerk/zetapp/controllers/DefaultController');
class SubBusinessUnitController extends DefaultController {
    constructor() {
        super('sub-business-unit');
    }

    async getSubBusinessUnitByBuId(req, res) {
        const buId = req.params.buId;
        const users = await this.services.SubBusinessUnitService.getSubBusinessUnitByBuId(buId);
        res.success({
            message: 'Event log list fetched successfully',
            data: users
        });
    }

    async createSubBusinessUnit(req, res) {
        const subBUObj = req.body;
        let subBU;
        try {
            subBU = await this.services.SubBusinessUnitService.createSubBusinessUnit(subBUObj, req.user);
        } catch (err) {
            if (err?.errors?.uniqueCode?.properties?.type === 'unique') {
                res.status(400).json({
                    success: false,
                    message: 'MSD code is already used'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: err?.message
                });
            }
        }
        res.success({
            message: 'Sub Business Unit created',
            data: subBU
        });
    }
    async getSubBusinessUnits(req, res) {
        const subBUs = await this.services.SubBusinessUnitService.getSubBusinessUnits(req.query);
        res.success({
            message: 'Sub Business Unit fetched successfully',
            data: subBUs
        });
    }

    async getAllValuesOfFilter(req, res) {
        const fiterData = await this.services.SubBusinessUnitService.getAllValuesOfFilter(req.query.filter);
        res.success({
            message: `${req.query.filter} filter list fetched successfully`,
            data: fiterData
        });
    }

    /**
     * Update the hidden status of a specific sub business unit
     * @param {*} req request object
     * @param {*} res response
     */
    async toggleSubBusinessUnitVisibility(req, res) {
        const data = await this.services.SubBusinessUnitService.toggleSubBuVisibility(req, req.user);

        logger.info({
            description: 'Sub Business unit visibilty updated',
            user: req.user
        });
        return res.status(200).json({
            success: true,
            message: 'Sub Business unit visibilty updated successfully',
            data
        });
    }

    async getSubBusinessUnitBySubBuId(req, res) {
        const subBuId = req.params.subBuId;
        const { buId, companyId } = req.query;
        if (!buId || !subBuId || !companyId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Input, Please provide buId, subBuId and companyId',
                data: {}
            });
        }
        const subBU = await this.services.SubBusinessUnitService.getSubBusinessUnitBySubBuId({
            subBuId,
            buId,
            companyId
        });
        res.success({
            message: 'Sub Business Unit fetched successfully',
            data: subBU
        });
    }

    async updateSubBuDraft(req, res) {
        const subBuId = req.params.subBuId;
        const { buId } = req.query;
        const { draft } = req.body;
        const { user } = req.user;
        if (!buId || !subBuId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Input, Please provide buId and subBuId',
                data: {}
            });
        }
        const data = await this.services.SubBusinessUnitService.updateSubBuDraft({ subBuId, buId, draft, user });
        res.status(200).json({
            success: true,
            message: 'Draft updated successfully',
            data
        });
    }

    async excelDownload(req, res) {
        const userId = req?.user?._id;

        if (!userId) {
            throw new Error('User information is required');
        }
        const agendaJob = await this.services.AgendaService.createJob({
            jobName: 'sub-business-unit-excel-download',
            payload: { userId }
        });
        res.success({
            data: { taskId: agendaJob?.attrs?._id },
            message: 'Sub business unit excel download initiated successfully'
        });
    }
}

module.exports = SubBusinessUnitController;
