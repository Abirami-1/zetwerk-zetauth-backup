const { jsonToSchema } = require('@zetwerk/low-code-library/utils/index');
const mongoosePaginate = require('mongoose-paginate');
const { zetAuditPlugin } = require('@zetwerk/zet-audit');

const CompanySchema = jsonToSchema('company');

CompanySchema.statics.fieldsToSearch = [];
CompanySchema.statics.fieldsToPopulate = ['createdByDetails', 'updatedByDetails'];
CompanySchema.statics.fieldsToSort = [];


CompanySchema.virtual('createdByDetails', {
    ref: 'user',
    localField: 'createdById',
    foreignField: '_id',
    justOne: true
});

CompanySchema.virtual('updatedByDetails', {
    ref: 'user',
    localField: 'updatedById',
    foreignField: '_id',
    justOne: true
});
CompanySchema.virtual('baseCurrencyDetails', {
    ref: 'currency',
    localField: 'baseCurrencyId',
    foreignField: '_id',
    justOne: true
});

CompanySchema.set('collection', 'companies');
CompanySchema.plugin(mongoosePaginate);
CompanySchema.plugin(zetAuditPlugin);
CompanySchema.index('uniqueCode', {
    unique: true,
    collation: {
        locale: 'en',
        strength: 2
    }
});
module.exports = { name: 'company', schema: CompanySchema };
