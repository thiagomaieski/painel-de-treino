import { DB } from './database.js';

export const DietManager = {
  // Obter diário para uma data específica
  getDiaryForDate(date) {
    const diary = DB.getDietDiary();
    return diary.filter(item => item.date === date);
  },

  // Adicionar alimento ao diário
  addFoodToDiary(date, meal, food, qty) {
    const diary = DB.getDietDiary();
    
    // Agora todos os cálculos de banco dinâmico (DEFAULT_FOODS) são baseados em 100g
    // ou usam os valores totais se não tiverem os campos por 100g (legado)
    let kcal = 0, prot = 0, carb = 0, fat = 0;

    if (food.kcal100 !== undefined) {
      // Cálculo exato por gramas ou unidade (já tratado na base de dados)
      const factor = qty / 100;
      kcal = food.kcal100 * factor;
      prot = food.prot100 * factor;
      carb = food.carb100 * factor;
      fat = food.fat100 * factor;
    } else {
      // Fallback para itens antigos
      let factor = food.unit === 'g' ? qty / 100 : qty;
      kcal = food.kcal * factor;
      prot = food.prot * factor;
      carb = food.carb * factor;
      fat = food.fat * factor;
    }

    const newEntry = {
      id: 'd_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      date,
      meal, // 'cafe' | 'lanche_manha' | 'almoco' | 'tarde' | 'jantar' | 'ceia'
      foodName: food.name,
      foodId: food.id,
      qty,
      unit: food.unit,
      kcal: Math.round(kcal),
      prot: parseFloat((prot).toFixed(1)),
      carb: parseFloat((carb).toFixed(1)),
      fat: parseFloat((fat).toFixed(1))
    };

    diary.push(newEntry);
    DB.saveDietDiary(diary);
    return newEntry;
  },

  // Adicionar múltiplos alimentos de uma vez (útil para o "Consumir Marcados" das refeições sugeridas)
  consumeMultipleFoods(date, meal, items) {
    // items = [{ food: FoodObj, qty: Number }, ...]
    items.forEach(item => {
      this.addFoodToDiary(date, meal, item.food, item.qty);
    });
  },

  // Remover alimento do diário
  removeFoodFromDiary(entryId) {
    let diary = DB.getDietDiary();
    diary = diary.filter(item => item.id !== entryId);
    DB.saveDietDiary(diary);
  },

  // Calcular totais nutricionais do dia
  getTotalsForDate(date) {
    const items = this.getDiaryForDate(date);
    return items.reduce((totals, item) => {
      totals.kcal += item.kcal;
      totals.prot += item.prot;
      totals.carb += item.carb;
      totals.fat += item.fat;
      return totals;
    }, { kcal: 0, prot: 0, carb: 0, fat: 0 });
  },

  // Cadastrar novo alimento customizado
  createCustomFood(name, kcal, prot, carb, fat, unit = 'g', group = 'especial') {
    const newFood = {
      name,
      kcal: parseFloat(kcal),
      prot: parseFloat(prot),
      carb: parseFloat(carb),
      fat: parseFloat(fat),
      unit,
      group
    };
    return DB.saveCustomFood(newFood);
  }
};
