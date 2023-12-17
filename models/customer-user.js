const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const { USER_STATUS } = require('../lib/constants/user');

const addressSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    company: {
        type: String
    },
    addressType: [
        {
            type: String,
            enum: ['SHIPPING', 'BILLING', 'BOTH'],
            default: 'BOTH'
        }
    ],
    isDefaultAddress: {
        type: Boolean,
        default: false
    },
    addressLine1: {
        type: String,
        required: true
    },
    addressLine2: {
        type: String,
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pincode: {
        type: String
    },
    country: {
        type: String
    },
    phone: {
        number: {
            type: String
        },
        countryCode: {
            type: String
        }
    }
}, {
    toJSON: {
        virtuals: true
    }
});

const schema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            index: true
        },
        lastName: {
            type: String,
            index: true
        },
        allowedIPs: [
            {
                type: String
            }
        ],
        email: {
            type: String,
            unique: true,
            sparse: true,
            required: true,
            validate: {
                validator: function(v) {
                    if (!v) {
                        return true;
                    }
                    // eslint-disable-next-line no-useless-escape
                    return /^([\w-\.\+W]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
                },
                message: props => `${props.value} is not a valid Email!`
            }
        },
        profilePicture: String,
        phoneNumber: {
            type: String,
            unique: true,
            sparse: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        password: {
            type: String
        },
        passPhrase: {
            type: String
        },
        status: {
            type: String,
            enum: Object.values(USER_STATUS)
        },
        roleId: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'role'
            }
        ],
        appsEnabled: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'application'
            }
        ],
        userType: {
            type: String,
            default: 'EXTERNAL',
            enum: ['INTERNAL', 'EXTERNAL', 'SYSTEM', 'GOOGLE']
        },
        userSubType: {
            type: String,
            enum: ['CUSTOMER', 'SUPPLIER', 'ZETWERK', 'FACTORY', 'CUSTOMER_USER'],
            default: 'CUSTOMER_USER'
        },
        supplierId: mongoose.Schema.Types.ObjectId,
        pomIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            }
        ],
        expeditorIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            }
        ],
        notificationTokens: mongoose.Schema.Types.Mixed,
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
        },
        userGroupIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user-groups'
            }
        ],
        ipRestrictionStatus: {
            type: String,
            enum: ['ENABLED', 'DISABLED'],
            default: 'DISABLED'
        },
        addresses: [addressSchema]
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true
        }
    }
);

schema.virtual('roleDetails', {
    ref: 'role',
    localField: 'roleId',
    foreignField: '_id',
    justOne: false
});

schema.virtual('appsEnabledDetails', {
    ref: 'application',
    localField: 'appsEnabled',
    foreignField: '_id',
    justOne: false
});

schema.virtual('createdByDetails', {
    ref: 'customer-user',
    localField: 'createdBy',
    foreignField: '_id',
    justOne: true
});

schema.virtual('updatedByDetails', {
    ref: 'customer-user',
    localField: 'updatedBy',
    foreignField: '_id',
    justOne: true
});

schema.set('collection', 'customer-users');
schema.plugin(mongoosePaginate);
module.exports = mongooseModel.model('customer-users', schema);
