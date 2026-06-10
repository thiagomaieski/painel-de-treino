import { DB } from './database.js';

export const WorkoutManager = {
  DAY_KCAL_BASE: {
    seg: 520,
    ter: 340,
    qua: 485,
    qui: 200,
    sex: 550
  },

  initEditButtons(openEditCallback) {
    document.querySelectorAll('.ex-card').forEach((card, index) => {
      const top = card.querySelector('.ex-top');
      if (!top) return;
      
      // Evitar duplicar botões se reinicializado
      if (card.querySelector('.edit-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'edit-btn';
      btn.textContent = 'Editar';
      btn.onclick = (e) => { 
        e.stopPropagation(); 
        openEditCallback(card, index); 
      };
      top.appendChild(btn);
    });
  },

  saveEditsFromDOM() {
    const data = {};
    document.querySelectorAll('.ex-card').forEach((card, i) => {
      const stats = card.querySelectorAll('.s-val');
      data[i] = {
        name: card.querySelector('.ex-name').textContent.trim(),
        equip: card.querySelector('.ex-equip').textContent.trim(),
        ser: stats[0] ? stats[0].textContent.trim() : '',
        reps: stats[1] ? stats[1].textContent.trim() : '',
        rest: stats[2] ? stats[2].textContent.trim() : '',
        tip: card.querySelector('.ex-tip') ? card.querySelector('.ex-tip').textContent.trim() : ''
      };
    });
    DB.saveWorkoutEdits(data);
  },

  loadEditsToDOM() {
    const data = DB.getWorkoutEdits();
    if (!data || Object.keys(data).length === 0) return;
    
    document.querySelectorAll('.ex-card').forEach((card, i) => {
      if (!data[i]) return;
      const d = data[i];
      const stats = card.querySelectorAll('.s-val');
      
      if (card.querySelector('.ex-name')) card.querySelector('.ex-name').textContent = d.name;
      if (card.querySelector('.ex-equip')) card.querySelector('.ex-equip').textContent = d.equip;
      if (stats[0] && d.ser) stats[0].textContent = d.ser;
      if (stats[1] && d.reps) stats[1].textContent = d.reps;
      if (stats[2] && d.rest) stats[2].textContent = d.rest;
      if (card.querySelector('.ex-tip') && d.tip) card.querySelector('.ex-tip').textContent = d.tip;
    });
  }
};
