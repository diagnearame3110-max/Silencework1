const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const ASSETS_PRODUITS = path.join(ROOT, 'assets', 'produits');
const DATA_FILE = path.join(ROOT, 'js', 'data.js');

// Ensure assets/produits directory exists
if (!fs.existsSync(ASSETS_PRODUITS)) {
  fs.mkdirSync(ASSETS_PRODUITS, { recursive: true });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit for image uploads
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURI(parsedUrl.pathname);

  // --- API ROUTES ---
  // Route Open Graph pour le partage de produit WhatsApp: /p/:id?c=:colorIndex
  if (pathname.startsWith('/p/') || pathname === '/p') {
    const match = pathname.match(/^\/p\/([^/?#]+)/);
    const id = match ? match[1] : parsedUrl.searchParams.get('id');
    const c = parsedUrl.searchParams.get('c') || '0';
    req.query = { id, c };
    const pHandler = require('./api/p.js');
    return pHandler(req, res);
  }

  if (pathname === '/api/status' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, server: true, port: PORT });
  }

  // Upload an image
  if (pathname === '/api/upload-image' && req.method === 'POST') {
    try {
      const { filename, data } = await parseJsonBody(req);
      if (!filename || !data) {
        return sendJson(res, 400, { error: 'Nom de fichier ou données manquantes' });
      }

      // data can be "data:image/png;base64,...." or raw base64
      const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const base64Data = matches ? matches[2] : data;
      const buffer = Buffer.from(base64Data, 'base64');

      // Sanitize filename
      const ext = path.extname(filename).toLowerCase() || '.jpg';
      const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      const uniqueName = `${base}-${Date.now()}${ext}`;
      const targetPath = path.join(ASSETS_PRODUITS, uniqueName);

      fs.writeFileSync(targetPath, buffer);

      const relativePath = `assets/produits/${uniqueName}`;
      return sendJson(res, 200, { ok: true, path: relativePath, filename: uniqueName });
    } catch (err) {
      console.error('Erreur upload:', err);
      return sendJson(res, 500, { error: err.message || 'Erreur lors de l\'enregistrement' });
    }
  }

  // Delete an image
  if (pathname === '/api/delete-image' && req.method === 'POST') {
    try {
      const { path: relPath } = await parseJsonBody(req);
      if (!relPath) {
        return sendJson(res, 400, { error: 'Chemin requis' });
      }

      // Check if it is a local asset in assets/produits
      if (relPath.startsWith('assets/produits/') || relPath.startsWith('/assets/produits/')) {
        const cleanName = path.basename(relPath);
        const fullPath = path.join(ASSETS_PRODUITS, cleanName);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      return sendJson(res, 200, { ok: true });
    } catch (err) {
      console.error('Erreur suppression:', err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // Orders API
  const COMMANDES_FILE = path.join(ROOT, 'data', 'commandes.json');
  if (pathname === '/api/commandes' && req.method === 'GET') {
    try {
      if (fs.existsSync(COMMANDES_FILE)) {
        const raw = fs.readFileSync(COMMANDES_FILE, 'utf8');
        return sendJson(res, 200, JSON.parse(raw || '[]'));
      }
      return sendJson(res, 200, []);
    } catch (e) {
      return sendJson(res, 200, []);
    }
  }

  if (pathname === '/api/commandes' && req.method === 'POST') {
    try {
      const list = await parseJsonBody(req);
      const dataDir = path.join(ROOT, 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(COMMANDES_FILE, JSON.stringify(list, null, 2), 'utf8');
      return sendJson(res, 200, { ok: true });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // Save updated data.js
  if (pathname === '/api/save-data' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const { produits, lookbook, heroImg, heroCols, whatsapp, devise, tailles, bandeau } = payload;

      if (!Array.isArray(produits)) {
        return sendJson(res, 400, { error: 'Liste de produits invalide' });
      }

      // Read existing data.js to preserve constants if not passed
      let fileContent = fs.readFileSync(DATA_FILE, 'utf8');

      // Extract existing constants or use defaults
      const waMatch = fileContent.match(/const WHATSAPP = "([^"]+)";/);
      const devMatch = fileContent.match(/const DEVISE = "([^"]+)";/);
      const heroMatch = fileContent.match(/const HERO_IMG = "([^"]*)";/);
      const colsMatch = fileContent.match(/const HERO_COLS = (\[[\s\S]*?\]);/);
      const bandeauMatch = fileContent.match(/const BANDEAU = "([^"]+)";/);

      const finalWa = whatsapp !== undefined ? whatsapp : (waMatch ? waMatch[1] : '221776336310');
      const finalDevise = devise !== undefined ? devise : (devMatch ? devMatch[1] : 'FCFA');
      const finalHero = heroImg !== undefined ? heroImg : (heroMatch ? heroMatch[1] : '');
      const finalBandeau = bandeau !== undefined ? bandeau : (bandeauMatch ? bandeauMatch[1] : 'Livraison à Dakar · Paiement Wave, Orange Money ou à la livraison');
      const finalCols = heroCols || (colsMatch ? JSON.parse(colsMatch[1]) : [
        "assets/produits/silence-work-hero-1.jpg",
        "assets/produits/silence-work-hero-3.jpg",
        "assets/produits/silence-work-hero-2.jpg"
      ]);
      const finalLookbook = lookbook || [{ titre: 'Les hoodies', img: '' }, { titre: 'Les t-shirts graffiti', img: '' }, { titre: 'Le jogging noir', img: '' }];
      const finalTailles = tailles || ['S', 'M', 'L', 'XL', 'XXL'];

      // Format clean data.js
      const newContent = `/* ====== À PERSONNALISER ====== */
const WHATSAPP = ${JSON.stringify(finalWa)};            // numéro de la marque, format international sans +
const DEVISE = ${JSON.stringify(finalDevise)};
const BANDEAU = ${JSON.stringify(finalBandeau)};
const HERO_IMG = ${JSON.stringify(finalHero)};                         // ex. "assets/produits/hero.jpg"
const HERO_COLS = ${JSON.stringify(finalCols, null, 2)};
const LOOKBOOK = ${JSON.stringify(finalLookbook, null, 1).replace(/\\n\\s+/g, ' ')};
const TAILLES = ${JSON.stringify(finalTailles)};
/* Chaque produit a des couleurs. Pour chaque couleur, "img" = liste de tes photos
   (face, dos, détail, porté, autre fond…), ex. img:["assets/produits/noir-1.jpg"].
   Vide = vues dessinées automatiquement (face, dos, détail, ambiance).
   ancien = prix initial barré (promo) · epuise:1 = SOLD OUT */
const PRODUITS = ${JSON.stringify(produits, null, 2)};
/* ============================= */
`;

      fs.writeFileSync(DATA_FILE, newContent, 'utf8');
      return sendJson(res, 200, { ok: true, message: 'data.js mis à jour avec succès' });
    } catch (err) {
      console.error('Erreur sauvegarde data.js:', err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // --- STATIC FILE SERVING ---
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);

  // Security check to prevent directory traversal
  if (!filePath.startsWith(path.resolve(ROOT))) {
    res.statusCode = 403;
    res.end('Accès interdit');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Page ou fichier introuvable');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`  Silence Work - Serveur actif`);
  console.log(`  Site client : http://localhost:${PORT}/`);
  console.log(`  Espace Admin: http://localhost:${PORT}/admin.html`);
  console.log(`===============================================`);
});
