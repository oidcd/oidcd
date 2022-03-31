// https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes

function getResponseMode(responseType) {
    return typeof responseType === 'string' && responseType.includes('token') ? 'fragment' : 'query';
} 

module.exports = {
    getResponseMode
}