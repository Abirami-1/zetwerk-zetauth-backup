/* eslint-disable @zetwerk/custom-rules/service-methodDef-context-as-first-parameter */
const BaseService = require('@zetwerk/zetapp-v2/services/BaseService');
const ZetAgenda = require('@zetwerk/zet-agenda');
const logger = require('@zetwerk/zetapp-v2/logger');

class AgendaService extends BaseService {
    constructor() {
        super();
        /**
     * Register all the job with jobname and its handlerFunction in this map
     * e.g.
     * this.jobDefinationMap = {
     *    jobname1: this.handlerFun1,
     *    jobname2: this.handlerFun2,
     * }
     */
        this.jobDefinitionMap = {};
        if (AgendaService.instance) {
            return AgendaService.instance;
        }

        AgendaService.instance = this;
    }

    async initializeConsumer({ config, mongoConnection }) {
        const agendaConfig = {
            ...config.get('agenda'),
            mongoConnection,
            consumerMode: true
        };
        this.zetAgenda = new ZetAgenda(agendaConfig);
        await this.zetAgenda.initAgenda({
            successHandler: this.successHandler,
            failHandler: this.failHandler
        });
        logger.info({
            description: 'Agenda consumer init success!',
            module: 'agenda'
        });
    }

    async initializeProducer({ config, mongoConnection }) {
        this.zetAgenda = new ZetAgenda({
            ...config.get('agenda'),
            mongoConnection
        });
        await this.zetAgenda.initAgenda({});
        logger.info({
            description: 'Agenda producer init success!',
            module: 'agenda'
        });
    }

    async successHandler(job) {
        console.log('success handler', job.attrs.name);
    }

    async failHandler(job) {
        console.log('success handler', job.attrs.name);
    }

    async defineJob({ jobName, handlerFunct }) {
        await this.zetAgenda.jobDefine({ jobName, handlerFunct });
    }

    async registerJobDefinitions(subModeConfig) {
        if (subModeConfig && subModeConfig.jobs && subModeConfig.jobs.length > 0) {
            for (const job of subModeConfig.jobs) {
                if (!this.jobDefinitionMap[job]) {
                    throw new Error(`Job: ${job} not found in jobDefinitionMap in agenda.service`);
                }
                await this.zetAgenda.jobDefine({ jobName: job, handlerFunc: this.jobDefinitionMap[job] });
            }
        } else {
            for (const job of Object.keys(this.jobDefinitionMap)) {
                await this.zetAgenda.jobDefine({ jobName: job, handlerFunc: this.jobDefinitionMap[job] });
            }
        }
    }

    async createJob(reqContext, {
        jobName, payload, maxretry, retryInterval
    }) {
        try {
            payload.reqContext = reqContext;
            const job = await this.zetAgenda.createJob({
                jobName,
                payload,
                maxretry,
                retryInterval
            });
            return job;
        } catch (err) {
            throw new Error(`Error at CreateJob :: Could not create agenda job for ${jobName}. ${err}`);
        }
    }
}

module.exports = new AgendaService();
