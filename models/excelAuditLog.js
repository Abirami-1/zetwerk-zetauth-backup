const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    s3Path: {
        type: String,
        required: true
    },
    entity: {
        type: mongoose.Schema.Types.String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
},{
    timestamps: true
});

Schema.virtual('createdByDetails', {
    ref: 'user',
    localField: 'createdBy',
    foreignField: '_id',
    justOne: true
});

module.exports = mongooseModel.model('excelAuditLog', Schema);