const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
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
        userIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'users'
            }
        ],
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

schema.virtual('usersDetail', {
    ref: 'user',
    localField: 'userIds',
    foreignField: '_id'
});

schema.virtual('updatedByDetails', {
    ref: 'user',
    localField: 'updatedBy',
    foreignField: '_id',
    justOne: true
});
schema.set('collection', 'user-groups');
schema.plugin(mongoosePaginate);
schema.plugin(zetAuditPlugin);
module.exports = mongooseModel.model('user-group', schema);
