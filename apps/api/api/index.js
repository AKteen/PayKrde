'use strict';

module.exports = async function handler(req, res) {
  try {
    const loaded = require('./_app.cjs');
    const app = typeof loaded === 'function' ? loaded : loaded.default;
    if (typeof app !== 'function') {
      throw new Error('API bundle has no handler');
    }
    return await app(req, res);
  } catch (err) {
    if (res.headersSent) return;
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    const message = err && err.message ? err.message : 'API failed to start';
    res.end(JSON.stringify({ error: message }));
  }
};
