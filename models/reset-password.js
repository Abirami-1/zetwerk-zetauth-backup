const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');

const schema = new mongoose.Schema({ 
    email: {
        type: String,
        required: true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

schema.index({ createdAt: 1 }, { expireAfterSeconds: 259200 });

schema.set('collection', 'reset-password');

module.exports = mongooseModel.model('reset-password', schema);