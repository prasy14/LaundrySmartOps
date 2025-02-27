import { Header } from "@/components/layout/Header";
import { MachineGrid } from "@/components/dashboard/MachineGrid";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { useEffect } from "react";
import { addMessageHandler } from "@/lib/ws";
import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  useEffect(() => {
    return addMessageHandler((message) => {
      if (message.type === 'machine_update') {
        queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      } else if (message.type === 'new_alert' || message.type === 'alert_cleared') {
        queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      }
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MachineGrid />
          </div>
          <div className="lg:col-span-1">
            <AlertsList />
          </div>
        </div>
      </main>
    </div>
  );
}
