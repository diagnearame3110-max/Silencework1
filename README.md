# Silence Work Sénégal – boutique en ligne

Site statique (HTML, CSS, JavaScript). Aucune installation nécessaire.

## Structure
- `index.html` : la page (accueil et page produit)
- `css/style.css` : tout le style
- `js/data.js` : **à modifier en premier** : numéro WhatsApp, devise, produits, couleurs, prix, photos
- `js/app.js` : le fonctionnement (galerie, panier, commande WhatsApp)
- `assets/` : logos (noir et blanc) et favicon
- `assets/produits/` : mets ici les photos des produits

## Lancer en local
Ouvre `index.html` dans le navigateur, ou lance un petit serveur : `python3 -m http.server 8000` puis http://localhost:8000

## Ajouter tes photos
Dans `js/data.js`, pour chaque couleur d'un produit :
`img:["assets/produits/tshirt-noir-1.jpg","assets/produits/tshirt-noir-2.jpg"]`
Si `img` est vide, des vues dessinées automatiquement sont utilisées.

## Mettre en ligne
Dépose tout le dossier sur Netlify, Vercel ou GitHub Pages.
