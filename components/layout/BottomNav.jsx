"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  CalendarCheck, 
  Megaphone, 
  CreditCard, 
  Settings,
  User,
  Dumbbell,
  Apple,
  Bell,
  ClipboardList,
  Trophy,
  ShoppingBag,
  Activity,
} from "lucide-react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";

const allAdminNavItems = [
  { href: "/admin/dashboard", label: "Home", icon: <Home className="w-5 h-5" />, permission: PERMISSIONS.DASHBOARD },
  { href: "/members", label: "Members", icon: <Users className="w-5 h-5" />, permission: PERMISSIONS.MEMBERS },
  { href: "/attendance", label: "Attendance", icon: <CalendarCheck className="w-5 h-5" />, permission: PERMISSIONS.ATTENDANCE },
  { href: "/announcements", label: "Alerts", icon: <Megaphone className="w-5 h-5" />, permission: PERMISSIONS.ANNOUNCEMENTS },
  { href: "/admin/leaderboard", label: "Ranks", icon: <Trophy className="w-5 h-5" /> },
  { href: "/admin/shop", label: "Shop", icon: <ShoppingBag className="w-5 h-5" /> },
  { href: "/finance", label: "Finance", icon: <CreditCard className="w-5 h-5" />, permission: PERMISSIONS.FINANCE },
  { href: "/settings", label: "Settings", icon: <Settings className="w-5 h-5" />, permission: PERMISSIONS.SETTINGS },
];

const trainerNavItems = [
  { href: "/trainer/dashboard", label: "Home", icon: <Home className="w-5 h-5" /> },
  { href: "/trainer/all-members", label: "Members", icon: <Users className="w-5 h-5" /> },
  { href: "/trainer/diet-plans", label: "Diet", icon: <Apple className="w-5 h-5" /> },
  { href: "/trainer/workout-plans", label: "Workout", icon: <Dumbbell className="w-5 h-5" /> },
  { href: "/trainer/profile", label: "Profile", icon: <User className="w-5 h-5" /> },
];

const customerNavItems = [
  { href: "/user/dashboard", label: "Home", icon: <Home className="w-5 h-5" /> },
  { href: "/workout", label: "Workout", icon: <Dumbbell className="w-5 h-5" /> },
  { href: "/diet", label: "Diet", icon: <Apple className="w-5 h-5" /> },
  { href: "/health-tracker", label: "Health", icon: <Activity className="w-5 h-5" /> },
  { href: "/leaderboard", label: "Ranks", icon: <Trophy className="w-5 h-5" /> },
  { href: "/shop", label: "Shop", icon: <ShoppingBag className="w-5 h-5" /> },
  { href: "/user/announcements", label: "Alerts", icon: <Bell className="w-5 h-5" /> },
  { href: "/profile", label: "Profile", icon: <User className="w-5 h-5" /> },
];

export default function BottomNav({ role = "admin" }) {
  const pathname = usePathname();
  const { permissions, loading } = usePermissions();
  
  const getNavItems = () => {
    switch (role) {
      case "trainer":
        return trainerNavItems;
      case "customer":
      case "member":
        return customerNavItems;
      case "admin":
      case "owner":
        // Filter based on permissions
        if (!permissions) return allAdminNavItems;
        return allAdminNavItems.filter(item => 
          !item.permission || hasPermission(permissions, item.permission)
        );
      default:
        return allAdminNavItems;
    }
  };
  
  const navItems = getNavItems();
  const homePath = navItems[0]?.href;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center  max-w-screen-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== homePath && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "text-blue-600" 
                  : "text-gray-500 hover:text-blue-500"
              }`}
              style={{ minWidth: '56px', minHeight: '56px' }}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "bg-blue-100" 
                  : "hover:bg-gray-100"
              }`}>
                <div className={`transition-all duration-200 ${
                  isActive ? "scale-110" : ""
                }`}>
                  {item.icon}
                </div>
              </div>
              
              <span className={`text-xs mt-1 font-medium ${
                isActive ? "text-blue-600" : "text-gray-600"
              }`}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="mt-0.5 w-5 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}