const AgendaJobController = new (require('../../../controllers/AgendaJobController'))();
const DefaultRoutes = require('@zetwerk/zetapp/routes/DefaultRoutes');
const asyncHandler = require('express-async-handler');

class AgendaJobRoute extends DefaultRoutes {
    constructor() {
    // Need to pass resource name
        super('agendaJob');
        this.prefixes = 'agenda-job';
        this.loadRoutes();
    }

    loadRoutes() {
    /**
     * Loaded default routes at end because otherwise,
     * custom routes might clash with the default routes
     */
        this.router.get('/status', asyncHandler(AgendaJobController.getJobStatus.bind(AgendaJobController)));
    // super.loadDefaultRoutes();
    }
}

module.exports = AgendaJobRoute;
