const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const schema = new mongoose.Schema({
    name: String,
    alpha2: String,
    alpha3: String,
    countryCode: {
        type: Number,
        unique: true
    },
    countryPhoneCode: String,
    isoCode: String,
    region: String,
    subRegion: String,
    intermediateRegion: String,
    regionCode: Number,
    subRegionCode: Number,
    intermediateRegionCode: Number,
    deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

schema.set('collection', 'countries');
schema.plugin(mongoosePaginate);
module.exports = mongooseModel.model('country', schema);