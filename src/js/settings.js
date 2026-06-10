import { DB } from './database.js';

export const SettingsManager = {
  init() {
    this.renderProfile();
    this.renderFoodBankList();
    this.attachEventListeners();
  },

  attachEventListeners() {
    // Inicialização extra se necessária
  },

  // ── PERFIL E BIOMETRIA ──

  renderProfile() {
    // Pesos, Idade, Altura, Nome
    const name = DB.getName();
    const heroName = document.getElementById('hero-name-h1');
    const heroAvatarInitial = document.getElementById('hero-avatar-initial');
    const configNomeEl = document.getElementById('config-nome');

    if (heroName) heroName.innerText = name;
    if (heroAvatarInitial) heroAvatarInitial.innerText = name.charAt(0).toUpperCase();
    if (configNomeEl) configNomeEl.innerHTML = `${name} <span class="settings-icon-right">›</span>`;

    const initKgEl = document.getElementById('config-peso-inicial');
    const metaKgEl = document.getElementById('config-peso-meta');
    const idadeEl = document.getElementById('config-idade');
    const alturaEl = document.getElementById('config-altura');
    
    if (initKgEl) initKgEl.innerHTML = `${DB.getInitialKg()} kg <span class="settings-icon-right">›</span>`;
    if (metaKgEl) metaKgEl.innerHTML = `${DB.getGoalKg()} kg <span class="settings-icon-right">›</span>`;
    if (idadeEl) idadeEl.innerHTML = `${DB.getAge()} Anos <span class="settings-icon-right">›</span>`;
    
    // Mostra altura em metros (ex: 175cm -> 1.75m)
    const h = DB.getHeight();
    if (alturaEl) alturaEl.innerHTML = `${h > 3 ? (h/100).toFixed(2) : h.toFixed(2)} m <span class="settings-icon-right">›</span>`;

    // Avatar
    const avatar = localStorage.getItem('julia_avatar');
    const imgEl = document.getElementById('settings-avatar-img');
    const phEl = document.getElementById('settings-avatar-placeholder');
    const heroAvatar = document.getElementById('hero-avatar-img');
    const heroInitial = document.getElementById('hero-avatar-initial');
    
    if (avatar) {
      if (imgEl) { imgEl.src = avatar; imgEl.style.display = 'flex'; }
      if (phEl) phEl.style.display = 'none';
      if (heroAvatar) { heroAvatar.src = avatar; heroAvatar.style.display = 'block'; }
      if (heroInitial) { heroInitial.style.display = 'none'; }
    }
  },

  promptNome() {
    window.UIManager.openGenericPromptModal(
      'Nome de Exibição',
      'Como gostaria de ser chamado(a)?',
      DB.getName(),
      'text',
      (val) => {
        if (val && val.trim().length > 0) {
          DB.setName(val.trim());
          this.renderProfile();
        }
      }
    );
  },

  promptPesoInicial() {
    window.UIManager.openGenericPromptModal(
      'Peso Inicial',
      'Digite seu peso inicial (kg):',
      DB.getInitialKg(),
      'number',
      (val) => {
        if (!isNaN(parseFloat(val))) {
          DB.setInitialKg(parseFloat(val));
          this.renderProfile();
          if (window.UIManager) window.UIManager.renderProgressWidgets();
        }
      }
    );
  },

  promptPesoMeta() {
    window.UIManager.openGenericPromptModal(
      'Meta de Peso',
      'Digite sua meta de peso (kg):',
      DB.getGoalKg(),
      'number',
      (val) => {
        if (!isNaN(parseFloat(val))) {
          DB.setGoalKg(parseFloat(val));
          this.renderProfile();
          if (window.UIManager) window.UIManager.renderProgressWidgets();
        }
      }
    );
  },

  promptIdade() {
    window.UIManager.openGenericPromptModal(
      'Sua Idade',
      'Digite sua idade:',
      DB.getAge(),
      'number',
      (val) => {
        if (!isNaN(parseInt(val))) {
          DB.setAge(parseInt(val));
          this.renderProfile();
        }
      }
    );
  },

  promptAltura() {
    let current = DB.getHeight();
    if (current > 3) current = (current / 100).toFixed(2);
    
    window.UIManager.openGenericPromptModal(
      'Sua Altura',
      'Digite sua altura em metros (ex: 1.75):',
      current,
      'number',
      (val) => {
        if (!isNaN(parseFloat(val))) {
          let h = parseFloat(val);
          if (h < 3) h = h * 100;
          DB.setHeight(h);
          this.renderProfile();
        }
      }
    );
  },

  handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar para miniatura (máx 300x300)
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        localStorage.setItem('julia_avatar', base64);
        this.renderProfile();
        
        // Tentativa de atualizar avatar na página inicial
        const heroIcon = document.querySelector('.hero-avatar');
        if (heroIcon) {
          heroIcon.innerHTML = `<img src="${base64}" style="width:100%;height:100%;border-radius:18px;object-fit:cover;">`;
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  // ── BANCO DE ALIMENTOS ──

  renderFoodBankList() {
    const listEl = document.getElementById('config-food-list');
    const searchEl = document.getElementById('config-food-search');
    if (!listEl) return;

    const query = searchEl ? searchEl.value.toLowerCase().trim() : '';
    const allFoods = DB.getAllFoods();
    
    // Filtrar
    const filtered = allFoods.filter(f => f.name.toLowerCase().includes(query));

    listEl.innerHTML = '';
    
    // Header com Total
    listEl.innerHTML += `<div style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:12px; text-align:right;">Total de alimentos: ${filtered.length}</div>`;

    if (filtered.length === 0) {
      listEl.innerHTML += '<div style="text-align:center;color:var(--text-tertiary);padding:20px;">Nenhum alimento encontrado.</div>';
      return;
    }

    // Agrupar por categoria
    const grouped = {};
    filtered.forEach(food => {
      const g = food.group || 'outros';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(food);
    });

    Object.keys(grouped).forEach(groupName => {
      // Título do grupo
      const groupTitle = groupName.charAt(0).toUpperCase() + groupName.slice(1).replace('_', ' ');
      listEl.innerHTML += `<div style="font-size:0.85rem; font-weight:800; text-transform:uppercase; color:var(--text-main); margin:16px 0 8px;">${groupTitle}</div>`;

      grouped[groupName].forEach(food => {
        const isEdited = DB.getEditedFoods()[food.id] !== undefined;
        const editedBadge = isEdited ? '<span style="color:var(--pink-primary);font-size:0.65rem;font-weight:800;background:var(--pink-soft);padding:2px 6px;border-radius:4px;margin-left:6px;">Editado</span>' : '';
        
        const itemHTML = `
          <div class="fb-item">
            <div class="fb-item-info">
              <h4>${food.name} ${editedBadge}</h4>
              <p>100${food.unit} = ${food.kcal100} kcal</p>
              <div class="fb-item-macros">
                <span class="fb-macro">P: ${food.prot100}g</span>
                <span class="fb-macro">C: ${food.carb100}g</span>
                <span class="fb-macro">G: ${food.fat100}g</span>
              </div>
            </div>
            <button class="fb-edit-btn" onclick="window.SettingsManager.openEditFoodModal('${food.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
        `;
        listEl.insertAdjacentHTML('beforeend', itemHTML);
      });
    });
  },

  openEditFoodModal(foodId) {
    const allFoods = DB.getAllFoods();
    const food = allFoods.find(f => f.id === foodId);
    if (!food) return;

    document.getElementById('edit-food-id').value = foodId;
    document.getElementById('edit-food-kcal').value = food.kcal100;
    document.getElementById('edit-food-prot').value = food.prot100;
    document.getElementById('edit-food-carb').value = food.carb100;
    document.getElementById('edit-food-fat').value = food.fat100;

    const modal = document.getElementById('modal-edit-food');
    const isEdited = DB.getEditedFoods()[foodId] !== undefined;
    const btnReset = document.getElementById('btn-reset-food');
    if (btnReset) {
      btnReset.style.display = isEdited ? 'block' : 'none';
    }

    modal.classList.add('open');
  },

  closeEditFoodModal() {
    document.getElementById('modal-edit-food').classList.remove('open');
  },

  saveFoodEdit() {
    const id = document.getElementById('edit-food-id').value;
    const kcal = parseFloat(document.getElementById('edit-food-kcal').value);
    const prot = parseFloat(document.getElementById('edit-food-prot').value);
    const carb = parseFloat(document.getElementById('edit-food-carb').value);
    const fat = parseFloat(document.getElementById('edit-food-fat').value);

    if (isNaN(kcal) || isNaN(prot) || isNaN(carb) || isNaN(fat)) {
      alert("Valores inválidos.");
      return;
    }

    DB.saveEditedFood(id, {
      kcal100: kcal,
      prot100: prot,
      carb100: carb,
      fat100: fat
    });

    this.closeEditFoodModal();
    this.renderFoodBankList();
    if (window.UIManager && window.UIManager.toast) {
      window.UIManager.toast("Valores atualizados com sucesso!");
    }
  },

  resetFoodEdit() {
    const id = document.getElementById('edit-food-id').value;
    DB.resetEditedFood(id);
    this.closeEditFoodModal();
    this.renderFoodBankList();
    if (window.UIManager && window.UIManager.toast) {
      window.UIManager.toast("Alimento restaurado ao padrão da nutri.");
    }
  }
};
