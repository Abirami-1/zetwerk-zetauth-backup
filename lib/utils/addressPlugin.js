
const ZetAddressPlugin = require('@zetwerk/zet-mongoose-utility/plugins/addressPlugin');
module.exports = (mongoose, options) => {
    return new ZetAddressPlugin(mongoose, options);
};