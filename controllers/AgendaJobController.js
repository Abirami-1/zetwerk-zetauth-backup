const DefaultController = require('@zetwerk/zetapp/controllers/DefaultController');
const mongoose = require('mongoose');

class AgendaJobController extends DefaultController {
    constructor() {
        super('user');
    }

    async getJobStatus(req, res) {
        const { taskId, name, sortBy, sortCriteria } = req.query;
        const query = {
            ...(taskId && { _id: new mongoose.Types.ObjectId(taskId) }),
            ...(name && { name })
        };
        const job = await this.services.AgendaService.getJob({ query, sortBy, sortCriteria });
        return res.success({
            message: 'Job status fetched successfully',
            data: job
        });
    }
}

module.exports = AgendaJobController;
