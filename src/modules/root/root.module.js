const ZetModule = require('@zetwerk/zetapp-v2/classes/ZetModule');

class RootModule extends ZetModule {
    constructor({ app, config }) {
        super({ app, config });
    }
}

module.exports = RootModule;
