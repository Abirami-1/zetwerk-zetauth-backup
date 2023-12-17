/**
 * Model for Business Unit
 */

const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const COMPANY_SCHEMA = require('../lib/utils/companySchema')(mongoose);
const uniqueValidator = require('mongoose-unique-validator');
const { zetAuditPlugin } = require('@zetwerk/zet-audit');

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        slug: {
            type: String,
            unique: true,
            required: true
        },
        company: {
            type: COMPANY_SCHEMA,
            required: true
        },
        projectTypeIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'project-type'
            }
        ],
        sequenceName: {
            type: String,
            maxlength: 2,
            uppercase: true,
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
        },
        uniqueCode: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },
        segments: [
            {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    index: true
                },
                name: {
                    type: String,
                    index: true,
                    required: true
                },
                uniqueCode: {
                    type: String,
                    required: true
                }
            }
        ],
        erpFactories: [
            {
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
            }
        ],
        subBusinessUnits: [
            {
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
                },
                sequenceName: {
                    type: String
                },
                draft: {
                    type: Boolean
                },
                hidden: {
                    type: Boolean
                },
            }
        ],
        hidden: {
            type: Boolean,
            default: true
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true
        }
    }
);

schema.virtual('companyDetails', {
    ref: 'company',
    localField: 'company.companyId',
    foreignField: '_id',
    justOne: true
});

schema.virtual('projectTypeDetails', {
    ref: 'project-type',
    localField: 'projectTypeIds',
    foreignField: '_id',
    justOne: false
});

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

schema.index({ sequenceName: 1, 'company.slug': 1 }, { unique: true });
schema.index({ uniqueCode: 1, 'company.companyId': 1 }, { unique: true });

schema.set('collection', 'business-units');
schema.plugin(mongoosePaginate);
schema.plugin(uniqueValidator);
schema.plugin(zetAuditPlugin);
module.exports = mongooseModel.model('business-unit', schema);
