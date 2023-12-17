const userService = require('./user');
const LoginOtp = require('../models/login-otp');
const EmailOtp = require('../models/email-otp');
const User = require('../models/user');
const CustomerUser = require('../models/customer-user');
const RefreshToken = require('../models/refresh-token');
const Role = require('../models/role');
const bcrypt = require('bcrypt');
const PasswordReset = require('../models/reset-password');
const mongoose = require('mongoose');
const { hashPassword } = require('../lib/utils/hash');
const SMSMessenger = require('../lib/utils/sms-messenger');
const zetMsgEmailService = require('../lib/utils/emailService');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('config');
const { sendPasswordResetMail, sendOTP, sendLoginOTP } = require('./email');
const logger = require('../lib/utils/logger');
const RoleV2Service = require('../src/modules/common/roleV2/roleV2.service');
const _ = require('lodash');

//const { TOKEN_FIELDS } = require('../lib/constants/token-fields');
const {
    OAuth2Client
} = require('google-auth-library');

const {
    INVALID_OTP,
    EXPIRED_OTP
} = require('../lib/constants/response-codes');

const {
    SUPPLIER
} = require('../lib/constants/roles');

const FIELDS_TO_POPULATE = [
    {
        path: 'roleDetails',
        select: 'name'
    },
    {
        path: 'appsEnabledDetails',
        select: 'name'
    },
    {
        path: 'updatedByDetails'
    },
    {
        path: 'createdByDetails'
    },
    {
        path: 'companies.companyDetails',
        populate: ['baseCurrencyDetails']
    },
    {
        path: 'applicationDetails',
        select: 'name'
    }
];

const GOOGLE_REFRESH_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token';

async function authUserForLocalDev({ email }) {
    let user = await User.findOne({ email });
    if (!user) {
        const usrObj = {
            email,
            firstName: email.split('@')[0]
        };
        user = new User(usrObj);
        await user.save();
    }
    let tokens = await generateTokens(user);
    return {tokens};
}

async function verifyGoogleOauthToken(token, clientId) {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId
    });
    const payload = ticket.getPayload();
    return verifyPayload(payload);
}

async function verifyGoogleOauth2Code(code, redirectUrl) {
    /* googleOAuth2RedirectUrl has to be revisited */
    const client = new OAuth2Client(
        config.get('googleAuthClientID'),
        config.get('googleAuthClientSecretNew'),
        redirectUrl
    );
    let { tokens } = await client.getToken(code);
    return tokens;
}

async function verifySupplierGoogleOauthToken(token) {
    const client = new OAuth2Client(config.get('googleAuthClientIDForSupplier'));
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.get('googleAuthClientIDForSupplier')
    });
    const payload = ticket.getPayload();
    if (payload.exp <= Date.now() / 1000) {
        throw new Error('TOKEN_EXPIRED');
    }
    return payload;
}

async function verifyPayload(payload) {

    if (config.get('authorisedDomains').indexOf(payload.hd) === -1) {
        throw new Error('DOMAIN_NOT_AUTHORIZED');
    }

    if (payload.exp <= Date.now() / 1000) {
        throw new Error('TOKEN_EXPIRED');
    }

    return payload;
}

async function getCentralAuthToken(user, expiresIn=null, type) {
    const tokenData = {_id: user._id, type, passPhrase: user.passPhrase};
    const cauthToken = jwt.sign(tokenData,
        config.get('jwt.secret'), {
            expiresIn: expiresIn || config.get('jwt.expiresIn')
        });

    return cauthToken;
}

async function verifyOTP(otp, phoneNumber) {
    let loginOtp = await LoginOtp.findOne({
        otp,
        phoneNumber
    });

    if (!loginOtp) {
        throw new Error(INVALID_OTP);
    }

    return userService.findUserByPhoneNumber(phoneNumber);
}

async function verifyEmailOTP (otp, email) {
    let emailOTP = await EmailOtp.findOne({
        otp,
        email
    });
    let createdAt = new Date(emailOTP.createdAt);
    let expiryDate = createdAt.setHours(createdAt.getHours()+2);
    let currentDate = new Date().getTime();

    if (!emailOTP) {
        throw new Error(INVALID_OTP);
    }

    if(expiryDate < currentDate) {
        throw new Error(EXPIRED_OTP);
    }
    // let supplierRole = await getSupplierRoleId();
    let user = await User.findOne({ email }).populate(FIELDS_TO_POPULATE);
  
    return user;
}

