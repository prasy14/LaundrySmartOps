import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, WashingMachine, MapPin, FileBarChart, Settings, History, 
  AlertTriangle, BarChart2, LineChart, BrainCircuit, Users, FileText, 
  TrendingUp, BarChart, Zap, Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

// Main navigation categories
const navigationCategories = [
  {
    name: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ]
  },
  {
    name: 'Machine Operations',
    items: [
      { name: 'Machine Management', href: '/machines', icon: WashingMachine },
      { name: 'Alert Issues', href: '/alerts', icon: AlertTriangle },
      { name: 'Predictive Maintenance', href: '/predictive', icon: BrainCircuit },
    ]
  },
  {
    name: 'Analytics',
    items: [
      { name: 'Reports & Analytics', href: '/reports', icon: FileBarChart },
      { name: 'Visualizations', href: '/visualizations', icon: LineChart },
      { name: 'Custom Reports', href: '/custom-reports', icon: FileText },
      { name: 'Usage Patterns', href: '/usage-patterns', icon: TrendingUp },
      { name: 'Machine Comparison', href: '/machine-comparison', icon: BarChart },
      { name: 'Energy Optimizer', href: '/energy', icon: Zap },
    ]
  },
  {
    name: 'Administration',
    items: [
      { name: 'Locations', href: '/locations', icon: MapPin },
      { name: 'Location Admin', href: '/location-admin', icon: Building },
      { name: 'User Management', href: '/users', icon: Users, role: 'admin' },
      { name: 'System Settings', href: '/admin', icon: Settings, role: 'admin' },
      { name: 'Sync Logs', href: '/sync-logs', icon: History, role: 'admin' },
    ]
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Overview']);
  
  // Get current user info
  const { data: userData } = useQuery<{ user: { role: string } }>({
    queryKey: ['/api/auth/me'],
  });
  
  const userRole = userData?.user?.role || '';

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="flex h-full w-64 flex-col gap-y-5 bg-background border-r border-border p-4 overflow-y-auto">
      <div className="flex h-16 shrink-0 items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">SmartOps</h1>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          {navigationCategories.map((category) => (
            <li key={category.name} className="mb-2">
              <Collapsible 
                open={expandedCategories.includes(category.name)} 
                onOpenChange={() => toggleCategory(category.name)}
                className="w-full"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between p-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/30">
                  <span>{category.name}</span>
                  {expandedCategories.includes(category.name) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-2 mt-1">
                  <ul className="space-y-1">
                    {category.items
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
                            <item.icon className="h-5 w-5 shrink-0" />
                            {item.name}
                          </a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}