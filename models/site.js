const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const COMPANY_SCHEMA = require('../lib/utils/companySchema')(mongoose);
const uniqueValidator = require('mongoose-unique-validator');

const addressFields = [
    { name: 'address', type: 'SINGLE', prefix: 'ADDR' },
];
const zetAddressPlugin = require('../lib/utils/addressPlugin')(mongoose, {mongooseConnection: mongooseModel});
const schema = new mongoose.Schema(
    {
        company: {
            type: COMPANY_SCHEMA,
            required: true
        },
        siteId: {
            type: String,
            maxlength: 10,
            required: true,
            index: true,
        },
        siteName: {
            type: String,
            maxlength: 60,
            required: true,
        },
        deleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);
schema.index({ siteId: 1, siteName: 1 }, { collation: { locale: 'en' } });
schema.index({ siteId: 1, 'company.companyId': 1 }, { unique: true });
schema.index({ 'company.uniqueCode': 1 });
schema.index({ siteName: 1 });
schema.plugin(uniqueValidator, {
    message: '{PATH} to be unique.'
});
schema.plugin(mongoosePaginate);
schema.plugin(zetAddressPlugin.plugin.bind(zetAddressPlugin), { fields: addressFields, addressSchema: true });
module.exports = mongooseModel.model('site', schema);
