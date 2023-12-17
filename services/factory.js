
const Factory = require('../models/factory');
const confluentKafka = require('../lib/utils/confluent-kafka');
const logger = require('../lib/utils/logger');
const { CREATE_FACTORY } = require('../lib/constants/kafka-events');

class FactoryService {
    constructor() {}

    async getFactoryDetails({factoryId}) {
        return Factory.findById(factoryId);
    }

    async create(req) {
        let data = await Factory.create(req);
        confluentKafka.sendMessage('ZET-FACTORY', {
            event: CREATE_FACTORY,
            message: 'New factory created',
            data
        });
        logger.info({
            description: 'Factory created',
            data,
            user: req.createdBy
        });
    }
}

module.exports = FactoryService;
