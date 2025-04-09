import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveLine } from '@nivo/line';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Gauge,
  Activity,
  ArrowDownCircle
} from 'lucide-react';
import type { Machine } from '@shared/schema';
import { addMonths, differenceInDays, format, isAfter, isBefore } from 'date-fns';

// Define lifecycle stages
const LIFECYCLE_STAGES = [
  { 
    id: 'new', 
    name: 'New', 
    description: 'Recently installed machine', 
    icon: CheckCircle2, 
    color: '#4CAF50'
  },
  { 
    id: 'productive', 
    name: 'Productive', 
    description: 'Machine operating at optimal efficiency',
    icon: Activity,
    color: '#2196F3'
  },
  { 
    id: 'maintenance', 
    name: 'Maintenance', 
    description: 'Regular maintenance required', 
    icon: Gauge, 
    color: '#FF9800'
  },
  {
    id: 'warranty-ending',
    name: 'Warranty Ending',
    description: 'Machine approaching warranty expiry',
    icon: Clock,
    color: '#FFC107'
  },
  { 
    id: 'aging', 
    name: 'Aging', 
    description: 'Machine showing signs of wear',
    icon: AlertTriangle,
    color: '#FF5722'
  },
  { 
    id: 'end-of-life', 
    name: 'End of Life', 
    description: 'Machine needs replacement',
    icon: ArrowDownCircle,
    color: '#F44336'
  }
];

interface MachineLifecycleChartProps {
  machine: Machine;
}

