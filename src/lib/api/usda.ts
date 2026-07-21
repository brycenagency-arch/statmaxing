const USDA_API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export interface ParsedFood {
  externalId: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  servingSize: string;
}

export async function searchFoods(query: string): Promise<ParsedFood[]> {
  const url = `${BASE_URL}/foods/search?query=${encodeURIComponent(query)}&api_key=${USDA_API_KEY}&pageSize=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch from USDA API');
  const data = await res.json();
  
  return data.foods.map((f: any) => {
    // USDA nutrient IDs: Protein: 1003, Fat: 1004, Carbs: 1005, Energy/Calories: 1008, Fiber: 1079
    const getNutrient = (id: number) => {
      const n = f.foodNutrients.find((n: any) => n.nutrientId === id || n.nutrientNumber === id.toString());
      return n ? n.value : 0;
    };
    
    let serving = '100g';
    if (f.servingSize && f.servingSizeUnit) {
      serving = `${f.servingSize} ${f.servingSizeUnit}`;
    } else if (f.householdServingFullText) {
      serving = f.householdServingFullText;
    }

    return {
      externalId: f.fdcId.toString(),
      name: f.description,
      calories: getNutrient(1008),
      protein: getNutrient(1003),
      fat: getNutrient(1004),
      carbs: getNutrient(1005),
      fiber: getNutrient(1079),
      servingSize: serving,
    };
  });
}
