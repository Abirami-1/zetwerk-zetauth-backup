const BaseService = require('@zetwerk/zetapp-v2/services/BaseService');
const serviceEntityActionService = require('../../serviceEntityAction/serviceEntityAction.service');
class KafkaMessageHandlerService extends BaseService {
    constructor() {
        super();
        if (KafkaMessageHandlerService.instance) {
            return KafkaMessageHandlerService.instance;
        }

        KafkaMessageHandlerService.instance = this;
    }

    async handle(reqContext, eventName, parsedMessage) {
        if (!reqContext?.user) {
            const systemUser = await this.modules.CommonModule.UserService.getSystemUser();
            reqContext = { user: systemUser };
        }
        if (parsedMessage.event === 'started' && parsedMessage.sourceService) {
            serviceEntityActionService._updateEntityActions(
                reqContext,
                parsedMessage.sourceService,
                parsedMessage.serviceVersion
            );
        }
    }
}

module.exports = new KafkaMessageHandlerService();
