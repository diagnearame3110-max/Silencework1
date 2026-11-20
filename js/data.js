/* ====== À PERSONNALISER ====== */
const WHATSAPP = "+221776336310";            // numéro de la marque (+221 77 633 63 10)
const DEVISE = "FCFA";
const BANDEAU = "Livraison à Dakar · Paiement Wave, Orange Money ou à la livraison";
const HERO_IMG = "assets/produits/silence-work-hero-3.jpg";                         // ex. "assets/produits/hero.jpg"
const HERO_COLS = [
  "assets/produits/silence-work-hero-1.jpg",
  "assets/produits/silence-work-hero-3.jpg",
  "assets/produits/silence-work-hero-2.jpg"
];
const LOOKBOOK = [
 {
  "titre": "Les hoodies",
  "img": "assets/produits/lookbook-hoodie.jpg"
 },
 {
  "titre": "Les t-shirts graffiti",
  "img": "assets/produits/lookbook-tshirt.jpg"
 },
 {
  "titre": "Le jogging noir",
  "img": "assets/produits/lookbook-jogging.jpg"
 }
];
const TAILLES = ["S","M","L","XL","XXL"];
/* Chaque produit a des couleurs. Pour chaque couleur, "img" = liste de tes photos
   (face, dos, détail, porté, autre fond…), ex. img:["assets/produits/noir-1.jpg"].
   Vide = vues dessinées automatiquement (face, dos, détail, ambiance).
   ancien = prix initial barré (promo) · epuise:1 = SOLD OUT */
