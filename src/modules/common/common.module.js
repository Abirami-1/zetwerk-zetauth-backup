const ZetModule = require('@zetwerk/zetapp-v2/classes/ZetModule');

class CommonModule extends ZetModule {
    constructor({ app, config }) {
        super({ app, config });
    }

    async onShutdown() {
        const services = this.serviceRegistry;
        if (services && services.KafkaService) {
            /* eslint-disable-next-line
        @zetwerk/custom-rules/service-methodcall-context-as-first-parameter
      */
            await services.KafkaService.disconnect();
        }
    }
}

module.exports = CommonModule;
