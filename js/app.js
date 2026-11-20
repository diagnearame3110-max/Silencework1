const LOGO="assets/logo-silence-work-noir.png";
document.body.insertAdjacentHTML("afterbegin",`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="swl" viewBox="0 0 480 480"><image href="${LOGO}" width="480" height="480"/></symbol><filter id="swinv"><feColorMatrix type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"/></filter></defs></svg>`);
document.querySelectorAll("img[data-logo]").forEach(i=>{i.src=LOGO});
const VUES=["face","dos","detail","ambiance"], LAB={face:"Face",dos:"Dos",detail:"Détail du logo",ambiance:"En ambiance"};
const $ = s => document.querySelector(s);
const fmt = n => n.toLocaleString("fr-FR").replace(/\u202f/g," ") + " " + DEVISE;
const prod = id => PRODUITS.find(x=>x.id===id);
const promo = p => p.ancien && p.ancien>p.prix;
const tousEp = p => p.couleurs.every(c=>c.epuise);
const imgs = c => c.img && c.img.length ? c.img : VUES;
const libelle = (it,i) => LAB[it] || "Photo "+(i+1);
try{
  const customData=JSON.parse(localStorage.getItem("sw-custom-data")||"null");
  if(customData){
    if(Array.isArray(customData.produits) && customData.produits.length){
      PRODUITS.splice(0, PRODUITS.length, ...customData.produits);
    }
    if(Array.isArray(customData.lookbook)){
      customData.lookbook.forEach((cl,i)=>{if(LOOKBOOK[i]&&cl.img)LOOKBOOK[i].img=cl.img});
    }
    if(customData.bandeau){
      const topEl=document.querySelector(".top");
      if(topEl) topEl.textContent=customData.bandeau;
    }
  }
}catch(e){}
let panier=[], filtre="Tous", favs=[];
try{panier=JSON.parse(localStorage.getItem("sw-panier2")||"[]").filter(l=>prod(l.id)&&prod(l.id).couleurs[l.c])}catch(e){}
try{favs=JSON.parse(localStorage.getItem("sw-fav")||"[]")}catch(e){}
const save=()=>{try{localStorage.setItem("sw-panier2",JSON.stringify(panier))}catch(e){}};
const total=()=>panier.reduce((s,l)=>s+prod(l.id).prix*l.q,0);
const cats=["Tous",...new Set(PRODUITS.map(p=>p.cat))];


const lum=h=>{h=h.replace("#","");if(h.length===3)h=[...h].map(x=>x+x).join("");const n=parseInt(h,16);return(.299*(n>>16)+.587*((n>>8)&255)+.114*(n&255))/255};
function svgVue(p,c,v){
  const dark=lum(c.hex)<.45;
  const body=p.bonnet?'<path d="M32 72Q32 22 60 22Q88 22 88 72Z"/><rect x="29" y="66" width="62" height="22" rx="4"/>':p.pant?'<path d="M35 8H85L93 104H66L60 42L54 104H27Z"/>':p.hood?'<path d="M32 26L6 78L24 85L36 58V104H84V58L96 85L114 78L88 26Q60 44 32 26Z"/><path d="M40 24Q60 4 80 24Q60 40 40 24Z"/>':'<path d="M32 18L8 40L24 56L36 48V100H84V48L96 56L112 40L88 18Q60 34 32 18Z"/>';
  const g=`<g fill="${c.hex}" stroke="#000" stroke-width="1.5" stroke-linejoin="round">${body}</g>`;
  const L=(x,y,z,inv)=>`<use href="#swl" x="${x}" y="${y}" width="${z}" height="${z}"${inv?' filter="url(#swinv)"':""}/>`;
  const front=g+(p.bonnet?L(50,67,20,dark):p.pant?L(38,14,18,dark):p.hood?L(42,44,36,dark):L(42,34,36,dark));
  const back=g+(p.bonnet||p.pant?"":L(52,p.hood?46:28,16,dark));
  const W=(vb,inner)=>`<svg viewBox="${vb}" role="img" aria-label="${p.nom} ${c.nom}">${inner}</svg>`;
  if(v==="dos")return W("-8 -2 136 118",back);
  if(v==="detail")return W(p.bonnet?"28 54 64 40":p.pant?"30 6 40 34":p.hood?"34 40 52 48":"34 30 52 48",front);
  if(v==="ambiance")return W("0 0 120 120",`<rect width="120" height="120" fill="${dark?"#e6e6e6":"#111"}"/><g opacity=".12">${L(2,2,116,!dark)}</g><g transform="translate(12 18) rotate(-6 60 56) scale(.8)">${front}</g>`);
  return W("-8 -2 136 118",front);
}
const vueHtml=(p,c,it,alt)=>`<div class="vw">${VUES.includes(it)?svgVue(p,c,it):`<img src="${it}" alt="${alt}" loading="lazy">`}</div>`;
const IC={fav:'<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z"/></svg>',bag:'<svg viewBox="0 0 24 24"><path d="M6 8h12l1 12H5L6 8zM9 8a3 3 0 0 1 6 0"/></svg>',eye:'<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'};
const prixHtml=p=>promo(p)?`<s>${fmt(p.ancien)}</s> <em>${fmt(p.prix)}</em>`:`<span class="n">${fmt(p.prix)}</span>`;
const badgeEp='<span class="badge"><i>!</i>SOLD OUT</span>';

