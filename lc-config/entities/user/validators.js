/* eslint-disable no-unused-vars */
function emailValidator(v) {
    if (!v) {
        return true;
    }
    // eslint-disable-next-line no-useless-escape
    return /^([\w-\.\+W]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
}
