const DefaultController = require('@zetwerk/zetapp/controllers/DefaultController');
class RegionController extends DefaultController {
    constructor() {
        super('region');
    }

    async createRegion(req, res) {
        try {
            const { _id: userId = null } = req.user || {};
            const body = {
                ...req.body,
                createdBy: userId,
                updatedBy: userId
            };
        
            const doc = await this.resourceHandler.create(body);
        
            res.success({
                message: `${this.resource} Created Successfully!`,
                doc
            });
        } catch(e) {
            if (e.code === 11000) {
                res.status(400).json({
                    success: false,
                    message:  `Entered MSD code is already used in the business unit ${req.body.businessUnit?.name}`
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: e.message
                });
            }
        }
    }

    async getRegionByBuId(req, res) {
        const businessUnitId = req.params.businessUnitId;
        const regions = await this.services.RegionService.getRegionByBuId(businessUnitId);
        res.success({
            message: 'Rregion list fetched successfully',
            data: regions
        });
    }

    async getRegions(req, res) {
        const regions = await this.services.RegionService.getRegions(req.query);
        res.success({
            message: 'Regions fetched successfully',
            data: regions
        });
    }

    async getAllValuesOfFilter(req, res) {
        const { filter } = req.query;
        const filters = await this.services.RegionService.getAllValuesOfFilter({ filter });
        res.success({
            message: 'All Filters fetched successfully',
            data: filters
        });
    }
}

module.exports = RegionController;
