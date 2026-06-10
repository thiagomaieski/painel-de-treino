const DEFAULT_INITIAL_KG = 118.0;
const DEFAULT_GOAL_KG = 78.0;
const HEIGHT_CM = 175;
const AGE = 20;
const ACTIVITY_FACTOR = 1.45;
const KCAL_PER_MIN_WALK = 4.5;

// Macros aproximados por porção padronizada de cada grupo (para bater as calorias exatas da nutri)
// Base: Prot=4kcal/g, Carb=4kcal/g, Fat=9kcal/g
const GROUPS = {
  cereais: { kcal: 150, prot: 4, carb: 30, fat: 1.5 },
  raizes: { kcal: 150, prot: 2, carb: 35, fat: 0.2 },
  vegetais: { kcal: 15, prot: 1, carb: 2.5, fat: 0.1 },
  frutas: { kcal: 70, prot: 1, carb: 16.5, fat: 0 },
  leguminosas: { kcal: 55, prot: 4, carb: 9, fat: 0.3 },
  carnes_ovos: { kcal: 120, prot: 18, carb: 0, fat: 5.3 },
  lacteos: { kcal: 80, prot: 6, carb: 10, fat: 1.8 },
  castanhas: { kcal: 70, prot: 2, carb: 2, fat: 6 },
  oleos: { kcal: 70, prot: 0, carb: 0, fat: 7.8 },
  doces: { kcal: 110, prot: 0, carb: 27.5, fat: 0 },
  especial: { kcal: 0, prot: 0, carb: 0, fat: 0 }
};

