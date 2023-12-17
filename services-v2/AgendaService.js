const AbstractService = require('@zetwerk/zetapp/services/AbstractService');
const ZetAgenda = require('@zetwerk/zet-agenda');
const logger = require('@zetwerk/zetapp/logger');
const ExcelAuditLogModel = require('../models/excelAuditLog');
const mongooseModel = require('../lib/utils/db').get();

class AgendaService extends AbstractService {
    constructor() {
        super();
    }

    async initializeConsumer({ dbURL }) {
        this.jobDefinitionMap = {
            'site-excel-upload': this.services.SiteService.handleExcelUpload.bind(this.services.SiteService),
            'warehouse-excel-upload': this.services.WarehouseErpService.handleExcelUpload.bind(
                this.services.WarehouseErpService
            ),
            'site-excel-download': this.services.SiteService.handleExcelDownload.bind(this.services.SiteService),
            'warehouse-erp-excel-download': this.services.WarehouseErpService.handleExcelDownload.bind(this.services.WarehouseErpService),
            'sub-business-unit-excel-download': this.services.SubBusinessUnitService.excelDownload.bind(this.services.SubBusinessUnitService),
            'business-unit-excel-download': this.services.BusinessUnitService.excelDownload.bind(this.services.BusinessUnitService)
        };
        const dbCollection = 'tasks';
        const agendaConfig = {
            dbCollection: dbCollection,
            dbURL,
            consumerMode: true
        };
        this.agendaConsumer = new ZetAgenda(agendaConfig);
        await this.agendaConsumer.initAgenda({ successHandler: this.successHandler, failHandler: this.failureHandler });
        logger.info({
            description: 'Agenda consumer init success!',
            module: 'agenda'
        });
        await this.createIndex(dbCollection, mongooseModel);
    }

    async createIndex(dbCollection, mongoConnection) {
        mongoConnection
            .collection(dbCollection)
            .createIndex(
                { name: 1, disabled: 1, nextRunAt: 1, lockedAt: 1 },
                { name: 'name_disabled_nextRunAt_lockedAtIdx' }
            );
    }

    async initializeProducer({ dbConnection, dbCollection }) {
        this.zetAgenda = new ZetAgenda({
            mongoConnection: dbConnection,
            dbCollection
        });
        await this.zetAgenda.initAgenda({
            successHandler: this.successHandler.bind(this),
            failHandler: this.failureHandler.bind(this)
        });
        logger.info({
            description: 'Agenda producer init success!',
            module: 'agenda'
        });
    }

    async createJob({ jobName, payload, maxretry, retryInterval }) {
        try {
            const job = await this.zetAgenda.createJob({ jobName, payload, maxretry, retryInterval });
            return job;
        } catch (err) {
            throw new Error(`Error at CreateJob :: Could not create agenda job for ${jobName}. ${err}`);
        }
    }

    async successHandler(job) {
        const payload = {
            s3Path: job?.attrs?.data?.fileUrl || job?.attrs?.jobStats?.downloadUrl,
            entity: job?.attrs?.name,
            createdBy: job?.attrs?.data?.userId
        };
        await ExcelAuditLogModel.create(payload);

        logger.info('success handler', job.attrs.name);
    }

    async failureHandler(job) {
        logger.info('failure handler', job.attrs.name);
    }

    async registerJobDefinitions() {
        console.log('registerJobDefinitions', this.jobDefinitionMap);

        for (const job in this.jobDefinitionMap) {
            try {
                await this.agendaConsumer.jobDefine({ jobName: job, handlerFunc: this.jobDefinitionMap[job] });
            } catch (err) {
                throw new Error(`Error at Agenda Service :: job definition failed for job ${job} :: ${err}`);
            }
        }
    }

    async updateJob({ job, updateAttrs }) {
        job.attrs = { ...job.attrs, ...updateAttrs };
        await job.save();
        return job;
    }

    async getJob({ query, sortBy = 'lastRunAt', sortCriteria = -1 }) {
        const sort = { [sortBy]: sortCriteria };
        const [job] = await this.zetAgenda.getJobsByQuery(query, sort);
        return job;
    }
}

module.exports = AgendaService;
