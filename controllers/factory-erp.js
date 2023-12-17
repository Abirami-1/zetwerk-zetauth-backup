const DefaultController = require('@zetwerk/zetapp/controllers/DefaultController');
class FactoryErpController extends DefaultController {
    constructor() {
        super('factory-erp');
    }

    async getFactoryErpByQuery(req, res) {
        const query = req.query;
        const segments = await this.services.FactoryErpService.getFactoryErpByQuery({ query });
        res.success({
            message: 'Factory Erp fetched successfully',
            data: segments
        });
    }

    async getFactoryErpById(req, res) {
        const { factoryId } = req.params;
        const factory = await this.services.FactoryErpService.getFactoryErpById({ factoryId });
        res.success({
            message: 'Factory Erp fetched successfully',
            data: factory
        });
    }

    async getAllValuesOfFilter(req, res) {
        const { filter } = req.query;
        const filters = await this.services.FactoryErpService.getAllValuesOfFilter({ filter });
        res.success({
            message: 'All Filters fetched successfully',
            data: filters
        });
    }

    async getFactories(req, res) {
        const factories = await this.services.FactoryErpService.getFactories(req.query);
        res.success({
            message: 'Factories fetched successfully',
            data: factories
        });
    }

    async createFactory(req, res) {
        try {
            const { _id: userId = null } = req.user || {};
            const body = {
                ...req.body,
                createdBy: userId,
                updatedBy: userId
            };
            const factoryErpDoc = await this.services.FactoryErpService.createFactory(body);
            res.success({
                message: 'Factory Erp Created Successfully!',
                doc: factoryErpDoc
            });
        } catch(e) {
            if (e.errors?.uniqueCode?.properties?.type === 'unique') {
                res.status(400).json({
                    success: false,
                    message: 'MSD code is already used'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: e.message
                });
            }
        }
    }
}

module.exports = FactoryErpController;
