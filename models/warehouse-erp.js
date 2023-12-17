const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const { types, WAREHOUSE_CATEGORY } = require('../lib/constants/warehouse-erp');
const COMPANY_SCHEMA = require('../lib/utils/companySchema')(mongoose);
const uniqueValidator = require('mongoose-unique-validator');
const addressFields = [{ name: 'address', type: 'SINGLE', prefix: 'ADDR' }];
const zetAddressPlugin = require('../lib/utils/addressPlugin')(mongoose, { disableValidation: true, mongooseConnection: mongooseModel });
const { zetAuditPlugin } = require('@zetwerk/zet-audit');

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            maxlength: 60,
            required: true
        },
        warehouseCode: {
            type: String,
            maxlength: 10,
            required: true
        },
        siteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'site'
        },
        siteCode: {
            type: String
        },
        company: {
            type: COMPANY_SCHEMA,
            required: true
        },
        type: {
            type: String,
            enum: Object.values(types),
            required: true
        },
        category: {
            type: String,
            enum: Object.values(WAREHOUSE_CATEGORY),
            required: true
        },
        vendorCode: {
            type: String
        },
        gstNumber: {
            type: String
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        deleted: {
            type: Boolean,
            default: false
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

schema.virtual('siteDetails', {
    ref: 'site',
    localField: 'siteId',
    foreignField: '_id',
    justOne: true
});

const handleE11000 = function(error, res, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Duplicate value detected'));
    } else {
        next();
    }
};

schema.post('save', handleE11000);
schema.post('update', handleE11000);
schema.set('collection', 'warehouses-erp');
schema.index({ name: 1 });
schema.index({ siteId: 1 });
schema.index({ category: 1, warehouseCode: 1 });
schema.index({ warehouseCode: 1, 'company.companyId': 1 }, { unique: true });
schema.index({ 'company.uniqueCode': 1 });
schema.index({ 'siteDetails.siteName': 1 });

schema.plugin(uniqueValidator, {
    message: '{PATH} to be unique.'
});
schema.plugin(mongoosePaginate);
schema.plugin(zetAddressPlugin.plugin.bind(zetAddressPlugin), { fields: addressFields, addressSchema: true });
schema.plugin(zetAuditPlugin);
module.exports = mongooseModel.model('warehouse-erp', schema);
