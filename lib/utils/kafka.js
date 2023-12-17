const { Kafka, logLevel: LOG_LEVEL } = require('kafkajs');
const config = require('config');
const logger = require('./logger');


let _kafkaClient, _producer, _consumer;

async function _getKafkaInstance() {
    return _kafkaClient
        ? {
            producerInstances: [_producer],
            consumerInstances: [_consumer],
            shutdown: () => {
                this.producerInstances?.forEach(async _ => await _.disconnect());
                this.consumerInstances?.forEach(async _ => await _.disconnect());
            }
        }
        : null;
}

const LOG_FORMATTER = logLevel => ({ namespace, log }) => {

    const toPinoLogLevel = level => {
        switch (level) {
            case LOG_LEVEL.ERROR:
            case LOG_LEVEL.NOTHING:
                return 'error';
            case LOG_LEVEL.WARN:
                return 'warn';
            case LOG_LEVEL.INFO:
                return 'info';
            case LOG_LEVEL.DEBUG:
                return 'debug';
        }
    };

    const pinoLogLevel = toPinoLogLevel(logLevel);

    const {
        message: description,
        // eslint-disable-next-line no-unused-vars
        timestamp,
        // eslint-disable-next-line no-unused-vars
        level: levelLog,
        // eslint-disable-next-line no-unused-vars
        label: labelLog,
        ...rest } = log;

    return logger[pinoLogLevel]({
        description,
        ...rest,
        namespace
    });
};

async function _initializeProducer(){
    if (!config.kafka) {
        throw new Error('Kafka configuration missing');
    }

    if (!config.kafka.clientId || !config.kafka.brokerURL) {
        throw new Error('Kafka client ID / Broker URL missing');
    }

    if(!_kafkaClient){
        _kafkaClient = new Kafka({
            clientId: config.kafka.clientId,
            brokers: [config.kafka.brokerURL],
            logCreator: LOG_FORMATTER
        });

        logger.info({
            description: 'Kafka client connected'
        });
    }  

    _producer = _kafkaClient.producer();

    await _producer.connect();

    logger.info({
        description: 'Kafka producer connected'
    });

}

async function _initializeConsumer(){
    const EventLib = require('./events');

    const TOPICS_TO_SUBSCRIBE = config.kafka.topics;
  
    if (!config.kafka) {
        throw new Error('Kafka configuration missing');
    }

    if (!config.kafka.clientId || !config.kafka.brokerURL) {
        throw new Error('Kafka client ID / Broker URL missing');
    }

    if (!config.kafka.consumerGroupId) {
        throw new Error('Kafka consumer group ID missing');
    }

    _kafkaClient = new Kafka({
        clientId: config.kafka.clientId,
        brokers: [config.kafka.brokerURL],
        logCreator: LOG_FORMATTER
    });

    logger.info({
        description: 'Kafka client connected'
    });

    _consumer = _kafkaClient.consumer({
        groupId: config.kafka.consumerGroupId
    });

    await _consumer.connect();

    logger.info({
        description: 'Kafka consumer connected'
    });

    for (const topic of TOPICS_TO_SUBSCRIBE) {

        if (!topic.fromBeginning) {
            topic.fromBeginning = false;
        } else {
            try {
                topic.fromBeginning = Boolean(topic.fromBeginning);
            } catch (error) {
                throw new Error('Invalid Topic configuration. Please check your config file and try again');
            }
        }

        if (!topic.name) {
            throw new Error('Invalid Topic configuration. Please check your config file and try again');
        }
    
        await _consumer.subscribe({
            topic: topic.name,
            fromBeginning: topic.fromBeginning
        });

        logger.info({
            description: `Kafka topic : ${topic.name} : subscribed`
        });
    }

    await _consumer.run({
        eachMessage: async ({ topic, message }) => {
            try {
                const parsedMessage = JSON.parse(message.value.toString());
                const eventName = `${topic}`;
                EventLib.emit(eventName, parsedMessage); //Emitting a global event

            } catch (error) {
                logger.error({
                    description: 'Failed to parse incoming message from KAFKA broker :',
                    topic,
                    error,
                    message
                });
            }
        },
    });

}

function mapMessages(messages) {
    return messages.map(message => {
        if (!message.type || !message.data) {
            throw new Error('Kafka message must contain both type and data');
        }

        if (typeof (message.type) !== 'string') {
            throw new Error('Message type must be a string');
        }

        return {
            value: JSON.stringify(message),
            headers: {
                origin: config.kafka.origin
            }
        };
    });
}

async function _sendMessage(topicName, message) {
    const messages = [message];
    const messagesToSend = mapMessages(messages);

    await _producer.send({
        topic: topicName,
        messages: messagesToSend
    });
}

module.exports._initializeProducer = _initializeProducer;
module.exports._initializeConsumer = _initializeConsumer;
module.exports._sendMessage = _sendMessage;
module.exports._getKafkaInstance = _getKafkaInstance;