const MachineLifecycleChart: React.FC<MachineLifecycleChartProps> = ({ machine }) => {
  // Determine current lifecycle stage based on machine data
  const getCurrentLifecycleStage = () => {
    // If there's a specific lifecycle status defined, use it
    if (machine.lifeCycleStatus) {
      const matchingStage = LIFECYCLE_STAGES.find(stage => 
        stage.id === machine.lifeCycleStatus?.toLowerCase().replace(' ', '-')
      );
      if (matchingStage) return matchingStage;
    }

    // Otherwise, determine based on other factors
    const today = new Date();
    
    // Installation date checks
    if (machine.installDate) {
      const installDate = new Date(machine.installDate);
      const threeMonthsAgo = addMonths(today, -3);
      
      // Machine is new (installed within last 3 months)
      if (isAfter(installDate, threeMonthsAgo)) {
        return LIFECYCLE_STAGES[0]; // New
      }
    }
    
    // Warranty checks
    if (machine.warrantyExpiryDate) {
      const warrantyDate = new Date(machine.warrantyExpiryDate);
      const threeMonthsBeforeExpiry = addMonths(warrantyDate, -3);
      
      // Machine warranty expiring soon
      if (isBefore(threeMonthsBeforeExpiry, today) && isAfter(warrantyDate, today)) {
        return LIFECYCLE_STAGES[3]; // Warranty Ending
      }
      
      // Machine out of warranty (considered aging)
      if (isBefore(warrantyDate, today)) {
        return LIFECYCLE_STAGES[4]; // Aging
      }
    }
    
    // Performance metrics checks
    if (machine.performanceMetrics) {
      const { uptime, efficiency, errorFrequency } = machine.performanceMetrics;
      
      // High error frequency or low efficiency indicate end of life
      if ((errorFrequency && errorFrequency > 5) || (efficiency && efficiency < 60)) {
        return LIFECYCLE_STAGES[5]; // End of Life
      }
      
      // Moderate issues indicate maintenance needed
      if ((errorFrequency && errorFrequency > 2) || (efficiency && efficiency < 80)) {
        return LIFECYCLE_STAGES[2]; // Maintenance
      }
    }
    
    // Default to productive if no other conditions met
    return LIFECYCLE_STAGES[1]; // Productive
  };

  // Generate historical performance data for visualization
  const generatePerformanceData = () => {
    // In a real app, this would come from historical data
    // For demo purposes, we'll generate some realistic data points
    
    const getRandomValue = (min: number, max: number) => {
      return Math.round((Math.random() * (max - min) + min) * 10) / 10;
    };
    
    const today = new Date();
    const days = 180; // 6 months of data
    const data = [];
    
    for (let i = days; i >= 0; i -= 7) { // Weekly data points
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Generate efficiency that gradually decreases over time
      // with some random variation
      const baseEfficiency = 95 - (i < 140 ? 0 : (i - 140) / 8);
      const efficiency = getRandomValue(
        Math.max(60, baseEfficiency - 5), 
        Math.min(100, baseEfficiency + 5)
      );
      
      // Generate uptime that follows a similar pattern
      const baseUptime = 98 - (i < 140 ? 0 : (i - 140) / 10);
      const uptime = getRandomValue(
        Math.max(75, baseUptime - 5), 
        Math.min(100, baseUptime + 2)
      );
      
      // Generate error frequency that gradually increases
      const baseErrors = i < 140 ? 0.5 : (i - 140) / 70;
      const errors = getRandomValue(
        Math.max(0, baseErrors - 0.5),
        baseErrors + 0.8
      );
      
      data.push({
        date: formattedDate,
        efficiency,
        uptime,
        errors
      });
    }
    
    return data;
  };

  const [performanceData] = useState(generatePerformanceData);
  
  const chartData = useMemo(() => {
    return [
      {
        id: 'Efficiency',
        color: '#2196F3',
        data: performanceData.map(d => ({
          x: d.date,
          y: d.efficiency
        }))
      },
      {
        id: 'Uptime',
        color: '#4CAF50',
        data: performanceData.map(d => ({
          x: d.date,
          y: d.uptime
        }))
      },
      {
        id: 'Error Frequency',
        color: '#F44336',
        data: performanceData.map(d => ({
          x: d.date,
          y: d.errors * 10 // Scale up for visibility
        }))
      }
    ];
  }, [performanceData]);

  const currentStage = getCurrentLifecycleStage();
  const StageIcon = currentStage.icon;

  // Calculate days in operation if install date available
  const getDaysInOperation = () => {
    if (!machine.installDate) return "Unknown";
    
    const installDate = new Date(machine.installDate);
    const today = new Date();
    const days = differenceInDays(today, installDate);
    
    if (days < 30) {
      return `${days} days`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(days / 365);
      const months = Math.floor((days % 365) / 30);
      return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? `, ${months} month${months !== 1 ? 's' : ''}` : ''}`;
    }
  };

  // Calculate expected remaining life
  const getRemainingLife = () => {
    if (!machine.installDate) return "Unknown";
    
    // Typical laundry machine lifespan is 10-15 years
    // We'll use 12 years as an average estimate
    const installDate = new Date(machine.installDate);
    const expectedEndDate = new Date(installDate);
    expectedEndDate.setFullYear(installDate.getFullYear() + 12);
    
    const today = new Date();
    
    if (isBefore(expectedEndDate, today)) {
      return "Past expected lifespan";
    }
    
    const daysRemaining = differenceInDays(expectedEndDate, today);
    const yearsRemaining = Math.floor(daysRemaining / 365);
    const monthsRemaining = Math.floor((daysRemaining % 365) / 30);
    
    return `~${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''}${monthsRemaining > 0 ? `, ${monthsRemaining} month${monthsRemaining !== 1 ? 's' : ''}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Machine Lifecycle</CardTitle>
          <CardDescription>Current status and performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg">
              <div className="flex items-center space-x-2">
                <StageIcon size={36} style={{ color: currentStage.color }} />
                <div>
                  <h3 className="text-xl font-bold" style={{ color: currentStage.color }}>
                    {currentStage.name}
                  </h3>
                  <p className="text-muted-foreground">{currentStage.description}</p>
                </div>
              </div>
              
              <div className="w-full mt-6 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">In Operation</p>
                  <p className="text-2xl font-bold">{getDaysInOperation()}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Est. Remaining Life</p>
                  <p className="text-2xl font-bold">{getRemainingLife()}</p>
                </div>
                
                {machine.installDate && (
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Install Date</p>
                    <p className="text-lg font-medium">
                      {format(new Date(machine.installDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                
                {machine.warrantyExpiryDate && (
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Warranty Until</p>
                    <p className="text-lg font-medium">
                      {format(new Date(machine.warrantyExpiryDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="w-full mt-4">
                <div className="relative pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        Lifecycle Progression
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block">
                        {LIFECYCLE_STAGES.findIndex(s => s.id === currentStage.id) / (LIFECYCLE_STAGES.length - 1) * 100}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 mt-1">
                    <div 
                      style={{ 
                        width: `${LIFECYCLE_STAGES.findIndex(s => s.id === currentStage.id) / (LIFECYCLE_STAGES.length - 1) * 100}%`,
                        backgroundColor: currentStage.color 
                      }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="h-[300px]">
              <ResponsiveLine
                data={chartData}
                margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                xScale={{
                  type: 'time',
                  format: '%Y-%m-%d',
                  useUTC: false,
                  precision: 'day',
                }}
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  max: 'auto',
                }}
                axisBottom={{
                  format: '%b %Y',
                  tickValues: 'every 2 months',
                  legend: 'Time',
                  legendOffset: 36,
                  legendPosition: 'middle'
                }}
                axisLeft={{
                  legend: 'Value',
                  legendOffset: -40,
                  legendPosition: 'middle'
                }}
                pointSize={0}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                useMesh={true}
                legends={[
                  {
                    anchor: 'bottom',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: 50,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 100,
                    itemHeight: 20,
                    symbolSize: 12,
                    symbolShape: 'circle',
                  }
                ]}
                theme={{
                  axis: {
                    ticks: {
                      text: {
                        fontSize: 11,
                      }
                    }
                  },
                  legends: {
                    text: {
                      fontSize: 11,
                    }
                  },
                  tooltip: {
                    container: {
                      fontSize: 11,
                    }
                  }
                }}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Lifecycle Stages</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {LIFECYCLE_STAGES.map((stage) => {
                const StageIcon = stage.icon;
                return (
                  <div 
                    key={stage.id} 
                    className={`flex items-center p-2 rounded-md border ${
                      currentStage.id === stage.id ? 'bg-accent' : ''
                    }`}
                  >
                    <StageIcon size={18} style={{ color: stage.color }} className="mr-2" />
                    <span className="text-xs font-medium">{stage.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MachineLifecycleChart;