import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileBottomNav from '../components/MobileBottomNav';
import * as tf from '@tensorflow/tfjs';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/appStore';
import { getPatients } from '../api/patientApi';

const Icons = {
  ArrowLeft: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18L9 12L15 6"/>
    </svg>
  ),
  Heart: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.8 4.6c-2.2-2.2-5.8-2.2-8 0L12 5.6l-0.8-1c-2.2-2.2-5.8-2.2-8 0-2.2 2.2-2.2 5.8 0 8L12 21l8.8-8.8c2.2-2.2 2.2-5.8 0-8z"/>
    </svg>
  ),
  Brain: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2c-3 0-5 2-5 5 0 1.5.5 2.5 1 3.5-1 1-2 2.5-2 4.5 0 3 2 5 5 5s5-2 5-5c0-2-1-3.5-2-4.5.5-1 1-2 1-3.5 0-3-2-5-5-5z"/>
      <path d="M12 7v10"/>
      <path d="M8 9l8 2"/>
      <path d="M8 13l8-2"/>
    </svg>
  ),
  Activity: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h4l3-9 4 18 3-9h4"/>
    </svg>
  ),
  Food: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8c0-4-3-7-6-7s-6 3-6 7c0 2.5 1.5 4.5 3 6"/>
      <path d="M9 14c-1.5 1.5-3 3.5-3 6h12c0-2.5-1.5-4.5-3-6"/>
      <path d="M12 1v1"/>
      <path d="M12 18v3"/>
    </svg>
  ),
  Weight: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8"/>
      <path d="M12 4v1M12 19v1"/>
    </svg>
  ),
  Target: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17L4 12"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 6l-7.5 7.5-5-5L2 17"/>
      <path d="M17 6h6v6"/>
    </svg>
  ),
  TrendingDown: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 18l-7.5-7.5-5 5L2 7"/>
      <path d="M17 18h6v-6"/>
    </svg>
  ),
  Warning: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01"/>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
    </svg>
  ),
  Muscle: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 12h12"/>
      <path d="M12 6v12"/>
      <circle cx="12" cy="12" r="8"/>
    </svg>
  ),
  Yoga: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 6c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z"/>
      <path d="M8 12l-2 6h12l-2-6"/>
      <path d="M12 14v8"/>
    </svg>
  ),
  Water: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 6c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z"/>
      <path d="M12 22c3 0 5-2 5-5s-2-5-5-5-5 2-5 5 2 5 5 5z"/>
    </svg>
  ),
  Ruler: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h20M12 2v20"/>
      <path d="M6 6v12M18 6v12"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

