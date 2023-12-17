const ZetModule = require('@zetwerk/zetapp-v2/classes/ZetModule');

class ServiceVersionInfoModule extends ZetModule {
    constructor({ app, config }) {
        super({ app, config });
    }
}

module.exports = ServiceVersionInfoModule;
