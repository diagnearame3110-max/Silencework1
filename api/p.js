/**
 * Silence Work Sénégal – Fonction Serverless de Partage Produit (Open Graph)
 * Accessible via https://MON-DOMAINE/p/:id?c=:colorIndex
 * Génère le HTML avec les balises Open Graph lues par WhatsApp, Facebook, iMessage, etc.
 * Redirige instantanément les visiteurs humains vers /#/produit/:id/:colorIndex.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Clés publiques uniquement (aucune clé secrète)
const DEFAULT_SUPABASE_URL = 'https://atduzssibornspqxavur.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_BHt-ONCkNnvZx1Z9bBN3tg_yuGsmIS9';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fetchSupabaseProduct(id, supabaseUrl, anonKey) {
  return new Promise((resolve) => {
    try {
      const url = new URL(`/rest/v1/produits?id=eq.${encodeURIComponent(id)}&select=*`, supabaseUrl);
      const req = https.request(url, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Accept': 'application/json'
        },
        timeout: 2500
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const list = JSON.parse(data);
            if (Array.isArray(list) && list.length > 0) return resolve(list[0]);
          } catch (e) {}
          resolve(null);
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.end();
    } catch (e) {
      resolve(null);
    }
  });
}

function getLocalFallbackProduct(id) {
  try {
    const dataFilePath = path.join(__dirname, '..', 'js', 'data.js');
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      const match = content.match(/const PRODUITS = (\[[\s\S]*?\]);/);
      if (match) {
        const list = JSON.parse(match[1]);
        const p = list.find(x => String(x.id) === String(id));
        if (p) return p;
      }
    }
  } catch (e) {}
  return null;
}

module.exports = async function handler(req, res) {
  const query = req.query || {};
  const id = query.id;
  const colorIndex = parseInt(query.c || '0', 10) || 0;

  // Déterminer l'hôte et protocole pour construire les URLs absolues nécessaires pour WhatsApp
  const forwardedProto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const siteUrl = `${forwardedProto}://${host}`;

  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

  let produit = null;
  if (id) {
    produit = await fetchSupabaseProduct(id, supabaseUrl, anonKey);
    if (!produit) produit = getLocalFallbackProduct(id);
  }

  // Cache court de 5 minutes sur CDN Vercel + revalidation en arrière-plan
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

  // Si le produit n'existe pas, redirection vers l'accueil avec Open Graph par défaut
  if (!produit) {
    const defaultTitle = 'Silence Work Sénégal – Streetwear à Dakar';
    const defaultDesc = 'T-shirts, hoodies et joggings Silence Work. Créations streetwear uniques et confortables créées à Dakar.';
    const defaultImg = `${siteUrl}/assets/og-default.jpg`;
    const homeUrl = `${siteUrl}/`;

    return res.end(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(defaultTitle)}</title>
  <meta name="description" content="${escapeHtml(defaultDesc)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Silence Work Sénégal">
  <meta property="og:title" content="${escapeHtml(defaultTitle)}">
  <meta property="og:description" content="${escapeHtml(defaultDesc)}">
  <meta property="og:image" content="${escapeHtml(defaultImg)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(homeUrl)}">
  <script>window.location.replace(${JSON.stringify(homeUrl)});</script>
</head>
<body>
  <p>Redirection vers <a href="${escapeHtml(homeUrl)}">Silence Work Sénégal</a>...</p>
</body>
</html>`);
  }

  // Extraire couleur demandée
  const couleurs = Array.isArray(produit.couleurs) ? produit.couleurs : [];
  const safeColorIdx = Math.min(colorIndex, Math.max(0, couleurs.length - 1));
  const couleur = couleurs[safeColorIdx] || { nom: '', img: [] };

  const prixFormatted = `${Number(produit.prix || 0).toLocaleString('fr-FR').replace(/\u202f/g, ' ')} FCFA`;
  const nomCouleur = couleur.nom ? ` – ${couleur.nom}` : '';
  const ogTitle = `${produit.nom}${nomCouleur} – ${prixFormatted} | Silence Work`;
  const ogDesc = produit.desc ? produit.desc.substring(0, 160) : 'Création streetwear Silence Work Sénégal, Dakar.';

  // Image Open Graph : WhatsApp préfère les images JPEG/PNG
  let rawImg = null;
  if (couleur.og_img) {
    rawImg = couleur.og_img;
  } else if (Array.isArray(couleur.img) && couleur.img.length > 0 && couleur.img[0]) {
    rawImg = couleur.img[0];
  }

  let ogImageUrl = `${siteUrl}/assets/og-default.jpg`;
  let imageType = 'image/jpeg';

  if (rawImg) {
    let resolvedUrl = rawImg;
    if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) {
      const cleanPath = resolvedUrl.replace(/^\/+/, '');
      resolvedUrl = `${siteUrl}/${cleanPath}`;
    }

    // WhatsApp rejette les images WebP pour les aperçus Open Graph : il exige JPEG ou PNG
    if (resolvedUrl.toLowerCase().endsWith('.webp')) {
      ogImageUrl = `${siteUrl}/assets/og-default.jpg`;
      imageType = 'image/jpeg';
    } else {
      ogImageUrl = resolvedUrl;
      imageType = resolvedUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    }
  }

  const targetUrl = `${siteUrl}/#/produit/${produit.id}/${safeColorIdx}`;
  const canonicalUrl = `${siteUrl}/p/${produit.id}?c=${safeColorIdx}`;

  const html = `<!DOCTYPE html>
<html lang="fr" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(ogTitle)}</title>
  <meta name="description" content="${escapeHtml(ogDesc)}">

  <!-- Balises Open Graph lues par WhatsApp, Facebook, iMessage, LinkedIn -->
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Silence Work Sénégal">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDesc)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${escapeHtml(ogImageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}">
  <meta property="og:image:type" content="${imageType}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(ogTitle)}">
  <meta property="product:price:amount" content="${escapeHtml(produit.prix)}">
  <meta property="product:price:currency" content="XOF">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDesc)}">
  <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">

  <!-- Redirection instantanée pour visiteurs humains -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}">
  <script>
    // Redirection JavaScript sans laisser la page de redirection dans l'historique
    window.location.replace(${JSON.stringify(targetUrl)});
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 48px 20px; background: #fff; color: #111; }
    .loader { width: 32px; height: 32px; border: 3px solid #f3f3f3; border-top: 3px solid #111; border-radius: 50%; margin: 0 auto 20px; animation: spin 0.8s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    a { color: #111; font-weight: 600; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="loader"></div>
  <p>Redirection vers la boutique <strong>Silence Work</strong>...</p>
  <p style="margin-top:14px;font-size:13px"><a href="${escapeHtml(targetUrl)}">Cliquez ici si la redirection ne démarre pas automatiquement</a></p>
</body>
</html>`;

  return res.end(html);
};