// Formato: [Nome, PesoPorcaoEmGramas, Grupo, CustomMacros(opcional)]
const RAW_FOODS = [
  // CEREAIS (150 kcal)
  ["Arroz Integral/Branco Cozido", 126, "cereais"],
  ["Aveia (flocos/farinha)", 40, "cereais"],
  ["Farinha (arroz/mandioca/trigo)", 40, "cereais"],
  ["Goma de tapioca", 45, "cereais"],
  ["Macarrão Cozido", 120, "cereais"],
  ["Panqueca (massa)", 60, "cereais"],
  ["Bolo simples/sem recheio", 40, "cereais", { prot: 2, carb: 25, fat: 4.5 }],
  ["Granola convencional", 40, "cereais"],
  ["Pão (batata, milho, leite)", 55, "cereais"],
  ["Pão de Forma (Integral/tradicional)", 50, "cereais"],
  ["Pão Caseiro", 60, "cereais"],
  ["Pão de Queijo", 55, "cereais", { prot: 3, carb: 15, fat: 8.5 }],
  ["Pão de Trigo (francês)", 50, "cereais"],
  ["Cereal matinal c/ açúcar", 40, "cereais"],
  ["Torrada convencional ou integral", 40, "cereais"],
  ["Psyllium", 10, "cereais", { kcal: 20, prot: 0, carb: 8, fat: 0 }], // extra nutri

  // RAÍZES (150 kcal)
  ["Batata Inglesa Cozida", 290, "raizes"],
  ["Batata Inglesa Assada", 170, "raizes"],
  ["Batata Frita (Palito)", 60, "raizes", { prot: 2, carb: 20, fat: 7 }],
  ["Purê de batata", 145, "raizes"], // extra da dieta (1 colher ~ 145g)

  // VEGETAIS (15 kcal)
  ["Abóbora Cozida", 70, "vegetais"],
  ["Beterraba (Crua ou Cozida)", 34, "vegetais"],
  ["Brócolis (Cru ou Cozido)", 55, "vegetais"],
  ["Cenoura (Cozida)", 35, "vegetais"],
  ["Cenoura (Crua / Ralada)", 50, "vegetais"],
  ["Pepino", 150, "vegetais"],
  ["Pimentão Cru Picado", 80, "vegetais"],
  ["Repolho Branco/Roxo Cru", 75, "vegetais"],
  ["Repolho Cozido", 34, "vegetais"],
  ["Rúcula", 88, "vegetais"],
  ["Tomate Cereja", 70, "vegetais"],
  ["Tomate Comum", 90, "vegetais"],
  ["Alface", 65, "vegetais"],
  ["Pepino em Conserva", 200, "vegetais"],
  ["Palmito em Conserva", 75, "vegetais"],

  // FRUTAS (70 kcal)
  ["Abacate", 90, "frutas", { prot: 1, carb: 6, fat: 6 }],
  ["Abacaxi", 140, "frutas"],
  ["Acerola", 230, "frutas"],
  ["Ameixa Vermelha", 130, "frutas"],
  ["Banana (Prata/Caturra)", 70, "frutas"],
  ["Fruta-do-conde", 70, "frutas"],
  ["Goiaba", 130, "frutas"],
  ["Jabuticaba", 120, "frutas"],
  ["Kiwi", 120, "frutas"],
  ["Laranja (Pera/Bahia)", 165, "frutas"],
  ["Limão", 135, "frutas"],
  ["Maçã", 110, "frutas"],
  ["Mamão (Formosa/Papaya)", 150, "frutas"],
  ["Manga", 110, "frutas"],
  ["Maracujá (polpa)", 95, "frutas"],
  ["Melancia", 240, "frutas"],
  ["Melão", 68, "frutas"],
  ["Mexerica / Tangerina", 120, "frutas"],
  ["Morango", 230, "frutas"],
  ["Nectarina", 150, "frutas"],
  ["Pera", 130, "frutas"],
  ["Pêssego", 165, "frutas"],
  ["Salada De Frutas", 105, "frutas"],
  ["Suco de frutas natural", 150, "frutas"],
  ["Uva", 120, "frutas"],
  ["Uvas Passas", 20, "frutas"],

  // LEGUMINOSAS (55 kcal)
  ["Ervilha Seca Cozida", 70, "leguminosas"],
  ["Feijão Branco cozido", 60, "leguminosas"],
  ["Feijão Carioca Cozido", 80, "leguminosas"],
  ["Feijão Preto Cozido", 80, "leguminosas"],
  ["Feijão Vermelho Cozido", 50, "leguminosas"],
  ["Grão-de-Bico Cozido", 45, "leguminosas"],
  ["Lentilha Cozida", 55, "leguminosas"],

  // CARNES E OVOS (120 kcal)
  ["Bacalhau Cozido", 135, "carnes_ovos"],
  ["Bife Bovino Grelhado/Patinho", 50, "carnes_ovos"],
  ["Camarão Cozido", 145, "carnes_ovos"],
  ["Carne Bov. Assada/Cozida", 60, "carnes_ovos"],
  ["Carne Moída Refogada", 60, "carnes_ovos"],
  ["Bisteca Suína", 45, "carnes_ovos"],
  ["Costela Suína Assada", 30, "carnes_ovos", { prot: 6, carb: 0, fat: 10 }],
  ["Frango Assado sem pele", 65, "carnes_ovos"],
  ["Frango Filé à Milanesa", 45, "carnes_ovos", { prot: 10, carb: 10, fat: 4 }],
  ["Frango Filé Grelhado/Cubos", 115, "carnes_ovos", { kcal: 180, prot: 36, carb: 0, fat: 3 }], // ajustado para 1 filé grande = 115g
  ["Hambúrguer Grelhado", 55, "carnes_ovos", { prot: 12, carb: 2, fat: 7 }],
  ["Omelete Simples", 70, "carnes_ovos"],
  ["Ovo Cozido/Mexido", 95, "carnes_ovos"], // 2 ovos
  ["Peixe Grelhado", 130, "carnes_ovos"],
  ["Porco Lombo Assado", 60, "carnes_ovos"],
  ["Salmão Grelhado", 50, "carnes_ovos", { prot: 10, carb: 0, fat: 8 }],
  ["Atum em Lata", 65, "carnes_ovos"],
  ["Presunto Sem Gordura", 125, "carnes_ovos"],
  ["Whey Protein", 30, "carnes_ovos", { kcal: 120, prot: 24, carb: 3, fat: 1.5 }], // Não está na lista, mas é base essencial!

  // LÁCTEOS (80 kcal)
  ["Leite em Pó Integral", 15, "lacteos"],
  ["Leite em Pó Desnatado", 20, "lacteos", { kcal: 70, prot: 7, carb: 10, fat: 0 }],
  ["Leite Integral", 120, "lacteos"],
  ["Leite Semidesnatado", 165, "lacteos"],
  ["Leite Desnatado", 240, "lacteos"],
  ["Iogurte Natural/Desnatado", 170, "lacteos", { kcal: 80, prot: 8, carb: 11, fat: 0 }], // Iogurte da dieta
  ["Queijo Minas", 35, "lacteos"],
  ["Queijo Mussarela/Prato", 25, "lacteos", { kcal: 80, prot: 6, carb: 1, fat: 6 }], // Mussarela adicionada
  ["Ricota temperada", 60, "lacteos", { kcal: 80, prot: 8, carb: 2, fat: 4 }],
  ["Requeijão / Cream Cheese Light", 45, "lacteos", { kcal: 80, prot: 4, carb: 2, fat: 6 }],
  ["Bebida láctea", 90, "lacteos"],

  // CASTANHAS E SEMENTES (70 kcal)
  ["Amêndoas Torrada", 11, "castanhas"],
  ["Castanha de Caju/Nozes", 11, "castanhas"],
  ["Castanha do Brasil crua", 10, "castanhas"],
  ["Chia", 16, "castanhas"],
  ["Gergelim", 12, "castanhas"],
  ["Linhaça Semente", 15, "castanhas"],
  ["Amendoim sem sal", 11, "castanhas"],
  ["Coco ralado sem açúcar", 20, "castanhas"],
  ["Semente de Abóbora/Girassol", 16, "castanhas"],
  ["Mix de Sementes da Nutri", 15, "castanhas", { prot: 3, carb: 3, fat: 5 }],

  // ÓLEOS E GORDURAS (70 kcal)
  ["Azeite de Oliva", 8, "oleos"],
  ["Creme de leite", 25, "oleos"],
  ["Óleo Vegetal (soja, girassol)", 8, "oleos"],
  ["Maionese", 23, "oleos"],
  ["Margarina", 11, "oleos"],

  // DOCES (110 kcal)
  ["Açúcar (cristal, mascavo)", 28, "doces"],
  ["Leite Condensado", 30, "doces"],
  ["Doce de Leite", 40, "doces"],
  ["Geleia de Frutas", 40, "doces"],
  ["Goiabada", 35, "doces"],
  ["Canela em pó", 5, "especial", { kcal: 15, prot: 0, carb: 3, fat: 0 }]
];

