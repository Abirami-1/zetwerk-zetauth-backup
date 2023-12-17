const { jsonToSchema } = require('@zetwerk/low-code-library/utils/index');

const RoleV2Schema = jsonToSchema('roleV2');

RoleV2Schema.statics.fieldsToSearch = ['name'];
RoleV2Schema.statics.fieldsToPopulate = [];
RoleV2Schema.statics.fieldsToSort = ['name'];
RoleV2Schema.set('timestamps', true);
RoleV2Schema.set('toJSON', {
    virtuals: true
});

RoleV2Schema.index({ name: 1 }, { unique: true });

module.exports = { name: 'roleV2', schema: RoleV2Schema };
