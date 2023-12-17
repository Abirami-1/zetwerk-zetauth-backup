const express = require('express');
const router = express.Router();
const AppController = require('../../../controllers/application');

router.get('/apps/:appId', AppController._getAppById);

router.post('/apps', AppController._createApp);

router.get('/apps', AppController._getAllApps);

router.put('/apps/:appId', AppController._updateAppById);

router.delete('/apps/:appId', AppController._deleteAppById);

module.exports = router;