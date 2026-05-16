"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabaseClient";
import { clearSession } from "@/lib/sessionStorage";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import {
  Settings as SettingsIcon,
  Users,
  Calendar,
  Bell,
  Shield,
  FileText,
  Dumbbell,
  Utensils,
  HelpCircle,
  Database,
  ArrowLeft,
  LogOut,
  Smartphone,
  Clock,
  Activity,
  ChevronRight,
  Building,
  TrendingUp,
  Wrench,
  ClipboardList,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  User,
  Phone,
  Mail,
  CreditCard,
  Key,
  Trash2,
  RefreshCw,
  Package,
  ShieldAlert,
} from "lucide-react";

const settingsSections = [
  {
    id: "admins",
    title: "Manage Admins",
    description: "Add, remove, toggle admin access & permissions",
    icon: ShieldAlert,
    href: "/settings/admins",
    color: "from-purple-600 to-indigo-600",
    superadminOnly: true,
  },
  {
    id: "gym",
    title: "Gym Settings",
    description: "Name, address, operating hours, QR code",
    icon: Building,
    href: "/settings/gym",
    color: "from-blue-600 to-indigo-600"
  },
  {
    id: "inquiries",
    title: "Inquiries",
    description: "Track walk-ins, follow-ups & conversions",
    icon: ClipboardList,
    href: "/inquiries",
    color: "from-purple-600 to-indigo-600"
  },
  {
    id: "plans",
    title: "Membership Plans",
    description: "Create, edit plans, pricing, freeze options",
    icon: FileText,
    href: "/settings/plans",
    color: "from-blue-600 to-indigo-600"
  },
  {
    id: "diet-plans",
    title: "Diet Plans",
    description: "Create and manage diet plans with meals",
    icon: Utensils,
    href: "/settings/diet-plans",
    color: "from-blue-600 to-indigo-600"
  },
  {
    id: "workout-plans",
    title: "Workout Plans",
    description: "Create and manage workout routines",
    icon: Dumbbell,
    href: "/settings/workout-plans",
    color: "from-blue-600 to-indigo-600"
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Reminders, alerts, payment notifications",
    icon: Bell,
    href: "/settings/notifications",
    color: "from-blue-600 to-indigo-600"
  },
  {
    id: "trainers",
    title: "Trainers",
    description: "Manage trainers, plans & member assignments",
    icon: Shield,
    href: "/settings/trainers",
    color: "from-blue-600 to-indigo-600"
  },
  {
    id: "amenities",
    title: "Gym Amenities",
    description: "Locker, towel, parking & other amenities",
    icon: Package,
    href: "/settings/amenities",
    color: "from-blue-600 to-indigo-600"
  },
];

