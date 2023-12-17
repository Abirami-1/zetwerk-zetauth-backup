const { matchPattern } = require('url-matcher');

const hasMatchingPatternFound = (urls, requestPath) => {
    let matchFound = false;
    urls.forEach(path => {
        if (matchPattern(path, requestPath)) {
            matchFound = true;
        }
    });
    return matchFound;
};

const checkUrlPattern = (urls, requestPath) => {
    if (
        urls.includes(requestPath) ||
    hasMatchingPatternFound(urls, requestPath)
    ) {
        return true;
    } else {
        return false;
    }
};

module.exports = { checkUrlPattern };