function carte(p){
  const ci=Math.max(0,p.couleurs.findIndex(c=>!c.epuise)), c=p.couleurs[ci], href=`#/produit/${p.id}/${ci}`;
  return `<article class="card"><div class="pic"><a class="cover" href="${href}" aria-label="${p.nom}">${vueHtml(p,c,imgs(c)[0],p.nom)}</a>${tousEp(p)?badgeEp:""}<div class="acts"><button type="button" class="fav${favs.includes(p.id)?" on":""}" data-fav="${p.id}" aria-label="Ajouter aux favoris">${IC.fav}</button><a href="${href}" aria-label="Choisir la taille">${IC.bag}</a><a href="${href}" aria-label="Voir le produit">${IC.eye}</a></div></div><h3><a href="${href}">${p.nom}</a></h3><div class="px">${prixHtml(p)}</div>${p.couleurs.length>1?`<div class="dots">${p.couleurs.map(k=>`<i style="background:${k.hex}" title="${k.nom}"></i>`).join("")}</div>`:""}</article>`;
}
function renderFiltres(){
  $("#filters").innerHTML=cats.map(c=>`<button type="button" aria-pressed="${c===filtre}" data-c="${c}">${c}</button>`).join("");
}
function renderGrille(){
  const l=PRODUITS.filter(p=>filtre==="Tous"||p.cat===filtre);
  $("#grid").innerHTML=l.length?l.map(carte).join(""):'<p class="empty" style="grid-column:1/-1">Aucun produit pour ce filtre pour le moment.</p>';
}
function renderPanier(){
  $("#count").textContent=panier.reduce((s,l)=>s+l.q,0);
  const body=$("#cartBody");
  if(!panier.length){body.innerHTML='<p class="empty">Ton panier est vide. Choisis une pièce dans la collection.</p>';$("#cartFoot").hidden=true;return}
  body.innerHTML=panier.map((l,i)=>{const p=prod(l.id),c=p.couleurs[l.c];return `
  <div class="line"><div><strong>${p.nom}</strong><br><small>${c.nom} · Taille ${l.t} · ${fmt(p.prix)}</small>
    <div class="qty"><button type="button" data-m="${i}" aria-label="Moins">−</button><span>${l.q}</span><button type="button" data-p="${i}" aria-label="Plus">+</button><button class="rm" type="button" data-r="${i}">Retirer</button></div></div>
    <strong>${fmt(p.prix*l.q)}</strong></div>`}).join("");
  $("#total").textContent=fmt(total());$("#cartFoot").hidden=false;
}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("on"),1800)}
function ouvre(o){$("#cart").classList.toggle("on",o);$("#shade").classList.toggle("on",o);$("#cart").setAttribute("aria-hidden",!o);document.body.style.overflow=o?"hidden":"";if(o)$("#closeCart").focus()}

