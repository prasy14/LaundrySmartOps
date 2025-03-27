import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { User } from "@shared/schema";

export function Header() {
  const [, setLocation] = useLocation();
  const { data } = useQuery<{ user: User }>({ 
    queryKey: ['/api/auth/me']
  });

  const handleLogout = async () => {
    // Clear session and redirect to login
    await fetch('/api/auth/logout', { method: 'POST' });
    setLocation('/login');
  };

  return (
    <header className="bg-background border-b h-16 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link to="/" className="logo-link">
          <img 
            src="/images/automatic-laundry-logo.webp" 
            alt="Automatic Laundry" 
            className="h-10 object-contain"
            title="Automatic Laundry SmartOps Platform"
          />
        </Link>
        <h2 className="text-xl font-semibold hidden md:block">
          {data?.user.role === 'admin' ? 'Administrator Dashboard' : 'SmartOps Dashboard'}
        </h2>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{data?.user.name[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuItem className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{data?.user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {data?.user.role}
              </p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
