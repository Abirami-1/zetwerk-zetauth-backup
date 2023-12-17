const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const AuditLog = require('../lib/constants/warehouse-audit-log');
const mongoosePaginate = require('mongoose-paginate');
const schema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: AuditLog.AUDIT_LOG_TYPES,
            required: true,
            index: true
        },
        action: {
            type: String,
            enum: AuditLog.AUDIT_LOG_ACTIONS,
            required: true
        },
        typeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        deleted: {
            type: Boolean,
            default: false
        }
    },
    {
        toJSON: {
            virtuals: true
        }
    }
);

schema.virtual('createdByDetails', {
    ref: 'user',
    localField: 'createdBy',
    foreignField: '_id',
    justOne: true
});
schema.set('collection', 'warehouse-audit-logs');
schema.plugin(mongoosePaginate);
module.exports = mongooseModel.model('warehouse-audit-log', schema);
