const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        symbol: {
            type: String,
            required: true
        },
        currencyCode: {
            type: String,
            required: true,
            unique: true
        },
        deleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

schema.virtual('exchangeRateDetails', {
    ref: 'currency-exchange-rate',
    localField: '_id',
    foreignField: 'from',
    justOne: true
});

schema.set('collection', 'currencies');
schema.plugin(mongoosePaginate);
schema.index({ name: 1 }, { unique: true });
schema.index({ createdAt: 1 });
schema.index({ updatedAt: 1 });
module.exports = mongooseModel.model('currency', schema);
