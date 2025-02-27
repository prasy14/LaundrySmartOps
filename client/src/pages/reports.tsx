import { Header } from "@/components/layout/Header";
import { KPICards } from "@/components/reports/KPICards";
import { PerformanceChart } from "@/components/reports/PerformanceChart";

export default function Reports() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <KPICards />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <PerformanceChart />
        </div>
      </main>
    </div>
  );
}
