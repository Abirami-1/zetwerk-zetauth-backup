const express = require('express');
const router = express.Router();
 
const RefreshTokenController = require('../../../controllers/refresh-token');
 
router.delete('/refresh-token/token/:token', RefreshTokenController._deleteRefreshTokenByToken);
router.delete('/refresh-token/user/:userId', RefreshTokenController._deleteRefreshTokensByUserId);

 
module.exports = router;