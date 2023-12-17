const AbstractService = require('@zetwerk/zetapp/services/AbstractService');
const logger = require('@zetwerk/zetapp/logger');
const auditLog = require('../lib/constants/audit-log');
const { createAuditLog } = require('@zetwerk/zet-audit');
class AuditLogService extends AbstractService {
    constructor() {
        super();
    }

    /**
     * Make audit log entries based on given model
     * @param {Object} oldData previous object before modification, newData updated/created object
     * @returns audit log object that is created
     */
    async createAuditLog({ oldData, newData, model, user, action, actionType, batchId }) {
        logger.info({ description: `Creating audit log entry for ${model.modelName}` });
        if (!model) {
            throw new Error('Source Model is required in order to create the audit log');
        }
        // Removing populated fields from newData before creating audit logs
        auditLog.FILTER_KEYS.forEach(key => delete newData[key]);
        return await createAuditLog({
            sourceModel: model,
            auditDataList: [
                {
                    data: {
                        ...(oldData && { before: oldData }),
                        after: newData
                    },
                    entityId: newData._id,
                    actionType: actionType || 'CREATE',
                    action
                }
            ],
            batchId,
            user
        });
    }
}

module.exports = AuditLogService;
