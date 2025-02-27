import { Link, useLocation } from "wouter";
import { LayoutDashboard, WashingMachine, FileBarChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Machines', href: '/machines', icon: WashingMachine },
  { name: 'Reports', href: '/reports', icon: FileBarChart },
  { name: 'Admin', href: '/admin', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen flex-col gap-y-5 bg-sidebar border-r border-sidebar-border p-6">
      <div className="flex h-16 shrink-0 items-center">
        <h1 className="text-2xl font-bold text-sidebar-foreground">SmartOps</h1>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a className={cn(
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6",
                      location === item.href
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
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