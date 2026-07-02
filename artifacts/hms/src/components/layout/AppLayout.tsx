import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Calendar, 
  Bed, 
  FileText, 
  Microscope, 
  Pill, 
  CreditCard, 
  UserCircle, 
  Building2, 
  Settings,
  Bell,
  Search,
  Activity
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Doctors", href: "/doctors", icon: Stethoscope },
  { name: "Appointments", href: "/appointments", icon: Calendar },
  { name: "Admissions", href: "/admissions", icon: Bed },
  { name: "Medical Records", href: "/medical-records", icon: FileText },
  { name: "Lab Orders", href: "/lab-orders", icon: Microscope },
  { name: "Pharmacy", href: "/pharmacy", icon: Pill },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Staff", href: "/staff", icon: UserCircle },
  { name: "Departments", href: "/departments", icon: Building2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-[100dvh] w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
            <Activity className="w-6 h-6" />
            <span>MedCore OS</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">Dr.A</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">Dr. Sarah Adams</span>
              <span className="text-xs text-muted-foreground mt-1">Chief Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center w-full max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patient ID, name, or doctor..."
                className="w-full pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:bg-background"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
