const { jsonToSchema } = require('@zetwerk/low-code-library/utils/index');

const UserSchema = jsonToSchema('user');

UserSchema.statics.fieldsToSearch = ['firstName', 'lastName', 'email', 'phoneNumber'];
UserSchema.statics.fieldsToPopulate = ['rolesV2', 'applications', 'createdByDetails', 'updatedByDetails', 'companies.companyDetails'];
UserSchema.statics.fieldsToSort = ['firstName'];
UserSchema.virtual('fullName').get(function () {
    let fullName;
    if (this.firstName) {
        fullName = this.firstName;
    }

    if (this.lastName) {
        fullName = fullName + ` ${this.lastName}`;
    }
    return fullName ? fullName : this.email;
});

UserSchema.virtual('createdByDetails', {
    ref: 'user',
    localField: 'createdById',
    foreignField: '_id',
    justOne: true
});

UserSchema.virtual('updatedByDetails', {
    ref: 'user',
    localField: 'updatedById',
    foreignField: '_id',
    justOne: true
});

UserSchema.virtual('companies.companyDetails', {
    ref: 'company',
    localField: 'companies.companyId',
    foreignField: '_id',
    justOne: true
});

UserSchema.index({ firstName: 1 });
UserSchema.index({ lastName: 1 });
UserSchema.index({ email: 1 }, { unique: 1, sparse: 1 });
module.exports = { name: 'user', schema: UserSchema };