async function authenticateByPhone(otp, phoneNumber) {
    let user = await verifyOTP(otp, phoneNumber);
    let tokens = await generateTokens(user);
    return {user, tokens};
}

async function authenticateByEmailOTP(otp, email, expiresIn=null) {

    let user = await verifyEmailOTP(otp, email);
    let tokens = await generateTokens(user, expiresIn);
    return {user, tokens};

}

async function generateTokens(user, expiresIn=null) {

    if (!user) {
        throw new Error('You are not authorized. Please contact the administrator.');
    }

    if ((user && (user.deleted || !user.isActive))) {
        throw new Error('You are no longer authorized for access. Please contact the administrator.');
    }

    let tokens = {};

    tokens['zetAuthToken'] = await getCentralAuthToken(user.toJSON(), expiresIn, 'authToken');
  
    return tokens;

}

async function generateRefreshTokens(user, referer) {
    if (!user) {
        throw new Error('You are not authorized. Please contact the administrator.');
    }

    if (user && (user.deleted || !user.isActive)) {
        throw new Error('You are no longer authorized for access. Please contact the administrator.');
    }

    let tokens = {};

    tokens['zetAuthToken'] = await getCentralAuthToken(
        user.toJSON(),
        config.get('jwt.newAccessTokenExpiresIn'),
        'authToken'
    );
    tokens['refreshToken'] = await getCentralAuthToken(
        user.toJSON(),
        config.get('jwt.refreshTokenExpiresIn'),
        'refreshToken'
    );
    await saveRefreshToken({ token: tokens.refreshToken, userId: user._id, referer: referer });
    return tokens;
}

async function saveRefreshToken(obj) {
    await RefreshToken.create(obj);
}

async function checkUserExists({ username }) {
    let user = await User.findOne({ email: username }).populate(FIELDS_TO_POPULATE);
    if (!user) {
        return false;
    }
    return true;
}

async function verifyUsernameAndPassword({ username, password }) {
    let user = await User.findOne({ email: username }).populate(FIELDS_TO_POPULATE);
    if (!user) {
        return false;
    }
    /** Compare the password input by the user and the hash stored in the
   * database.
   */
    let inputPassword = password;
    let passwordInDatabase = user.password;
    let match = bcrypt.compare(inputPassword, passwordInDatabase);
    return match;
}

async function authenticateByUsernamePassword(username, password) {
    let user;
    let tokens;
    let message = 'You are not authorized. Please contact the administrator';
    let isPasswordCorrect = false;

    const userExists = await checkUserExists({ username });
    if (!userExists) {
        return { userExists, user, tokens, message };
    }

    const verifyPassword = await verifyUsernameAndPassword({ username, password });
    if (verifyPassword){
        user = await User.findOne({ email: username }).populate(FIELDS_TO_POPULATE);
        tokens = await generateTokens(user);
        isPasswordCorrect = true;
    } else {
        message = 'Invalid password';
    }
    return {userExists, user, tokens, message, isPasswordCorrect};
}


async function authenticate(token) {

    let userData = await verifyGoogleOauthToken(token, config.get('googleAuthClientID'));

    let user = await User.findOne({ email: userData.email }).populate(FIELDS_TO_POPULATE);

    let tokens = await generateTokens(user);

    let allPermisions = {};
    for (const role of user.roleIdsV2) {
        const rolesV2 = await RoleV2Service.findById({user},role);
        if(rolesV2) _.merge(allPermisions, rolesV2.permissions);
    }
    user._doc.permissions = allPermisions;
    return  { user, tokens };
}

async function authenticateCode(token, redirectUrl) {
    let codeVerifyResponse = await verifyGoogleOauth2Code(token, redirectUrl);
    let userData = await verifyGoogleOauthToken(codeVerifyResponse.id_token, config.get('googleAuthClientID'));

    let user = await User.findOne({ email: userData.email }).populate(FIELDS_TO_POPULATE);

    let tokens = await generateRefreshTokens(user, { issuedBy: 'GOOGLE', token: codeVerifyResponse.refresh_token });
    return { user, tokens };
}

