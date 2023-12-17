const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
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
        slug: {
            type: String,
            unique: true,
            required: true
        },
        businessUnit: {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            uniqueCode: {
                type: String,
                required: true
            }
        },
        deleted: {
            type: Boolean,
            default: false
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
        toJSON: { virtuals: true }
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

schema.virtual('businessUnitDetails', {
    ref: 'business-unit',
    localField: 'businessUnitId',
    foreignField: '_id',
    justOne: true
});

schema.index({ uniqueCode: 1, 'businessUnit._id': 1 }, { unique: true });
schema.set('collection', 'region');
schema.plugin(mongoosePaginate);
schema.plugin(zetAuditPlugin);
module.exports = mongooseModel.model('region', schema);
