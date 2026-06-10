import './style.css';
import { UIManager } from './js/ui.js';
import { WorkoutManager } from './js/workout.js';
import { SettingsManager } from './js/settings.js';

window.SettingsManager = SettingsManager;

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa a UI do app
  UIManager.init();
  SettingsManager.init();
  
  // Inicializa botões de edição de treino
  WorkoutManager.initEditButtons((card, index) => {
    UIManager.openEditWorkout(card, index);
  });
});

// Registro do Service Worker para suporte PWA (apenas em produção)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registrado com sucesso: ', reg.scope);
      })
      .catch(err => {
        console.warn('Falha ao registrar Service Worker: ', err);
      });
  });
}
