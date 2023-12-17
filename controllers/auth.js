const logger = require('../lib/utils/logger');
const authService = require('../services/auth');

const {
    NO_GAUTH_TOKEN,
    NO_GAUTH_CODE,
    USER_UNAUTHORIZED,
    USER_AUTHENTICATED,
    NO_USERNAME_OR_PASSWORD,
} = require('../lib/constants/response-codes');

/* Fixed */
async function _authenticateByPhone(req, res) {
    try {
        const otp = req.body.otp;
        const phoneNumber = req.body.phoneNumber;
  
        if (!otp) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : OTL Invalid',
                user: req.user,
                reqBody: req.body
            });
            return res.status(401).json({
                success: false,
                message: 'No otp provided.',
                data: {}
            });
        }
  
        if (!phoneNumber) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : phoneNumber Invalid',
                user: req.user,
                reqBody: req.body
            });
            return res.status(401).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'No phone number provided.',
                data: {}
            });
        }

        let {user, tokens} = await authService.authenticateByPhone(otp, phoneNumber);

        return res.status(200).json({
            success: true,
            statusCode: USER_AUTHENTICATED,
            data: tokens,
            user: user
        });

    } catch (error) {
        logger.error({
            description: 'An error occurred while authentication using google oauth',
            error,
            user: req.user
        });

        return res.status(401).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'The OTP entered is incorrect.',
            data: {
                error: error.message
            }
        });
    }
}

/* Fixed */
async function _authenticateByEmailOTP(req, res) {
    try {
        const otp = req.body.otp;
        const email = req.body.email;
        const expiresIn = req.body.expiresIn;
  
        if (!otp) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : OTP INVALID',
                user: req.user,
                reqBody: req.body
            });
            return res.status(401).json({
                success: false,
                message: 'No otp provided.',
                data: {}
            });
        }
  
        if (!email) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : EMAIL Invalid',
                user: req.user,
                reqBody: req.body
            });
            return res.status(401).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'No email id provided.',
                data: {}
            });
        }

        let { user,tokens } = await authService.authenticateByEmailOTP(otp, email, expiresIn);

        return res.status(200).json({
            success: true,
            statusCode: USER_AUTHENTICATED,
            data: { tokens },
            user: user
        });

    } catch (error) {
        logger.error({
            description: 'An error occurred while authentication using email otp',
            error,
            user: req.user
        });

        return res.status(401).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'The OTP entered is incorrect.',
            data: {
                error: error.message
            }
        });
    }
}

/* Fixed */
async function _authenticateByUsernamePassword(req, res) {
  
    try {
        let username = req.body.username;
        let password = req.body.password;
        if (!username || !password) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : USERNAME/PASSWORD Invalid',
                user: req.user,
                reqBody: req.body
            });
            return res.status(401).json({
                success: false,
                statusCode: NO_USERNAME_OR_PASSWORD,
                message: 'No username or password provided'
            });
        }
        let {userExists, user, tokens, message, isPasswordCorrect} = await authService.authenticateByUsernamePassword(username, password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: message
            });
        }
   
        if(userExists){
            return res.status(200).json({
                success: true,
                statusCode: USER_AUTHENTICATED,
                data: { userObject: user, tokens }
            });
        }
   
        return res.status(401).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: message
        });

    } catch (error) {

        logger.error({
            description: 'An error occurred while authentication using username and password',
            error,
            user: req.user
        });

        return res.status(401).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'You are not authorized. Please contact the administrator'
        });
    }
}

/* Fixed */
async function _authenticate(req, res) {

    try {
        const token = req.body.token;

        if (!token) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : No token provided',
                user: req.user,
                reqBody: req.body
            });
            return res.status(401).json({
                success: false,
                statusCode: NO_GAUTH_TOKEN,
                message: 'No google auth token provided'
            });
        }
    
        let {user, tokens} = await authService.authenticate(token);

        logger.info({
            description: 'User authentication using google oauth success',
            user: req.user,
            reqBody: req.body
        });

        return res.status(200).json({
            success: true,
            statusCode: USER_AUTHENTICATED,
            data: { userObject: user, tokens }
        });


    } catch (error) {

        logger.error({
            description: 'An error occurred while authentication using google oauth',
            error,
            user: req.user,
            reqBody: req.body
        });

        return res.status(401).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'You are not authorized. Please contact the administrator'
        });
    }
}

