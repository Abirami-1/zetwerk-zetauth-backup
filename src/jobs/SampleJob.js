const BaseJob = require('@zetwerk/zetapp-v2/classes/BaseJob');

class SampleJob extends BaseJob {
    constructor() {
        super();
    }

    async handle() {
        console.log('job running');
    }
}

module.exports = SampleJob;
