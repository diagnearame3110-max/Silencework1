/**
 * Silence Work Sénégal – Logique Espace Administration
 * Style : Fond blanc, clair, aéré, sobre et professionnel
 * Sans aucun nom de marque étranger.
 */

(function () {
  'use strict';

  // --- ÉTAT GLOBAL DE L'APPLICATION ---
  const STATE = {
    user: null,
    supabase: null,
    isSupabaseOnline: false,
    isLocalServerOnline: false,
    activeView: 'dashboard',
    produits: [],
    categories: ['T-shirts', 'Hoodies', 'Joggings', 'Bonnets'],
    commandes: [],
    settings: {
      whatsapp: '221776336310',
      bandeau: 'Livraison à Dakar · Paiement Wave, Orange Money ou à la livraison',
      devise: 'FCFA',
      supabaseUrl: 'https://atduzssibornspqxavur.supabase.co',
      supabaseAnonKey: 'sb_publishable_BHt-ONCkNnvZx1Z9bBN3tg_yuGsmIS9'
    },
    // Formulaire produit en cours d'édition
    editingProduct: null,
    isDirty: false,
    activePhotoColorIndex: 0
  };

  // Sélecteur DOM rapide
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // Formatage des montants FCFA
  function formatMoney(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '0 FCFA';
    return Number(amount).toLocaleString('fr-FR').replace(/\u202f/g, ' ') + ' ' + STATE.settings.devise;
  }

  // Toast notifications
  function showToast(message, type = 'success') {
    const container = $('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'error'
          ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
          : '<polyline points="20 6 9 17 4 12"></polyline>'}
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // Modale de confirmation
  let confirmCallback = null;
  function showConfirmModal(title, description, onConfirm) {
    $('confirmTitle').textContent = title;
    $('confirmDesc').textContent = description;
    confirmCallback = onConfirm;
    $('confirmModal').style.display = 'flex';
  }
  function hideConfirmModal() {
    $('confirmModal').style.display = 'none';
    confirmCallback = null;
  }
  $('btnConfirmCancel').addEventListener('click', hideConfirmModal);
  $('btnConfirmDanger').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    hideConfirmModal();
  });

  // --- INITIALISATION SUPABASE & SÉCURITÉ ---
  function initSupabase() {
    const savedConfig = localStorage.getItem('sw_supabase_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.url) STATE.settings.supabaseUrl = parsed.url;
        if (parsed.key) STATE.settings.supabaseAnonKey = parsed.key;
      } catch (e) {}
    }

    if (STATE.settings.supabaseUrl && STATE.settings.supabaseAnonKey && typeof window.supabase !== 'undefined') {
      try {
        STATE.supabase = window.supabase.createClient(
          STATE.settings.supabaseUrl,
          STATE.settings.supabaseAnonKey,
          { auth: { persistSession: true } }
        );
        STATE.isSupabaseOnline = true;
      } catch (err) {
        console.warn('Supabase initialisation échouée:', err);
        STATE.isSupabaseOnline = false;
      }
    }
    updateSupabaseStatusDisplay();
  }

  function updateSupabaseStatusDisplay() {
    const dot = $('supabaseStatusDot');
    const text = $('supabaseStatusText');
    if (!dot || !text) return;
    if (STATE.isSupabaseOnline) {
      dot.style.background = '#10b981';
      text.textContent = 'Connecté à Supabase Cloud (atduzssibornspqxavur)';
    } else {
      dot.style.background = '#6b7280';
      text.textContent = 'Mode local / Hors-ligne (Données sauvegardées en direct)';
    }
  }

  // --- GESTION DE L'AUTHENTIFICATION ---
  async function checkAuthSession() {
    // 1. Si Supabase est initialisé, vérifier la session Supabase Auth
    if (STATE.supabase) {
      try {
        const { data: { session } } = await STATE.supabase.auth.getSession();
        if (session && session.user) {
          STATE.user = session.user;
          showAppView();
          return;
        }
      } catch (e) {
        console.warn('Erreur session Supabase:', e);
      }
    }

    // 2. Vérification de la session locale sécurisée
    const localSession = sessionStorage.getItem('sw_admin_authenticated');
    if (localSession === 'true') {
      STATE.user = { email: sessionStorage.getItem('sw_admin_email') || 'admin@silencework.sn' };
      showAppView();
      return;
    }

    // Non connecté
    showAuthView();
  }

  function showAuthView() {
    $('authView').style.display = 'flex';
    $('appView').style.display = 'none';
  }

  function showAppView() {
    $('authView').style.display = 'none';
    $('appView').style.display = 'flex';
    loadData();
  }

  // Formulaire de connexion
  $('authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value.trim();
    const errBox = $('authError');
    errBox.style.display = 'none';

    if (!email || !password) {
      errBox.textContent = 'Veuillez saisir votre e-mail et votre mot de passe.';
      errBox.style.display = 'block';
      return;
    }

    $('btnSignIn').disabled = true;
    $('btnSignIn').textContent = 'Connexion en cours...';

    // Si Supabase est connecté, utiliser Supabase Auth
    if (STATE.supabase) {
      try {
        const { data, error } = await STATE.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        STATE.user = data.user;
        showToast('Connexion réussie');
        showAppView();
        return;
      } catch (err) {
        errBox.textContent = 'Identifiants incorrects ou utilisateur inexistant.';
        errBox.style.display = 'block';
        $('btnSignIn').disabled = false;
        $('btnSignIn').textContent = 'Se connecter';
        return;
      }
    }

    // Mode local / par défaut
    if (password.length >= 4) {
      sessionStorage.setItem('sw_admin_authenticated', 'true');
      sessionStorage.setItem('sw_admin_email', email);
      STATE.user = { email };
      showToast('Connecté à l\'espace d\'administration');
      showAppView();
    } else {
      errBox.textContent = 'Le mot de passe doit contenir au moins 4 caractères.';
      errBox.style.display = 'block';
      $('btnSignIn').disabled = false;
      $('btnSignIn').textContent = 'Se connecter';
    }
  });

  // Déconnexion
  $('btnLogout').addEventListener('click', async () => {
    if (STATE.supabase) {
      try { await STATE.supabase.auth.signOut(); } catch (e) {}
    }
    sessionStorage.removeItem('sw_admin_authenticated');
    sessionStorage.removeItem('sw_admin_email');
    STATE.user = null;
    showToast('Déconnexion effectuée');
    showAuthView();
  });

  // --- CHARGEMENT DES DONNÉES (PRODUITS, CATÉGORIES, COMMANDES) ---
  async function loadData() {
    // Vérifier l'état du serveur local
    try {
      const res = await fetch('/api/status');
      if (res.ok) STATE.isLocalServerOnline = true;
    } catch (e) {
      STATE.isLocalServerOnline = false;
    }

    // Charger les catégories & paramètres
    loadSettings();

    // 1. Tenter de charger les produits depuis Supabase
    let loadedFromSupabase = false;
    if (STATE.supabase) {
      try {
        const { data, error } = await STATE.supabase.from('produits').select('*').order('id', { ascending: true });
        if (!error && Array.isArray(data) && data.length > 0) {
          STATE.produits = data;
          loadedFromSupabase = true;
          const alert = $('migrationAlert');
          if (alert) alert.style.display = 'none';
        } else if (error && (error.code === 'PGRST205' || (error.message && error.message.includes('not find')))) {
          const alert = $('migrationAlert');
          if (alert) alert.style.display = 'flex';
        }
      } catch (e) {
        console.warn('Erreur chargement Supabase:', e);
      }
    }

    // 2. Si pas de données Supabase, charger depuis localStorage ou data.js
    if (!loadedFromSupabase) {
      try {
        const saved = localStorage.getItem('sw-custom-data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.produits) && parsed.produits.length) {
            STATE.produits = parsed.produits;
          }
          if (Array.isArray(parsed.categories) && parsed.categories.length) {
            STATE.categories = parsed.categories;
          }
        }
      } catch (e) {}

      // Fallback constants data.js
      if (!STATE.produits || !STATE.produits.length) {
        if (typeof PRODUITS !== 'undefined' && Array.isArray(PRODUITS)) {
          STATE.produits = JSON.parse(JSON.stringify(PRODUITS));
        }
      }
    }

    // Extraire les catégories à partir des produits existants
    const existingCats = [...new Set(STATE.produits.map(p => p.cat).filter(Boolean))];
    existingCats.forEach(c => {
      if (!STATE.categories.includes(c)) STATE.categories.push(c);
    });

    // Charger les commandes
    await loadOrders();

    // Rendre l'interface
    updateStats();
    renderProductsTable();
    renderCategoriesTable();
    renderOrdersTable();
    renderDashboard();
    populateCategorySelects();
  }

  function loadSettings() {
    if (typeof WHATSAPP !== 'undefined') STATE.settings.whatsapp = WHATSAPP;
    if (typeof DEVISE !== 'undefined') STATE.settings.devise = DEVISE;
    if (typeof BANDEAU !== 'undefined') STATE.settings.bandeau = BANDEAU;

    const savedCustom = localStorage.getItem('sw-custom-data');
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        if (parsed.whatsapp) STATE.settings.whatsapp = parsed.whatsapp;
        if (parsed.bandeau) STATE.settings.bandeau = parsed.bandeau;
      } catch (e) {}
    }

    $('settingWhatsapp').value = STATE.settings.whatsapp;
    $('settingBandeau').value = STATE.settings.bandeau;
    $('settingDevise').value = STATE.settings.devise;
    $('settingSupabaseUrl').value = STATE.settings.supabaseUrl || '';
    $('settingSupabaseAnonKey').value = STATE.settings.supabaseAnonKey || '';
  }

  async function loadOrders() {
    // 1. Supabase
    if (STATE.supabase) {
      try {
        const { data, error } = await STATE.supabase.from('commandes').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          STATE.commandes = data;
          return;
        }
      } catch (e) {}
    }

    // 2. Serveur local / localStorage
    try {
      const res = await fetch('/api/commandes');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length) {
          STATE.commandes = list;
          return;
        }
      }
    } catch (e) {}

    const saved = localStorage.getItem('sw_commandes');
    if (saved) {
      try {
        STATE.commandes = JSON.parse(saved);
      } catch (e) {}
    } else {
      // Commandes d'exemple Silence Work pour un démarrage immédiat
      STATE.commandes = [
        {
          id: 'cmd-1',
          numero: 'SW-1084',
          client_nom: 'Moussa Diop',
          client_tel: '77 123 45 67',
          client_adresse: 'Almadies, Dakar',
          total: 18000,
          statut: 'nouvelle',
          paiement_mode: 'Wave',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          articles: [
            { nom: 'T-shirt Silence Work', couleur: 'Noir', taille: 'L', quantite: 2, prix: 9000 }
          ]
        },
        {
          id: 'cmd-2',
          numero: 'SW-1083',
          client_nom: 'Fatou Ndiaye',
          client_tel: '78 987 65 43',
          client_adresse: 'Mermoz, Dakar',
          total: 25000,
          statut: 'confirmée',
          paiement_mode: 'Orange Money',
          created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
          articles: [
            { nom: 'Hoodie Silence Work', couleur: 'Crème', taille: 'M', quantite: 1, prix: 25000 }
          ]
        }
      ];
      saveOrders();
    }
  }

  async function saveOrders() {
    localStorage.setItem('sw_commandes', JSON.stringify(STATE.commandes));
    if (STATE.isLocalServerOnline) {
      try {
        await fetch('/api/commandes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(STATE.commandes)
        });
      } catch (e) {}
    }
  }

  // --- SAUVEGARDE GÉNÉRALE DU CATALOGUE ---
  async function persistCatalog() {
    // Mise à jour immédiate et synchrone de l'interface
    updateStats();
    renderProductsTable();
    renderDashboard();

    // 1. Sauvegarde dans localStorage pour synchronisation immédiate de la boutique
    const customData = {
      produits: STATE.produits,
      categories: STATE.categories,
      whatsapp: STATE.settings.whatsapp,
      bandeau: STATE.settings.bandeau
    };
    try {
      localStorage.setItem('sw-custom-data', JSON.stringify(customData));
    } catch (e) {}

    // 2. Sauvegarde sur le serveur local Node.js (met à jour js/data.js sur disque)
    if (STATE.isLocalServerOnline) {
      try {
        await fetch('/api/save-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produits: STATE.produits,
            whatsapp: STATE.settings.whatsapp,
            bandeau: STATE.settings.bandeau,
            devise: STATE.settings.devise
          })
        });
      } catch (err) {
        console.warn('Erreur sauvegarde serveur local:', err);
      }
    }

    // 3. Sauvegarde dans Supabase si connecté
    if (STATE.supabase) {
      try {
        for (const p of STATE.produits) {
          await STATE.supabase.from('produits').upsert({
            id: p.id,
            nom: p.nom,
            cat: p.cat,
            prix: p.prix,
            ancien: p.ancien || null,
            desc: p.desc || '',
            details: p.details || [],
            visible: p.visible !== false,
            tailles: p.tailles || ['S', 'M', 'L', 'XL', 'XXL'],
            couleurs: p.couleurs || [],
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Erreur synchronisation Supabase:', err);
      }
    }
  }

  // --- CALCUL DES STATISTIQUES ---
  function getProductStats() {
    const total = STATE.produits.length;
    let inStock = 0;
    let outOfStock = 0;

    STATE.produits.forEach(p => {
      // Un produit est en rupture si toutes ses couleurs sont epuise = 1
      const allColorsEpuise = p.couleurs && p.couleurs.length > 0 && p.couleurs.every(c => c.epuise);
      if (allColorsEpuise) {
        outOfStock++;
      } else {
        inStock++;
      }
    });

    const activeCats = [...new Set(STATE.produits.map(p => p.cat).filter(Boolean))].length;
    return { total, inStock, outOfStock, activeCats };
  }

  function updateStats() {
    const stats = getProductStats();

    // Badges barre latérale
    if ($('navProdCount')) $('navProdCount').textContent = stats.total;
    if ($('navOrdersCount')) $('navOrdersCount').textContent = STATE.commandes.filter(c => c.statut === 'nouvelle').length;

    // Cartes Tableau de bord
    if ($('dashTotalProd')) $('dashTotalProd').textContent = stats.total;
    if ($('dashInStock')) $('dashInStock').textContent = stats.inStock;
    if ($('dashOutOfStock')) $('dashOutOfStock').textContent = stats.outOfStock;
    if ($('dashActiveCats')) $('dashActiveCats').textContent = stats.activeCats;

    // Cartes Page Produits
    if ($('statProdTotal')) $('statProdTotal').textContent = stats.total;
    if ($('statProdStock')) $('statProdStock').textContent = stats.inStock;
    if ($('statProdRupture')) $('statProdRupture').textContent = stats.outOfStock;
    if ($('statProdCats')) $('statProdCats').textContent = stats.activeCats;

    // Compteurs filtres
    if ($('countPillAll')) $('countPillAll').textContent = stats.total;
    if ($('countPillInStock')) $('countPillInStock').textContent = stats.inStock;
    if ($('countPillOutOfStock')) $('countPillOutOfStock').textContent = stats.outOfStock;
  }

  // --- NAVIGATION ENTRE LES VUES ---
  function switchView(viewName) {
    if (STATE.isDirty) {
      if (!confirm('Des modifications ne sont pas enregistrées. Souhaitez-vous quitter cette page ?')) {
        return;
      }
      setDirty(false);
    }

    STATE.activeView = viewName;
    $$('.view-panel').forEach(el => el.style.display = 'none');
    $$('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));

    const navItem = document.querySelector(`.sidebar-nav [data-nav="${viewName}"]`);
    if (navItem) navItem.classList.add('active');

    // Fermer le menu mobile si ouvert
    closeMobileSidebar();

    if (viewName === 'dashboard') {
      $('viewDashboard').style.display = 'block';
      renderDashboard();
    } else if (viewName === 'produits') {
      $('viewProduits').style.display = 'block';
      renderProductsTable();
    } else if (viewName === 'produit-form') {
      $('viewProduitForm').style.display = 'block';
    } else if (viewName === 'commandes') {
      $('viewCommandes').style.display = 'block';
      renderOrdersTable();
    } else if (viewName === 'categories') {
      $('viewCategories').style.display = 'block';
      renderCategoriesTable();
    } else if (viewName === 'parametres') {
      $('viewParametres').style.display = 'block';
    }
  }

  $$('.sidebar-nav [data-nav]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.nav));
  });

  $$('[data-action="go-add-product"]').forEach(btn => {
    btn.addEventListener('click', () => openProductForm(null));
  });

  $$('[data-nav-target]').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.navTarget));
  });

  // Mobile drawer
  const burgerBtn = $('burgerBtn');
  const sidebar = $('sidebar');
  const overlay = $('sidebarOverlay');
  if (burgerBtn) {
    burgerBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', closeMobileSidebar);
  }
  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  // --- TABLEAU DE BORD (DASHBOARD) ---
  function renderDashboard() {
    updateStats();

    // 5 Dernières commandes
    const ordersContainer = $('dashOrdersList');
    if (ordersContainer) {
      const latest = STATE.commandes.slice(0, 5);
      if (!latest.length) {
        ordersContainer.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px 0">Aucune commande enregistrée pour le moment.</p>';
      } else {
        ordersContainer.innerHTML = `
          <table class="data-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Client</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${latest.map(cmd => `
                <tr style="cursor:pointer" onclick="window.viewOrderDetail('${cmd.id}')">
                  <td><strong>${cmd.numero}</strong></td>
                  <td>${cmd.client_nom}</td>
                  <td>${formatMoney(cmd.total)}</td>
                  <td><span class="badge badge-order-${cmd.statut}">${cmd.statut}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    }

    // Produits bientôt en rupture ou en rupture
    const lowStockContainer = $('dashLowStockList');
    const badge = $('dashLowStockBadge');
    if (lowStockContainer) {
      const lowStockItems = [];
      STATE.produits.forEach(p => {
        p.couleurs.forEach(c => {
          if (c.epuise) {
            lowStockItems.push({ nom: p.nom, couleur: c.nom, id: p.id, epuise: true });
          }
        });
      });

      if (badge) badge.textContent = `${lowStockItems.length} alerte${lowStockItems.length > 1 ? 's' : ''}`;

      if (!lowStockItems.length) {
        lowStockContainer.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px 0">Tous les stocks sont à niveau optimal.</p>';
      } else {
        lowStockContainer.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:8px">
            ${lowStockItems.slice(0, 5).map(item => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#fef2f2;border-radius:var(--radius-sm);border:1px solid #fecaca">
                <div>
                  <strong style="font-size:13px;color:var(--accent-red)">${item.nom}</strong>
                  <div style="font-size:11.5px;color:var(--text-muted)">Couleur : ${item.couleur} (Rupture)</div>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.editProduct(${item.id})">
                  Gérer le stock
                </button>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  }

  // --- PAGE PRODUITS (TABLEAU, RECHERCHE & FILTRES) ---
  let activeAvailabilityFilter = 'all'; // all | instock | outofstock

  $('btnHeaderAddProd').addEventListener('click', () => openProductForm(null));

  function populateCategorySelects() {
    const filterSelect = $('prodCatFilter');
    const formCatSelect = $('prodCategory');

    if (filterSelect) {
      const currentVal = filterSelect.value;
      filterSelect.innerHTML = '<option value="Toutes">Toutes les catégories</option>' +
        STATE.categories.map(c => `<option value="${c}">${c}</option>`).join('');
      filterSelect.value = currentVal || 'Toutes';
    }

    if (formCatSelect) {
      formCatSelect.innerHTML = STATE.categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }
  }

  // Écouteurs de filtres
  $('prodSearch').addEventListener('input', renderProductsTable);
  $('prodCatFilter').addEventListener('change', renderProductsTable);

  $$('.filter-pills [data-filter]').forEach(pill => {
    pill.addEventListener('click', () => {
      $$('.filter-pills [data-filter]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeAvailabilityFilter = pill.dataset.filter;
      renderProductsTable();
    });
  });

  function renderProductsTable() {
    const tbody = $('productsTableBody');
    const emptyState = $('productsEmptyState');
    if (!tbody) return;

    const query = $('prodSearch').value.toLowerCase().trim();
    const cat = $('prodCatFilter').value;

    let filtered = STATE.produits.filter(p => {
      if (query && !p.nom.toLowerCase().includes(query)) return false;
      if (cat !== 'Toutes' && p.cat !== cat) return false;

      const isOutOfStock = p.couleurs && p.couleurs.length > 0 && p.couleurs.every(c => c.epuise);
      if (activeAvailabilityFilter === 'instock' && isOutOfStock) return false;
      if (activeAvailabilityFilter === 'outofstock' && !isOutOfStock) return false;

      return true;
    });

    if (!filtered.length) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map(p => {
      // Trouver la première photo disponible
      let thumbImg = null;
      if (p.couleurs && p.couleurs.length) {
        for (const c of p.couleurs) {
          if (c.img && c.img.length && c.img[0]) {
            thumbImg = c.img[0];
            break;
          }
        }
      }

      const isOutOfStock = p.couleurs && p.couleurs.length > 0 && p.couleurs.every(c => c.epuise);
      const isPromo = p.ancien && Number(p.ancien) > Number(p.prix);

      return `
        <tr>
          <td class="prod-thumb-cell">
            <div class="prod-thumb">
              ${thumbImg ? `<img src="${thumbImg}" alt="${p.nom}" loading="lazy">` : `
                <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.8">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                </svg>
              `}
            </div>
          </td>
          <td class="prod-info-cell">
            <div>${p.nom}</div>
            <div class="prod-sub">${p.couleurs ? p.couleurs.length : 0} couleur${p.couleurs && p.couleurs.length > 1 ? 's' : ''}</div>
          </td>
          <td>
            <span class="badge badge-cat">${p.cat || 'Non classé'}</span>
          </td>
          <td>
            <div class="price-display">
              ${isPromo ? `<span class="price-strike">${formatMoney(p.ancien)}</span>` : ''}
              <span>${formatMoney(p.prix)}</span>
            </div>
          </td>
          <td>
            ${isOutOfStock ? `
              <span class="badge badge-rupture">
                <span class="badge-dot"></span>
                Rupture
              </span>
            ` : `
              <span class="badge badge-stock">
                <span class="badge-dot"></span>
                En stock
              </span>
            `}
          </td>
          <td>
            <div class="row-actions">
              <a href="index.html#/produit/${p.id}/0" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" title="Voir sur la boutique">
                Voir
              </a>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.editProduct(${p.id})" title="Modifier">
                Modifier
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.duplicateProduct(${p.id})" title="Dupliquer">
                Dupliquer
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.confirmDeleteProduct(${p.id})" title="Supprimer">
                Supprimer
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- ACTIONS PRODUIT GLOBALES (ATTACHÉES À WINDOW) ---
  window.editProduct = function (id) {
    const p = STATE.produits.find(x => String(x.id) === String(id));
    if (p) openProductForm(p);
  };

  window.duplicateProduct = function (id) {
    const original = STATE.produits.find(x => String(x.id) === String(id));
    if (!original) return;

    const newId = Date.now();
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = newId;
    copy.nom = `${original.nom} (Copie)`;

    STATE.produits.unshift(copy);
    persistCatalog();
    showToast(`Produit dupliqué : "${copy.nom}"`);
  };

  window.confirmDeleteProduct = function (id) {
    const p = STATE.produits.find(x => String(x.id) === String(id));
    if (!p) return;

    showConfirmModal(
      `Supprimer « ${p.nom} » ?`,
      'Cette action retirera définitivement ce vêtement de la boutique Silence Work.',
      () => {
        STATE.produits = STATE.produits.filter(x => String(x.id) !== String(id));
        persistCatalog();
        showToast('Produit supprimé avec succès');
      }
    );
  };

  // --- FORMULAIRE PRODUIT (AJOUTER & MODIFIER – 3 BLOCS) ---
  function openProductForm(productOrNull) {
    populateCategorySelects();
    STATE.isDirty = false;
    STATE.activePhotoColorIndex = 0;

    if (productOrNull) {
      STATE.editingProduct = JSON.parse(JSON.stringify(productOrNull));
      $('formProductTitle').textContent = `Modifier : ${productOrNull.nom}`;
    } else {
      // Nouveau produit par défaut Silence Work
      STATE.editingProduct = {
        id: Date.now(),
        nom: '',
        cat: STATE.categories[0] || 'T-shirts',
        prix: 9000,
        ancien: null,
        desc: '',
        details: [
          'Logo Silence Work sérigraphié ou brodé',
          'Coupe confortable, unisexe',
          'Création originale, Dakar'
        ],
        visible: true,
        tailles: ['S', 'M', 'L', 'XL', 'XXL'],
        couleurs: [
          {
            nom: 'Noir',
            hex: '#111111',
            encre: '#ffffff',
            img: [],
            stock: { S: 5, M: 5, L: 5, XL: 5, XXL: 5 },
            epuise: 0
          }
        ]
      };
      $('formProductTitle').textContent = 'Ajouter un produit';
    }

    // Assurer que les stocks existent dans chaque couleur
    ensureStockStructure(STATE.editingProduct);

    // Hydrater le bloc 1
    $('prodName').value = STATE.editingProduct.nom || '';
    $('prodCategory').value = STATE.editingProduct.cat || STATE.categories[0];
    $('prodPrice').value = STATE.editingProduct.prix || '';
    $('prodOldPrice').value = STATE.editingProduct.ancien || '';
    $('prodDesc').value = STATE.editingProduct.desc || '';
    $('prodVisible').checked = STATE.editingProduct.visible !== false;

    renderBulletDetails();
    renderColorsList();
    renderSizesCheckboxes();
    renderStockMatrix();
    renderPhotoTabs();
    renderPhotosGallery();
    renderLiveClientPreview();

    setDirty(false);
    switchView('produit-form');
  }

  function ensureStockStructure(prod) {
    if (!prod.couleurs || !prod.couleurs.length) {
      prod.couleurs = [{ nom: 'Noir', hex: '#111111', encre: '#ffffff', img: [], stock: {}, epuise: 0 }];
    }
    const currentTailles = prod.tailles && prod.tailles.length ? prod.tailles : ['S', 'M', 'L', 'XL', 'XXL'];
    prod.couleurs.forEach(c => {
      if (!c.stock || typeof c.stock !== 'object') c.stock = {};
      currentTailles.forEach(t => {
        if (c.stock[t] === undefined) {
          c.stock[t] = c.epuise ? 0 : 5;
        }
      });
      if (!Array.isArray(c.img)) c.img = [];
    });
  }

  function setDirty(isDirty) {
    STATE.isDirty = isDirty;
    const dot = $('formDirtyDot');
    const text = $('formDirtyText');
    if (!dot || !text) return;
    if (isDirty) {
      dot.style.background = 'var(--accent-amber)';
      text.textContent = 'Modifications non enregistrées';
    } else {
      dot.style.background = 'var(--accent-green)';
      text.textContent = 'Toutes les modifications sont prêtes';
    }
  }

  // --- BLOC 1 : DÉTAILS DU PRODUIT (PUCES AJOUTABLES/SUPPRIMABLES) ---
  function renderBulletDetails() {
    const container = $('bulletListContainer');
    if (!container) return;
    container.innerHTML = STATE.editingProduct.details.map((detail, idx) => `
      <div class="bullet-item">
        <input type="text" class="form-input" value="${escapeHtml(detail)}" data-bullet-idx="${idx}" placeholder="ex. Coton lourd de qualité supérieure">
        <button type="button" class="bullet-remove-btn" onclick="window.removeBullet(${idx})" title="Retirer cette puce">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');

    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', e => {
        const idx = +e.target.dataset.bulletIdx;
        STATE.editingProduct.details[idx] = e.target.value;
        setDirty(true);
      });
    });
  }

  window.removeBullet = function (idx) {
    STATE.editingProduct.details.splice(idx, 1);
    setDirty(true);
    renderBulletDetails();
  };

  $('btnAddDetailBullet').addEventListener('click', () => {
    STATE.editingProduct.details.push('');
    setDirty(true);
    renderBulletDetails();
    const inputs = $('bulletListContainer').querySelectorAll('input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  // Écouteurs de changement sur les inputs du Bloc 1
  ['prodName', 'prodCategory', 'prodPrice', 'prodOldPrice', 'prodDesc'].forEach(id => {
    $(id).addEventListener('input', () => {
      setDirty(true);
      renderLiveClientPreview();
    });
  });
  $('prodVisible').addEventListener('change', () => setDirty(true));

  // --- BLOC 2 : COULEURS, TAILLES ET STOCK ---
  function renderColorsList() {
    const container = $('colorsListContainer');
    if (!container) return;

    container.innerHTML = STATE.editingProduct.couleurs.map((c, i) => `
      <div class="color-row-card">
        <div class="color-swatch-picker">
          <input type="color" class="color-input-circle" value="${c.hex.length === 4 ? c.hex + c.hex.slice(1) : c.hex}" data-color-idx="${i}" data-field="hex" title="Choisir la teinte">
          <input type="text" class="form-input" style="width:140px" value="${escapeHtml(c.nom)}" data-color-idx="${i}" data-field="nom" placeholder="Nom de couleur">
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-left:auto">
          ${c.img ? c.img.length : 0} photo${c.img && c.img.length > 1 ? 's' : ''}
        </div>
        ${STATE.editingProduct.couleurs.length > 1 ? `
          <button type="button" class="btn btn-danger btn-sm" onclick="window.removeColor(${i})" title="Retirer cette couleur">
            Retirer
          </button>
        ` : ''}
      </div>
    `).join('');

    container.querySelectorAll('[data-color-idx]').forEach(input => {
      input.addEventListener('input', e => {
        const idx = +e.target.dataset.colorIdx;
        const field = e.target.dataset.field;
        STATE.editingProduct.couleurs[idx][field] = e.target.value;
        setDirty(true);
        renderStockMatrix();
        renderPhotoTabs();
        renderLiveClientPreview();
      });
    });
  }

  $('btnAddColorBtn').addEventListener('click', () => {
    const newColor = {
      nom: 'Nouvelle couleur',
      hex: '#2B4BFF',
      encre: '#ffffff',
      img: [],
      stock: {},
      epuise: 0
    };
    (STATE.editingProduct.tailles || ['S', 'M', 'L', 'XL', 'XXL']).forEach(t => {
      newColor.stock[t] = 5;
    });
    STATE.editingProduct.couleurs.push(newColor);
    setDirty(true);
    renderColorsList();
    renderStockMatrix();
    renderPhotoTabs();
    renderPhotosGallery();
    renderLiveClientPreview();
  });

  window.removeColor = function (idx) {
    if (STATE.editingProduct.couleurs.length <= 1) {
      showToast('Le produit doit avoir au moins une couleur.', 'error');
      return;
    }
    STATE.editingProduct.couleurs.splice(idx, 1);
    if (STATE.activePhotoColorIndex >= STATE.editingProduct.couleurs.length) {
      STATE.activePhotoColorIndex = 0;
    }
    setDirty(true);
    renderColorsList();
    renderStockMatrix();
    renderPhotoTabs();
    renderPhotosGallery();
    renderLiveClientPreview();
  };

  // Tailles disponibles
  function renderSizesCheckboxes() {
    const container = $('sizesCheckboxes');
    if (!container) return;
    const current = STATE.editingProduct.tailles || ['S', 'M', 'L', 'XL', 'XXL'];

    container.querySelectorAll('.size-pill-label').forEach(label => {
      const sizeVal = label.dataset.size;
      const checkbox = label.querySelector('input');
      const isChecked = current.includes(sizeVal);
      checkbox.checked = isChecked;
      label.classList.toggle('checked', isChecked);

      checkbox.onchange = () => {
        if (sizeVal === 'Unique' && checkbox.checked) {
          STATE.editingProduct.tailles = ['Unique'];
        } else if (sizeVal !== 'Unique' && checkbox.checked) {
          STATE.editingProduct.tailles = (STATE.editingProduct.tailles || []).filter(x => x !== 'Unique');
          if (!STATE.editingProduct.tailles.includes(sizeVal)) STATE.editingProduct.tailles.push(sizeVal);
        } else {
          STATE.editingProduct.tailles = (STATE.editingProduct.tailles || []).filter(x => x !== sizeVal);
        }
        if (!STATE.editingProduct.tailles.length) STATE.editingProduct.tailles = ['M'];

        ensureStockStructure(STATE.editingProduct);
        setDirty(true);
        renderSizesCheckboxes();
        renderStockMatrix();
      };
    });
  }

  // Matrice de Stock (+ Entrée / - Sortie)
  function renderStockMatrix() {
    const tbody = $('stockMatrixBody');
    if (!tbody) return;

    const tailles = STATE.editingProduct.tailles || ['S', 'M', 'L', 'XL', 'XXL'];
    let rowsHtml = '';

    STATE.editingProduct.couleurs.forEach((c, ci) => {
      tailles.forEach(t => {
        const qty = c.stock && c.stock[t] !== undefined ? c.stock[t] : 0;
        const isRupture = qty <= 0;

        rowsHtml += `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="color-dot" style="background:${c.hex}"></span>
                <strong>${c.nom}</strong>
              </div>
            </td>
            <td><strong>Taille ${t}</strong></td>
            <td>
              <div class="stock-stepper">
                <button type="button" class="stepper-btn out" onclick="window.adjustStock(${ci}, '${t}', -1)" title="Retirer 1 du stock">
                  − Sortie
                </button>
                <input type="number" class="stepper-input" value="${qty}" min="0" onchange="window.setDirectStock(${ci}, '${t}', this.value)">
                <button type="button" class="stepper-btn in" onclick="window.adjustStock(${ci}, '${t}', 1)" title="Ajouter 1 au stock">
                  + Entrée
                </button>
              </div>
            </td>
            <td>
              <div style="display:flex;gap:4px">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.adjustStock(${ci}, '${t}', 5)">+5</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.adjustStock(${ci}, '${t}', 10)">+10</button>
              </div>
            </td>
            <td>
              ${isRupture ? `
                <span class="badge badge-rupture">
                  <span class="badge-dot"></span> Rupture
                </span>
              ` : `
                <span class="badge badge-stock">
                  <span class="badge-dot"></span> En stock (${qty})
                </span>
              `}
            </td>
          </tr>
        `;
      });
    });

    tbody.innerHTML = rowsHtml;
  }

  window.adjustStock = function (colorIdx, taille, delta) {
    const color = STATE.editingProduct.couleurs[colorIdx];
    if (!color.stock) color.stock = {};
    const current = color.stock[taille] || 0;
    const next = Math.max(0, current + delta);
    color.stock[taille] = next;

    // Calculer si toute la couleur est épuisée
    const allSizesZero = Object.values(color.stock).every(v => v <= 0);
    color.epuise = allSizesZero ? 1 : 0;

    setDirty(true);
    renderStockMatrix();
    renderLiveClientPreview();
  };

  window.setDirectStock = function (colorIdx, taille, rawVal) {
    const val = Math.max(0, parseInt(rawVal, 10) || 0);
    const color = STATE.editingProduct.couleurs[colorIdx];
    if (!color.stock) color.stock = {};
    color.stock[taille] = val;

    const allSizesZero = Object.values(color.stock).every(v => v <= 0);
    color.epuise = allSizesZero ? 1 : 0;

    setDirty(true);
    renderStockMatrix();
    renderLiveClientPreview();
  };

  // --- BLOC 3 : PHOTOS, PAR COULEUR ---
  function renderPhotoTabs() {
    const container = $('photosColorTabs');
    if (!container) return;

    container.innerHTML = STATE.editingProduct.couleurs.map((c, i) => `
      <button type="button" class="color-tab-btn ${i === STATE.activePhotoColorIndex ? 'active' : ''}" onclick="window.switchPhotoColor(${i})">
        <span class="color-dot" style="background:${c.hex}"></span>
        <span>${c.nom}</span>
        <span class="nav-badge" style="margin-left:6px">${c.img ? c.img.length : 0}</span>
      </button>
    `).join('');
  }

  window.switchPhotoColor = function (idx) {
    STATE.activePhotoColorIndex = idx;
    renderPhotoTabs();
    renderPhotosGallery();
    renderLiveClientPreview();
  };

  function renderPhotosGallery() {
    const container = $('photosGalleryContainer');
    if (!container) return;

    const curColor = STATE.editingProduct.couleurs[STATE.activePhotoColorIndex];
    if (!curColor || !curColor.img || !curColor.img.length) {
      container.innerHTML = `
        <div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--text-muted);font-size:13px;background:#f9fafb;border-radius:var(--radius-sm);border:1px dashed var(--border)">
          Aucune photo ajoutée pour la couleur <strong>${curColor ? curColor.nom : ''}</strong>.<br>
          Glisse des photos dans le cadre ci-dessus ou clique sur « Ajouter des photos ».
        </div>
      `;
      return;
    }

    container.innerHTML = curColor.img.map((url, i) => {
      const isCover = i === 0;
      return `
        <div class="photo-card-item ${isCover ? 'is-cover' : ''}">
          <div class="photo-preview-box">
            <img src="${url}" alt="Photo ${i + 1}" loading="lazy">
            ${isCover ? '<span class="cover-badge">Photo de couverture</span>' : ''}
          </div>
          <div class="photo-card-actions">
            <select class="photo-label-select" onchange="window.setPhotoLabel(${i}, this.value)">
              <option value="Face">Vue de Face</option>
              <option value="Dos">Vue de Dos</option>
              <option value="Détail">Détail du logo</option>
              <option value="Porté">Porté en situation</option>
              <option value="Ambiance">Photo d'ambiance</option>
            </select>
            <div class="photo-action-buttons">
              <div style="display:flex;gap:4px">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.movePhoto(${i}, -1)" ${i === 0 ? 'disabled' : ''} title="Déplacer vers la gauche">◀</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.movePhoto(${i}, 1)" ${i === curColor.img.length - 1 ? 'disabled' : ''} title="Déplacer vers la droite">▶</button>
              </div>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.confirmRemovePhoto(${i})" title="Retirer">
                Retirer
              </button>
            </div>
            ${!isCover ? `
              <button type="button" class="btn btn-secondary btn-sm" style="width:100%" onclick="window.setAsCover(${i})">
                Définir comme couverture
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window.movePhoto = function (idx, dir) {
    const curColor = STATE.editingProduct.couleurs[STATE.activePhotoColorIndex];
    const target = idx + dir;
    if (target < 0 || target >= curColor.img.length) return;

    const temp = curColor.img[idx];
    curColor.img[idx] = curColor.img[target];
    curColor.img[target] = temp;

    setDirty(true);
    renderPhotosGallery();
    renderLiveClientPreview();
  };

  window.setAsCover = function (idx) {
    const curColor = STATE.editingProduct.couleurs[STATE.activePhotoColorIndex];
    if (idx === 0 || !curColor.img[idx]) return;

    const [selected] = curColor.img.splice(idx, 1);
    curColor.img.unshift(selected);

    setDirty(true);
    renderPhotosGallery();
    renderLiveClientPreview();
    showToast('Nouvelle photo de couverture définie');
  };

  window.confirmRemovePhoto = function (idx) {
    showConfirmModal(
      'Retirer cette photo ?',
      'Cette photo ne sera plus affichée pour cette couleur.',
      () => {
        const curColor = STATE.editingProduct.couleurs[STATE.activePhotoColorIndex];
        curColor.img.splice(idx, 1);
        setDirty(true);
        renderPhotoTabs();
        renderPhotosGallery();
        renderLiveClientPreview();
        showToast('Photo retirée');
      }
    );
  };

  window.setPhotoLabel = function (idx, val) {
    setDirty(true);
  };

  // Upload et compression client-side (Canvas -> WebP max 1600px)
  const dropzone = $('photoDropzone');
  const fileInput = $('photoFileInput');
  const btnBrowse = $('btnBrowsePhotos');

  btnBrowse.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', e => {
    if (e.target !== btnBrowse && !btnBrowse.contains(e.target)) fileInput.click();
  });

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFilesUpload(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files && e.target.files.length) {
      handleFilesUpload(e.target.files);
    }
  });

  async function handleFilesUpload(fileList) {
    const curColor = STATE.editingProduct.couleurs[STATE.activePhotoColorIndex];
    if (!curColor) return;

    const progressContainer = $('uploadProgressContainer');
    const progressBar = $('uploadProgressBar');
    progressContainer.style.display = 'block';
    progressBar.style.width = '10%';

    const files = Array.from(fileList);
    const total = files.length;
    let completed = 0;

    for (const file of files) {
      try {
        // Compression en WebP max 1600px
        const compressedBase64 = await resizeImageToWebP(file, 1600, 0.85);

        // Upload vers Supabase Storage si disponible
        let uploadedUrl = null;
        if (STATE.supabase) {
          try {
            const fileName = `produit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
            const blob = await (await fetch(compressedBase64)).blob();
            const { data, error } = await STATE.supabase.storage.from('produits').upload(fileName, blob, { contentType: 'image/webp' });
            if (!error && data) {
              const { data: pubUrl } = STATE.supabase.storage.from('produits').getPublicUrl(fileName);
              uploadedUrl = pubUrl.publicUrl;
            }
          } catch (e) {
            console.warn('Storage Supabase upload échoué, repli local:', e);
          }
        }

        // Sinon envoi au serveur local /api/upload-image
        if (!uploadedUrl && STATE.isLocalServerOnline) {
          try {
            const res = await fetch('/api/upload-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: file.name.replace(/\.[^.]+$/, '') + '.webp', data: compressedBase64 })
            });
            const data = await res.json();
            if (data.ok && data.path) uploadedUrl = data.path;
          } catch (e) {}
        }

        // Repli base64
        if (!uploadedUrl) uploadedUrl = compressedBase64;

        curColor.img.push(uploadedUrl);

        // Version JPEG de partage pour les aperçus WhatsApp (max 1200px, < 300 Ko)
        if (!curColor.og_img || curColor.img.length === 1) {
          try {
            const jpegBase64 = await resizeImageToJpeg(file, 1200, 0.82);
            let ogUrl = null;
            if (STATE.supabase) {
              const shareName = `og-share-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.jpg`;
              const blob = await (await fetch(jpegBase64)).blob();
              const { data: sData } = await STATE.supabase.storage.from('produits').upload(shareName, blob, { contentType: 'image/jpeg' });
              if (sData) {
                const { data: pubUrl } = STATE.supabase.storage.from('produits').getPublicUrl(shareName);
                ogUrl = pubUrl.publicUrl;
              }
            }
            if (!ogUrl && STATE.isLocalServerOnline) {
              const resOg = await fetch('/api/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: `og-share-${Date.now()}.jpg`, data: jpegBase64 })
              });
              const dOg = await resOg.json();
              if (dOg.ok && dOg.path) ogUrl = dOg.path;
            }
            if (ogUrl) curColor.og_img = ogUrl;
          } catch(e) {}
        }
      } catch (err) {
        console.error('Erreur traitement image:', err);
      }
      completed++;
      progressBar.style.width = `${Math.round((completed / total) * 100)}%`;
    }

    setTimeout(() => {
      progressContainer.style.display = 'none';
      progressBar.style.width = '0%';
    }, 400);

    setDirty(true);
    renderPhotoTabs();
    renderPhotosGallery();
    renderLiveClientPreview();
    showToast(`${completed} photo${completed > 1 ? 's' : ''} ajoutée${completed > 1 ? 's' : ''}`);
    fileInput.value = '';
  }

  function resizeImageToWebP(file, maxWidth = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/webp', quality));
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function resizeImageToJpeg(file, maxWidth = 1200, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          let q = quality;
          let dataUrl = canvas.toDataURL('image/jpeg', q);
          while (dataUrl.length * 0.75 > 300 * 1024 && q > 0.4) {
            q -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', q);
          }
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Aperçu boutique en direct
  function renderLiveClientPreview() {
    const curColor = STATE.editingProduct.couleurs[STATE.activePhotoColorIndex] || STATE.editingProduct.couleurs[0];
    const name = $('prodName').value.trim() || 'Nom du vêtement';
    const price = $('prodPrice').value.trim();
    const oldPrice = $('prodOldPrice').value.trim();

    $('previewCardTitle').textContent = name;

    const isPromo = oldPrice && Number(oldPrice) > Number(price);
    $('previewCardPrice').innerHTML = isPromo
      ? `<span class="price-strike">${formatMoney(oldPrice)}</span> <strong>${formatMoney(price)}</strong>`
      : `<strong>${formatMoney(price)}</strong>`;

    const imgContainer = $('previewCardImg');
    if (curColor && curColor.img && curColor.img.length) {
      imgContainer.innerHTML = `<img src="${curColor.img[0]}" alt="${name}">`;
    } else {
      imgContainer.innerHTML = `
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f3f4f6">
          <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.8" style="width:40px;height:40px">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          </svg>
        </div>
      `;
    }

    const dotsContainer = $('previewCardDots');
    dotsContainer.innerHTML = STATE.editingProduct.couleurs.map(c => `
      <span style="width:10px;height:10px;border-radius:50%;background:${c.hex};border:1px solid rgba(0,0,0,0.1)"></span>
    `).join('');
  }

  // Enregistrement du produit
  $('productForm').addEventListener('submit', async e => {
    e.preventDefault();

    const name = $('prodName').value.trim();
    const price = parseInt($('prodPrice').value, 10);
    const oldPrice = $('prodOldPrice').value ? parseInt($('prodOldPrice').value, 10) : null;
    const cat = $('prodCategory').value;
    const desc = $('prodDesc').value.trim();
    const visible = $('prodVisible').checked;

    if (!name) {
      showToast('Le nom du produit est obligatoire.', 'error');
      $('prodName').focus();
      return;
    }
    if (isNaN(price) || price <= 0) {
      showToast('Veuillez saisir un prix valide.', 'error');
      $('prodPrice').focus();
      return;
    }

    STATE.editingProduct.nom = name;
    STATE.editingProduct.cat = cat;
    STATE.editingProduct.prix = price;
    STATE.editingProduct.ancien = oldPrice;
    STATE.editingProduct.desc = desc;
    STATE.editingProduct.visible = visible;
    STATE.editingProduct.details = STATE.editingProduct.details.filter(d => d.trim().length > 0);

    // Mettre à jour dans la liste
    const existingIdx = STATE.produits.findIndex(p => String(p.id) === String(STATE.editingProduct.id));
    if (existingIdx >= 0) {
      STATE.produits[existingIdx] = STATE.editingProduct;
    } else {
      STATE.produits.unshift(STATE.editingProduct);
    }

    $('btnSaveProduct').disabled = true;
    $('btnSaveProduct').textContent = 'Enregistrement...';

    await persistCatalog();

    $('btnSaveProduct').disabled = false;
    $('btnSaveProduct').textContent = 'Enregistrer le produit';
    setDirty(false);

    showToast(`Produit « ${name} » enregistré avec succès`);
    switchView('produits');
  });

  // Annuler l'édition
  $('btnCancelTop').addEventListener('click', () => switchView('produits'));
  $('btnCancelBottom').addEventListener('click', () => switchView('produits'));

  // --- COMMANDES (COMMANDES BOUTIQUE & ACTIONS WHATSAPP) ---
  let activeOrderStatusFilter = 'all';

  $$('#orderStatusFilters [data-order-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#orderStatusFilters [data-order-status]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeOrderStatusFilter = btn.dataset.orderStatus;
      renderOrdersTable();
    });
  });

  function renderOrdersTable() {
    const tbody = $('ordersTableBody');
    const emptyState = $('ordersEmptyState');
    if (!tbody) return;

    let list = STATE.commandes;
    if (activeOrderStatusFilter !== 'all') {
      list = list.filter(cmd => cmd.statut === activeOrderStatusFilter);
    }

    if (!list.length) {
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    tbody.innerHTML = list.map(cmd => {
      const dateStr = new Date(cmd.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      return `
        <tr>
          <td><small style="color:var(--text-muted)">${dateStr}</small></td>
          <td><strong>${cmd.numero}</strong></td>
          <td>
            <strong>${cmd.client_nom}</strong>
            <div style="font-size:12px;color:var(--text-muted)">${cmd.client_adresse}</div>
          </td>
          <td>${cmd.client_tel}</td>
          <td><strong>${formatMoney(cmd.total)}</strong></td>
          <td><span class="badge badge-order-${cmd.statut}">${cmd.statut}</span></td>
          <td>
            <div class="row-actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.viewOrderDetail('${cmd.id}')">
                Voir
              </button>
              <button type="button" class="btn btn-primary btn-sm" onclick="window.openOrderWhatsApp('${cmd.id}')">
                WhatsApp
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  let selectedOrder = null;
  window.viewOrderDetail = function (orderId) {
    selectedOrder = STATE.commandes.find(c => c.id === orderId);
    if (!selectedOrder) return;

    $('modalOrderNumber').textContent = `Commande ${selectedOrder.numero}`;
    $('modalOrderDate').textContent = new Date(selectedOrder.created_at).toLocaleString('fr-FR');
    $('modalOrderClientName').textContent = selectedOrder.client_nom;
    $('modalOrderClientTel').textContent = selectedOrder.client_tel;
    $('modalOrderClientAddr').textContent = selectedOrder.client_adresse;
    $('modalOrderPayMode').textContent = selectedOrder.paiement_mode || 'Wave';

    const statusBadge = $('modalOrderCurrentStatus');
    statusBadge.className = `badge badge-order-${selectedOrder.statut}`;
    statusBadge.textContent = selectedOrder.statut;

    $('modalOrderTotal').textContent = formatMoney(selectedOrder.total);

    const articlesList = $('modalOrderArticlesList');
    articlesList.innerHTML = (selectedOrder.articles || []).map(art => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border-light)">
        <div>
          <strong>${art.nom}</strong>
          <div style="font-size:12px;color:var(--text-muted)">${art.couleur || ''} · Taille ${art.taille || 'Unique'} · Qté : ${art.quantite}</div>
        </div>
        <strong>${formatMoney(art.prix * art.quantite)}</strong>
      </div>
    `).join('');

    $('orderDetailModal').style.display = 'flex';
  };

  function closeOrderModal() {
    $('orderDetailModal').style.display = 'none';
  }
  $('btnCloseOrderModal').addEventListener('click', closeOrderModal);
  $('btnCloseOrderModal2').addEventListener('click', closeOrderModal);

  // Changement de statut de commande en 1 clic
  $$('[data-set-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!selectedOrder) return;
      const newStatus = btn.dataset.setStatus;
      selectedOrder.statut = newStatus;
      await saveOrders();
      renderOrdersTable();
      renderDashboard();
      window.viewOrderDetail(selectedOrder.id);
      showToast(`Statut de la commande passé à : ${newStatus}`);
    });
  });

  // Bouton WhatsApp direct avec message personnalisé
  $('btnOrderWhatsApp').addEventListener('click', () => {
    if (selectedOrder) window.openOrderWhatsApp(selectedOrder.id);
  });

  window.openOrderWhatsApp = function (orderId) {
    const cmd = STATE.commandes.find(c => c.id === orderId);
    if (!cmd) return;

    let telClean = cmd.client_tel.replace(/[^0-9]/g, '');
    if (telClean.startsWith('00')) telClean = telClean.slice(2);
    if (telClean.length === 9) telClean = '221' + telClean; // Sénégal par défaut

    const articlesText = (cmd.articles || []).map(a => `• ${a.quantite}x ${a.nom} (${a.couleur}, Taille ${a.taille})`).join('\n');
    const msg = `Bonjour ${cmd.client_nom}, c'est Silence Work Sénégal concernant votre commande n° ${cmd.numero} (${formatMoney(cmd.total)}).\n\nArticles commandés :\n${articlesText}\n\nAdresse de livraison : ${cmd.client_adresse}\n\nNous préparons votre commande. Souhaitez-vous une livraison aujourd'hui ?`;

    window.open(`https://wa.me/${telClean}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };

  // --- CATÉGORIES (GESTION, RENOMMAGE & SÉCURITÉ DE SUPPRESSION) ---
  function renderCategoriesTable() {
    const tbody = $('categoriesTableBody');
    if (!tbody) return;

    tbody.innerHTML = STATE.categories.map((cat, i) => {
      const attachedCount = STATE.produits.filter(p => p.cat === cat).length;
      return `
        <tr>
          <td>
            <strong>${cat}</strong>
          </td>
          <td>
            <span class="badge badge-cat">${attachedCount} produit${attachedCount > 1 ? 's' : ''}</span>
          </td>
          <td>
            <div class="row-actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.renameCategory(${i})">
                Renommer
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.deleteCategory(${i})">
                Supprimer
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  $('addCategoryForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('newCategoryName').value.trim();
    if (!name) return;
    if (STATE.categories.includes(name)) {
      showToast('Cette catégorie existe déjà.', 'error');
      return;
    }
    STATE.categories.push(name);
    $('newCategoryName').value = '';
    persistCatalog();
    renderCategoriesTable();
    populateCategorySelects();
    showToast(`Catégorie « ${name} » ajoutée`);
  });

  window.renameCategory = function (idx) {
    const oldName = STATE.categories[idx];
    const newName = prompt(`Nouveau nom pour la catégorie « ${oldName} » :`, oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;

    const trimmed = newName.trim();
    STATE.categories[idx] = trimmed;

    // Mettre à jour les produits rattachés
    STATE.produits.forEach(p => {
      if (p.cat === oldName) p.cat = trimmed;
    });

    persistCatalog();
    renderCategoriesTable();
    populateCategorySelects();
    showToast(`Catégorie renommée en « ${trimmed} »`);
  };

  window.deleteCategory = function (idx) {
    const cat = STATE.categories[idx];
    const attachedCount = STATE.produits.filter(p => p.cat === cat).length;

    // Refuser si des produits y sont rattachés
    if (attachedCount > 0) {
      alert(`Impossible de supprimer la catégorie « ${cat} » car ${attachedCount} produit(s) y sont rattachés.\nDéplacez d'abord ces produits vers une autre catégorie.`);
      return;
    }

    showConfirmModal(
      `Supprimer la catégorie « ${cat} » ?`,
      'Cette catégorie vide sera retirée de la liste.',
      () => {
        STATE.categories.splice(idx, 1);
        persistCatalog();
        renderCategoriesTable();
        populateCategorySelects();
        showToast('Catégorie supprimée');
      }
    );
  };

  // --- PARAMÈTRES (WHATSAPP, BANDEAU & SUPABASE CONFIG) ---
  $('settingsForm').addEventListener('submit', async e => {
    e.preventDefault();
    const wa = $('settingWhatsapp').value.trim();
    const bandeau = $('settingBandeau').value.trim();
    const subUrl = $('settingSupabaseUrl').value.trim();
    const subKey = $('settingSupabaseAnonKey').value.trim();

    STATE.settings.whatsapp = wa;
    STATE.settings.bandeau = bandeau;
    STATE.settings.supabaseUrl = subUrl;
    STATE.settings.supabaseAnonKey = subKey;

    localStorage.setItem('sw_supabase_config', JSON.stringify({ url: subUrl, key: subKey }));
    initSupabase();

    await persistCatalog();
    showToast('Paramètres enregistrés avec succès');
  });

  $('btnTestSupabase').addEventListener('click', async () => {
    const url = $('settingSupabaseUrl').value.trim();
    const key = $('settingSupabaseAnonKey').value.trim();

    if (!url || !key) {
      showToast('Veuillez renseigner l\'URL et la clé Supabase.', 'error');
      return;
    }

    if (typeof window.supabase === 'undefined') {
      showToast('Client Supabase non chargé.', 'error');
      return;
    }

    $('btnTestSupabase').disabled = true;
    $('btnTestSupabase').textContent = 'Test en cours...';

    try {
      const client = window.supabase.createClient(url, key);
      const { data, error } = await client.from('produits').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') throw error;
      showToast('Connexion à Supabase réussie !');
      STATE.isSupabaseOnline = true;
      updateSupabaseStatusDisplay();
    } catch (err) {
      showToast('Échec de connexion : ' + (err.message || 'Vérifiez les clés'), 'error');
    } finally {
      $('btnTestSupabase').disabled = false;
      $('btnTestSupabase').textContent = 'Tester la connexion';
    }
  });

  window.copyMigrationSql = async function () {
    try {
      const res = await fetch('/supabase/migration.sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      showToast('Script SQL copié dans le presse-papier !');
    } catch (e) {
      showToast('Ouvrez supabase/migration.sql pour copier le script.', 'error');
    }
  };

  // Fonctions utilitaires
  function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
  }

  // --- DÉMARRAGE DE L'APPLICATION ---
  initSupabase();
  checkAuthSession();

})();