async function _authenticateCode(req, res) {

    try {
        const code = req.body.code;

        if (!code) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : No code provided',
                user: req.user,
                reqBody: req.body
            });
            return res.status(401).json({
                success: false,
                statusCode: NO_GAUTH_CODE,
                message: 'No google auth code provided'
            });
        }

        let {user, tokens} = await authService.authenticateCode(code, req.body.redirectUrl);
        await authService.setZetAuthCookie(res, tokens['zetAuthToken'], `authorizationtoken${process.env.NODE_ENV}`);
        await authService.setZetAuthCookie(res, tokens['refreshToken'], `refreshtoken${process.env.NODE_ENV}`);  

        logger.info({
            description: 'User authentication using google oauth success',
            user: req.user,
            reqBody: req.body
        });

        /* Tokens will be removed once all Frontend are migrated */
        return res.status(200).json({
            success: true,
            statusCode: USER_AUTHENTICATED,
            data: { userObject: user }
        });


    } catch (error) {

        logger.error({
            description: 'An error occurred while authentication using google oauth',
            error,
            user: req.user,
            reqBody: req.body
        });

        return res.status(401).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'You are not authorized. Please contact the administrator'
        });
    }
}

/* Fixed */
async function _requestOTP(req, res) {
    try {
        const phoneNumber = req.body.phoneNumber;
        const msgTemplateName = req.body.templateName || 'DEFAULT';
        const msgTemplateSource = req.body.templateSource || 'ZETRACKER';

        if (!phoneNumber) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : No phone number provided',
                user: req.user,
                reqBody: req.body
            });
            return res.status(401).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'No phone number provided',
            });
        }
    
        let {user} = await authService.requestOTP(phoneNumber, msgTemplateName, msgTemplateSource);

        if (!user) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : User Does not Exists',
                user: req.user,
                reqBody: req.body
            });
            return res.status(403).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'You are not authorized. Please contact the administrator.',
            });
        }

        if (user && (user.deleted || !user.isActive)) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : Login Attemp for inactive/deleted user',
                user: req.user,
                reqBody: req.body
            });
            return res.status(403).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'You are no longer authorized for access. Please contact the administrator.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP generated successfully'
        });

    } catch (error) {

        logger.error({
            description: 'An error occurred while generating otp',
            error,
            user: req.user,
            reqBody: req.body
        });
        return res.status(401).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'You are not authorized. Please contact the administrator',
            data: {
                error: error.message
            }
        });

    }
}

/* Fixed */
async function _requestEmailOTP(req, res) {
    try {
        const email = req.body.email;
        if (!email) {
            logger.info({
                description: 'OTP REQUESTED FOR INVALID USER',
                data: req.body
            });
            return res.status(401).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'No email provided',
            });
        }
    
        let {user} = await authService.requestEmailOTP(email);

        if (!user) {
            logger.info({
                description: 'OTP REQUESTED FOR INVALID USER',
                data: req.body
            });
            return res.status(403).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'You are not authorized. Please contact the administrator.'
            });
        }
        if (user && (user.deleted || !user.isActive)) {
            logger.info({
                description: 'OTP REQUESTED FOR UNAUTHORIZED USER',
                data: req.body
            });
            return res.status(403).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'You are no longer authorized for access. Please contact the administrator.'
            });
        }

        logger.info({
            description: 'OTP requested for user',
            data: req.body,
            mail: { user: user.firstName, email: user.email }
        });

        return res.status(200).json({
            success: true,
            message: 'OTP generated successfully'
        });
    }
    catch (error) {
        logger.error({
            description: 'An error occurred while generating otp',
            error,
            user: req.user
        });
        return res.status(401).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'You are not authorized. Please contact the administrator',
            data: {
                error: error.message
            }
        });
    }

}

/* Fixed */
async function _resetPasswordRequest(req, res) {
    try {
        const {user, passwordRequest} = await authService.resetPasswordRequest(req.body.email);

        if (!user) {
            logger.info({
                description: 'PASSWORD REQUEST ATTEMPTED FOR INVALID USER',
                data: req.body
            });
            return res.status(403).json({
                description: 'password reset request failed',
                statusCode: USER_UNAUTHORIZED,
                success: false
            });
        }

        if (user && (user.deleted || !user.isActive)) {
            logger.info({
                description: 'PASSWORD REQUEST ATTEMPTED FOR INVALID USER',
                data: req.body
            });
            return res.status(403).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'You are no longer authorized for access. Please contact the administrator.'
            });
        }

        logger.info({
            description: 'password reset requested for user',
            data: req.body,
            mail: { id: passwordRequest._id, user: user.firstName, email: user.email }
        });

        res.status(200).json({
            description: 'password reset request success',
            success: true
        });

    } catch (error) {
        res.status(400).json({
            description: 'password reset request failed',
            success: false
        });
    }
}

/* Fixed */
async function _getResetPasswordDetails(req, res) {
    try {

        const resetRequest = await authService.getResetPasswordDetails(req.params.resetId);

        res.status(200).json({
            data: resetRequest,
            success: true
        });

    } catch (error) {
        logger.error({
            description: 'error',
            error
        });
    }
}

