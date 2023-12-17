const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const { zetAuditPlugin } = require('@zetwerk/zet-audit');

const schema = new mongoose.Schema({
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'warehouse',
        required: true
    },
    name: {
        type: String,
        index: true,
        required: true
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});


schema.set('collection', 'warehouse-zones');
schema.plugin(mongoosePaginate);
schema.plugin(zetAuditPlugin);
schema.index({warehouseId:1, name:1}, { unique: true });

module.exports = mongooseModel.model('warehouse-zone', schema);
