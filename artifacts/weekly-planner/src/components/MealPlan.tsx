import { DayData } from "@/lib/types";

interface MealPlanProps {
  meals: DayData['meals'];
  onChange: (meals: DayData['meals']) => void;
}

export function MealPlan({ meals, onChange }: MealPlanProps) {
  const updateMeal = (type: keyof DayData['meals'], value: string) => {
    onChange({ ...meals, [type]: value });
  };

  return (
    <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-card-border mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-secondary mb-4">Meals</h2>
      
      <div className="space-y-3">
        {(Object.keys(meals) as Array<keyof DayData['meals']>).map((mealType) => (
          <div key={mealType} className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground capitalize font-medium">{mealType}</label>
            <input
              type="text"
              value={meals[mealType]}
              onChange={(e) => updateMeal(mealType, e.target.value)}
              placeholder={`What's for ${mealType}?`}
              className="w-full bg-accent/30 hover:bg-accent/50 focus:bg-accent/50 rounded-md px-3 py-2 text-sm border-none focus:outline-none transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