/* Fixed */
async function _resetPassword(req, res) {
    try {

        if (req.body.confirmedPassword != req.body.password) {
            logger.info({
                description: 'FAILED PASSWORD REQUEST ATTEMPTED USER',
                data: req.body
            });

            return res.status(500).json({
                description: 'password reset request failed',
                success: false,
                error: 'Validation Error'
            });
        }

        const {resetRequest, updatedUser} = await authService.resetPassword(req.params.resetId, req.body.password);

        if (!resetRequest) {

            logger.info({
                description: 'FAILED PASSWORD REQUEST ATTEMPTED USER',
                data: req.body
            });

            return res.status(500).json({
                description: 'password reset request failed',
                success: false
            });

        }

        logger.info({
            description: 'password reset success',
            data: updatedUser
        });

        res.status(200).json({
            success: true,
            description: 'password reset success'
        });

    } catch (error) {

        logger.error({
            description: 'password reset failed',
            error
        });
        res.status(400).json({
            success: false,
            description: 'password reset failed'
        });

    }
}

async function _googleAuthenticateSupplier(req, res) {
    try {
        const token = req.body.token;

        if (!token) {
            return res.status(200).json({
                success: false,
                statusCode: NO_GAUTH_TOKEN,
                message: 'No google auth token provided'
            });
        }
    
        let {user, tokens} = await authService.googleAuthenticateSupplier(token);
        return res.status(200).json({
            success: true,
            statusCode: USER_AUTHENTICATED,
            data: { userObject: user, tokens} 
        });


    } catch (error) {

        logger.error({
            description: 'An error occurred while authentication using google oauth',
            error,
            user: req.user
        });

        return res.status(200).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'You are not authorized. Please contact the administrator',
            data: {
                error: error.message
            }
        });
    }
}

async function _authenticateCustomerUserOtp(req, res) {
    try {
        const { otp, email, expiresIn } = req.body;
        if (!otp) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : OTP INVALID',
                user: req.user,
                reqBody: req.body
            });
            return res.status(401).json({
                success: false,
                message: 'No otp provided.',
                data: {}
            });
        }

        if (!email) {
            logger.error({
                description: 'FAILED LOGIN ATTEMPT : EMAIL Invalid',
                user: req.user,
                reqBody: req.body
            });
            return res.status(401).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'No email id provided.',
                data: {}
            });
        }

        let { user,tokens } = await authService.authenticateCustomerUserOtp(otp, email, expiresIn);

        return res.status(200).json({
            success: true,
            statusCode: USER_AUTHENTICATED,
            data: { tokens },
            user: user
        });


    } catch (error) {
        logger.error({
            description: 'An error occurred while authentication using email otp',
            error,
            user: req.user
        });

        return res.status(401).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'The OTP entered is incorrect.',
            data: {
                error: error.message
            }
        });
    }

}

/* Fixed */
async function _requestCustomerUserOTP(req, res) {
    try {
        const email = req.body.email;
        if (!email) {
            logger.info({
                description: 'OTP REQUESTED FOR INVALID USER',
                data: req.body
            });
            return res.status(401).json({
                success: false,
                statusCode: USER_UNAUTHORIZED,
                message: 'No email provided',
            });
        }
    
        await authService.requestCustomerUserEmailOTP(email);

        logger.info({
            description: 'OTP requested for user',
            data: req.body,
            mail: { email }
        });

        return res.status(200).json({
            success: true,
            message: 'OTP generated successfully'
        });
    }
    catch (error) {
        logger.error({
            description: 'An error occurred while generating otp',
            error,
            user: req.user
        });
        return res.status(401).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'You are not authorized. Please contact the administrator',
            data: {
                error: error.message
            }
        });
    }

}

async function authenticateForLocal(req, res) {
    try {
        const email = req.body.email;
        const {tokens} = await authService.authUserForLocalDev({email});
        res.status(200).json({
            success: true,
            statusCode: USER_AUTHENTICATED,
            data: { tokens} 
        });
    } catch (error) {

        logger.error({
            description: 'An error occurred while authentication using google oauth',
            error,
            user: req.user
        });

        return res.status(200).json({
            success: false,
            statusCode: USER_UNAUTHORIZED,
            message: 'You are not authorized. Please contact the administrator',
            data: {
                error: error.message
            }
        });
    }
}
module.exports = {
    _authenticate,
    _authenticateCode,
    _authenticateByPhone,
    _authenticateByEmailOTP,
    _authenticateByUsernamePassword,
    _requestOTP,
    _resetPassword,
    _resetPasswordRequest,
    _getResetPasswordDetails,
    _googleAuthenticateSupplier,
    _requestEmailOTP,
    _authenticateCustomerUserOtp,
    _requestCustomerUserOTP,
    authenticateForLocal
};
