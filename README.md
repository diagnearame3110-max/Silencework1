# Silence Work Sénégal – Boutique en ligne & Espace Administration

Site e-commerce élégant et minimaliste pour la marque streetwear **Silence Work Sénégal** (Dakar).

---

## ⚡ Démarrage rapide (Local avec espace Admin)

Lancez simplement le serveur Node.js inclus :

```bash
npm start
# ou
node server.js
```

Puis ouvrez dans votre navigateur :
- 🛍️ **Boutique client** : [http://localhost:3000/](http://localhost:3000/)
- ⚙️ **Espace Administration** : [http://localhost:3000/admin.html](http://localhost:3000/admin.html)  
  *(Code PIN d'accès par défaut : **`1234`**)*

---

## 🛠️ Espace Administration (`admin.html`)

L'espace admin vous permet de gérer toutes les photos sans toucher au code :

1. **Ajouter des photos par produit et par couleur** :
   - Sélectionnez un vêtement et sa couleur (ex: *T-shirt Silence Work* en *Noir*).
   - Glissez-déposez vos photos ou sélectionnez-les depuis votre ordinateur.
   - Les photos sont automatiquement sauvegardées dans `assets/produits/` et ajoutées au catalogue.
   - Vous pouvez également coller directement l'URL d'une image web.

2. **Retirer des photos** :
   - Cliquez sur l'icône rouge **Retirer** sur n'importe quelle photo pour la supprimer instantanément du produit.
   - Si aucune photo n'est présente, le site affiche automatiquement les superbes croquis vectoriels de la marque.

3. **Changer l'ordre des photos** :
   - Utilisez les flèches `◀` et `▶` pour déplacer une photo.
   - La première photo devient automatiquement la photo de couverture affichée sur la boutique.

4. **Gérer le Lookbook et le Hero** :
   - Onglet **Lookbook** : changez ou retirez les 3 photos de la section Lookbook.
   - Onglet **Bannière Accueil (Hero)** : définissez ou retirez l'image de fond du haut de page.

5. **Sauvegarde et Export GitHub** :
   - Le bouton **« Enregistrer les modifications »** met à jour `js/data.js` directement sur votre disque dur.
   - Le bouton **« Exporter data.js »** vous permet de télécharger le fichier prêt à être commit/push sur GitHub pour GitHub Pages.

---

## 📁 Structure des fichiers

- `index.html` : Boutique client (accueil, catalogue, filtres, fiche produit, panier, commande WhatsApp).
- `admin.html` : Tableau de bord d'administration pour ajouter et retirer des images.
- `server.js` : Serveur local léger Node.js (zéro dépendance externe) pour servir le site et gérer les uploads d'images.
- `css/style.css` : Design responsive de la boutique client.
- `css/admin.css` : Design de l'interface d'administration.
- `js/data.js` : Base de données du site (produits, couleurs, photos, prix, lookbook, WhatsApp).
- `js/app.js` : Logique client (filtres, galerie, zoom lightbox, sélection de taille, panier).
- `js/admin.js` : Logique de l'espace administration (upload, suppression, tri, export).
- `assets/produits/` : Dossier où sont enregistrées toutes vos photos de vêtements.

---

## 🚀 Mettre en ligne sur GitHub Pages

1. Enregistrez vos modifications dans l'admin (les photos sont dans `assets/produits/` et `js/data.js` est à jour).
2. Dans votre terminal Git :
   ```bash
   git add .
   git commit -m "Mise à jour des photos du catalogue"
   git push origin main
   ```
3. GitHub Pages se met à jour automatiquement en 1 à 2 minutes !