/* ---- page produit ---- */
let G={p:null,ci:0,i:0,sel:null,qte:1};
const curC=()=>G.p.couleurs[G.ci];
function renderPdp(p,ci){
  G={p,ci,i:0,sel:(p.tailles&&p.tailles.length===1?p.tailles[0]:null),qte:1};
  const sim=PRODUITS.filter(x=>x.id!==p.id&&x.cat===p.cat), liste=(sim.length>=2?sim:PRODUITS.filter(x=>x.id!==p.id)).slice(0,4);
  const off=promo(p)?Math.round(100-p.prix/p.ancien*100):0;
  const aide=encodeURIComponent(`Bonjour Silence Work, j’hésite sur la taille pour : ${p.nom}.`);
  $("#pdp").innerHTML=`<nav class="crumb" aria-label="Fil d’Ariane"><a href="#">Accueil</a> › <a href="#boutique" data-cat="${p.cat}">${p.cat}</a> › ${p.nom}</nav>
  <div class="prod">
   <div class="gal"><div class="thumbs" id="thumbs"></div>
    <div class="mainwrap"><button class="main" id="main" type="button" aria-label="Agrandir l’image"></button>
     <button class="nv p" type="button" data-nav="-1" aria-label="Image précédente">‹</button><button class="nv n" type="button" data-nav="1" aria-label="Image suivante">›</button>
     <span class="zm">Cliquer pour agrandir</span><span class="cnt" id="cnt"></span>
     <span class="badge" id="epb" hidden><i>!</i>SOLD OUT</span>${off?`<span class="promo">-${off}%</span>`:""}</div></div>
   <div class="pinfo">
    <div class="tags"><a href="#boutique" data-cat="${p.cat}">${p.cat}</a></div>
    <h1>${p.nom}</h1><div class="px">${prixHtml(p)}</div>
    <div class="lbl">Couleur : <b id="cn"></b></div>
    <div class="sw" role="radiogroup" aria-label="Couleur">${p.couleurs.map((k,i)=>`<button type="button" role="radio" class="cw${k.epuise?" ep":""}" data-ci="${i}" aria-label="${k.nom}${k.epuise?" (épuisé)":""}" title="${k.nom}"><i style="background:${k.hex}"></i></button>`).join("")}</div>
    <div class="lbl">Taille : <b id="tsel"></b> <a class="help" href="https://wa.me/${WHATSAPP}?text=${aide}" target="_blank" rel="noopener">Besoin d’aide pour la taille ?</a></div>
    <div class="circ" role="radiogroup" aria-label="Taille">${(p.tailles||TAILLES).map(t=>`<button type="button" role="radio" aria-checked="false" class="sz" data-t="${t}">${t}</button>`).join("")}<button type="button" class="clr" id="clr" hidden>Effacer</button></div>
    <div class="stock" id="stk"></div>
    <div class="buy"><div class="stepper"><button type="button" data-q="-1" aria-label="Moins">−</button><span id="qv" aria-live="polite">1</span><button type="button" data-q="1" aria-label="Plus">+</button></div><button class="btn" type="button" id="addp">Ajouter au panier</button></div>
    <button class="btn line wab" type="button" id="wap" style="width:100%">Commander sur WhatsApp</button>
    <p class="err" id="perr" role="alert"></p>
    <div class="ras"><span>✓ Livraison à Dakar</span><span>✓ Wave, Orange Money ou paiement à la livraison</span><span>✓ Commande confirmée sur WhatsApp</span></div>
    <div class="acc"><details open><summary>Description</summary><p>${p.desc}</p></details>
     <details><summary>Détails du produit</summary><ul>${p.details.map(d=>`<li>${d}</li>`).join("")}</ul></details>
     <details><summary>Livraison et paiement</summary><p>Livraison à Dakar et dans sa banlieue, frais et délai confirmés sur WhatsApp. Paiement par Wave, Orange Money ou à la livraison.</p></details></div>
   </div></div>
  <h2 class="simt">Vous aimerez aussi</h2><div class="grid">${liste.map(carte).join("")}</div>`;
  majGal();majCoul();majSel();
}
function majGal(){
  const p=G.p,c=curC(),l=imgs(c);
  $("#main").innerHTML=vueHtml(p,c,l[G.i],p.nom+" "+c.nom);
  $("#thumbs").innerHTML=l.map((it,i)=>`<button type="button" class="th${i===G.i?" on":""}" data-th="${i}" aria-label="${libelle(it,i)}" title="${libelle(it,i)}">${vueHtml(p,c,it,"")}</button>`).join("");
  $("#cnt").textContent=`${G.i+1} / ${l.length}`;
}
function majCoul(){
  const c=curC();
  document.querySelectorAll("#pdp .cw").forEach((b,i)=>{b.classList.toggle("on",i===G.ci);b.setAttribute("aria-checked",i===G.ci)});
  $("#cn").textContent=c.nom+(c.epuise?" (épuisé)":"");
  $("#epb").hidden=!c.epuise;
  document.querySelectorAll("#pdp .sz").forEach(b=>b.disabled=!!c.epuise);
  $("#stk").textContent=c.epuise?"Épuisé dans cette couleur":"✓ En stock";
  $("#addp").disabled=$("#wap").disabled=!!c.epuise;
  $("#addp").textContent=c.epuise?"Épuisé":"Ajouter au panier";
  if(c.epuise){$("#tsel").textContent="";$("#clr").hidden=true}else{majSel()}
}
function majSel(){document.querySelectorAll("#pdp .sz").forEach(b=>{const on=b.dataset.t===G.sel;b.setAttribute("aria-checked",on);b.classList.toggle("on",on)});$("#tsel").textContent=G.sel||"";$("#clr").hidden=!G.sel}
function navG(d){const n=imgs(curC()).length;G.i=(G.i+d+n)%n;majGal();if(!$("#lb").hidden)majLb()}
function majLb(){const p=G.p,c=curC(),l=imgs(c);$("#lbimg").innerHTML=vueHtml(p,c,l[G.i],p.nom);$("#lbc").textContent=`${p.nom} – ${c.nom} · ${libelle(l[G.i],G.i)} (${G.i+1}/${l.length})`}
const fermeLb=()=>{$("#lb").hidden=true;if(!$("#cart").classList.contains("on"))document.body.style.overflow=""};
function getProdShareUrl(id, c) {
  let origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "";
  if (!origin || origin === "null" || origin.startsWith("file:") || origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes(":3000")) {
    origin = "https://silence-work1.vercel.app";
  }
  return `${origin}/p/${id}?c=${c !== undefined ? c : 0}`;
}
function ligneWa(){const p=G.p,c=curC();return `• ${G.qte} × ${p.nom} – ${c.nom} (taille ${G.sel}) – ${fmt(p.prix*G.qte)}`}

