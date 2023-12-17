const mongooseModel = require('../lib/utils/db').get();
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const { zetAuditPlugin } = require('@zetwerk/zet-audit');

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        slug: {
            type: String,
            unique: true,
            required: true
        },
        legalName: {
            type: String,
            required: true
        },
        cinNo: {
            type: String,
            required: true
        },
        website: {
            type: String
        },
        logoUrl: {
            type: String
        },
        address: {
            line1: {
                type: String,
                required: true
            },
            line2: {
                type: String
            },
            pin: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            country: {
                type: String,
                required: true
            }
        },
        companyType: {
            type: String
        },
        localization: {
            type: String,
            enum: ['DOMESTIC', 'INTERNATIONAL'],
            required: true,
            default: 'DOMESTIC'
        },
        baseCurrencyId: {
            type: mongoose.Schema.Types.ObjectId
        },
        pointOfContact: {
            name: String,
            designation: String,
            email: String,
            phone: {
                number: {
                    type: String
                },
                countryCode: {
                    type: String
                }
            }
        },
        email: {
            type: String
        },
        phone: {
            type: String
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        uniqueCode: {
            type: String,
            required: true,
            index: true,
            unique: true
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        segments: [
            {
                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },
                name: {
                    type: String,
                    required: true
                },
                uniqueCode: {
                    type: String,
                    required: true
                }
            }
        ],
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
schema.virtual('baseCurrencyDetails', {
    ref: 'currency',
    localField: 'baseCurrencyId',
    foreignField: '_id',
    justOne: true
});

schema.set('collection', 'companies');
schema.plugin(mongoosePaginate);
schema.plugin(zetAuditPlugin);
schema.index('uniqueCode', {
    unique: true,
    collation: {
        locale: 'en',
        strength: 2
    }
});

module.exports = mongooseModel.model('company', schema);
