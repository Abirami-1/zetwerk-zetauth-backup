const express = require('express');
const router = express.Router();

const authController = require('../../../controllers/auth');

router.post('/authenticate', authController._authenticate);

router.post('/authenticate-code', authController._authenticateCode);

router.post('/authenticateByUsernamePassword', authController._authenticateByUsernamePassword);

router.post('/request-otp', authController._requestOTP);

router.post('/request-email-otp', authController._requestEmailOTP);

router.post('/authenticate-by-otp', authController._authenticateByEmailOTP);

router.post('/authenticateByPhone', authController._authenticateByPhone);

router.post('/request-password-reset', authController._resetPasswordRequest);

router.get('/reset-password/:resetId', authController._getResetPasswordDetails);

router.post('/reset-password/:resetId', authController._resetPassword);

router.post('/supplier-authenticate/google', authController._googleAuthenticateSupplier);

router.post('/authenticate-for-local', authController.authenticateForLocal);

router.post('/customer-user/authenticate', authController._authenticateCustomerUserOtp);

router.post('/customer-user/request-otp', authController._requestCustomerUserOTP);

module.exports = router;