$("#pdp").addEventListener("click",e=>{
  const T=e.target, cat=T.closest("[data-cat]");
  if(cat){filtre=cat.dataset.cat;renderFiltres();renderGrille();return}
  const cw=T.closest(".cw"), th=T.closest(".th"), nv=T.closest("[data-nav]"), sz=T.closest(".sz"), q=T.closest("[data-q]");
  if(cw){G.ci=+cw.dataset.ci;G.i=0;$("#perr").textContent="";majGal();majCoul();history.replaceState(null,"",`#/produit/${G.p.id}/${G.ci}`)}
  else if(th){G.i=+th.dataset.th;majGal()}
  else if(nv)navG(+nv.dataset.nav);
  else if(T.closest("#main")){majLb();$("#lb").hidden=false;document.body.style.overflow="hidden";$("#lbx").focus()}
  else if(sz){G.sel=sz.dataset.t;majSel();$("#perr").textContent=""}
  else if(T.id==="clr"){G.sel=null;majSel()}
  else if(q){G.qte=Math.max(1,G.qte+ +q.dataset.q);$("#qv").textContent=G.qte}
  else if(T.closest("#addp")||T.closest("#wap")){
    if(curC().epuise)return;
    if(!G.sel){$("#perr").textContent="Choisis une taille avant de continuer.";return}
    if(T.closest("#wap")){
      const p = G.p, c = curC();
      const firstLink = getProdShareUrl(p.id, G.ci);
      const articleLine = `• ${G.qte} × ${p.nom} – ${c.nom} (taille ${G.sel}) – ${fmt(p.prix*G.qte)}\n  🔗 Voir l'article : ${firstLink}`;
      const cleanWa = (typeof WHATSAPP !== "undefined" ? WHATSAPP : "+221776336310").replace(/[^0-9]/g, "");
      const msg = `${firstLink}\n\nBonjour Silence Work, je souhaite commander :\n\n${articleLine}\n\n💰 *Total : ${fmt(p.prix * G.qte)}*\n💳 *Paiement souhaité :* Wave / Orange Money (au +221 77 633 63 10) / à la livraison\n\nMerci de me confirmer la disponibilité !`;
      window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`,"_blank","noopener");return}
    const id=G.p.id,c=G.ci,t=G.sel,l=panier.find(x=>x.id===id&&x.c===c&&x.t===t);
    l?l.q+=G.qte:panier.push({id,c,t,q:G.qte});
    G.qte=1;$("#qv").textContent="1";
    save();renderPanier();toast("Ajouté au panier");ouvre(true);
  }
});
$("#lbx").onclick=fermeLb;
$("#lbp").onclick=()=>navG(-1);$("#lbn").onclick=()=>navG(1);
$("#lb").addEventListener("click",e=>{if(e.target.id==="lb")fermeLb()});
let tx=0,ty=0;
document.addEventListener("touchstart",e=>{tx=e.changedTouches[0].clientX;ty=e.changedTouches[0].clientY},{passive:true});
document.addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy) && G.p && (e.target.closest(".mainwrap")||e.target.closest("#lb"))) navG(dx<0?1:-1);
},{passive:true});

/* ---- accueil ---- */
$("#filters").addEventListener("click",e=>{const c=e.target.dataset.c;if(!c)return;filtre=c;renderFiltres();renderGrille()});
document.addEventListener("click",e=>{const b=e.target.closest("[data-fav]");if(!b)return;const id=+b.dataset.fav;favs=favs.includes(id)?favs.filter(x=>x!==id):[...favs,id];try{localStorage.setItem("sw-fav",JSON.stringify(favs))}catch(x){}document.querySelectorAll(`[data-fav="${id}"]`).forEach(x=>x.classList.toggle("on",favs.includes(id)))});
$("#cartBody").addEventListener("click",e=>{
  const btn=e.target.closest("[data-p],[data-m],[data-r]");
  if(!btn)return;
  const d=btn.dataset;
  if(d.p!==undefined && panier[+d.p])panier[+d.p].q++;
  else if(d.m!==undefined && panier[+d.m]){panier[+d.m].q--;if(panier[+d.m].q<1)panier.splice(+d.m,1)}
  else if(d.r!==undefined && panier[+d.r])panier.splice(+d.r,1);else return;
  save();renderPanier();
});
$("#openCart").onclick=()=>ouvre(true);
$("#closeCart").onclick=$("#shade").onclick=()=>ouvre(false);
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){ouvre(false);fermeLb()}
  if(!$("#lb").hidden){if(e.key==="ArrowLeft")navG(-1);if(e.key==="ArrowRight")navG(1)}
});
/* ---- Instructions de paiement dynamiques ---- */
const paySelect = $("#paySelect");
const payBox = $("#payInstruction");
function majPayInstruction(){
  if(!paySelect||!payBox)return;
  const v = paySelect.value;
  if(v.startsWith("Wave")){
    payBox.innerHTML = '<strong>📱 Paiement Wave</strong>Effectue ton paiement au <span class="pay-num">+221 77 633 63 10</span> (Silence Work). Nous confirmons la réception immédiatement.';
  } else if(v.startsWith("Orange")){
    payBox.innerHTML = '<strong>🍊 Paiement Orange Money</strong>Envoie ton transfert au <span class="pay-num">+221 77 633 63 10</span> (Silence Work).';
  } else {
    payBox.innerHTML = '<strong>💵 Paiement à la livraison</strong>Règlement en espèces directement auprès du livreur lors de la livraison à Dakar.';
  }
}
if(paySelect){
  paySelect.addEventListener("change", majPayInstruction);
  majPayInstruction();
}

$("#form").addEventListener("submit", async e => {
  e.preventDefault();
  if(!panier.length)return;
  const f=new FormData(e.target),nom=f.get("nom").trim(),rawTel=f.get("tel").trim(),tel=rawTel.replace(/[\s.\-()]/g,"").replace(/^00/,"+"),adr=f.get("adr").trim();
  if(!nom||!adr||!/^\+?\d{9,14}$/.test(tel)){$("#err").textContent="Renseigne ton nom, un numéro valide (ex. 77 633 63 10) et ton adresse de livraison.";return}
  $("#err").textContent="";

  const modePaiement = f.get("pay") || "Wave";
  const numCmd = "SW-" + Math.floor(1000 + Math.random() * 9000);
  const montantTotal = total();

  const articlesCmd = panier.map(l=>{
    const p=prod(l.id), c=p.couleurs[l.c];
    return { nom: p.nom, couleur: c.nom, taille: l.t, quantite: l.q, prix: p.prix };
  });

  const nouvelleCommande = {
    id: "cmd-" + Date.now(),
    numero: numCmd,
    client_nom: nom,
    client_tel: rawTel,
    client_adresse: adr,
    total: montantTotal,
    statut: "nouvelle",
    paiement_mode: modePaiement,
    created_at: new Date().toISOString(),
    articles: articlesCmd
  };

  // Enregistrer pour l'espace administration
  try {
    const saved = JSON.parse(localStorage.getItem("sw_commandes") || "[]");
    saved.unshift(nouvelleCommande);
    localStorage.setItem("sw_commandes", JSON.stringify(saved));
  } catch(err){}

  try {
    const res = await fetch("/api/commandes");
    if(res.ok){
      const list = await res.json();
      if(Array.isArray(list)){
        list.unshift(nouvelleCommande);
        await fetch("/api/commandes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(list)
        });
      }
    }
  } catch(err){}

  // Formatage du message WhatsApp avec aperçu de lien riche pour le 1er article
  const firstItem = panier[0];
  const firstLink = getProdShareUrl(firstItem.id, firstItem.c);

  const lignes = panier.map(l => {
    const p = prod(l.id), c = p.couleurs[l.c];
    const url = getProdShareUrl(l.id, l.c);
    return `• ${l.q} × ${p.nom} – ${c.nom} (taille ${l.t}) – ${fmt(p.prix * l.q)}\n  🔗 Voir l'article : ${url}`;
  }).join("\n");

  const cleanWa = (typeof WHATSAPP !== "undefined" ? WHATSAPP : "+221776336310").replace(/[^0-9]/g, "");
  const msg = `${firstLink}\n\nBonjour Silence Work Sénégal, je passe une commande sur votre boutique :\n\n📋 *Commande n° ${numCmd}*\n${lignes}\n\n💰 *Total : ${fmt(montantTotal)}*\n💳 *Paiement :* ${modePaiement} (Numéro Silence Work : +221 77 633 63 10)\n\n👤 *Nom :* ${nom}\n📞 *Téléphone :* ${rawTel}\n📍 *Adresse de livraison :* ${adr}\n\nMerci de me confirmer la réception !`;

  window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`,"_blank","noopener");

  panier = [];
  save();
  renderPanier();
  ouvre(false);
  toast(`Commande ${numCmd} enregistrée et transmise sur WhatsApp !`);
});
$("#nl").addEventListener("submit",e=>{
  e.preventDefault();
  const c=new FormData(e.target).get("c").trim();if(!c)return;
  const cleanWa = (typeof WHATSAPP !== "undefined" ? WHATSAPP : "+221776336310").replace(/[^0-9]/g, "");
  window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent("Bonjour, je souhaite être informé(e) des nouveautés Silence Work : "+c)}`,"_blank","noopener");
});
function navTo(h,push){
  const m=h.match(/^#\/produit\/(\d+)(?:\/(\d+))?/), p=m&&prod(+m[1]);
  fermeLb();$("#accueil").hidden=!!p;$("#produit").hidden=!p;
  if(push){try{history.pushState(null,"",h)}catch(e){}}
  if(p){renderPdp(p,Math.min(+(m[2]||0),p.couleurs.length-1));window.scrollTo(0,0);document.title=p.nom+" – Silence Work Sénégal"}
  else{document.title="Silence Work Sénégal – Streetwear à Dakar";const id=h.slice(1),el=id&&document.getElementById(id);if(el)requestAnimationFrame(()=>el.scrollIntoView());else window.scrollTo(0,0)}
}
document.addEventListener("click",e=>{
  const a=e.target.closest('a[href^="#"]');if(!a)return;
  e.preventDefault();navTo(a.getAttribute("href"),true);
});
const activeHero = (typeof HERO_IMG !== 'undefined' ? HERO_IMG : "") || (function(){ try { return JSON.parse(localStorage.getItem("sw-custom-data")||"{}").heroImg; } catch(e){ return ""; } })();
if(activeHero && $("#hero") && $("#hero").style && $("#hero").style.setProperty) $("#hero").style.setProperty("--hero",`url(${activeHero})`);

$("#tiles").innerHTML=LOOKBOOK.map(l=>`<a class="tile" href="https://www.instagram.com/silence.work_senegal/" target="_blank" rel="noopener"${l.img?` style="background-image:url(${l.img})"`:""}><span>${l.titre}</span></a>`).join("");
$("#fcats").innerHTML=cats.slice(1).map(c=>`<li><a href="#boutique" data-f="${c}">${c}</a></li>`).join("");
$("#fcats").addEventListener("click",e=>{const f=e.target.dataset.f;if(f){filtre=f;renderFiltres();renderGrille()}});
const cleanGlobalWa = (typeof WHATSAPP !== "undefined" ? WHATSAPP : "+221776336310").replace(/[^0-9]/g, "");
const waLink = $("#waLink");
if(waLink) waLink.href = `https://wa.me/${cleanGlobalWa}`;
const waFloat = $("#waFloat");
if(waFloat) waFloat.href = `https://wa.me/${cleanGlobalWa}`;
$("#yr").textContent=new Date().getFullYear();
renderFiltres();renderGrille();renderPanier();
/* ---- Full-Bleed 3-Column Hero Background ---- */
(function initHeroColumns(){
  const hero = $("#hero");
  if(!hero) return;
  const cols = Array.from(hero.querySelectorAll(".hero-bg-col"));
  if(!cols.length) return;

  // Sync images if custom data or HERO_COLS is provided
  try {
    const custom = JSON.parse(localStorage.getItem("sw-custom-data")||"{}");
    const list = custom.heroCols || (typeof HERO_COLS !== "undefined" ? HERO_COLS : null);
    if(Array.isArray(list) && list.length){
      cols.forEach((col, i) => {
        if(list[i]){
          const img = col.querySelector("img");
          if(img) img.src = list[i];
        }
      });
    }
  } catch(e){}

  // Fluid hover focus on columns
  cols.forEach((col, idx) => {
    col.addEventListener("mouseenter", () => {
      cols.forEach((c, i) => c.classList.toggle("col-dimmed", i !== idx));
      col.classList.add("col-active");
    });
    col.addEventListener("mouseleave", () => {
      cols.forEach(c => c.classList.remove("col-dimmed", "col-active"));
    });
  });
})();

addEventListener("popstate",()=>navTo(location.hash||"#",false));navTo(location.hash||"#",false);