async function generateOTP(phoneNumber, user, msgTemplateName = 'DEFAULT', msgTemplateSource = '') {

    await LoginOtp.deleteMany({
        phoneNumber
    });

    const otp = Math.floor(1000 + Math.random() * 9000);

    await LoginOtp.create({
        phoneNumber,
        otp
    });

    await SMSMessenger._sendOTP({
        to: phoneNumber,
        otp,
        msgTemplateName,
        msgTemplateSource
    });

    sendLoginOTP(user.email, otp, user.firstName);

}

async function requestOTP(phoneNumber, msgTemplateName = 'DEFAULT', msgTemplateSource = '') {
    let user = await userService.findUserByPhoneNumber(phoneNumber);
    if (user && (!user.deleted && user.isActive)) {
        await generateOTP(phoneNumber, user, msgTemplateName, msgTemplateSource);
        //await generateEmailOTP(user.email, user.firstName);     
    }
    return {user};
} 


async function generateEmailOTP(email, name, isSupplier) {
    /** Delete existing OTP for this email */
    await EmailOtp.deleteMany({
        email
    });

    /** Generate OTP */
    const otp = Math.floor(1000 + Math.random() * 900);

    /** Store OTP */
    await EmailOtp.create({
        email,
        otp
    });

    /** Send OTP as WhatsApp message */
    sendOTP(email, otp, name, isSupplier);
}

async function requestEmailOTP(email) {
    let user = await userService.findUserByEmail(email);
    let isSupplier = false;
    if (user && (!user.deleted && user.isActive)) {
        if (user.supplierId)
            isSupplier = true;
        await generateEmailOTP(email, user.firstName, isSupplier);
    }
    return {user};
}


async function verifyCentralAuthToken(token, cookies, res) {
    try {
        let user = jwt.verify(token, config.get('jwt.secret'));
        if (user.type === 'refreshToken') {
            throw new Error('Please pass Auth Token');
        }
        return user;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.info({
                description: 'Attempting Refresh Token, received cookies',
                data: cookies
            });
            /* Renewal will be attempted only for new cookie based flow */         
            if (cookies[`refreshtoken${process.env.NODE_ENV}`]) {
                let { renewed, user } = await attemptRenewal(cookies[`refreshtoken${process.env.NODE_ENV}`], res);
                if (renewed) return user;
            }
        }
        throw error;
    }
}

async function attemptRenewal(refreshToken, res) {
    let decryptedToken = jwt.verify(refreshToken, config.get('jwt.secret'));
    if (decryptedToken.type === 'refreshToken') {
        let token = await RefreshToken.findOne({
            token: refreshToken,
            deleted: false
        });
        if (token && decryptedToken) {
            let user = await User.findOne({ _id: new mongoose.Types.ObjectId(decryptedToken._id) });
            if (!user || user.deleted) {
                return { renewed: false };
            }
            if (token.referer && token.referer.issuedBy === 'GOOGLE') {
                if (await verifyGoogleRefreshToken(token.referer.token)) {
                    let tokens = await generateTokens(user, config.get('jwt.newAccessTokenExpiresIn'));
                    await setZetAuthCookie(res, tokens['zetAuthToken'], `authorizationtoken${process.env.NODE_ENV}`);
                    return { renewed: true, user };
                }
            }
        }
    }
    return { renewed: false };
}

async function verifyGoogleRefreshToken(token) {
    let payload = {
        client_id: config.get('googleAuthClientID'),
        client_secret: config.get('googleAuthClientSecretNew'),
        refresh_token: token,
        grant_type: 'refresh_token'
    };
    try {
        let res = await axios.post(GOOGLE_REFRESH_TOKEN_URL, payload);
        logger.info({
            description: 'Reached Google servers for Refresh Token',
            data: res.data
        });
        if (res && res.data && res.data.access_token) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        logger.error({
            description: 'Could not refresh token from google',
            error
        });
        return false;
    }
}

async function resetPasswordRequest(email) {
 
    let passwordRequest;
    const user = await userService.findUserByEmail(email);

    if (user && (!user.deleted && user.isActive)) {
        passwordRequest = await PasswordReset.create({
            userId: user._id,
            email: user.email
        });
      
        sendPasswordResetMail(user, passwordRequest._id);
    }
    return {user, passwordRequest};
}

async function getResetPasswordDetails(resetId) {
    const resetRequest = await PasswordReset.find({ _id: new mongoose.Types.ObjectId(resetId) });
    return resetRequest;
}

