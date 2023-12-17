const Kafka = require('@zetwerk/zet-kafka');
const configOptions = require('config').get('confluentKafka');
let kafka, producer, logger;

async function disconnect() {
    if (producer) await producer.disconnect();
}

async function getConfluentKafkaInstance() {
    return kafka;
}

async function initializeConfluentKafka() {
    kafka = new Kafka(configOptions);
    logger = kafka.getLogger();
    logger.on('warn', (msg) => {
        console.log('msg from logger', msg);
    });
    logger.on('info', (msg) => {
        console.log('msg from logger', msg);
    });
    logger.on('error', (msg) => {
        console.log('msg from logger', msg);
    });
}

async function initializeProducer() {
    producer = await kafka.getProducer({
        'queue.buffering.max.ms': 1
    });
}

async function sendMessage(topic, message) {
    if (!producer) await initializeProducer();
    return producer.sendMessage(topic, message);
}



module.exports.initializeConfluentKafka = initializeConfluentKafka;
module.exports.initializeProducer = initializeProducer;
module.exports.disconnectKafka = disconnect;
module.exports.sendMessage = sendMessage;
module.exports.getConfluentKafkaInstance = getConfluentKafkaInstance;
