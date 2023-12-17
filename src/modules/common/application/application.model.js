const { jsonToSchema } = require('@zetwerk/low-code-library/utils/index');

const ApplicationSchema = jsonToSchema('application');

ApplicationSchema.statics.fieldsToSearch = [];
ApplicationSchema.statics.fieldsToPopulate = [];
ApplicationSchema.statics.fieldsToSort = [];

module.exports = { name: 'application', schema: ApplicationSchema };
