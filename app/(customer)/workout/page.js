
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabaseClient";
import { ChevronDown, ChevronUp, Dumbbell, Clock, RotateCcw } from "lucide-react";
import { useGymLogo } from "@/lib/hooks/useGymLogo";

export default function WorkoutPage() {
  const router = useRouter();
  const gymLogo = useGymLogo();
  const [loading, setLoading] = useState(true);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [membershipActive, setMembershipActive] = useState(false);
  const [canEditWorkoutPlan, setCanEditWorkoutPlan] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  // Get today's day number (1=Monday, 6=Saturday, 0=Sunday)
  const getTodayDayNumber = () => {
    const day = new Date().getDay();
    return day === 0 ? 0 : day; // Sunday = 0, Monday = 1, etc.
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    fetchWorkoutData();
  }, []);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      
      // Get logged-in member from localStorage
      const storedMember = localStorage.getItem("member");
      if (!storedMember) {
        router.push("/auth/login");
        return;
      }

      const member = JSON.parse(storedMember);

      // Fetch member details to check membership status and self_plan_edit_access
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
      setCanEditWorkoutPlan(memberDetails.self_plan_edit_access || false);

      // If membership is not active, don't fetch workout plans
      if (!isActive) {
        setLoading(false);
        return;
      }

      // Fetch assigned workout plans with days and exercises
      const { data: memberWorkouts, error } = await supabase
        .from("member_workouts")
        .select(`
          id,
          assigned_at,
          workout_plan_id,
          workout_plans (
            id,
            title,
            goal,
            level,
            description,
            created_at,
            workout_plan_days (
              id,
              day_of_week,
              day_name,
              focus,
              workout_exercises (
                id,
                exercise_name,
                sets,
                reps,
                weight,
                rest_seconds,
                notes,
                exercise_order
              )
            )
          )
        `)
        .eq("member_id", member.id)
        .order("assigned_at", { ascending: false });

      if (error) throw error;

      if (memberWorkouts && memberWorkouts.length > 0) {
        const plans = memberWorkouts.map(mw => {
          const plan = mw.workout_plans;
          // Sort days by day_of_week
          const sortedDays = plan?.workout_plan_days?.sort((a, b) => a.day_of_week - b.day_of_week) || [];
          // Sort exercises within each day
          sortedDays.forEach(day => {
            if (day.workout_exercises) {
              day.workout_exercises.sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0));
            }
          });
          
          return {
            id: mw.id,
            planId: plan?.id,
            title: plan?.title || "Workout Plan",
            goal: plan?.goal,
            level: plan?.level,
            description: plan?.description,
            assignedAt: mw.assigned_at,
            days: sortedDays,
          };
        });

        setWorkoutPlans(plans);

        // Get today's workout
        const todayNum = getTodayDayNumber();
        const latestPlan = plans[0];
        const todayDay = latestPlan.days?.find(d => d.day_of_week === todayNum);
        
        setTodayWorkout({
          name: latestPlan.title,
          focus: todayDay?.focus || (todayNum === 0 ? "Rest Day" : "No workout scheduled"),
          dayName: dayNames[todayNum],
          exercises: todayDay?.workout_exercises || [],
          isRestDay: todayNum === 0 || !todayDay,
        });

        // Auto-expand first plan
        setExpandedPlan(plans[0].id);
      } else {
        setTodayWorkout({
          name: "No workout assigned",
          focus: "-",
          dayName: dayNames[getTodayDayNumber()],
          exercises: [],
          isRestDay: true,
        });
      }

    } catch (error) {
      console.error("Error fetching workout data:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlan = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
    setExpandedDay(null);
  };

  const toggleDay = (dayId) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-700";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700";
      case "advanced":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getGoalColor = (goal) => {
    switch (goal?.toLowerCase()) {
      case "fat loss":
        return "bg-orange-100 text-orange-700";
      case "muscle gain":
        return "bg-blue-100 text-blue-700";
      case "strength":
        return "bg-purple-100 text-purple-700";
      case "endurance":
        return "bg-teal-100 text-teal-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header title="Workout" showBack={false} gymLogo={gymLogo} />
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
        <Header title="Workout" showBack={false} />
        <main className="px-4 py-4">
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔒</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Membership Required</h2>
            <p className="text-gray-500 mb-4">
              Your membership is not active. Please renew your membership to access workout plans.
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
      <Header title="Workout" showBack={false} />

      <main className="px-4 py-4 space-y-4">
        {/* Create Own Workout Plan Option */}
        {canEditWorkoutPlan && (
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Self Plan Access</p>
                <p className="text-lg font-semibold">Create Your Own Workout Plan</p>
              </div>
              <button
                onClick={() => router.push("/workout/create")}
                className="px-4 py-2 bg-white text-purple-700 rounded-lg font-medium text-sm hover:bg-purple-50 transition"
              >
                Create Plan
              </button>
            </div>
          </div>
        )}

        {/* Today's Workout Card */}
        <div className={`rounded-xl p-5 text-white ${todayWorkout?.isRestDay ? 'bg-gradient-to-br from-gray-600 to-gray-700' : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-blue-100 text-sm">{todayWorkout?.dayName} - Today</p>
              <h2 className="text-xl font-bold">{todayWorkout?.focus}</h2>
              {!todayWorkout?.isRestDay && (
                <p className="text-blue-200 text-sm mt-1">{todayWorkout?.name}</p>
              )}
            </div>
            <span className="text-3xl">{todayWorkout?.isRestDay ? '😴' : '💪'}</span>
          </div>
          {!todayWorkout?.isRestDay && todayWorkout?.exercises?.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1">
                <Dumbbell size={14} />
                {todayWorkout.exercises.length} exercise{todayWorkout.exercises.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Today's Exercises Preview */}
        {!todayWorkout?.isRestDay && todayWorkout?.exercises?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-blue-50">
              <h3 className="font-semibold text-blue-900">Today's Exercises</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {todayWorkout.exercises.map((exercise, idx) => (
                <div key={exercise.id || idx} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{exercise.exercise_name}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {exercise.sets && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {exercise.sets} sets
                          </span>
                        )}
                        {exercise.reps && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {exercise.reps} reps
                          </span>
                        )}
                        {exercise.weight && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {exercise.weight}
                          </span>
                        )}
                        {exercise.rest_seconds && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                            <RotateCcw size={10} />
                            {exercise.rest_seconds}s rest
                          </span>
                        )}
                      </div>
                      {exercise.notes && (
                        <p className="text-xs text-gray-500 mt-2">{exercise.notes}</p>
                      )}
                    </div>
                    <span className="text-2xl ml-3">🏋️</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Workout Plans with Day Breakdown */}
        {workoutPlans.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💪</span>
            </div>
            <p className="text-gray-700 font-medium mb-2">No Workout Plan Assigned</p>
            <p className="text-gray-500 text-sm">
              Contact your trainer to get a personalized workout plan
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">My Workout Plans</h3>
            
            {workoutPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Plan Header - Clickable */}
                <button
                  onClick={() => togglePlan(plan.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-900">{plan.title}</h4>
                      {plan.level && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getLevelColor(plan.level)}`}>
                          {plan.level}
                        </span>
                      )}
                      {plan.goal && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getGoalColor(plan.goal)}`}>
                          {plan.goal}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.days?.length || 0} training days • Assigned {new Date(plan.assignedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                  {expandedPlan === plan.id ? (
                    <ChevronUp className="text-gray-400" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400" size={20} />
                  )}
                </button>

                {/* Plan Days - Expandable */}
                {expandedPlan === plan.id && (
                  <div className="border-t border-gray-100">
                    {plan.description && (
                      <p className="px-4 py-3 text-sm text-gray-600 bg-gray-50 border-b border-gray-100">
                        {plan.description}
                      </p>
                    )}
                    
                    {plan.days?.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center">
                        No days configured for this plan
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {plan.days?.map((day) => (
                          <div key={day.id}>
                            {/* Day Header */}
                            <button
                              onClick={() => toggleDay(day.id)}
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-bold text-sm">
                                    {day.day_name?.slice(0, 2)}
                                  </span>
                                </div>
                                <div className="text-left">
                                  <p className="font-medium text-gray-900">{day.day_name}</p>
                                  <p className="text-sm text-gray-500">{day.focus || "General Workout"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {day.workout_exercises?.length || 0} exercises
                                </span>
                                {expandedDay === day.id ? (
                                  <ChevronUp className="text-gray-400" size={16} />
                                ) : (
                                  <ChevronDown className="text-gray-400" size={16} />
                                )}
                              </div>
                            </button>

                            {/* Day Exercises */}
                            {expandedDay === day.id && day.workout_exercises?.length > 0 && (
                              <div className="bg-gray-50 px-4 py-3 space-y-3">
                                {day.workout_exercises.map((exercise, exIdx) => (
                                  <div 
                                    key={exercise.id || exIdx}
                                    className="bg-white rounded-lg p-3 border border-gray-200"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {exIdx + 1}
                                          </span>
                                          <p className="font-medium text-gray-900">{exercise.exercise_name}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2 ml-8">
                                          {exercise.sets && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                              {exercise.sets} sets
                                            </span>
                                          )}
                                          {exercise.reps && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                              {exercise.reps} reps
                                            </span>
                                          )}
                                          {exercise.weight && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                              {exercise.weight}
                                            </span>
                                          )}
                                          {exercise.rest_seconds && (
                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                                              {exercise.rest_seconds}s rest
                                            </span>
                                          )}
                                        </div>
                                        {exercise.notes && (
                                          <p className="text-xs text-gray-500 mt-2 ml-8">💡 {exercise.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
