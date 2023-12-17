const config = require('config');
const logger = require('./logger');

const { ZetMsgService } = require('@zetwerk/zet-msg-sdk');
const msgService = new ZetMsgService({
    apiKey: config.get('ZetMsgService.apiKey')
});

async function _sendEmailUsingMsgSdk({ from, to, subject, templateId, templateData }) {
    from = from.toString();
    to = to.toString();
    const response = await msgService.sendTemplateEmail( {
        from: from,
        to: to,
        templateData: templateData,
        templateId: templateId,
        subject: subject
    });

    logger.info({
        description: 'MSG-SDK: Email sent successfully',
        to
    });
    return response;
}

module.exports = {
    _sendEmailUsingMsgSdk
};