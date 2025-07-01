import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Invalid credentials");
      }

      const data = await res.json();

      // Update auth state in React Query
      queryClient.setQueryData(['/api/auth/me'], { user: data.user });

      toast({
        title: "Success",
        description: "Successfully logged in",
        duration: 500,
      });
      
      // Redirect based on role
switch (data.user.role) {
  case 'admin':
  case 'manager':
  case 'executive':
  case 'sysanalyst':
    setLocation("/dashboard");
    break;
  case 'technician':
    setLocation("/alerts");
    break;
  case 'compliance':
    setLocation("/");
    break;
  default:
    setLocation("/");
}
      // Add a small delay to ensure the session is properly set
      await new Promise(resolve => setTimeout(resolve, 100));
      setLocation("/");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to login");
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* Hero Image Section */}
      <div className="hidden md:flex flex-col items-center justify-center bg-[#2f3944] p-8">
        <div className="max-w-2xl mx-auto text-center">
          <img 
            src="/images/automatic-laundry-logo.webp" 
            alt="Automatic Laundry" 
            className="h-14 object-contain mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-white mb-4">SmartOps Platform</h1>
          <p className="text-white/80 mb-8">Advanced enterprise laundry management and monitoring system</p>
          
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            <img 
              src="/images/laundry-machines-row.png" 
              alt="Automatic Laundry machines in a row" 
              className="w-full h-auto max-w-lg mx-auto rounded-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2f3944]/80 to-transparent flex items-end">
              <p className="text-white text-sm p-4">Smart monitoring for efficient laundry operations</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Form Section */}
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-[#73a4b7]">
          <CardHeader className="space-y-2">
            <div className="flex flex-col items-center justify-center mb-4">
              <img 
                src="/images/automatic-laundry-logo.webp" 
                alt="Automatic Laundry" 
                className="h-12 object-contain mx-auto"
              />
              <CardTitle className="text-2xl font-bold text-center gradient-text mt-3">SmartOps Platform</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          disabled={isLoading}
                          placeholder="Enter your username"
                          autoComplete="username"
                          className="border-[#647991]/30 focus-visible:ring-[#73a4b7]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          disabled={isLoading}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="border-[#647991]/30 focus-visible:ring-[#73a4b7]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-[#73a4b7] hover:bg-[#73a4b7]/90 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>
            
            {/* Mobile only image */}
            <div className="mt-8 md:hidden">
              <img 
                src="/images/laundry-machines-row.png" 
                alt="Automatic Laundry machines in a row" 
                className="w-full h-auto rounded-lg shadow-md"
              />
              <p className="text-center text-sm text-muted-foreground mt-2">
                Automatic Laundry Solutions - Smart monitoring for efficient operations
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}