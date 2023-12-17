const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const { types, status } = require('../lib/constants/warehouse');
const locationSchema = new mongoose.Schema({
    address: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    country: {
        type: String
    },
    coordinates: {
        lat: {
            type: Number
        },
        long: {
            type: Number
        }
    }
});
const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            index: true,
            required: true,
            unique: true
        },
        shortName: {
            type: String,
            index: true,
            unique: true,
            required: true,
            validate: {
                validator: function(v) {
                    if (!v) {
                        return true;
                    }
                    return v.length <= 5;
                },
                message: () => 'Shortname should be upto 5 character.'
            }
        },
        location: locationSchema,
        company: {
            companyId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            slug: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            legalName: {
                type: String,
                required: true
            }
        },
        factory: {
            factoryId: {
                type: mongoose.Schema.Types.ObjectId
            },
            name: {
                type: String
            },
            shortName: {
                type: String
            }
        },
        type: {
            type: String,
            enum: Object.values(types),
            default: types.MANAGED
        },
        stcApprovers: [
            {
                type: mongoose.Schema.Types.ObjectId
            }
        ],
        status: {
            type: String,
            enum: Object.values(status),
            default: status.ACTIVE
        },
        contract: {
            contractId: {
                type: mongoose.Schema.Types.ObjectId
            },
            contractNumber: {
                type: String
            }
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        deleted: {
            type: Boolean,
            default: false
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

schema.virtual('updatedByDetails', {
    ref: 'user',
    localField: 'updatedBy',
    foreignField: '_id',
    justOne: true
});

schema.virtual('zones', {
    ref: 'warehouse-zone',
    localField: '_id',
    foreignField: 'warehouseId'
});

schema.virtual('auditLogs', {
    ref: 'warehouse-audit-log',
    localField: '_id',
    foreignField: 'typeId'
});

schema.virtual('stcApproversDetails', {
    ref: 'user',
    localField: 'stcApprovers',
    foreignField: '_id'
});

const handleE11000 = function(error, res, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Either name or short name is duplicated'));
    } else {
        next();
    }
};

schema.post('save', handleE11000);
schema.post('update', handleE11000);
schema.set('collection', 'warehouses');
schema.plugin(mongoosePaginate);
module.exports = mongooseModel.model('warehouse', schema);
