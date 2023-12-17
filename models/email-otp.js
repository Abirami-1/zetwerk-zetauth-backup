/**
 * @type Model
 * @desc Store Email OTP for supplier portal.
 */

/** Import dependency libs */
const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');

/** Define schema */
const schema = new mongoose.Schema(
    {
        otp: {
            type: Number,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        deleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

schema.set('collection', 'email-otp');
module.exports = mongooseModel.model('email-otp', schema);