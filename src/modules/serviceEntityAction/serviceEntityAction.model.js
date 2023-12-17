const { jsonToSchema } = require('@zetwerk/low-code-library/utils/index');

const ServiceEntityActionSchema = jsonToSchema('serviceEntityAction');

ServiceEntityActionSchema.set('timestamps', true);

ServiceEntityActionSchema.statics.fieldsToSearch = [];
ServiceEntityActionSchema.statics.fieldsToPopulate = [];
ServiceEntityActionSchema.statics.fieldsToSort = [];

module.exports = { name: 'serviceEntityAction', schema: ServiceEntityActionSchema };
