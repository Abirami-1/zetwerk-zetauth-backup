const config = require('config');
const { sendMail } = require('../lib/utils/mail');

async function sendPasswordResetMail(user, passwordRequestId) {
    const payloadForRM = {
        from: 'Zetwerk<no-reply@zetwerk.com>',
        to: user.email,
        type: 'reset-password',
        data: {
            username: user.firstName,
            link: `${config.domainUrl}/reset-password/${passwordRequestId}`,
            mail: 'Zetwerk <support@zetwerk.com>',
            supportEmail: 'support@zetwerk.com',
            supportNumber: config.supportNumber
        },
        subject: 'Password Reset Request'
    };

    const message = {
        type: 'C_AUTH',
        subtype: 'RESET_PASSWORD',
        data: { ...payloadForRM }
    };
    await sendMail('CAUTH-EMAIL', message);
}

async function sendOTP(email, otp, name, isSupplier = false) {
    const payloadForRM = {
        from: 'Zetwerk <no-reply@zetwerk.com>',
        to: email,
        type: isSupplier? 'otp': 'login-otp',
        data: {
            otp: otp,
            name: name,
            mail: 'Zetwerk<support@zetwerk.com>',
            supportEmail: 'support@zetwerk.com',
            supportNumber: config.supportNumber
        },
        subject: 'Account verification OTP'
    };

    // if (env.includes(process.env.NODE_ENV)) {
    //   payloadForRM.cc = ['rajendra.p@zetwerk.com'];
    //   payloadForRM.to = 'deepak.as@zetwerk.com';
    // }

    const message = {
        type: 'C_AUTH',
        subtype: isSupplier? 'OTP': 'LOGIN_OTP',
        data: { ...payloadForRM }
    };
    console.log(message);
    await sendMail('CAUTH-EMAIL', message);
}
// email otp for login  

async function sendLoginOTP(email, otp, name) {
    const payloadForRM = {
        from: 'Zetwerk <no-reply@zetwerk.com>',
        to: email,
        type: 'login-otp',
        data: {
            otp: otp,
            name: name,
            mail: 'Zetwerk<support@zetwerk.com>',
            supportEmail: 'support@zetwerk.com',
            supportNumber: config.supportNumber
        },
        subject: 'Login OTP'
    };

    // if (env.includes(process.env.NODE_ENV)) {
    //   payloadForRM.cc = ['rajendra.p@zetwerk.com'];
    //   payloadForRM.to = 'deepak.as@zetwerk.com';
    // }

    const message = {
        type: 'C_AUTH',
        subtype: 'LOGIN_OTP',
        data: { ...payloadForRM }
    };
    await sendMail('CAUTH-EMAIL', message);
}

module.exports = {
    sendPasswordResetMail,
    sendOTP,
    sendLoginOTP
};
