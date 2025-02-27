import { Header } from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Machine } from "@shared/schema";

export default function Machines() {
  const { data } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines']
  });

  if (!data) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-3xl font-bold">Machine Management</h1>
        
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Ping</TableHead>
                  <TableHead>Cycles</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.machines.map((machine) => (
                  <TableRow key={machine.id}>
                    <TableCell className="font-medium">{machine.name}</TableCell>
                    <TableCell>{machine.location}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={machine.status === 'online' ? 'default' : 
                                machine.status === 'offline' ? 'destructive' : 'warning'}
                      >
                        {machine.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {machine.lastPing ? 
                        format(new Date(machine.lastPing), 'MMM d, h:mm a') : 
                        'Never'
                      }
                    </TableCell>
                    <TableCell>{machine.metrics?.cycles || 0}</TableCell>
                    <TableCell>{machine.metrics?.uptime.toFixed(1)}%</TableCell>
                    <TableCell>{machine.metrics?.errors || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
