const EntityController = require('@zetwerk/zetapp-v2/controllers/EntityController');
const serviceEntityActionValidator = require('./serviceEntityAction.validator');
const serviceEntityActionService = require('./serviceEntityAction.service');

class ServiceEntityActionController extends EntityController {
    constructor() {
        super({ serviceName: 'ServiceEntityActionService' });
        this.routePrefix = 'service-entity-action';
        this.validator = serviceEntityActionValidator;
        this.loadRoutes();
    }

    loadRoutes() {
        this.router.get('/', this.getAllEntityActions);
        this.router.post('/', this.create);
    }
    async create(req, res) {
        const reqContext = req.context;
        await serviceEntityActionService.createAction(reqContext, req.body);
        res.success({});
    }

    async getAllEntityActions(req, res) {
        const allEntityActions = await serviceEntityActionService.getAllEntityActions(req.context);
        res.success({ data: { records: allEntityActions, totalCount: allEntityActions.length } } );
    }
}

module.exports = ServiceEntityActionController;