// Gera a lista final de alimentos com base nas porções ou valores customizados
const DEFAULT_FOODS = RAW_FOODS.map((item, index) => {
  const [name, weight, groupKey, custom] = item;
  const group = GROUPS[groupKey] || GROUPS.especial;
  
  const kcal = custom?.kcal !== undefined ? custom.kcal : group.kcal;
  const prot = custom?.prot !== undefined ? custom.prot : group.prot;
  const carb = custom?.carb !== undefined ? custom.carb : group.carb;
  const fat = custom?.fat !== undefined ? custom.fat : group.fat;

  // Calculamos os valores exatos para cada 100g para o banco dinâmico (regra de 3)
  const factor = 100 / weight;
  
  return {
    id: `f_${index}`,
    name,
    group: groupKey,
    unit: 'g',
    portionWeight: weight, // a porção base da nutricionista
    
    // Valores por 100g para cálculos precisos de quantidades livres
    kcal100: parseFloat((kcal * factor).toFixed(1)),
    prot100: parseFloat((prot * factor).toFixed(1)),
    carb100: parseFloat((carb * factor).toFixed(1)),
    fat100: parseFloat((fat * factor).toFixed(1))
  };
});

// Cardápio Planejado (Baseado nas quantidades enviadas pela Nutricionista)
export const PREPLANNED_MEALS = {
  cafe: [
    { name: "Iogurte Natural/Desnatado", qty: 170 }, // 1 unidade
    { name: "Maçã", qty: 110 }, // 1 unidade média
    { name: "Chia", qty: 16 }, // 1 colher de sopa
    { name: "Pão de Forma (Integral/tradicional)", qty: 50 }, // 2 fatias
    { name: "Requeijão / Cream Cheese Light", qty: 15 }, // 1 colher rasa (1/3 da porção de 45g)
    { name: "Queijo Mussarela/Prato", qty: 25 }, // 1 fatia
    { name: "Ovo Cozido/Mexido", qty: 95 } // 2 ovos
  ],
  lanche_manha: [
    { name: "Banana (Prata/Caturra)", qty: 70 }, // 1 unidade média
    { name: "Leite em Pó Desnatado", qty: 20 }, // 2 colheres
    { name: "Canela em pó", qty: 5 }
  ],
  almoco: [
    { name: "Alface", qty: 65 }, // 2 pegadores
    { name: "Cenoura (Crua / Ralada)", qty: 50 }, // 2 pegadores
    { name: "Linhaça Semente", qty: 15 }, // 1 colher sopa
    { name: "Brócolis (Cru ou Cozido)", qty: 55 }, // 1 colher servir
    { name: "Arroz Integral/Branco Cozido", qty: 63 }, // 1 colher servir (metade da porção de 126g)
    { name: "Feijão Preto Cozido", qty: 80 }, // 1 concha
    { name: "Frango Filé Grelhado/Cubos", qty: 50 }, // 1 filé pequeno (metade da porção de 115g)
    { name: "Purê de batata", qty: 145 }, // 1 colher servir
    { name: "Laranja (Pera/Bahia)", qty: 165 } // 1 unidade
  ],
  tarde: [
    { name: "Leite Semidesnatado", qty: 165 }, // 1 copo americano
    { name: "Morango", qty: 115 }, // 7 unidades (metade da porção de 230g)
    { name: "Psyllium", qty: 10 }, // 1 colher sopa
    { name: "Torrada convencional ou integral", qty: 20 }, // 2 unidades (metade da porção de 40g)
    { name: "Ricota temperada", qty: 60 }, // 2 colheres sopa
    { name: "Tomate Comum", qty: 30 }, // 2 fatias (1/3 da porção de 90g)
    { name: "Rúcula", qty: 44 } // 4 folhas (metade da porção de 88g)
  ],
  jantar: [
    { name: "Alface", qty: 65 }, 
    { name: "Cenoura (Crua / Ralada)", qty: 25 }, 
    { name: "Tomate Comum", qty: 90 }, // 1 unidade média
    { name: "Iogurte Natural/Desnatado", qty: 50 }, // 2 colheres
    { name: "Mix de Sementes da Nutri", qty: 15 }, // 1 colher sopa
    { name: "Frango Filé Grelhado/Cubos", qty: 115 }, // 1 filé grande
    { name: "Torrada convencional ou integral", qty: 40 } // "Pão torrado 2 unidades" (equivalente à porção de torrada ou pão)
  ],
  ceia: [
    { name: "Aveia (flocos/farinha)", qty: 40 }, // 3 colheres cheias
    { name: "Leite Semidesnatado", qty: 165 }, // 1 copo americano
    { name: "Açúcar (cristal, mascavo)", qty: 10 }, // 1 colher chá
    { name: "Leite em Pó Desnatado", qty: 20 }, // 2 colheres
    { name: "Pera", qty: 130 }, // 1 unidade
    { name: "Canela em pó", qty: 5 }
  ]
};