// Health Trend Chart Component
function HealthTrendChart({ history }) {
  const [showChart, setShowChart] = useState(true);

  if (history.length === 0) return null;

  // Prepare data for the chart (simple bar chart using CSS)
  const maxScore = 100;
  const chartData = history.slice(0, 7).reverse(); // Show last 7 entries, oldest to newest

  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Icons.TrendingUp />
          <h3 className="font-semibold text-navy">Health Trend</h3>
        </div>
        <button onClick={() => setShowChart(!showChart)} className="text-xs text-mint">
          {showChart ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showChart && (
        <>
          {/* Bar Chart */}
          <div className="space-y-2 mb-4">
            {chartData.map((entry, idx) => {
              const height = (entry.healthScore / maxScore) * 120;
              const date = new Date(entry.date);
              const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-muted">{formattedDate}</div>
                  <div className="flex-1">
                    <div
                      className="bg-mint rounded-full transition-all duration-500"
                      style={{
                        width: `${entry.healthScore}%`,
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '8px'
                      }}
                    >
                      <span className="text-xs text-white font-medium">{entry.healthScore}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trend Indicator */}
          {history.length >= 2 && (
            <div className="p-3 bg-faint rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Overall Trend</span>
                {history[0].healthScore > history[history.length - 1].healthScore ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Icons.TrendingUp />
                    <span className="text-sm font-medium">Improving</span>
                  </div>
                ) : history[0].healthScore < history[history.length - 1].healthScore ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <Icons.TrendingDown />
                    <span className="text-sm font-medium">Declining</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Icons.Target />
                    <span className="text-sm font-medium">Stable</span>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-muted">
                {history.length} total records • Last update: {new Date(history[0].date).toLocaleDateString()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Health History Timeline Component
function HealthHistoryTimeline({ history, onSelectEntry }) {
  const [expanded, setExpanded] = useState(false);
  const displayHistory = expanded ? history : history.slice(0, 3);

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-4 text-center">
        <Icons.Calendar />
        <p className="text-sm text-muted mt-2">No health history yet</p>
        <p className="text-xs text-muted">Complete an analysis to start tracking</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Icons.Calendar />
          <h3 className="font-semibold text-navy">Health History</h3>
        </div>
        {history.length > 3 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-mint">
            {expanded ? 'Show Less' : `View All (${history.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayHistory.map((entry, idx) => {
          const date = new Date(entry.date);
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={idx}
              className="p-3 bg-faint rounded-xl cursor-pointer hover:bg-mint-light transition-colors"
              onClick={() => onSelectEntry?.(entry)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted">{formattedDate}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Icons.Heart className="w-4 h-4" />
                      <span className="text-sm font-medium text-mint">{entry.healthScore}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icons.Weight className="w-4 h-4" />
                      <span className="text-xs text-muted">{entry.weight} kg</span>
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  entry.riskLevel === 'Low' ? 'bg-green-100 text-green-700' :
                  entry.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {entry.riskLevel} Risk
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// AI Health Model (same as before)
class HealthAdvisor {
  constructor() {
    this.model = null;
    this.isTrained = false;
  }

  createModel() {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      inputShape: [5],
      units: 32,
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }));

    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }));

    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu',
      kernelInitializer: 'heNormal'
    }));

    model.add(tf.layers.dense({
      units: 3,
      activation: 'sigmoid',
      kernelInitializer: 'heNormal'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    this.model = model;
    return model;
  }

  calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  getBMICategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  calculateBMR(weight, height, age, gender = 'male') {
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  }

  calculateDailyCalories(bmr, activityLevel) {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };
    return Math.round(bmr * (multipliers[activityLevel] || 1.2));
  }

  async predictRecommendations(age, height, weight, activityLevel, goal) {
    const bmi = this.calculateBMI(weight, height);
    const bmiCategory = this.getBMICategory(bmi);
    const bmr = this.calculateBMR(weight, height, age);
    const dailyCalories = this.calculateDailyCalories(bmr, activityLevel);

    let adjustedCalories = dailyCalories;
    if (goal === 'lose') adjustedCalories -= 500;
    else if (goal === 'gain') adjustedCalories += 500;

    let healthScore = 70;
    if (bmiCategory === 'Normal') healthScore += 20;
    else if (bmiCategory === 'Overweight') healthScore -= 10;
    else if (bmiCategory === 'Obese') healthScore -= 20;
    else if (bmiCategory === 'Underweight') healthScore -= 10;

    if (activityLevel === 'active' || activityLevel === 'veryActive') healthScore += 10;
    else if (activityLevel === 'sedentary') healthScore -= 15;

    healthScore = Math.max(0, Math.min(100, healthScore));

    let riskLevel = 'Low';
    if (healthScore < 50) riskLevel = 'High';
    else if (healthScore < 70) riskLevel = 'Moderate';

    return {
      bmi: bmi.toFixed(1),
      bmiCategory,
      bmr: Math.round(bmr),
      dailyCalories,
      adjustedCalories,
      healthScore,
      riskLevel,
      idealWeightRange: this.getIdealWeightRange(height),
      waterIntake: Math.round(weight * 0.033),
      proteinNeeds: Math.round(weight * 1.6),
      sleepNeeds: age > 60 ? 7 : age > 18 ? 8 : 9
    };
  }

  getIdealWeightRange(height) {
    const heightInMeters = height / 100;
    const minWeight = (18.5 * heightInMeters * heightInMeters).toFixed(1);
    const maxWeight = (24.9 * heightInMeters * heightInMeters).toFixed(1);
    return `${minWeight} - ${maxWeight} kg`;
  }

  getDietPlan(bmiCategory, goal, age, allergies = []) {
    const plans = {
      Underweight: {
        goal: 'Healthy Weight Gain',
        calories: '+500 kcal/day',
        foods: {
          eat: ['Nuts and seeds', 'Avocados', 'Whole milk', 'Nut butters', 'Lean meats', 'Complex carbs'],
          avoid: ['Empty calories', 'Processed foods', 'Sugary drinks'],
          breakfast: 'Oatmeal with nuts, banana, and whole milk + 2 eggs',
          lunch: 'Brown rice with chicken, avocado, and vegetables',
          dinner: 'Salmon with sweet potato and olive oil',
          snacks: 'Greek yogurt, trail mix, protein shake'
        }
      },
      Normal: {
        goal: 'Maintain Healthy Weight',
        calories: 'Maintenance calories',
        foods: {
          eat: ['Lean proteins', 'Whole grains', 'Fruits', 'Vegetables', 'Healthy fats'],
          avoid: ['Processed foods', 'Excess sugar', 'Trans fats'],
          breakfast: 'Greek yogurt with berries and granola',
          lunch: 'Grilled chicken salad with quinoa',
          dinner: 'Baked fish with roasted vegetables',
          snacks: 'Apple with peanut butter, hummus with carrots'
        }
      },
      Overweight: {
        goal: 'Gradual Weight Loss',
        calories: '-500 kcal/day',
        foods: {
          eat: ['High protein', 'High fiber', 'Low glycemic foods', 'Leafy greens'],
          avoid: ['Sugary drinks', 'Refined carbs', 'Fried foods'],
          breakfast: 'Protein smoothie (whey, spinach, berries, almond milk)',
          lunch: 'Large salad with lean protein and vinaigrette',
          dinner: 'Vegetable stir-fry with tofu or lean chicken',
          snacks: 'Celery sticks, cucumber slices, green tea'
        }
      },
      Obese: {
        goal: 'Medical Weight Loss',
        calories: '-750 kcal/day',
        foods: {
          eat: ['Low calorie density', 'High volume', 'High protein', 'Non-starchy vegetables'],
          avoid: ['High fat', 'High sugar', 'Processed foods', 'Fast food'],
          breakfast: 'Vegetable omelet with whole grain toast',
          lunch: 'Lentil soup with side salad',
          dinner: 'Grilled white fish with steamed broccoli',
          snacks: 'Raw vegetables, air-popped popcorn'
        }
      }
    };

    const plan = plans[bmiCategory] || plans.Normal;

    if (age > 60) {
      plan.foods.eat.push('Calcium-rich foods', 'Vitamin D supplements');
      plan.foods.avoid.push('High sodium foods');
    }

    if (allergies.includes('dairy')) {
      plan.foods.eat = plan.foods.eat.filter(f => !f.toLowerCase().includes('milk') && !f.toLowerCase().includes('yogurt'));
    }
    if (allergies.includes('nuts')) {
      plan.foods.eat = plan.foods.eat.filter(f => !f.toLowerCase().includes('nut'));
    }
    if (allergies.includes('gluten')) {
      plan.foods.eat = plan.foods.eat.filter(f => !f.toLowerCase().includes('wheat') && !f.toLowerCase().includes('bread'));
    }

    return plan;
  }

  getWorkoutPlan(age, bmiCategory, activityLevel, goal) {
    const workouts = {
      beginner: {
        cardio: 'Walking 20-30 mins, 5 days/week',
        strength: 'Bodyweight exercises (squats, push-ups, lunges) - 2 days/week',
        flexibility: 'Basic stretching - daily',
        schedule: 'Start slow, focus on consistency'
      },
      intermediate: {
        cardio: 'Jogging/Cycling 30-45 mins, 4-5 days/week',
        strength: 'Weight training (dumbbells, resistance bands) - 3 days/week',
        flexibility: 'Yoga or Pilates - 2 days/week',
        schedule: 'Alternate cardio and strength days'
      },
      advanced: {
        cardio: 'HIIT or running 45-60 mins, 5-6 days/week',
        strength: 'Split training (push/pull/legs) - 4-5 days/week',
        flexibility: 'Dynamic stretching daily',
        schedule: 'High intensity with proper recovery'
      }
    };

    let level = 'beginner';
    if (activityLevel === 'moderate') level = 'intermediate';
    else if (activityLevel === 'active' || activityLevel === 'veryActive') level = 'advanced';

    if (age > 60) level = 'beginner';

    let plan = workouts[level];

    if (goal === 'lose') {
      plan.cardio += ' (add 2 HIIT sessions/week)';
    } else if (goal === 'gain') {
      plan.strength += ' (focus on compound lifts, progressive overload)';
    }

    if (age > 60) {
      plan = {
        cardio: 'Brisk walking 20-30 mins, 5 days/week',
        strength: 'Light resistance bands, chair exercises - 2 days/week',
        flexibility: 'Gentle stretching, tai chi - daily',
        schedule: 'Listen to your body, prioritize balance exercises'
      };
    } else if (age < 25) {
      plan.intensity = 'Can handle higher intensity, focus on building foundation';
    }

    return plan;
  }

  getHealthTips(bmiCategory, age, goal) {
    const tips = {
      general: [
        'Stay hydrated - drink water throughout the day',
        'Get 7-8 hours of quality sleep',
        'Manage stress through meditation or deep breathing',
        'Regular health check-ups',
        'Limit alcohol and avoid smoking'
      ],
      Underweight: [
        'Eat calorie-dense nutritious foods',
        'Add healthy fats to meals',
        'Strength train to build muscle mass',
        'Don\'t skip meals',
        'Drink smoothies between meals'
      ],
      Overweight: [
        'Portion control is key',
        'Eat slowly and mindfully',
        'Reduce liquid calories',
        'Increase protein intake',
        'Track your meals for awareness'
      ],
      Obese: [
        'Consult with a healthcare provider',
        'Start with low-impact activities',
        'Set realistic weekly goals',
        'Focus on behavior changes',
        'Join a support group'
      ]
    };

    let categoryTips = tips[bmiCategory] || [];
    if (age > 60) {
      categoryTips.push('Focus on balance exercises to prevent falls');
      categoryTips.push('Get adequate Vitamin D and calcium');
    }

    return [...categoryTips, ...tips.general];
  }
}

// BMI Chart Component
function BMIChart({ bmi, category }) {
  const categories = [
    { label: 'Underweight', range: [0, 18.5], color: '#3B82F6', position: 10 },
    { label: 'Normal', range: [18.5, 25], color: '#10B981', position: 35 },
    { label: 'Overweight', range: [25, 30], color: '#F59E0B', position: 65 },
    { label: 'Obese', range: [30, 40], color: '#EF4444', position: 85 }
  ];

  let indicatorPosition = 10;
  if (bmi <= 18.5) indicatorPosition = (bmi / 18.5) * 20;
  else if (bmi <= 25) indicatorPosition = 20 + ((bmi - 18.5) / 6.5) * 30;
  else if (bmi <= 30) indicatorPosition = 50 + ((bmi - 25) / 5) * 30;
  else indicatorPosition = 80 + Math.min(20, (bmi - 30) / 10 * 20);

  indicatorPosition = Math.min(95, Math.max(5, indicatorPosition));

  return (
    <div className="space-y-2">
      <div className="relative h-8 rounded-full overflow-hidden">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className="absolute top-0 h-full"
            style={{
              left: `${cat.position - (idx === 0 ? 0 : 10)}%`,
              width: `${idx === 0 ? 20 : idx === 1 ? 30 : idx === 2 ? 30 : 20}%`,
              backgroundColor: cat.color
            }}
          />
        ))}
        <div
          className="absolute top-0 w-1 h-8 bg-black transform -translate-x-1/2"
          style={{ left: `${indicatorPosition}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>Underweight</span>
        <span>Normal</span>
        <span>Overweight</span>
        <span>Obese</span>
      </div>
    </div>
  );
}

// Diet Plan Card
function DietPlanCard({ plan, bmiCategory }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Icons.Food />
          <h3 className="font-semibold text-navy">Personalized Diet Plan</h3>
        </div>
        <span className="px-2 py-1 bg-mint-light text-mint text-xs rounded-full">
          {plan.goal}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm border-b border-border pb-2">
          <span className="text-muted">Daily Calories</span>
          <span className="font-medium text-mint">{plan.calories}</span>
        </div>

        {!expanded ? (
          <button onClick={() => setExpanded(true)} className="text-sm text-mint">
            View Full Plan →
          </button>
        ) : (
          <>
            <div>
              <p className="text-sm font-medium text-navy mb-1">✅ Foods to Eat</p>
              <ul className="list-disc list-inside text-sm text-muted space-y-1">
                {plan.foods.eat.map((food, idx) => (
                  <li key={idx}>{food}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-medium text-navy mb-1">❌ Foods to Avoid</p>
              <ul className="list-disc list-inside text-sm text-muted space-y-1">
                {plan.foods.avoid.map((food, idx) => (
                  <li key={idx}>{food}</li>
                ))}
              </ul>
            </div>

            <div className="bg-mint-light rounded-2xl p-3">
              <p className="text-sm font-medium text-navy mb-2">📅 Sample Meal Plan</p>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Breakfast:</span> {plan.foods.breakfast}</div>
                <div><span className="font-medium">Lunch:</span> {plan.foods.lunch}</div>
                <div><span className="font-medium">Dinner:</span> {plan.foods.dinner}</div>
                <div><span className="font-medium">Snacks:</span> {plan.foods.snacks}</div>
              </div>
            </div>

            <button onClick={() => setExpanded(false)} className="text-sm text-mint">
              Show Less ↑
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Workout Plan Card
function WorkoutPlanCard({ plan }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icons.Muscle />
        <h3 className="font-semibold text-navy">Workout Guide</h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted">Cardio</p>
            <p className="font-medium">{plan.cardio}</p>
          </div>
          <div>
            <p className="text-muted">Strength</p>
            <p className="font-medium">{plan.strength}</p>
          </div>
          <div>
            <p className="text-muted">Flexibility</p>
            <p className="font-medium">{plan.flexibility}</p>
          </div>
          <div>
            <p className="text-muted">Schedule</p>
            <p className="font-medium">{plan.schedule}</p>
          </div>
        </div>

        {!expanded ? (
          <button onClick={() => setExpanded(true)} className="text-sm text-mint">
            View Details →
          </button>
        ) : (
          <>
            <div className="bg-faint rounded-xl p-3">
              <p className="text-sm font-medium text-navy mb-2">🏋️ Weekly Schedule Example</p>
              <div className="space-y-1 text-sm">
                <div>Monday: Cardio + Core</div>
                <div>Tuesday: Upper Body Strength</div>
                <div>Wednesday: Active Recovery (Light cardio + Stretching)</div>
                <div>Thursday: Lower Body Strength</div>
                <div>Friday: Cardio + Full Body</div>
                <div>Saturday: Yoga/Flexibility</div>
                <div>Sunday: Rest & Recovery</div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 rounded-xl">
              <p className="text-sm font-medium text-navy mb-1">⚠️ Important Tips</p>
              <ul className="text-sm text-muted space-y-1 list-disc list-inside">
                <li>Warm up for 5-10 minutes before each workout</li>
                <li>Cool down and stretch after exercise</li>
                <li>Stay hydrated before, during, and after workouts</li>
                <li>Listen to your body and rest when needed</li>
                <li>Progress gradually - increase intensity over time</li>
              </ul>
            </div>

            <button onClick={() => setExpanded(false)} className="text-sm text-mint">
              Show Less ↑
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Health Tips Card
function HealthTipsCard({ tips }) {
  const [showAll, setShowAll] = useState(false);
  const displayedTips = showAll ? tips : tips.slice(0, 5);

  return (
    <div className="bg-mint-light rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icons.Heart />
        <h3 className="font-semibold text-navy">💡 Health Tips & Insights</h3>
      </div>

      <ul className="space-y-2">
        {displayedTips.map((tip, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-navy">
            <Icons.Check />
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      {tips.length > 5 && (
        <button onClick={() => setShowAll(!showAll)} className="mt-3 text-sm text-mint">
          {showAll ? 'Show Less ↑' : `Show ${tips.length - 5} More Tips ↓`}
        </button>
      )}
    </div>
  );
}

// Progress Tracker
function ProgressTracker({ healthScore, bmiCategory, goal }) {
  const goals = {
    lose: { title: 'Weight Loss Goal', target: '0.5-1 kg per week', icon: Icons.TrendingDown },
    maintain: { title: 'Maintenance Goal', target: 'Stay active & eat balanced', icon: Icons.Target },
    gain: { title: 'Weight Gain Goal', target: '0.25-0.5 kg per week', icon: Icons.TrendingUp }
  };

  const currentGoal = goals[goal] || goals.maintain;
  const GoalIcon = currentGoal.icon;

  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <GoalIcon />
          <h3 className="font-semibold text-navy">{currentGoal.title}</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-mint">{healthScore}</div>
          <div className="text-xs text-muted">Health Score</div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted">Health Score Progress</span>
            <span className="font-medium">{healthScore}%</span>
          </div>
          <div className="w-full bg-faint rounded-full h-1.5">
            <div
              className="bg-mint h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <span className="text-muted">Target</span>
          <span className="font-medium text-navy">{currentGoal.target}</span>
        </div>

        <div className="bg-mint-light rounded-2xl p-2 text-center">
          <p className="text-xs text-mint">Track your progress weekly to stay motivated!</p>
        </div>
      </div>
    </div>
  );
}

export default function AIHealthPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [healthAdvisor, setHealthAdvisor] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState(null);

  // Unit selections
  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');

  const [userInputs, setUserInputs] = useState({
    age: 30,
    height: 170,
    weight: 70,
    activityLevel: 'moderate',
    goal: 'maintain',
    gender: 'male',
    allergies: []
  });

  useEffect(() => {
    loadPatients();
    initializeModel();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadHealthHistory(selectedPatient._id);
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
      if (data.length > 0) {
        setSelectedPatient(data[0]);
        if (data[0].dateOfBirth) {
          const age = new Date().getFullYear() - new Date(data[0].dateOfBirth).getFullYear();
          setUserInputs(prev => ({ ...prev, age }));
        }
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHealthHistory = (patientId) => {
    const history = localStorage.getItem(`health_history_${patientId}`);
    if (history) {
      const parsedHistory = JSON.parse(history);
      setHealthHistory(parsedHistory.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } else {
      setHealthHistory([]);
    }
  };

  const saveHealthHistory = (patientId, entry) => {
    const existingHistory = localStorage.getItem(`health_history_${patientId}`);
    let history = existingHistory ? JSON.parse(existingHistory) : [];

    // Add new entry
    history.unshift(entry);

    // Keep only last 20 entries
    if (history.length > 20) history = history.slice(0, 20);

    localStorage.setItem(`health_history_${patientId}`, JSON.stringify(history));
    loadHealthHistory(patientId);
  };

  const initializeModel = async () => {
    await tf.ready();
    const advisor = new HealthAdvisor();
    advisor.createModel();
    setHealthAdvisor(advisor);
  };

  const analyzeHealth = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    setAnalyzing(true);

    // Convert to standard units for calculation
    let heightInCm = userInputs.height;
    let weightInKg = userInputs.weight;

    if (heightUnit === 'ft') {
      heightInCm = userInputs.height * 30.48;
    }
    if (weightUnit === 'lbs') {
      weightInKg = userInputs.weight * 0.453592;
    }

    setTimeout(async () => {
      try {
        const metrics = await healthAdvisor.predictRecommendations(
          userInputs.age,
          heightInCm,
          weightInKg,
          userInputs.activityLevel,
          userInputs.goal
        );

        const dietPlan = healthAdvisor.getDietPlan(
          metrics.bmiCategory,
          userInputs.goal,
          userInputs.age,
          userInputs.allergies
        );

        const workoutPlan = healthAdvisor.getWorkoutPlan(
          userInputs.age,
          metrics.bmiCategory,
          userInputs.activityLevel,
          userInputs.goal
        );

        const healthTips = healthAdvisor.getHealthTips(
          metrics.bmiCategory,
          userInputs.age,
          userInputs.goal
        );

        const analysisResult = {
          ...metrics,
          recommendations: { dietPlan, workoutPlan, healthTips },
          date: new Date().toISOString(),
          age: userInputs.age,
          height: userInputs.height,
          heightUnit,
          weight: userInputs.weight,
          weightUnit,
          activityLevel: userInputs.activityLevel,
          goal: userInputs.goal,
          gender: userInputs.gender
        };

        setRecommendations({
          metrics,
          dietPlan,
          workoutPlan,
          healthTips
        });

        // Save to history
        saveHealthHistory(selectedPatient._id, analysisResult);

        toast.success('Health analysis complete! Data saved to history');
      } catch (error) {
        console.error('Analysis error:', error);
        toast.error('Failed to analyze health data');
      } finally {
        setAnalyzing(false);
      }
    }, 500);
  };

  const handleViewHistoryEntry = (entry) => {
    setSelectedHistoryEntry(entry);
    // You can show a modal with detailed history
    toast.info(`Health score: ${entry.healthScore} - ${entry.riskLevel} risk`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint mx-auto mb-4"></div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Display values for height and weight based on selected units
  const displayHeight = userInputs.height;
  const displayWeight = userInputs.weight;

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 h-16">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-muted hover:bg-faint transition-colors">
            <Icons.ArrowLeft />
          </button>
          <h1 className="text-lg font-bold text-navy">AI Health Assistant</h1>
          <div className="ml-auto">
            <div className="flex items-center gap-1 px-2 py-1 bg-mint-light rounded-full">
              <div className="w-2 h-2 bg-mint rounded-full animate-pulse"></div>
              <span className="text-xs text-mint">AI Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Patient Selection */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-2">Select Patient</label>
          <div className="flex flex-wrap gap-2">
            {patients.map(patient => (
              <button
                key={patient._id}
                onClick={() => {
                  setSelectedPatient(patient);
                  setRecommendations(null);
                  if (patient?.dateOfBirth) {
                    const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
                    setUserInputs(prev => ({ ...prev, age }));
                  }
                }}
                className={`rounded-full border border-border text-sm font-medium px-4 py-1.5 transition-colors ${
                  selectedPatient?._id === patient._id
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-navy hover:bg-faint'
                }`}
              >
                {patient.name}
              </button>
            ))}
          </div>
        </div>

        {/* Health Trend Chart */}
        {healthHistory.length > 0 && (
          <HealthTrendChart history={healthHistory} />
        )}

        {/* Health History Timeline */}
        <HealthHistoryTimeline
          history={healthHistory}
          onSelectEntry={handleViewHistoryEntry}
        />

        {/* Health Input Form */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icons.Heart />
            <h2 className="font-semibold text-navy">Health Metrics</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1">Age (years)</label>
              <input
                type="range"
                min="18"
                max="100"
                value={userInputs.age}
                onChange={(e) => setUserInputs(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>18</span>
                <span className="font-medium text-mint">{userInputs.age} years</span>
                <span>100</span>
              </div>
            </div>

            {/* Height Section with Unit Toggle */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold tracking-widest text-muted uppercase">Height</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (heightUnit === 'cm') return;
                      const newValue = userInputs.height * 30.48;
                      setUserInputs(prev => ({ ...prev, height: Math.round(newValue) }));
                      setHeightUnit('cm');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                      heightUnit === 'cm' ? 'bg-mint text-white' : 'bg-faint text-muted hover:bg-border'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (heightUnit === 'ft') return;
                      const newValue = userInputs.height / 30.48;
                      setUserInputs(prev => ({ ...prev, height: parseFloat(newValue.toFixed(1)) }));
                      setHeightUnit('ft');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                      heightUnit === 'ft' ? 'bg-mint text-white' : 'bg-faint text-muted hover:bg-border'
                    }`}
                  >
                    ft
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={heightUnit === 'cm' ? 140 : 4.5}
                max={heightUnit === 'cm' ? 220 : 7.2}
                step={heightUnit === 'cm' ? 1 : 0.1}
                value={displayHeight}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setUserInputs(prev => ({ ...prev, height: newValue }));
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>{heightUnit === 'cm' ? '140 cm' : "4'6\""}</span>
                <span className="font-medium text-mint">
                  {displayHeight} {heightUnit === 'cm' ? 'cm' : 'ft'}
                </span>
                <span>{heightUnit === 'cm' ? '220 cm' : "7'2\""}</span>
              </div>
            </div>

            {/* Weight Section with Unit Toggle */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold tracking-widest text-muted uppercase">Weight</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (weightUnit === 'kg') return;
                      const newValue = userInputs.weight * 0.453592;
                      setUserInputs(prev => ({ ...prev, weight: Math.round(newValue) }));
                      setWeightUnit('kg');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                      weightUnit === 'kg' ? 'bg-mint text-white' : 'bg-faint text-muted hover:bg-border'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (weightUnit === 'lbs') return;
                      const newValue = userInputs.weight / 0.453592;
                      setUserInputs(prev => ({ ...prev, weight: Math.round(newValue) }));
                      setWeightUnit('lbs');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                      weightUnit === 'lbs' ? 'bg-mint text-white' : 'bg-faint text-muted hover:bg-border'
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={weightUnit === 'kg' ? 40 : 88}
                max={weightUnit === 'kg' ? 150 : 330}
                step={1}
                value={displayWeight}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setUserInputs(prev => ({ ...prev, weight: newValue }));
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>{weightUnit === 'kg' ? '40 kg' : '88 lbs'}</span>
                <span className="font-medium text-mint">
                  {displayWeight} {weightUnit === 'kg' ? 'kg' : 'lbs'}
                </span>
                <span>{weightUnit === 'kg' ? '150 kg' : '330 lbs'}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1">Activity Level</label>
              <select
                value={userInputs.activityLevel}
                onChange={(e) => setUserInputs(prev => ({ ...prev, activityLevel: e.target.value }))}
                className="w-full rounded-xl border border-border bg-faint px-4 py-3 text-sm text-navy focus:outline-none focus:border-mint transition-colors"
              >
                <option value="sedentary">Sedentary (Little or no exercise)</option>
                <option value="light">Light (Exercise 1-3 days/week)</option>
                <option value="moderate">Moderate (Exercise 3-5 days/week)</option>
                <option value="active">Active (Exercise 6-7 days/week)</option>
                <option value="veryActive">Very Active (Athlete/Physical job)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest text-muted uppercase mb-1">Health Goal</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'lose', label: 'Lose Weight', icon: '🎯' },
                  { value: 'maintain', label: 'Maintain', icon: '⚖️' },
                  { value: 'gain', label: 'Gain Weight', icon: '💪' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setUserInputs(prev => ({ ...prev, goal: option.value }))}
                    className={`p-3 rounded-xl text-center transition-all ${
                      userInputs.goal === option.value
                        ? 'bg-mint text-white'
                        : 'bg-faint text-navy hover:bg-border'
                    }`}
                  >
                    <div className="text-xl mb-1">{option.icon}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widests text-muted uppercase mb-1">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'male', label: 'Male', icon: '👨' },
                  { value: 'female', label: 'Female', icon: '👩' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setUserInputs(prev => ({ ...prev, gender: option.value }))}
                    className={`p-3 rounded-xl text-center transition-all ${
                      userInputs.gender === option.value
                        ? 'bg-mint text-white'
                        : 'bg-faint text-navy hover:bg-border'
                    }`}
                  >
                    <div className="text-xl mb-1">{option.icon}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={analyzeHealth}
            disabled={analyzing}
            className="w-full mt-6 bg-mint text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {analyzing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </span>
            ) : (
              'Get Personalized Plan'
            )}
          </button>
        </div>

        {/* Results Section */}
        {recommendations && (
          <>
            {/* BMI & Health Metrics */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <h3 className="font-semibold text-navy mb-3">Your Health Profile</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-faint rounded-xl">
                  <p className="text-2xl font-bold text-mint">{recommendations.metrics.bmi}</p>
                  <p className="text-xs text-muted">BMI</p>
                  <p className="text-sm font-medium mt-1">{recommendations.metrics.bmiCategory}</p>
                </div>
                <div className="text-center p-3 bg-faint rounded-xl">
                  <p className="text-2xl font-bold text-mint">{recommendations.metrics.healthScore}</p>
                  <p className="text-xs text-muted">Health Score</p>
                  <p className="text-sm font-medium mt-1">out of 100</p>
                </div>
              </div>
              <BMIChart bmi={parseFloat(recommendations.metrics.bmi)} category={recommendations.metrics.bmiCategory} />
              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div className="p-2 bg-faint rounded-xl">
                  <p className="text-muted">Daily Calories</p>
                  <p className="font-bold text-mint">{recommendations.metrics.adjustedCalories} kcal</p>
                </div>
                <div className="p-2 bg-faint rounded-xl">
                  <p className="text-muted">Water Intake</p>
                  <p className="font-bold text-mint">{recommendations.metrics.waterIntake} L/day</p>
                </div>
                <div className="p-2 bg-faint rounded-xl">
                  <p className="text-muted">Protein Needed</p>
                  <p className="font-bold text-mint">{recommendations.metrics.proteinNeeds} g/day</p>
                </div>
                <div className="p-2 bg-faint rounded-xl">
                  <p className="text-muted">Sleep Needed</p>
                  <p className="font-bold text-mint">{recommendations.metrics.sleepNeeds} hours</p>
                </div>
              </div>
            </div>

            {/* Progress Tracker */}
            <ProgressTracker
              healthScore={recommendations.metrics.healthScore}
              bmiCategory={recommendations.metrics.bmiCategory}
              goal={userInputs.goal}
            />

            {/* Diet Plan */}
            <DietPlanCard
              plan={recommendations.dietPlan}
              bmiCategory={recommendations.metrics.bmiCategory}
            />

            {/* Workout Plan */}
            <WorkoutPlanCard plan={recommendations.workoutPlan} />

            {/* Health Tips */}
            <HealthTipsCard tips={recommendations.healthTips} />

            {/* Hydration Reminder */}
            <div className="bg-mint-light rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Icons.Water />
                <div>
                  <p className="font-medium text-navy">Hydration Reminder</p>
                  <p className="text-sm text-muted">Try to drink {recommendations.metrics.waterIntake} liters of water today</p>
                </div>
              </div>
              <div className="mt-3 w-full bg-faint rounded-full h-1.5">
                <div className="w-0 bg-mint h-1.5 rounded-full transition-all duration-500" />
              </div>
            </div>
          </>
        )}
      </div>
      <MobileBottomNav />
    </div>
  );
}