async function resetPassword(resetId, password) {

    const resetRequest = await PasswordReset.findOne({ _id: new mongoose.Types.ObjectId(resetId) });
    let updatedUser;
    if (resetRequest) {
        const hashedPassword = await hashPassword({ password: password, userId: resetRequest.userId });
        updatedUser = await User.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(resetRequest.userId) },
            { $set: { password: hashedPassword } },
            { new: true }
        );
    }

    return {resetRequest, updatedUser};
}

async function getSupplierRoleId() {
    return Role.findOne({ name: SUPPLIER }, {_id:1});
}

async function googleAuthenticateSupplier(token) {
 
    let userData = await verifySupplierGoogleOauthToken(token);
    
    let supplierRole = await getSupplierRoleId();
    
    let user = await User.findOne({ email: userData.email, roleId: supplierRole._id}).populate(FIELDS_TO_POPULATE);
    
    let tokens = await generateTokens(user);

    return {user, tokens};

}

/**
 * Set Authentication token in Cookies
 * 
 * @param {object} res Express Response
 * @param {string} token AuthorizedToken
 * @returns boolean
 */
async function setZetAuthCookie(res, token, tokenType) {

    res.cookie(tokenType, token, {
        domain: config.get('cookies.whitelistDomain'),
        httpOnly: true,
        secure: true,
        maxAge: config.get('cookies.maxAge')
    });

    return true;
}

/**
 * Remove Authentication token in cookies
 * 
 * @param {object} res Express Response
 * @returns boolean
 */
async function removeZetAuthCookie(res) {
    res.clearCookie(`authorizationtoken${process.env.NODE_ENV}`);
    return true;
}

function stripSensitiveHeaders(headers) {
    const sensitiveHeaders = ['authorizationtoken'];
    const strippedHeaders = JSON.parse(JSON.stringify(headers));
    for (let h of sensitiveHeaders) {
        if (strippedHeaders[h]) {
            delete strippedHeaders[h];
        }
    }
    return strippedHeaders;
}

async function verifyEmailCustomerUserOtp(otp, email) {
    const emailOTP = await EmailOtp.findOne({
        otp,
        email
    });
    const createdAt = new Date(emailOTP.createdAt);
    const expiryDate = createdAt.setHours(createdAt.getHours()+2);
    const currentDate = new Date().getTime();

    if (!emailOTP) {
        throw new Error(INVALID_OTP);
    }

    if (expiryDate < currentDate) {
        throw new Error(EXPIRED_OTP);
    }
    
    return CustomerUser.findOne({ email });
}

async function authenticateCustomerUserOtp(otp, email, expiresIn = null) {
    let user = await verifyEmailCustomerUserOtp(otp, email);
    if (!user) {
        await CustomerUser.create({ email });
        user = await CustomerUser.findOne({ email: email });
    }
    const tokens = await generateTokens(user, expiresIn);
    return {
        user,
        tokens
    };
}

async function requestCustomerUserEmailOTP(email) {
    /** Delete existing OTP for this email */
    await EmailOtp.deleteMany({
        email
    });

    /** Generate OTP */
    const otp = Math.floor(1000 + Math.random() * 900);

    /** Store OTP */
    await EmailOtp.create({
        email,
        otp
    });

    /** Build Template data and call Zet-msg-sdk email service */
    const templateData = {
        otp: otp
    };
    const from = 'Zetwerk<no-reply@zetwerk.com>';
    const to = email;
    const templateId = 'zetquote_otp_received';
    const subject = 'Zetwerk OTP: {{data.otp}}';
    zetMsgEmailService._sendEmailUsingMsgSdk(
        {
            from, to, templateData, templateId, subject
        }
    );
    return {
        email
    };
}


module.exports = {
    authenticate,
    authenticateCode,
    authenticateByPhone,
    authenticateByEmailOTP,
    authenticateByUsernamePassword,
    requestOTP,
    resetPassword,
    resetPasswordRequest,
    getResetPasswordDetails,
    googleAuthenticateSupplier,
    requestEmailOTP,
    verifyCentralAuthToken,
    setZetAuthCookie,
    removeZetAuthCookie,
    stripSensitiveHeaders,
    authUserForLocalDev,
    authenticateCustomerUserOtp,
    requestCustomerUserEmailOTP
};
