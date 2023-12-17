/**
 * Model for factory
 */

const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const COMPANY_SCHEMA = require('../lib/utils/companySchema')(mongoose);
const { zetAuditPlugin } = require('@zetwerk/zet-audit');

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        shortName: {
            type: String,
            required: true
        },
        company: {
            type: COMPANY_SCHEMA,
            required: true
        },
        uniqueCode: {
            type: String,
            index: true,
            unique: true,
            sparse: true
        },
        location: {
            address: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            stateCode: {
                type: String,
                required: true
            },
            shortName: {
                type: String,
                required: true
            }
        },
        emailId: {
            type: String,
            required: false
        },
        phoneNo: {
            type: String,
            required: false
        },
        gst: {
            type: String,
            required: false
        },
        pan: {
            type: String,
            required: false
        },
        cinNo: {
            type: String,
            required: false
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
        isSite: {
            type: Boolean,
            default: false
        },
        businessUnitIds: {
            type: [mongoose.Schema.Types.ObjectId]
        }
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

schema.virtual('businessDetails', {
    ref: 'business-unit',
    localField: 'businessUnitIds',
    foreignField: '_id',
    justOne: false
});

schema.set('collection', 'factories');
schema.plugin(mongoosePaginate);
schema.plugin(zetAuditPlugin);
module.exports = mongooseModel.model('factory', schema);
