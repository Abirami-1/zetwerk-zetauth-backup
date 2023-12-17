const kafka = require('./kafka');
const logger = require('./logger');

async function sendMail(topic, message) {
    try {
        await kafka._sendMessage(topic, message);
        logger.info({
            description: 'Email sent successfully',
            statusCode: 'SEND_EMAIL_SUCCESS',
            data: { topic: topic, message: message },
        });
    }
    catch (error) {
        logger.error({
            description: 'Send email failed',
            statusCode: 'SEND_EMAIL_FAILED',
            data: { topic: topic, message: message },
            error
        });
        throw new Error(error.message);
    }
}

module.exports = { sendMail };