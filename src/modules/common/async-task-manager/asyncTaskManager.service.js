/* eslint-disable @zetwerk/custom-rules/service-methodDef-context-as-first-parameter */
const BaseService = require('@zetwerk/zetapp-v2/services/BaseService');
const taskManager = require('@zetwerk/async-task-manager');

class AsyncTaskManagerService extends BaseService {
    constructor() {
        super();

        /**
     * Register processing & saving function for each task type here
     * eg:
     *  'task-1': {
     *  processingFn: this.fn1,
     *  savingFn: this.fn2
     * }
     *
     *
     */
        this.taskExecutorFnMap = {};
        this.topicMap = {
            default: 'TestApp_tasks'
        };
        this.topicsList = ['TestApp_tasks'];
        if (AsyncTaskManagerService.instance) {
            return AsyncTaskManagerService.instance;
        }

        AsyncTaskManagerService.instance = this;
    }

    initAPIMode({
        db, appId, producerInstance = {}, collectionName = 'tasks'
    }) {
        taskManager.initProducer({
            db,
            appId,
            kafkaProducer: producerInstance,
            collectionName,
            topicMap: this.topicMap
        });
        this.setUplogger();
    }

    async initKakfaMode({
        db, appId, consumerInstance = {}, collectionName = 'tasks'
    }) {
        taskManager.initConsumer({
            db,
            appId,
            kafkaConsumer: consumerInstance,
            collectionName,
            topicsList: this.topicsList
        });
        // Iterating on all the keys of this.taskExecutorFnMap using forEach
        Object.keys(this.taskExecutorFnMap).forEach(taskType => {
            const processingFn = this.taskExecutorFnMap[taskType]
      && this.taskExecutorFnMap[taskType].processingFn;
            const savingFn = this.taskExecutorFnMap[taskType]
      && this.taskExecutorFnMap[taskType].savingFn;
            taskManager.registerTaskExecutor(taskType, processingFn.bind(this), savingFn.bind(this));
        });
        await taskManager.startExecution();
        this.setUplogger();
    }

    async createTask(reqContext, {
        type, inputFileId, user, uiEnabled, scopeId, scopeType, ...args
    }) {
        if (!reqContext) throw new Error('Request Context is mandatory');
        return taskManager.createTask({
            type, inputFileId, user, uiEnabled, scopeId, scopeType, reqContext, ...args
        });
    }

    setUplogger() {
        const logger = taskManager.getLogger();
        if (!logger) return;

        logger.on('warn', msg => {
            console.log('msg from Task Manager logger', msg);
        });
        logger.on('info', msg => {
            console.log('msg from Task Manager logger', msg);
        });
        logger.on('error', msg => {
            console.log('msg from Task Manager logger', msg);
        });
    }
}

module.exports = new AsyncTaskManagerService();
