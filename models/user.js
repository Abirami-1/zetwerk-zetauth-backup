const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const COMPANY_SCHEMA = require('../lib/utils/companySchema')(mongoose);
const { zetAuditPlugin } = require('@zetwerk/zet-audit');

COMPANY_SCHEMA.options = {
    ...COMPANY_SCHEMA.options,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
};

const { USER_STATUS } = require('../lib/constants/user');

const schema = new mongoose.Schema({
    firstName: {
        type: String,
        index: true
    },
    lastName: {
        type: String,
        index: true
    },
    allowedIPs: [ {
        type: String,
    } ],
    email: {
        type: String,
        // unique: true,
        sparse: true,
        required: true,
        validate: {
            validator: function(v) {
                if(!v){
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
        type: String
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
    roleId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'role'
    }],
    roleIdsV2: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'roleV2'
        }
    ],
    applicationIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'application'
    },
    appsEnabled: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'application'
    }],
    userType: {
        type: String,
        enum: ['INTERNAL', 'EXTERNAL', 'SYSTEM', 'GOOGLE']
    },
    userSubType: {
        type: String,
        enum: ['CUSTOMER', 'SUPPLIER', 'ZETWERK', 'FACTORY'],
    },
    supplierId: mongoose.Schema.Types.ObjectId,
    pomIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    expeditorIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
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
    companies: {
        type: [COMPANY_SCHEMA],
        required: true
    },
    userGroupIds:[ 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user-groups'
        }     
    ],
    ipRestrictionStatus:{
        type: String,
        enum: ['ENABLED', 'DISABLED'],
        default: 'DISABLED'
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

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

schema.virtual('companies.companyDetails', {
    ref: 'company',
    localField: 'companies.companyId',
    foreignField: '_id',
    justOne: true
});

schema.virtual('applicationDetails', {
    ref: 'application',
    localField: 'applicationIds',
    foreignField: '_id',
    justOne: false
});
// schema.set('collection', 'users');
schema.plugin(mongoosePaginate);
schema.plugin(zetAuditPlugin);
module.exports = mongooseModel.model('user', schema);
