// functions/[[path]].js
// Serverless handler suitable for Vercel/Netlify-like runtimes.
// Handles GET and POST, returns JSON with path and timestamp.

module.exports = async function handler(req, res) {
  const method = req.method || 'GET';
  const pathParam = (req.query && req.query.path) || (req.params && req.params.path) || '';

  if (method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      method: 'GET',
      path: pathParam,
      message: 'GET request received',
      time: new Date().toISOString()
    }));
    return;
  }

  if (method === 'POST') {
    // If runtime streams raw body
    if (req.on) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body || '{}'); } catch (e) { parsed = { raw: body }; }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          method: 'POST',
          path: pathParam,
          received: parsed,
          message: 'POST request received',
          time: new Date().toISOString()
        }));
      });
      return;
    }

    // If runtime already parsed body (e.g., req.body)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      method: 'POST',
      path: pathParam,
      received: req.body || null,
      message: 'POST request received (parsed)',
      time: new Date().toISOString()
    }));
    return;
  }

  // Other methods
  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: `Method ${method} not allowed` }));
};