const quickActions = [
  {
    label: "Backup",
    icon: Database,
    action: "backup",
    description: "Create backup",
    color: "bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200"
  },
  {
    label: "Help",
    icon: HelpCircle,
    action: "help",
    description: "Get support",
    color: "bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200"
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { canViewFinance, canCreateTrainer, user } = useUserRole();
  const [gymName, setGymName] = useState("Loading...");
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [appStats, setAppStats] = useState({
    version: "1.2.5",
    lastUpdated: "Jan 15, 2025",
    databaseSize: "2.4 GB"
  });

  // Filter quick actions based on role
  const filteredQuickActions = quickActions;

  useEffect(() => {
    fetchGymData();
  }, []);

  const fetchGymData = async () => {
    try {
      setLoading(true);
      
      const storedGym = localStorage.getItem("selectedGym");
      if (!storedGym) {
        console.error("No gym selected");
        setLoading(false);
        router.push("/admin/dashboard");
        return;
      }

      const gym = JSON.parse(storedGym);
      setGymName(gym.name || "My Gym");

      const { count, error } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("gym_id", gym.id);

      if (error) throw error;
      setTotalMembers(count || 0);
    } catch (error) {
      console.error("Error fetching gym data:", error);
      const storedGym = localStorage.getItem("selectedGym");
      if (storedGym) {
        const gym = JSON.parse(storedGym);
        setGymName(gym.name || "My Gym");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    switch (action) {
      case "backup":
        alert("Backup functionality coming soon!");
        break;
      case "help":
        alert("Contact details phone no - +91 7498341146                                       email id - shaibyasolutions@gmail.com");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 safe-area-inset-bottom">
      <Header title="Settings" showBack={false} />

      <main className="px-3 py-3 space-y-4">
        {/* Gym Profile Card - Updated to Indigo Theme */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-4 shadow-lg mx-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
              <Building className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1 truncate">{gymName}</h2>
              <p className="text-white/90 text-sm">Administrator Dashboard</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-white/80" />
                  <p className="text-white/90 text-xs">{loading ? "..." : totalMembers} Members</p>
                </div>
                <span className="text-white/30">•</span>
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-white/80" />
                  <p className="text-white/90 text-xs">Active Today</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/20">
            <div className="text-center">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-white/80">Settings</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-white/80">Analytics</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-1">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-white/80">Tools</p>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <SettingsIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Settings</span>
          </div>
          
          <div className="space-y-3">
            {settingsSections
              .filter((section) => {
                // Only show superadmin sections to superadmins
                if (section.superadminOnly && user?.role !== "superadmin") {
                  return false;
                }
                // Hide membership plans, diet plans, and workout plans if members permission is false
                if (!hasPermission(permissions, PERMISSIONS.MEMBERS)) {
                  return !['plans', 'diet-plans', 'workout-plans'].includes(section.id);
                }
                // Hide gym settings, membership plans and trainers section for trainers
                if (!canCreateTrainer) {
                  return !['gym', 'plans', 'trainers'].includes(section.id);
                }
                return true;
              })
              .map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  onClick={() => !section.badge && router.push(section.href)}
                  className={`bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md active:scale-95 transition-all duration-200 ${section.badge ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {section.title}
                        </h3>
                        {section.badge && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full whitespace-nowrap">
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2 truncate">
                        {section.description}
                      </p>
                      {!section.badge && (
                        <div className="flex items-center text-blue-600 text-xs font-medium">
                          <span>Configure</span>
                          <ChevronRight className="w-3 h-3 ml-1" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Quick Actions</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {quickActions
              .map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.action}
                  onClick={() => handleQuickAction(action.action)}
                  className={`${action.color} rounded-xl p-3 flex flex-col items-center gap-2 transition-all duration-200 hover:shadow-md active:scale-95`}
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900 text-xs">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* App Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <Smartphone className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">App Information</span>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4 mx-1 space-y-3">
            {/* Version */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">v</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Version</p>
                  <p className="text-xs text-gray-500">Current app version</p>
                </div>
              </div>
              <span className="font-semibold text-gray-900 text-sm">{appStats.version}</span>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Last Updated</p>
                  <p className="text-xs text-gray-500">Most recent update</p>
                </div>
              </div>
              <span className="font-semibold text-gray-900 text-sm">{appStats.lastUpdated}</span>
            </div>

            {/* Total Members */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Members</p>
                  <p className="text-xs text-gray-500">Active member count</p>
                </div>
              </div>
              <span className="font-semibold text-gray-900 text-sm">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                  totalMembers.toLocaleString()
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-3 px-1">
          {/* Back to Dashboard - Updated to Indigo Theme */}
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            style={{ minHeight: '44px' }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          {/* Logout Button */}
          <button
            onClick={async () => {
              if (window.confirm("Are you sure you want to logout?")) {
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
              }
            }}
            className="w-full py-3 bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 text-red-600 rounded-xl font-medium hover:shadow-sm active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
            style={{ minHeight: '44px' }}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Support Info */}
        <div className="text-center pt-2 px-3">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <button 
              onClick={() => handleQuickAction("help")}
              className="text-blue-600 font-medium hover:text-blue-700 active:text-blue-800"
            >
              Contact Support
            </button>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            © {new Date().getFullYear()} Gym Management System
          </p>
        </div>
      </main>
    </div>
  );
}