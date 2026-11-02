/* ====== À PERSONNALISER ====== */
const WHATSAPP = "221770000000";            // numéro de la marque, format international sans +
const DEVISE = "FCFA";
const HERO_IMG = "";                         // ex. "img/hero.jpg"
const LOOKBOOK = [{titre:"Les hoodies",img:""},{titre:"Les t-shirts graffiti",img:""},{titre:"Le jogging noir",img:""}];
const TAILLES = ["S","M","L","XL","XXL"];
/* Chaque produit a des couleurs. Pour chaque couleur, "img" = liste de tes photos
   (face, dos, détail, porté, autre fond…), ex. img:["img/noir-1.jpg","img/noir-2.jpg"].
   Vide = vues dessinées automatiquement (face, dos, détail, ambiance).
   ancien = prix initial barré (promo) · epuise:1 = SOLD OUT */
const PRODUITS = [
 {id:1,nom:"T-shirt Silence Work",cat:"T-shirts",ancien:12000,prix:9000,
  desc:"Le t-shirt signature Silence Work : un graphisme fort sur la poitrine, une coupe confortable pour tous les jours.",
  details:["Logo Silence Work imprimé","Coupe confortable, unisexe","Disponible du S au XXL","Création Silence Work, Dakar"],
  couleurs:[{nom:"Noir",hex:"#111",encre:"#fff",img:[]},{nom:"Bordeaux",hex:"#6E1730",encre:"#fff",img:[]},{nom:"Kaki",hex:"#5b6038",encre:"#fff",img:[]},{nom:"Rose",hex:"#e9b6c4",encre:"#111",img:[]},{nom:"Marron",hex:"#6b4a3a",encre:"#fff",img:[],epuise:1}]},
 {id:2,nom:"T-shirt Graffiti",cat:"T-shirts",prix:12000,
  desc:"Le logo graffiti bleu et rouge en grand, sur un t-shirt blanc facile à porter.",
  details:["Logo graffiti bleu et rouge","Coupe confortable, unisexe","Disponible du S au XXL","Création Silence Work, Dakar"],
  couleurs:[{nom:"Blanc",hex:"#fff",encre:"#2B4BFF",img:[]}]},
 {id:3,nom:"Hoodie Logo Bleu & Rouge",cat:"Hoodies",prix:25000,hood:1,
  desc:"Le hoodie blanc au logo Silence Work bleu et rouge. Confortable, pensé pour être vu.",
  details:["Logo bleu et rouge brodé ou imprimé","Capuche","Disponible du S au XXL","Création Silence Work, Dakar"],
  couleurs:[{nom:"Blanc",hex:"#fff",encre:"#2B4BFF",img:[]}]},
 {id:4,nom:"Hoodie Silence Work",cat:"Hoodies",prix:25000,hood:1,
  desc:"Le hoodie crème Silence Work, un basique chaud et confortable.",
  details:["Logo Silence Work","Capuche","Disponible du S au XXL","Création Silence Work, Dakar"],
  couleurs:[{nom:"Crème",hex:"#e8dfcf",encre:"#E5322B",img:[]}]},
 {id:5,nom:"Jogging Silence Work",cat:"Joggings",prix:18000,pant:1,
  desc:"Le jogging noir Silence Work, avec le symbole de la marque sur la cuisse. À assortir avec le hoodie ou le t-shirt.",
  details:["Symbole Silence Work","Coupe confortable","Disponible du S au XXL","Création Silence Work, Dakar"],
  couleurs:[{nom:"Noir",hex:"#111",encre:"#fff",img:[]}]},
 {id:6,nom:"Bonnet Silence Work",cat:"Bonnets",prix:8000,bonnet:1,tailles:["Unique"],
  desc:"Le bonnet Silence Work, pour compléter ton look avec le nom de la marque.",
  details:["Logo Silence Work","Taille unique","Création Silence Work, Dakar"],
  couleurs:[{nom:"Noir",hex:"#111",encre:"#fff",img:[]},{nom:"Gris",hex:"#9a9a9a",encre:"#111",img:[]}]}
];
/* ============================= */
