const axios = require('axios');
const config = require('config');
const logger = require('./logger');
const { LOGIN_OTP, LOGIN_OTP_MOBILE } = require('../constants/sms-templates');
const baseURL = 'https://enterprise.smsgupshup.com/GatewayAPI';

const httpClient = axios.create({
    baseURL: baseURL,
    timeout: 100000
});

const { ZetMsgService } = require('@zetwerk/zet-msg-sdk');
const msgService = new ZetMsgService({
    apiKey: config.get('ZetMsgService.apiKey')
});

const userId = config.smsApi.userId;
const password = config.smsApi.password;
const version = config.smsApi.version;

async function _sendMessage({ message, to }) {
    const toNumber = `91${to}`;
    const encodedMsg = encodeURIComponent(message);
    const urlQuery = `/rest?method=SendMessage&send_to=${toNumber}&msg=${encodedMsg}&msg_type=TEXT&userid=${userId}&auth_scheme=plain&v=${version}&format=text&password=${password}`;

    let result = await httpClient.put(urlQuery);

    logger.info({
        description: 'Sending SMS Message',
        toNumber,
        message,
        response: result.data
    });
}

async function _sendSmsUsingMsgSdk({ to, templateId, templateData }) {
    to = to.toString();
    const response = await msgService.sendSMS({
        to,
        templateId: templateId,
        templateData: templateData
    });

    logger.info({
        description: 'MSG-SDK: SMS sent successfully',
        to
    });
    return response;
}

async function _sendOTP({ to, otp, msgTemplateName, msgTemplateSource }) {
    let templateData = { otp };
    let templateId;
    if (msgTemplateName === 'MOBILE') {
        const hashCodes = config.get('hashCodeForCrashAnalytics');
        templateData.hashCodes = hashCodes[msgTemplateSource];
        templateId = LOGIN_OTP_MOBILE;
    } else {
        templateId = LOGIN_OTP;
    }

    return _sendSmsUsingMsgSdk({ to, templateId, templateData });
}

module.exports = {
    _sendMessage,
    _sendOTP
};