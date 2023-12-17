const { jsonToSchema } = require('@zetwerk/low-code-library/utils/index');

const ServiceVersionInfoSchema = jsonToSchema('serviceVersionInfo');

ServiceVersionInfoSchema.statics.fieldsToSearch = [];
ServiceVersionInfoSchema.statics.fieldsToPopulate = [];
ServiceVersionInfoSchema.statics.fieldsToSort = [];

module.exports = { name: 'serviceVersionInfo', schema: ServiceVersionInfoSchema };
