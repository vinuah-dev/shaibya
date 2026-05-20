"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabaseClient";
import { useGymLogo } from "@/lib/hooks/useGymLogo";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPE_LABELS = {
  early_morning: "Early Morning",
  breakfast: "Breakfast",
  mid_morning: "Mid Morning",
  lunch: "Lunch",
  pre_workout: "Pre Workout",
  post_workout: "Post Workout",
  evening_snack: "Evening Snack",
  dinner: "Dinner",
  bedtime: "Bedtime",
};

export default function DietPage() {
  const router = useRouter();
  const gymLogo = useGymLogo();
  const [loading, setLoading] = useState(true);
  const [dietPlan, setDietPlan] = useState(null);
  const [water, setWater] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [membershipActive, setMembershipActive] = useState(false);
  const [canEditDietPlan, setCanEditDietPlan] = useState(false);

  useEffect(() => {
    fetchDietData();
    // Set selected day to today's day of week (1-7)
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday (0) to 7
    setSelectedDay(dayOfWeek);
  }, []);

  const fetchDietData = async () => {
    try {
      setLoading(true);
      
      // Get logged-in member from localStorage
      const storedMember = localStorage.getItem("member");
      if (!storedMember) {
        router.push("/auth/login");
        return;
      }

      const member = JSON.parse(storedMember);

      // Fetch member details including self_plan_edit_access and membership status
      const { data: memberDetails, error: memberError } = await supabase
        .from("members")
        .select(`
          id,
          self_plan_edit_access,
          memberships (
            id,
            status,
            end_date
          )
        `)
        .eq("id", member.id)
        .single();

      if (memberError) throw memberError;

      // Check if membership is active
      const activeMembership = memberDetails.memberships?.find(m => m.status === 'active');
      const isActive = activeMembership && new Date(activeMembership.end_date) >= new Date();
      setMembershipActive(isActive);
      setCanEditDietPlan(memberDetails.self_plan_edit_access || false);

      // If membership is not active, don't fetch diet plans
      if (!isActive) {
        setLoading(false);
        return;
      }

      // Fetch the most recent assigned diet plan with full details
      const { data: memberDiets, error: memberDietError } = await supabase
        .from("member_diets")
        .select(`
          id,
          assigned_at,
          diet_plan_id,
          diet_plans (
            id,
            title,
            description,
            created_at
          )
        `)
        .eq("member_id", member.id)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (memberDietError) throw memberDietError;

      if (!memberDiets || !memberDiets.diet_plans) {
        setLoading(false);
        return;
      }

      const planId = memberDiets.diet_plan_id;

      // Fetch diet plan days
      const { data: planDays, error: daysError } = await supabase
        .from("diet_plan_days")
        .select(`
          id,
          day_of_week,
          day_name,
          diet_meals (
            id,
            meal_type,
            meal_time,
            instructions,
            diet_meal_items (
              id,
              food_name,
              quantity,
              calories,
              notes
            )
          )
        `)
        .eq("diet_plan_id", planId)
        .order("day_of_week", { ascending: true });

      if (daysError) throw daysError;

      // Organize data by day
      const organizedDays = {};
      if (planDays) {
        planDays.forEach(day => {
          organizedDays[day.day_of_week] = {
            id: day.id,
            dayOfWeek: day.day_of_week,
            dayName: day.day_name || DAY_NAMES[day.day_of_week],
            meals: day.diet_meals || []
          };
        });
      }

      setDietPlan({
        id: memberDiets.diet_plans.id,
        title: memberDiets.diet_plans.title,
        description: memberDiets.diet_plans.description,
        assignedAt: memberDiets.assigned_at,
        days: organizedDays
      });

    } catch (error) {
      console.error("Error fetching diet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addWater = () => {
    setWater((prev) => Math.min(prev + 250, 3000));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header title="Diet Plan" showBack={false} gymLogo={gymLogo} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  // Show inactive membership message
  if (!membershipActive) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header title="Diet Plan" showBack={false} />
        <main className="px-4 py-4">
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔒</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Membership Required</h2>
            <p className="text-gray-500 mb-4">
              Your membership is not active. Please renew your membership to access diet plans.
            </p>
            <div
              className="px-6 py-3 bg-orange-300 text-white rounded-lg font-medium hover:bg-orange-600 transition"
            >
              Renew Membership to continue
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Diet Plan" showBack={false} />

      <main className="px-4 py-4 space-y-4">
        {/* Create Own Diet Plan Option */}
        {canEditDietPlan && (
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Self Plan Access</p>
                <p className="text-lg font-semibold">Create Your Own Diet Plan</p>
              </div>
              <button
                onClick={() => router.push("/diet/create")}
                className="px-4 py-2 bg-white text-purple-700 rounded-lg font-medium text-sm hover:bg-purple-50 transition"
              >
                Create Plan
              </button>
            </div>
          </div>
        )}
        {/* Diet Plan Overview */}
        {dietPlan ? (
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm">Active Diet Plan</p>
                <p className="text-2xl font-bold">{dietPlan.title}</p>
                {dietPlan.description && (
                  <p className="text-green-100 text-sm mt-1">{dietPlan.description}</p>
                )}
              </div>
              <span className="text-3xl">🥗</span>
            </div>
            <p className="text-green-100 text-sm">
              Assigned: {new Date(dietPlan.assignedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm">No Diet Plan Assigned</p>
                <p className="text-xl font-bold">Contact your trainer</p>
              </div>
              <span className="text-3xl">🥗</span>
            </div>
          </div>
        )}

        {/* Day Selector */}
        {dietPlan && Object.keys(dietPlan.days).length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">Select Day</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
                const dayData = dietPlan.days[dayNum];
                if (!dayData) return null;
                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                      selectedDay === dayNum
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {dayData.dayName || DAY_NAMES[dayNum]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Day's Meals */}
        {dietPlan && selectedDay && dietPlan.days[selectedDay] && (
          <div className="space-y-4">
            {dietPlan.days[selectedDay].meals.length > 0 ? (
              dietPlan.days[selectedDay].meals
                .sort((a, b) => {
                  const order = ['early_morning', 'breakfast', 'mid_morning', 'lunch', 'pre_workout', 'post_workout', 'evening_snack', 'dinner', 'bedtime'];
                  return order.indexOf(a.meal_type) - order.indexOf(b.meal_type);
                })
                .map(meal => (
                  <div key={meal.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {MEAL_TYPE_LABELS[meal.meal_type] || meal.meal_type}
                        </h3>
                        {meal.meal_time && (
                          <p className="text-sm text-gray-500 mt-1">
                            ⏰ {meal.meal_time}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {meal.instructions && (
                      <p className="text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded-lg">
                        {meal.instructions}
                      </p>
                    )}

                    {meal.diet_meal_items && meal.diet_meal_items.length > 0 && (
                      <div className="space-y-2">
                        {meal.diet_meal_items.map(item => (
                          <div key={item.id} className="flex items-start justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.food_name}</p>
                              {item.quantity && (
                                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                              )}
                            </div>
                            {item.calories && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                                {item.calories} cal
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <span className="text-4xl">🍽️</span>
                <p className="text-gray-500 mt-2">No meals planned for this day</p>
              </div>
            )}
          </div>
        )}

        {/* Water Tracker */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💧</span>
              <div>
                <p className="font-medium text-blue-900">Water Intake</p>
                <p className="text-sm text-blue-600">
                  {water}ml / 3000ml
                </p>
              </div>
            </div>
            <button
              onClick={addWater}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              + 250ml
            </button>
          </div>
          <div className="h-3 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${(water / 3000) * 100}%` }}
            ></div>
          </div>
        </div>


        {/* Health Tip */}
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="font-medium text-yellow-900">Health Tip</p>
              <p className="text-sm text-yellow-700">
                Stay hydrated throughout the day. Aim for at least 3L of water daily for better performance and recovery.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