export const DB = {
  HEIGHT_CM,
  AGE,
  ACTIVITY_FACTOR,
  KCAL_PER_MIN_WALK,

  getInitialKg() {
    return parseFloat(localStorage.getItem('julia_initial_kg')) || DEFAULT_INITIAL_KG;
  },
  setInitialKg(val) {
    localStorage.setItem('julia_initial_kg', val);
  },

  getGoalKg() {
    return parseFloat(localStorage.getItem('julia_goal_kg')) || DEFAULT_GOAL_KG;
  },
  setGoalKg(val) {
    localStorage.setItem('julia_goal_kg', val);
  },

  getAge() {
    return parseInt(localStorage.getItem('julia_age')) || AGE;
  },
  setAge(val) {
    localStorage.setItem('julia_age', val);
  },

  getHeight() {
    return parseFloat(localStorage.getItem('julia_height')) || HEIGHT_CM;
  },
  setHeight(val) {
    localStorage.setItem('julia_height', val);
  },

  getWeights() {
    try {
      const raw = localStorage.getItem('julia_weights');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },
  saveWeights(weights) { localStorage.setItem('julia_weights', JSON.stringify(weights)); },

  getWalks() {
    try {
      const raw = localStorage.getItem('julia_walks');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },
  saveWalks(walks) { localStorage.setItem('julia_walks', JSON.stringify(walks)); },

  getWorkoutEdits() {
    try {
      const raw = localStorage.getItem('julia_edits');
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  },
  saveWorkoutEdits(edits) { localStorage.setItem('julia_edits', JSON.stringify(edits)); },

  getDietDiary() {
    try {
      const raw = localStorage.getItem('julia_diet_diary');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },
  saveDietDiary(diary) { localStorage.setItem('julia_diet_diary', JSON.stringify(diary)); },

  getCustomFoods() {
    try {
      const raw = localStorage.getItem('julia_custom_foods');
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  },
  saveCustomFood(food) {
    const list = this.getCustomFoods();
    food.id = 'c_' + Date.now();
    
    // Converter de valores totais para base em 100g se a unidade for gramas
    if (food.unit === 'g') {
      const factor = 100 / food.portionWeight;
      food.kcal100 = food.kcal * factor;
      food.prot100 = food.prot * factor;
      food.carb100 = food.carb * factor;
      food.fat100 = food.fat * factor;
    } else {
      // Se for unidade, tratamos 1 unidade como 100"unidades" para reaproveitar a matemática
      food.kcal100 = food.kcal;
      food.prot100 = food.prot;
      food.carb100 = food.carb;
      food.fat100 = food.fat;
    }
    
    list.push(food);
    localStorage.setItem('julia_custom_foods', JSON.stringify(list));
    return food;
  },

  getEditedFoods() {
    try {
      const raw = localStorage.getItem('julia_edited_foods');
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  },
  saveEditedFood(foodId, changes) {
    const edits = this.getEditedFoods();
    edits[foodId] = changes;
    localStorage.setItem('julia_edited_foods', JSON.stringify(edits));
  },
  resetEditedFood(foodId) {
    const edits = this.getEditedFoods();
    delete edits[foodId];
    localStorage.setItem('julia_edited_foods', JSON.stringify(edits));
  },

  getAllFoods() {
    const edits = this.getEditedFoods();
    const defaultMerged = DEFAULT_FOODS.map(food => {
      if (edits[food.id]) {
        return { ...food, ...edits[food.id] };
      }
      return food;
    });
    return [...defaultMerged, ...this.getCustomFoods()];
  },

  searchFoods(query, groupFilter = null) {
    const cleanQuery = query.toLowerCase().trim();
    let all = this.getAllFoods();
    
    if (groupFilter) {
      all = all.filter(f => f.group === groupFilter);
    }
    
    if (!cleanQuery) return all;
    return all.filter(f => f.name.toLowerCase().includes(cleanQuery));
  },
  
  getPreplannedMeal(mealKey) {
    return PREPLANNED_MEALS[mealKey] || [];
  },

  getPreplannedDailyGoals() {
    let kcal = 0, prot = 0, carb = 0, fat = 0;
    const allFoods = this.getAllFoods();
    
    Object.values(PREPLANNED_MEALS).forEach(mealItems => {
      mealItems.forEach(item => {
        const food = allFoods.find(f => f.name === item.name);
        if (food) {
          const factor = item.qty / 100;
          kcal += food.kcal100 * factor;
          prot += food.prot100 * factor;
          carb += food.carb100 * factor;
          fat += food.fat100 * factor;
        }
      });
    });
    
    return {
      kcal: Math.round(kcal),
      prot: Math.round(prot),
      carb: Math.round(carb),
      fat: Math.round(fat)
    };
  }
};
