const defErr = require('def-err');
const BusinessError = defErr('BusinessError', '发生业务错误了', ['code', 'message']);
module.exports = BusinessError;
