const config = require('config');
const zetAuthMiddleWare = require('@zetwerk/zet-auth-middleware');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

function SMESInfo() {}

SMESInfo.prototype.getHeader = function() {
    const user = {
        _id: new mongoose.Types.ObjectId(),
        email: config.get('smes.jwtEmail'),
        deleted: false,
        isActive: true
    };

    return zetAuthMiddleWare.interceptHeader(user);
};

SMESInfo.prototype.getUrl = function() {
    return config.get('smes.ipcUrl');
};

function INZEInfo() {
    const { isInternalIPCActive, inzeIPCUrl, inzeUrl } = config['inze-api'];
    const jwtInze = config['jwt'];
    const user = {
        _id: new mongoose.Types.ObjectId(),
        email: config.get('inze-api.jwtEmail'),
        deleted: false,
        isActive: true
    };
    const inzeToken = jwt.sign(user, jwtInze.secret, {
        expiresIn: jwtInze.expiresIn
    });
    this.inzeUser = user;
    this.inzeToken = inzeToken;
    this.inzeIPCUrl = inzeIPCUrl;
    this.inzeUrl = inzeUrl;
    this.isInternalIPCActive = isInternalIPCActive;
}
INZEInfo.prototype.getHeader = function() {
    if (this.isInternalIPCActive) {
        return zetAuthMiddleWare.interceptHeader(this.inzeUser);
    }
    return { authorizationtoken: this.inzeToken };
};
INZEInfo.prototype.getUrl = function() {
    return this.isInternalIPCActive ? this.inzeIPCUrl : this.inzeUrl;
};


module.exports = {
    SMESInfo,
    INZEInfo
};
