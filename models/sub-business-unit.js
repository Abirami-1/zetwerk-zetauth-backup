/**
 * Dummy model added for demo/testing purpose, please update schema as per use cases
 */

const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const uniqueValidator = require('mongoose-unique-validator');
const { zetAuditPlugin } = require('@zetwerk/zet-audit');

const schema = new mongoose.Schema(
    {
        uniqueCode: {
            type: String,
            required: true,
            uppercase: true
        },
        name: {
            type: String,
            required: true
        },
        deleted: {
            type: Boolean,
            default: false
        },
        sequenceName: {
            type: String,
            maxlength: 2,
            uppercase: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        }
    },
    {
        timestamps: true,
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

schema.virtual('updatedByDetails', {
    ref: 'user',
    localField: 'updatedBy',
    foreignField: '_id',
    justOne: true
});

schema.set('collection', 'sub-business-units');
schema.plugin(uniqueValidator);
schema.plugin(mongoosePaginate);
schema.plugin(zetAuditPlugin);
module.exports = mongooseModel.model('sub-business-unit', schema);
