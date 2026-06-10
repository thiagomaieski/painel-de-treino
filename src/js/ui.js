import Chart from 'chart.js/auto';
import { DB } from './database.js';
import { WorkoutManager } from './workout.js';
import { DietManager } from './diet.js';

let weightChartInstance = null;

export const UIManager = {
  // Inicialização geral da UI
  init() {
    this.setupDateDefaults();
    this.setupEventListeners();
    this.renderAll();
    this.highlightTodayTab();
    
    // Alerta de peso matinal proativo
    setTimeout(() => this.checkWeightNotification(), 1200);
  },

  setupDateDefaults() {
    const today = this.todayISO();
    const wDateInput = document.getElementById('w-date');
    const walkDateInput = document.getElementById('walk-date');
    const dietDateInput = document.getElementById('diet-date');

    if (wDateInput) wDateInput.value = today;
    if (walkDateInput) walkDateInput.value = today;
    if (dietDateInput) {
      dietDateInput.value = today;
      dietDateInput.addEventListener('change', () => {
        this.renderDietPage();
      });
    }
  },

  setupEventListeners() {
    // Escutas para buscas de alimentos na Dieta
    const searchInput = document.getElementById('food-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleFoodSearch(e.target.value);
      });
    }

    // Modal de adicionar alimento
    const addCustomFoodForm = document.getElementById('custom-food-form');
    if (addCustomFoodForm) {
      addCustomFoodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCustomFoodSubmit();
      });
    }
  },

  todayISO() {
    const date = new Date();
    // Ajuste de fuso horário local
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  },

  // Alternar abas principais (Bottom Nav)
  switchTab(tabId, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    
    const targetPage = document.getElementById('page-' + tabId);
    if (targetPage) targetPage.classList.add('active');
    
    if (el) el.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Ações específicas ao carregar certas abas
    if (tabId === 'inicio') {
      this.renderWeightChart();
    } else if (tabId === 'dieta') {
      this.renderDietPage();
    }
  },

  // Alternar sub-abas de dias da semana (aba Treinos)
  switchWorkoutDay(dayId, el) {
    document.querySelectorAll('.workout-day-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.workout-sub-tab').forEach(t => t.classList.remove('active'));
    
    const targetDayPage = document.getElementById('wday-' + dayId);
    if (targetDayPage) targetDayPage.classList.add('active');
    
    if (el) el.classList.add('active');
  },

  // Destacar o dia da semana atual no seletor de treinos
  highlightTodayTab() {
    const d = new Date().getDay(); // 0 = Dom, 1 = Seg, 2 = Ter, etc.
    const map = { 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex' };
    const dayKey = map[d];
    
    if (dayKey) {
      const subTabs = document.querySelectorAll('.workout-sub-tab');
      subTabs.forEach(tab => {
        if (tab.getAttribute('data-day') === dayKey) {
          tab.classList.add('is-today');
          // Ativa o treino do dia atual por padrão
          this.switchWorkoutDay(dayKey, tab);
        }
      });
    } else {
      // Se for fim de semana, abre segunda por padrão
      const firstTab = document.querySelector('.workout-sub-tab');
      if (firstTab) this.switchWorkoutDay('seg', firstTab);
    }
  },

  showToast(msg) {
    const t = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    if (!t || !toastMsg) return;
    
    toastMsg.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  },

  // ─────────────────────────────────────────────
  // RENDERIZADORES
  // ─────────────────────────────────────────────
  renderAll() {
    WorkoutManager.loadEditsToDOM();
    this.updateDashboardCalculations();
    this.renderWeightUI();
    this.renderWalkUI();
    this.renderWeightChart();
    this.updateAllDaySummaries();
  },

  // Renderizar pesos históricos no dashboard
  renderWeightUI() {
    const log = document.getElementById('weight-log');
    if (!log) return;

    const weights = DB.getWeights();
    if (weights.length === 0) {
      log.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); font-size: 0.8rem; padding: 20px;">Nenhum registro.</div>';
    } else {
      log.innerHTML = [...weights].reverse().map(w => `
        <div class="weight-entry">
          <span class="we-date">${this.formatDate(w.date)}</span>
          <strong class="we-kg">${w.kg.toFixed(1)} kg</strong>
          <button class="we-del" data-date="${w.date}">✕</button>
        </div>
      `).join('');

      // Configurar eventos de exclusão de peso
      log.querySelectorAll('.we-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const date = e.target.getAttribute('data-date');
          this.handleDeleteWeight(date);
        });
      });
    }

    // Atualizar widgets de evolução
    if (weights.length > 0) {
      const last = weights[weights.length - 1].kg;
      const lost = DB.getInitialKg() - last;
      const left = Math.max(0, last - DB.getGoalKg());
      const progress = Math.min(100, Math.round((lost / (DB.getInitialKg() - DB.getGoalKg())) * 100));

      const wsAtual = document.getElementById('ws-atual');
      const wsPerdeu = document.getElementById('ws-perdeu');
      const wsFalta = document.getElementById('ws-falta');
      const wsProgressPct = document.getElementById('ws-progress-pct');
      const wsProgressBar = document.getElementById('ws-progress-bar');
      const heroPeso = document.getElementById('hero-peso');

      if (wsAtual) wsAtual.textContent = last.toFixed(1) + 'kg';
      if (wsPerdeu) wsPerdeu.textContent = (lost >= 0 ? '-' : '+') + Math.abs(lost).toFixed(1) + 'kg';
      if (wsFalta) wsFalta.textContent = left.toFixed(1) + 'kg';
      if (wsProgressPct) wsProgressPct.textContent = progress + '%';
      if (wsProgressBar) wsProgressBar.style.width = progress + '%';
      if (heroPeso) heroPeso.textContent = last.toFixed(1) + 'kg';
    }
  },

  // Renderizar gráfico de peso
  renderWeightChart() {
    const container = document.getElementById('chart-container');
    const canvas = document.getElementById('weightChart');
    if (!container || !canvas) return;

    const weights = DB.getWeights();
    if (weights.length < 2) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';

    const ctx = canvas.getContext('2d');
    if (weightChartInstance) {
      weightChartInstance.destroy();
    }

    weightChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: weights.map(w => this.formatDate(w.date)),
        datasets: [{
          label: 'Peso (kg)',
          data: weights.map(w => w.kg),
          borderColor: '#FF2D55',
          backgroundColor: 'rgba(255, 45, 85, 0.08)',
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#FF2D55',
          tension: 0.35,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#8E8E93', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: { color: '#8E8E93', font: { size: 10 } }
          }
        }
      }
    });
  },

  // Atualizar os cálculos metabólicos do dashboard
  updateDashboardCalculations() {
    const weights = DB.getWeights();
    const currentWeight = weights.length > 0 ? weights[weights.length - 1].kg : DB.getInitialKg();

    // Equação Harris-Benedict revisada para mulheres
    const tmb = 655.1 + (9.563 * currentWeight) + (1.850 * DB.HEIGHT_CM) - (4.676 * DB.AGE);
    const tdee = tmb * DB.ACTIVITY_FACTOR;
    
    // Metas da Nutricionista (Dinamico)
    const goals = DB.getPreplannedDailyGoals();
    const meta = goals.kcal; 
    const prot = goals.prot;

    const calcTmb = document.getElementById('calc-tmb');
    const calcTdee = document.getElementById('calc-tdee');
    const calcMeta = document.getElementById('calc-meta');
    const calcDeficit = document.getElementById('calc-deficit');
    const calcProt = document.getElementById('calc-prot');

    if (calcTmb) calcTmb.textContent = Math.round(tmb).toLocaleString('pt-BR');
    if (calcTdee) calcTdee.textContent = Math.round(tdee).toLocaleString('pt-BR');
    if (calcMeta) calcMeta.textContent = Math.round(meta).toLocaleString('pt-BR');
    if (calcDeficit) calcDeficit.textContent = Math.round(tdee - meta);
    if (calcProt) calcProt.textContent = Math.round(prot) + 'g';

    this.updateActiveExpenditure(currentWeight);
  },

  updateActiveExpenditure(weight) {
    const trainingAvg = (520 + 340 + 485 + 200 + 550) / 7;
    
    // Caminhadas semanais
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const walks = DB.getWalks();
    const weekWalks = walks.filter(w => new Date(w.date) >= startOfWeek);
    const totalWalkKcal = weekWalks.reduce((sum, w) => sum + w.kcal, 0);
    const walkAvg = totalWalkKcal / 7;

    const dashWalkKcal = document.getElementById('dash-walk-kcal');
    const dashActiveAvg = document.getElementById('dash-active-avg');

    if (dashWalkKcal) dashWalkKcal.textContent = Math.round(totalWalkKcal) + ' kcal';
    if (dashActiveAvg) dashActiveAvg.textContent = `~${Math.round(trainingAvg + walkAvg)} kcal/dia`;
  },

  // Caminhadas
  renderWalkUI() {
    const log = document.getElementById('walk-log');
    if (!log) return;

    const walks = DB.getWalks();
    if (walks.length === 0) {
      log.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); font-size: 0.9rem; padding: 20px;">Nenhuma caminhada registrada ainda.</div>';
    } else {
      log.innerHTML = [...walks].reverse().map(w => `
        <div class="walk-entry">
          <span class="we-date">${this.formatDate(w.date)}</span>
          <strong class="we-info">${w.min} min</strong>
          <span class="we-kcal">~${w.kcal} kcal</span>
          <button class="we-del-walk" data-date="${w.date}">✕</button>
        </div>
      `).join('');

      log.querySelectorAll('.we-del-walk').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const date = e.target.getAttribute('data-date');
          this.handleDeleteWalk(date);
        });
      });
    }

    // Estatísticas semanais
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const weekWalks = walks.filter(w => new Date(w.date) >= startOfWeek);
    
    const totalMin = weekWalks.reduce((s, w) => s + w.min, 0);
    const totalKcal = weekWalks.reduce((s, w) => s + w.kcal, 0);

    const wkTotalMin = document.getElementById('wk-total-min');
    const wkTotalKcal = document.getElementById('wk-total-kcal');
    const wkTotalWalks = document.getElementById('wk-total-walks');

    if (wkTotalMin) wkTotalMin.textContent = totalMin + ' min';
    if (wkTotalKcal) wkTotalKcal.textContent = totalKcal + ' kcal';
    if (wkTotalWalks) wkTotalWalks.textContent = weekWalks.length;

    // Atualizar UI dos blocos de caminhada específicos dos dias
    ['seg', 'ter', 'qua', 'qui', 'sex'].forEach(dayId => this.updateDayWalkUI(dayId));
  },

  updateDayWalkUI(dayId) {
    const dateVal = this.getDayISO(dayId);
    const walks = DB.getWalks();
    const rec = walks.find(w => w.date === dateVal);
    
    const form = document.getElementById(`walk-${dayId}-form`);
    const done = document.getElementById(`walk-${dayId}-done`);
    const txt = document.getElementById(`walk-${dayId}-done-txt`);
    
    if (!form || !done) return;
    
    if (rec) {
      form.style.display = 'none';
      done.style.display = 'flex';
      if (txt) txt.textContent = `${rec.min} min · ~${rec.kcal} kcal`;
    } else {
      form.style.display = 'block';
      done.style.display = 'none';
    }
  },

  updateDaySummary(dayId) {
    const date = this.getDayISO(dayId);
    const walks = DB.getWalks();
    const rec = walks.find(w => w.date === date);
    const base = WorkoutManager.DAY_KCAL_BASE[dayId];
    
    const row = document.getElementById(`sum-${dayId}-walk`);
    const val = document.getElementById(`sum-${dayId}-walk-val`);
    const total = document.getElementById(`sum-${dayId}-total`);
    
    if (!row) return;

    if (rec) {
      row.style.display = 'flex';
      if (val) val.textContent = `+${rec.kcal} kcal`;
      if (total) total.textContent = `~${base + rec.kcal} kcal`;
    } else {
      row.style.display = 'none';
      if (total) total.textContent = `~${base} kcal`;
    }
  },

  updateAllDaySummaries() {
    ['seg', 'ter', 'qua', 'qui', 'sex'].forEach(dayId => this.updateDaySummary(dayId));
  },

  // ─────────────────────────────────────────────
  // DIETA & BANCO DE ALIMENTOS
  // ─────────────────────────────────────────────
  renderDietPage() {
    const dateInput = document.getElementById('diet-date');
    if (!dateInput) return;
    const date = dateInput.value;

    const diaryItems = DietManager.getDiaryForDate(date);
    const totals = DietManager.getTotalsForDate(date);

    // Metas Exatas da Nutricionista
    const goals = DB.getPreplannedDailyGoals();
    const calorieGoal = goals.kcal;
    const proteinGoal = goals.prot;
    const carbGoal = goals.carb;
    const fatGoal = goals.fat;

    // Atualizar sumário de calorias ingeridas vs meta
    const calIn = document.getElementById('diet-kcal-in');
    const calMeta = document.getElementById('diet-kcal-target');
    const calRem = document.getElementById('diet-kcal-remaining');
    const statusLabel = document.getElementById('diet-status-label');

    if (calIn) calIn.textContent = totals.kcal;
    if (calMeta) calMeta.textContent = calorieGoal;
    
    const remaining = calorieGoal - totals.kcal;
    if (calRem) calRem.textContent = Math.abs(remaining);
    
    if (statusLabel) {
      if (remaining >= 0) {
        statusLabel.textContent = 'Restantes';
        calRem.style.color = 'var(--text-main)';
      } else {
        statusLabel.textContent = 'Excedidos';
        calRem.style.color = 'var(--pink-primary)';
      }
    }

    // Barras de progresso de macros
    this.updateMacroBar('diet-bar-prot', 'diet-val-prot', totals.prot, proteinGoal, 'g');
    this.updateMacroBar('diet-bar-carb', 'diet-val-carb', totals.carb, carbGoal, 'g');
    this.updateMacroBar('diet-bar-fat', 'diet-val-fat', totals.fat, fatGoal, 'g');

    // Listagem por refeições
    const meals = {
      cafe: { title: '☕ Café da Manhã', el: document.getElementById('meal-cafe') },
      lanche_manha: { title: '🍎 Lanche da Manhã', el: document.getElementById('meal-lanche-manha') },
      almoco: { title: '🍽️ Almoço', el: document.getElementById('meal-almoco') },
      tarde: { title: '🍌 Lanche da Tarde', el: document.getElementById('meal-tarde') },
      jantar: { title: '🥗 Jantar', el: document.getElementById('meal-jantar') },
      ceia: { title: '🥛 Ceia / Extras', el: document.getElementById('meal-ceia') }
    };

    Object.keys(meals).forEach(mealKey => {
      const meal = meals[mealKey];
      if (!meal.el) return;

      const items = diaryItems.filter(item => item.meal === mealKey);
      const listEl = meal.el.querySelector('.meal-list');
      const kcalEl = meal.el.querySelector('.meal-kcal');

      const mealKcal = items.reduce((sum, item) => sum + item.kcal, 0);
      if (kcalEl) kcalEl.textContent = mealKcal > 0 ? `${mealKcal} kcal` : '';

      // Separar Planejados vs Consumidos
      const preplanned = DB.getPreplannedMeal(mealKey) || [];
      const consumedNames = items.map(i => i.foodName);
      const remainingPreplanned = preplanned.filter(p => !consumedNames.includes(p.name));

      let html = '';

      if (items.length > 0) {
        html += `<div class="meal-section-title" style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 8px;">Consumidos:</div>`;
        html += items.map(item => `
          <div class="meal-item">
            <div class="meal-item-info">
              <span class="meal-item-name">${item.foodName}</span>
              <span class="meal-item-details">${item.qty}${item.unit} · P: ${item.prot}g · C: ${item.carb}g · G: ${item.fat}g</span>
            </div>
            <span class="meal-item-kcal">${item.kcal} kcal</span>
            <button class="meal-item-del" data-id="${item.id}">✕</button>
          </div>
        `).join('');
      }

      if (remainingPreplanned.length > 0) {
        if (items.length > 0) html += `<div style="height: 12px;"></div>`;
        html += `<div class="meal-section-title" style="font-size: 0.8rem; color: var(--green-primary); margin-bottom: 8px;">Sugestão da Nutri:</div>`;
        html += remainingPreplanned.map(p => `
          <div class="meal-item preplanned" style="opacity: 0.8; border-left: 3px solid var(--green-primary); padding-left: 8px;">
            <div class="meal-item-info">
              <span class="meal-item-name">${p.name}</span>
              <span class="meal-item-details">Sugerido: ${p.qty}g</span>
            </div>
            <button class="btn-consume-single" data-meal="${mealKey}" data-name="${p.name}" data-qty="${p.qty}" style="background: none; border: none; color: var(--green-primary); font-size: 1.4rem; padding: 4px; cursor: pointer;">+</button>
          </div>
        `).join('');
        
        html += `
          <div style="margin-top: 12px; text-align: center;">
            <button class="btn-consume-all" data-meal="${mealKey}" style="background-color: rgba(52, 199, 89, 0.15); color: var(--green-primary); border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              ✅ Consumir Sugestões (${remainingPreplanned.length})
            </button>
          </div>
        `;
      }

      if (items.length === 0 && remainingPreplanned.length === 0) {
        html = '<div class="meal-empty">Nenhum alimento registrado nesta refeição.</div>';
      }

      listEl.innerHTML = html;

      // Eventos
      listEl.querySelectorAll('.meal-item-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.handleRemoveFood(e.target.getAttribute('data-id'));
        });
      });

      listEl.querySelectorAll('.btn-consume-all').forEach(btn => {
        btn.addEventListener('click', (e) => {
          // Busca preplanned remaining pra data correta na hora de clicar
          this.handleConsumeAllPreplanned(e.currentTarget.getAttribute('data-meal'));
        });
      });
      
      listEl.querySelectorAll('.btn-consume-single').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const btnEl = e.currentTarget;
          const m = btnEl.getAttribute('data-meal');
          const n = btnEl.getAttribute('data-name');
          const q = parseFloat(btnEl.getAttribute('data-qty'));
          this.handleConsumeSinglePreplanned(m, n, q);
        });
      });
    });

    // Atualizar meta calórica dinâmica no Metabolic Widget do dashboard se estiver na mesma data
    if (date === this.todayISO()) {
      const dashWalkKcal = document.getElementById('dash-walk-kcal');
      this.updateDashboardCalculations();
    }
  },

  updateMacroBar(barId, valId, current, goal, unit) {
    const bar = document.getElementById(barId);
    const val = document.getElementById(valId);
    if (!bar || !val) return;

    val.textContent = `${Math.round(current)}${unit} / ${goal}${unit}`;
    const pct = Math.min(100, Math.round((current / goal) * 100));
    bar.style.width = `${pct}%`;
  },

  handleFoodSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (!query.trim()) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
      return;
    }

    const results = DB.searchFoods(query);
    resultsContainer.style.display = 'block';

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div style="padding:16px; text-align:center; color:var(--text-secondary); font-size:0.9rem;">
          Nenhum alimento encontrado.
          <button class="btn-primary" style="padding: 6px 12px; margin-top: 10px; font-size: 0.8rem;" onclick="window.UIManager.openAddCustomFoodModal('${query}')">
            + Cadastrar Alimento
          </button>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = results.map(food => `
        <div class="search-result-item" data-id="${food.id}">
          <div style="display:flex; flex-direction:column;">
            <strong class="food-name">${food.name}</strong>
            <span style="font-size:0.75rem; color:var(--text-tertiary);">
              A cada 100${food.unit} · Kcal: ${food.kcal} · P: ${food.prot}g · C: ${food.carb}g · G: ${food.fat}g
            </span>
          </div>
          <button class="select-food-btn">+</button>
        </div>
      `).join('');

      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.querySelector('.select-food-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const id = item.getAttribute('data-id');
          const food = DB.getAllFoods().find(f => f.id === id);
          this.openAddFoodQtyModal(food);
        });
      });
    }
  },

  // ─────────────────────────────────────────────
  // MODAIS E DIÁLOGOS
  // ─────────────────────────────────────────────
  
  // Modal de peso matinal proativo
  checkWeightNotification() {
    const today = this.todayISO();
    const weights = DB.getWeights();
    const alreadyRegistered = weights.some(w => w.date === today);
    if (alreadyRegistered) return;

    const seenKey = 'julia_prompt_seen_' + today;
    if (localStorage.getItem(seenKey)) return;

    const prompt = document.getElementById('weight-prompt');
    if (prompt) prompt.classList.add('open');
  },

  closeWeightPrompt() {
    const prompt = document.getElementById('weight-prompt');
    if (prompt) prompt.classList.remove('open');
    localStorage.setItem('julia_prompt_seen_' + this.todayISO(), '1');
  },

  savePromptWeight() {
    const input = document.getElementById('prompt-kg');
    if (!input) return;

    const kg = parseFloat(input.value);
    if (isNaN(kg) || kg < 30 || kg > 300) {
      alert("Por favor, insira um peso válido.");
      return;
    }

    const today = this.todayISO();
    let weights = DB.getWeights();
    weights = weights.filter(w => w.date !== today);
    weights.push({ date: today, kg });
    weights.sort((a, b) => a.date.localeCompare(b.date));

    DB.saveWeights(weights);
    this.renderAll();
    this.showToast("Peso registrado!");
    this.closeWeightPrompt();
  },

  // Diálogo de adicionar peso manual
  addWeightManual() {
    const dateEl = document.getElementById('w-date');
    const kgEl = document.getElementById('w-kg');
    if (!dateEl || !kgEl) return;

    const date = dateEl.value;
    const kg = parseFloat(kgEl.value);

    if (!date || isNaN(kg) || kg < 30 || kg > 300) {
      alert("Insira valores de peso e data válidos.");
      return;
    }

    let weights = DB.getWeights();
    weights = weights.filter(w => w.date !== date);
    weights.push({ date, kg });
    weights.sort((a, b) => a.date.localeCompare(b.date));

    DB.saveWeights(weights);
    this.renderAll();
    kgEl.value = '';
    this.showToast("Peso registrado!");
  },

  handleDeleteWeight(date) {
    if (confirm("Deseja realmente remover este registro de peso?")) {
      let weights = DB.getWeights();
      weights = weights.filter(w => w.date !== date);
      DB.saveWeights(weights);
      this.renderAll();
      this.showToast("Peso removido.");
    }
  },

  // Diálogo de adicionar caminhada manual
  addWalkManual() {
    const dateEl = document.getElementById('walk-date');
    const minEl = document.getElementById('walk-min');
    if (!dateEl || !minEl) return;

    const date = dateEl.value;
    const min = parseInt(minEl.value);

    if (!date || isNaN(min) || min < 1) return;

    const kcal = Math.round(min * DB.KCAL_PER_MIN_WALK);
    let walks = DB.getWalks();
    walks = walks.filter(w => w.date !== date);
    walks.push({ date, min, kcal });
    walks.sort((a, b) => a.date.localeCompare(b.date));

    DB.saveWalks(walks);
    this.renderWalkUI();
    this.updateAllDaySummaries();
    this.updateDashboardCalculations();
    minEl.value = '';
    this.showToast(`Caminhada registrada: +${kcal} kcal!`);
  },

  addDayWalk(dayId) {
    const input = document.getElementById(`wday-${dayId}-min`);
    if (!input) return;

    const min = parseInt(input.value);
    if (isNaN(min) || min < 1) return;

    const date = this.getDayISO(dayId);
    const kcal = Math.round(min * DB.KCAL_PER_MIN_WALK);

    let walks = DB.getWalks();
    walks = walks.filter(w => w.date !== date);
    walks.push({ date, min, kcal });

    DB.saveWalks(walks);
    input.value = '';
    this.renderWalkUI();
    this.updateAllDaySummaries();
    this.updateDashboardCalculations();
    this.showToast(`Caminhada de ${min}min salva!`);
  },

  removeDayWalk(dayId) {
    const date = this.getDayISO(dayId);
    let walks = DB.getWalks();
    walks = walks.filter(w => w.date !== date);
    DB.saveWalks(walks);
    
    this.renderWalkUI();
    this.updateAllDaySummaries();
    this.updateDashboardCalculations();
    this.showToast("Caminhada removida.");
  },

  handleDeleteWalk(date) {
    if (confirm("Remover este registro de caminhada?")) {
      let walks = DB.getWalks();
      walks = walks.filter(w => w.date !== date);
      DB.saveWalks(walks);
      
      this.renderWalkUI();
      this.updateAllDaySummaries();
      this.updateDashboardCalculations();
      this.showToast("Caminhada removida.");
    }
  },

  // Modal para quantidade do alimento
  openAddFoodQtyModal(food) {
    const modal = document.getElementById('foodQtyModal');
    const title = document.getElementById('qty-modal-food-name');
    const label = document.getElementById('qty-modal-unit-label');
    const input = document.getElementById('food-qty-input');
    
    if (!modal || !title || !label || !input) return;

    title.textContent = food.name;
    label.textContent = food.unit === 'g' ? 'Quantidade em Gramas (g)' : 'Quantidade em Unidades';
    input.value = food.unit === 'g' ? '100' : '1';
    
    // Armazena temporariamente o alimento selecionado no elemento do modal
    modal.setAttribute('data-selected-food', JSON.stringify(food));
    modal.classList.add('open');
    input.focus();
  },

  closeAddFoodQtyModal() {
    const modal = document.getElementById('foodQtyModal');
    if (modal) modal.classList.remove('open');
  },

  saveFoodToDiary() {
    const modal = document.getElementById('foodQtyModal');
    const input = document.getElementById('food-qty-input');
    const mealSelect = document.getElementById('food-meal-select');
    const dateInput = document.getElementById('diet-date');

    if (!modal || !input || !mealSelect || !dateInput) return;

    const qty = parseFloat(input.value);
    const meal = mealSelect.value;
    const date = dateInput.value;
    
    const foodData = modal.getAttribute('data-selected-food');
    if (!foodData || isNaN(qty) || qty <= 0) return;

    const food = JSON.parse(foodData);
    DietManager.addFoodToDiary(date, meal, food, qty);
    
    this.renderDietPage();
    this.closeAddFoodQtyModal();
    this.showToast(`${food.name} adicionado!`);

    // Limpar busca
    const searchInput = document.getElementById('food-search');
    const resultsContainer = document.getElementById('search-results');
    if (searchInput) searchInput.value = '';
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
    }
  },

  handleRemoveFood(id) {
    DietManager.removeFoodFromDiary(id);
    this.renderDietPage();
    this.showToast("Alimento removido.");
  },

  handleConsumeSinglePreplanned(mealKey, foodName, qty) {
    const dateInput = document.getElementById('diet-date');
    if (!dateInput) return;
    const date = dateInput.value;

    const allFoods = DB.getAllFoods();
    const foodObj = allFoods.find(f => f.name === foodName);

    if (foodObj) {
      DietManager.addFoodToDiary(date, mealKey, foodObj, qty);
      this.renderDietPage();
      this.showToast(`${foodName} adicionado!`);
    } else {
      this.showToast(`Alimento ${foodName} não encontrado no banco.`);
    }
  },

  handleConsumeAllPreplanned(mealKey) {
    const dateInput = document.getElementById('diet-date');
    if (!dateInput) return;
    const date = dateInput.value;

    const diaryItems = DietManager.getDiaryForDate(date);
    const items = diaryItems.filter(item => item.meal === mealKey);
    const consumedNames = items.map(i => i.foodName);

    const preplanned = DB.getPreplannedMeal(mealKey) || [];
    const remainingPreplanned = preplanned.filter(p => !consumedNames.includes(p.name));

    const allFoods = DB.getAllFoods();
    const foodsToAdd = [];

    remainingPreplanned.forEach(p => {
      const foodObj = allFoods.find(f => f.name === p.name);
      if (foodObj) {
        foodsToAdd.push({ food: foodObj, qty: p.qty });
      }
    });

    if (foodsToAdd.length > 0) {
      DietManager.consumeMultipleFoods(date, mealKey, foodsToAdd);
      this.renderDietPage();
      this.showToast(`${foodsToAdd.length} sugestões consumidas!`);
    }
  },

  // Modal para cadastrar alimento customizado
  openAddCustomFoodModal(prefilledName = '') {
    const modal = document.getElementById('customFoodModal');
    const nameInput = document.getElementById('cf-name');
    if (!modal || !nameInput) return;

    nameInput.value = prefilledName;
    modal.classList.add('open');
  },

  closeCustomFoodModal() {
    const modal = document.getElementById('customFoodModal');
    if (modal) modal.classList.remove('open');
  },

  handleCustomFoodSubmit() {
    const name = document.getElementById('cf-name').value.trim();
    const kcal = document.getElementById('cf-kcal').value;
    const prot = document.getElementById('cf-prot').value;
    const carb = document.getElementById('cf-carb').value;
    const fat = document.getElementById('cf-fat').value;
    const unit = document.getElementById('cf-unit').value;
    const group = document.getElementById('cf-group') ? document.getElementById('cf-group').value : 'especial';

    if (!name || !kcal || !prot || !carb || !fat) {
      alert("Preencha todos os campos do alimento.");
      return;
    }

    const food = DietManager.createCustomFood(name, kcal, prot, carb, fat, unit, group);
    this.closeCustomFoodModal();
    this.showToast(`Alimento "${name}" cadastrado!`);
    
    if (window.SettingsManager) {
      window.SettingsManager.renderFoodBankList();
    }
    
    // Abre direto o modal de quantidade para facilitar a adição ao diário
    this.openAddFoodQtyModal(food);
  },

  // Modal para editar exercícios
  openEditWorkout(card, index) {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    modal.setAttribute('data-card-index', index);

    document.getElementById('edit-name').value = card.querySelector('.ex-name').textContent.trim();
    document.getElementById('edit-equip').value = card.querySelector('.ex-equip').textContent.trim();
    
    const stats = card.querySelectorAll('.s-val');
    document.getElementById('edit-series').value = stats[0] ? stats[0].textContent.trim() : '';
    document.getElementById('edit-reps').value = stats[1] ? stats[1].textContent.trim() : '';
    document.getElementById('edit-rest').value = stats[2] ? stats[2].textContent.trim() : '';
    
    const tipEl = card.querySelector('.ex-tip');
    document.getElementById('edit-tip').value = tipEl ? tipEl.textContent.trim() : '';
    
    modal.classList.add('open');
  },

  closeEditWorkoutModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.classList.remove('open');
  },

  saveWorkoutEdit() {
    const modal = document.getElementById('editModal');
    if (!modal) return;

    const index = modal.getAttribute('data-card-index');
    const cards = document.querySelectorAll('.ex-card');
    const card = cards[index];

    if (!card) return;

    const name = document.getElementById('edit-name').value.trim();
    const equip = document.getElementById('edit-equip').value.trim();
    const ser = document.getElementById('edit-series').value.trim();
    const reps = document.getElementById('edit-reps').value.trim();
    const rest = document.getElementById('edit-rest').value.trim();
    const tip = document.getElementById('edit-tip').value.trim();

    if (name) card.querySelector('.ex-name').textContent = name;
    if (equip) card.querySelector('.ex-equip').textContent = equip;
    
    const stats = card.querySelectorAll('.s-val');
    if (stats[0] && ser) stats[0].textContent = ser;
    if (stats[1] && reps) stats[1].textContent = reps;
    if (stats[2] && rest) stats[2].textContent = rest;
    
    const tipEl = card.querySelector('.ex-tip');
    if (tipEl) tipEl.textContent = tip;

    WorkoutManager.saveEditsFromDOM();
    this.closeEditWorkoutModal();
    this.showToast("Exercício atualizado!");
  },

  // ─────────────────────────────────────────────
  // AJUDANTES GERAIS
  // ─────────────────────────────────────────────
  getDayISO(dayId) {
    const now = new Date();
    const wd = now.getDay();
    const map = { seg: 1, ter: 2, qua: 3, qui: 4, sex: 5 };
    const target = map[dayId];
    const curr = new Date(now);
    const diff = target - wd;
    curr.setDate(now.getDate() + diff);
    return curr.toISOString().split('T')[0];
  },

  formatDate(iso) {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length < 3) return iso;
    const [y, m, d] = parts;
    return `${d}/${m}`;
  }
};

// Vincula o UIManager ao objeto global window para permitir chamadas via onclick no HTML
window.UIManager = UIManager;
