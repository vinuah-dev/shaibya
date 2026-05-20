"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabaseClient";
import { clearSession } from "@/lib/sessionStorage";
import { ProfilePageSkeleton } from "@/components/shared/CustomerSkeleton";
import { Edit2, Camera, Calendar, AlertTriangle, DollarSign } from "lucide-react";
import { useGymLogo } from "@/lib/hooks/useGymLogo";

export default function CustomerProfilePage() {
  const router = useRouter();
  const gymLogo = useGymLogo();
  const [activeTab, setActiveTab] = useState("membership");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [payments, setPayments] = useState([]);
  const [gymInfo, setGymInfo] = useState(null);
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Get logged-in member from localStorage
      const storedMember = localStorage.getItem("member");
      if (!storedMember) {
        router.push("/auth/login");
        return;
      }

      const member = JSON.parse(storedMember);

      // Fetch member details
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select(`
          id,
          full_name,
          phone,
          email,
          profile_image,
          gym_id,
          join_date,
          created_at,
          memberships (
            id,
            plan_id,
            start_date,
            end_date,
            status,
            membership_plans (
              name,
              duration_days,
              price
            )
          )
        `)
        .eq("id", member.id)
        .single();

      if (memberError) throw memberError;

      setProfile({
        id: memberData.id,
        name: memberData.full_name,
        email: memberData.email || "",
        phone: memberData.phone,
        profileImage: memberData.profile_image,
        joinDate: memberData.join_date || memberData.created_at,
      });

      // Get active membership
      const activeMembership = memberData.memberships?.find(m => m.status === 'active') || memberData.memberships?.[0];
      if (activeMembership) {
        const endDate = new Date(activeMembership.end_date);
        const startDate = new Date(activeMembership.start_date);
        const today = new Date();
        const daysLeft = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        setMembership({
          plan: activeMembership.membership_plans?.name || "No Plan",
          status: activeMembership.status,
          startDate: activeMembership.start_date,
          endDate: activeMembership.end_date,
          daysLeft: daysLeft,
          totalDays: totalDays,
        });
      } else {
        setMembership({
          plan: "No Plan",
          status: "expired",
          startDate: null,
          endDate: null,
          daysLeft: 0,
          totalDays: 0,
        });
      }

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!paymentsError && paymentsData) {
        setPayments(paymentsData.map(p => ({
          id: p.id,
          date: p.created_at.split('T')[0],
          amount: parseFloat(p.amount),
          type: p.membership_id ? "Membership" : "Trainer",
          status: p.status,
        })));
      }

      // Fetch pending payment with next payment date
      const { data: pendingData } = await supabase
        .from("payments")
        .select("next_payment_date, remaining_amount")
        .eq("member_id", member.id)
        .not("next_payment_date", "is", null)
        .gt("remaining_amount", 0)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingData) {
        setPendingPaymentInfo({
          nextPaymentDate: pendingData.next_payment_date,
          remainingAmount: pendingData.remaining_amount,
        });
      }

      // Also check member balance
      const { data: balanceData } = await supabase
        .from("members")
        .select("balance")
        .eq("id", member.id)
        .single();

      if (balanceData && balanceData.balance > 0 && !pendingData) {
        setPendingPaymentInfo({
          remainingAmount: balanceData.balance,
          nextPaymentDate: null,
        });
      }

      // Fetch gym info
      if (memberData.gym_id) {
        const { data: gymData, error: gymError } = await supabase
          .from("gyms")
          .select(`
            id, name, address, phone, email, website,
            weekday_morning_start, weekday_morning_end,
            weekday_evening_start, weekday_evening_end,
            weekend_morning_start, weekend_morning_end,
            weekend_evening_start, weekend_evening_end,
            sunday_off
          `)
          .eq("id", memberData.gym_id)
          .single();

        if (!gymError && gymData) {
          const formatTime = (time) => {
            if (!time) return "";
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
          };

          setGymInfo({
            name: gymData.name,
            address: gymData.address || "",
            phone: gymData.phone || "",
            email: gymData.email || "",
            website: gymData.website || "",
            weekdayMorning: gymData.weekday_morning_start && gymData.weekday_morning_end
              ? `${formatTime(gymData.weekday_morning_start)} - ${formatTime(gymData.weekday_morning_end)}`
              : null,
            weekdayEvening: gymData.weekday_evening_start && gymData.weekday_evening_end
              ? `${formatTime(gymData.weekday_evening_start)} - ${formatTime(gymData.weekday_evening_end)}`
              : null,
            weekendMorning: gymData.weekend_morning_start && gymData.weekend_morning_end
              ? `${formatTime(gymData.weekend_morning_start)} - ${formatTime(gymData.weekend_morning_end)}`
              : null,
            weekendEvening: gymData.weekend_evening_start && gymData.weekend_evening_end
              ? `${formatTime(gymData.weekend_evening_start)} - ${formatTime(gymData.weekend_evening_end)}`
              : null,
            sundayOff: gymData.sunday_off || false,
          });
        }
      }

    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header title="My Profile" showBack={false} gymLogo={gymLogo} />
        <div className="px-4 py-4 text-center">
          <p className="text-gray-500">Failed to load profile data</p>
        </div>
      </div>
    );
  }

  const membershipProgress = membership && membership.totalDays > 0
    ? ((membership.totalDays - membership.daysLeft) / membership.totalDays) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Profile" showBack={false} />

      <main className="px-4 py-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Clickable Profile Image */}
            <div 
              className="relative cursor-pointer group"
              onClick={() => router.push("/profile/edit")}
            >
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name.charAt(0)}
                </div>
              )}
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {profile.name}
              </h2>
              <p className="text-gray-500">{profile.phone}</p>
              {profile.email && (
                <p className="text-gray-400 text-sm">{profile.email}</p>
              )}
            </div>
            {/* Edit Button */}
            <button
              onClick={() => router.push("/profile/edit")}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Edit2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Member Since */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Member since</span>
            <span className="font-medium text-gray-900">
              {new Date(profile.joinDate).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Membership Status Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-300 text-sm">Current Plan</p>
              <p className="text-xl font-bold">{membership?.plan || "No Plan"}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              membership?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {membership?.status || "expired"}
            </span>
          </div>

          {membership && membership.totalDays > 0 && (
            <>
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${membershipProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-300">
                  {membership.daysLeft} days left
                </span>
                {membership.endDate && (
                  <span className="text-gray-300">
                    Expires: {new Date(membership.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Renew Button */}
       
        </div>

        {/* Pending Payment Alert */}
        {pendingPaymentInfo && pendingPaymentInfo.remainingAmount > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Pending Payment
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <p className="text-lg font-bold text-amber-600">
                    ₹{pendingPaymentInfo.remainingAmount}
                  </p>
                </div>
                {pendingPaymentInfo.nextPaymentDate && (
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-amber-200">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Due on{" "}
                      <span className="font-semibold">
                        {new Date(pendingPaymentInfo.nextPaymentDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Please clear your dues at the gym reception.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          {["membership", "payments", "gym"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize ${activeTab === tab
                  ? "bg-black text-white"
                  : "bg-white text-gray-600 border border-gray-200"
                }`}
            >
              {tab === "gym" ? "Gym Info" : tab}
            </button>
          ))}
        </div>

        {/* Membership Tab */}
        {activeTab === "membership" && (
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">Membership Details</h3>

            {membership ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Plan</p>
                  <p className="font-medium text-gray-900">
                    {membership.plan}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`font-medium capitalize ${
                    membership.status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {membership.status}
                  </p>
                </div>
                {membership.startDate && (
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(membership.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                )}
                {membership.endDate && (
                  <div>
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(membership.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No active membership</p>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Payment History</h3>
            </div>
            {payments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No payment history found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        ₹{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.type} • {new Date(payment.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payment.status === 'paid' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gym Info Tab */}
        {activeTab === "gym" && (
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            {gymInfo ? (
              <>
                <h3 className="font-semibold text-gray-900 text-lg">{gymInfo.name}</h3>

                <div className="space-y-4">
                  {gymInfo.address && (
                    <div className="flex items-start gap-3">
                      <span className="text-lg">📍</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Address</p>
                        <p className="text-sm text-gray-900">{gymInfo.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {gymInfo.phone && (
                    <div className="flex items-start gap-3">
                      <span className="text-lg">📞</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                        <a
                          href={`tel:${gymInfo.phone}`}
                          className="text-sm text-blue-600 font-medium"
                        >
                          {gymInfo.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {gymInfo.email && (
                    <div className="flex items-start gap-3">
                      <span className="text-lg">✉️</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Email</p>
                        <p className="text-sm text-gray-900">{gymInfo.email}</p>
                      </div>
                    </div>
                  )}

                  {gymInfo.website && (
                    <div className="flex items-start gap-3">
                      <span className="text-lg">🌐</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Website</p>
                        <a
                          href={gymInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 font-medium"
                        >
                          {gymInfo.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Operating Hours */}
                  {(gymInfo.weekdayMorning || gymInfo.weekdayEvening || gymInfo.weekendMorning || gymInfo.weekendEvening) && (
                    <div className="flex items-start gap-3">
                      <span className="text-lg">🕐</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2">Operating Hours</p>
                        
                        {/* Weekdays */}
                        {(gymInfo.weekdayMorning || gymInfo.weekdayEvening) && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Weekdays (Mon - Fri)</p>
                            <div className="space-y-1">
                              {gymInfo.weekdayMorning && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Morning</span>
                                  <span className="text-sm text-gray-900 font-medium">{gymInfo.weekdayMorning}</span>
                                </div>
                              )}
                              {gymInfo.weekdayEvening && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Evening</span>
                                  <span className="text-sm text-gray-900 font-medium">{gymInfo.weekdayEvening}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Weekends */}
                        {(gymInfo.weekendMorning || gymInfo.weekendEvening) && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              Weekends {gymInfo.sundayOff ? "(Saturday Only)" : "(Sat - Sun)"}
                            </p>
                            <div className="space-y-1">
                              {gymInfo.weekendMorning && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Morning</span>
                                  <span className="text-sm text-gray-900 font-medium">{gymInfo.weekendMorning}</span>
                                </div>
                              )}
                              {gymInfo.weekendEvening && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Evening</span>
                                  <span className="text-sm text-gray-900 font-medium">{gymInfo.weekendEvening}</span>
                                </div>
                              )}
                            </div>
                            {gymInfo.sundayOff && (
                              <p className="text-xs text-red-600 mt-2 font-medium">⚠️ Closed on Sundays</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                {gymInfo.phone && (
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => window.open(`tel:${gymInfo.phone}`)}
                      className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      📞 Call
                    </button>
                    <button
                      onClick={() =>
                        window.open(`https://wa.me/91${gymInfo.phone.replace(/\D/g, '')}`)
                      }
                      className="flex-1 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      💬 WhatsApp
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">Gym information not available</p>
            )}
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={async () => {
            // Clear all session & cached data
            await clearSession();
            localStorage.removeItem("selectedGym");
            localStorage.removeItem("member");
            localStorage.removeItem("swr-cache");
            localStorage.removeItem("trainer_login_at");
            localStorage.removeItem("notif_state");
            localStorage.removeItem("lastReceiptCleanup");
            window.history.replaceState(null, "", "/auth/login");
            router.replace("/auth/login");
          }}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium"
        >
          Logout
        </button>
      </main>
    </div>
  );
}
