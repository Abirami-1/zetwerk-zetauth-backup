const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique:true
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

schema.set('collection', 'applications');
schema.plugin(mongoosePaginate);
module.exports = mongooseModel.model('application', schema);