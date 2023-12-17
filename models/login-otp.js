const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const schema = new mongoose.Schema({
    otp: {
        type: Number,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

schema.set('collection', 'login-otp-details');
schema.plugin(mongoosePaginate);
module.exports = mongooseModel.model('login-otp-details', schema);