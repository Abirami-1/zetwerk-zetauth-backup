const DefaultController = require('@zetwerk/zetapp/controllers/DefaultController');
class SegmentController extends DefaultController {
    constructor() {
        super('region');
    }

    async getSegmentByQuery(req, res) {
        const query = req.query;
        const segments = await this.services.SegmentService.getSegmentByQuery({ query });
        res.success({
            message: 'Segment fetched successfully',
            data: segments
        });
    }

    async createSegment(req, res) {
        try {
            const segmentObj = req.body;
            const segment = await this.services.SegmentService.createSegment(segmentObj, req.user);
            res.success({
                message: 'Segment created',
                data: segment
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

    async getSegments(req, res) {
        const segments = await this.services.SegmentService.getSegments(req.query);
        res.success({
            message: 'Segments fetched successfully',
            data: segments
        });
    }
    
    async getAllValuesOfFilter(req, res) {
        const { filter } = req.query;
        const filters = await this.services.SegmentService.getAllValuesOfFilter({ filter });
        res.success({
            message: 'All Filters fetched successfully',
            data: filters
        });
    }

    async addCompanyToSegment(req, res) {
        const segmentId = req.params.segmentId;
        const segment = await this.services.SegmentService.addCompanyToSegment(segmentId, req.body, req.user);
        res.success({
            message: 'Segment updated successfully',
            data: segment
        });
    }
}

module.exports = SegmentController;
