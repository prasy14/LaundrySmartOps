import { Link, useLocation } from "wouter";
import { LayoutDashboard, WashingMachine, MapPin, FileBarChart, Settings, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Machines', href: '/machines', icon: WashingMachine },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'Admin', href: '/admin', icon: Settings },
  { name: 'Sync Logs', href: '/sync-logs', icon: History, role: 'admin' },
];

export function Sidebar() {
  const [location] = useLocation();
  
  // Get current user info
  const { data: userData } = useQuery<{ user: { role: string } }>({
    queryKey: ['/api/auth/me'],
  });
  
  const userRole = userData?.user?.role || '';

  return (
    <div className="flex h-full w-64 flex-col gap-y-5 bg-background border-r border-border p-6">
      <div className="flex h-16 shrink-0 items-center">
        <h1 className="text-2xl font-bold text-foreground">SmartOps</h1>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation
                .filter(item => !item.role || item.role === userRole)
                .map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a className={cn(
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6",
                      location === item.href
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    )}>
                      <item.icon className="h-6 w-6 shrink-0" />
                      {item.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}