const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const schema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'currency'
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'currency'
    },
    deleted: {
        type: Boolean,
        default: false
    },
    value: {
        type: Number,
        required: true
    }
}, { timestamps: true });

schema.virtual('fromCurrencyDetails', {
    ref: 'currency',
    localField: 'from',
    foreignField: '_id',
    justOne: true,
});

schema.virtual('toCurrencyDetails', {
    ref: 'currency',
    localField: 'to',
    foreignField: '_id',
    justOne: true,
});

schema.index({ from: 1, to: 1 }, { unique: true });
schema.set('collection', 'currency-exchange-rates');
schema.plugin(mongoosePaginate);
schema.index({ createdAt: 1 });
schema.index({ updatedAt: 1 });
module.exports = mongooseModel.model('currency-exchange-rate', schema);