const PRODUITS = [
  {
    "id": 1794879053962,
    "nom": "T-shirt simple",
    "cat": "T-shirts",
    "prix": 7000,
    "ancien": null,
    "desc": "Fais parti de la premiére collection",
    "details": [
      "Logo Silence Work sérigraphié ou brodé",
      "Coupe confortable, unisexe",
      "Création originale, Dakar"
    ],
    "visible": true,
    "tailles": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "couleurs": [
      {
        "nom": "Noir",
        "hex": "#111111",
        "encre": "#ffffff",
        "img": [
          "assets/produits/9493bf02-1275-41ec-af87-6f9be1c697c0-1794879066657.webp"
        ],
        "stock": {
          "S": 5,
          "M": 5,
          "L": 5,
          "XL": 5,
          "XXL": 5
        },
        "epuise": 0,
        "og_img": "assets/produits/og-share-1794879066960-1794879066964.jpg"
      }
    ]
  },
  {
    "id": 1794878899128,
    "nom": "Pull",
    "cat": "Hoodies",
    "prix": 15000,
    "ancien": 18000,
    "desc": "Concu pour l'hiver",
    "details": [
      "Logo Silence Work sérigraphié ou brodé",
      "Coupe confortable, unisexe",
      "Création originale, Dakar"
    ],
    "visible": true,
    "tailles": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "couleurs": [
      {
        "nom": "Blanc",
        "hex": "#ffffff",
        "encre": "#ffffff",
        "img": [
          "assets/produits/0143f49a-36d7-4564-a005-e080c32871e6-1794878908396.webp"
        ],
        "stock": {
          "S": 5,
          "M": 5,
          "L": 5,
          "XL": 5,
          "XXL": 5
        },
        "epuise": 0,
        "og_img": "assets/produits/og-share-1794878908590-1794878908594.jpg"
      }
    ]
  },
  {
    "id": 1794878040638,
    "nom": "t-shirt été",
    "cat": "T-shirts",
    "prix": 7000,
    "ancien": null,
    "desc": "T-shirt de qualité premium",
    "details": [
      "Logo Silence Work sérigraphié ou brodé",
      "Coupe confortable, unisexe"
    ],
    "visible": true,
    "tailles": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "couleurs": [
      {
        "nom": "blanc",
        "hex": "#ffffff",
        "encre": "#ffffff",
        "img": [
          "assets/produits/705b633a-9db2-4ea0-92ce-e09c3e72b10c-1794878056556.webp",
          "assets/produits/b953ec28-118a-4915-b9a9-c91598af1a23-1794878166067.webp"
        ],
        "stock": {
          "S": 5,
          "M": 5,
          "L": 5,
          "XL": 5,
          "XXL": 5
        },
        "epuise": 0,
        "og_img": "assets/produits/og-share-1794878056855-1794878056859.jpg"
      }
    ]
  },
  {
    "id": 1794532542301,
    "nom": "Bonnet",
    "cat": "Bonnets",
    "prix": 7000,
    "ancien": 9000,
    "desc": "",
    "details": [
      "Logo Silence Work sérigraphié ou brodé",
      "Coupe confortable, unisexe",
      "Création originale, Dakar"
    ],
    "visible": true,
    "tailles": [
      "Unique"
    ],
    "couleurs": [
      {
        "nom": "Noir",
        "hex": "#111111",
        "encre": "#ffffff",
        "img": [
          "assets/produits/48ece4ad-6cef-4b87-9ab4-d4b3d67144ac-1794533720490.webp"
        ],
        "og_img": "assets/produits/og-share-1794878722229-1794878722230.jpg",
        "stock": {
          "S": 5,
          "M": 5,
          "L": 5,
          "XL": 5,
          "XXL": 5,
          "Unique": 5
        },
        "epuise": 0
      },
      {
        "nom": "Blanc",
        "hex": "#ffffff",
        "encre": "#ffffff",
        "img": [
          "assets/produits/192e0458-0f8f-4c49-84d1-0d3d01f6d12b-1794533727142.webp"
        ],
        "stock": {
          "S": 5,
          "M": 5,
          "L": 5,
          "XL": 5,
          "XXL": 5,
          "Unique": 5
        },
        "epuise": 0
      },
      {
        "nom": "Vert",
        "hex": "#3f5c3d",
        "encre": "#ffffff",
        "img": [
          "assets/produits/fcc1ec2d-d689-463d-bd64-1d2f53b936d1-1794533302394.webp"
        ],
        "stock": {
          "S": 5,
          "M": 5,
          "L": 5,
          "XL": 5,
          "XXL": 5,
          "Unique": 5
        },
        "epuise": 0
      }
    ]
  },
  {
    "id": 1794531820903,
    "nom": "PILL NOIRR",
    "cat": "Hoodies",
    "prix": 9000,
    "ancien": null,
    "desc": "",
    "details": [
      "Logo Silence Work sérigraphié ou brodé",
      "Coupe confortable, unisexe",
      "Création originale, Dakar"
    ],
    "visible": true,
    "tailles": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "couleurs": [
      {
        "nom": "Noir",
        "hex": "#111111",
        "encre": "#ffffff",
        "img": [
          "assets/produits/6b064c0a-5282-43b7-a681-fb90cc509c64-1794532195980.webp"
        ],
        "og_img": "assets/produits/og-share-1794878744509-1794878744511.jpg",
        "stock": {
          "S": 5,
          "M": 5,
          "L": 5,
          "XL": 5,
          "XXL": 5
        },
        "epuise": 0
      }
    ]
  },
  {
    "id": 1794531592969,
    "nom": "XXXXXX",
    "cat": "Hoodies",
    "prix": 9000,
    "ancien": null,
    "desc": "",
    "details": [
      "Logo Silence Work sérigraphié ou brodé",
      "Coupe confortable, unisexe",
      "Création originale, Dakar"
    ],
    "visible": true,
    "tailles": [
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ],
    "couleurs": [
      {
        "nom": "Noir",
        "hex": "#111111",
        "encre": "#ffffff",
        "img": [
          "assets/produits/099e835d-1eac-4b2f-8f6a-cc4867dd9fa4-1794531652834.webp"
        ],
        "og_img": "assets/produits/og-share-1794878653579-1794878653582.jpg",
        "stock": {
          "S": 5,
          "M": 5,
          "L": 5,
          "XL": 5,
          "XXL": 5
        },
        "epuise": 0
      }
    ]
  }
];
/* ============================= */
