const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const schema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique:true,
        index: true
    },
    referer: {
        issuedBy: {
            type: String,
            enum: ['GOOGLE']
        },
        token: {
            type: String
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

schema.virtual('userIdDetails', {
    ref: 'user',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});
schema.set('collection', 'refresh-tokens');
schema.plugin(mongoosePaginate);
module.exports = mongooseModel.model('refresh-token', schema);