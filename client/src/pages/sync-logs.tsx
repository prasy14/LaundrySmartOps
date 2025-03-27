import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw } from 'lucide-react';
import { SyncLog } from '@shared/schema';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getQueryFn, queryClient } from '../lib/queryClient';

type SyncFilterState = {
  dateRange: DateRange | undefined;
  syncType: string;
  status: string;
};

export default function SyncLogsPage() {
  const [filter, setFilter] = useState<SyncFilterState>({
    dateRange: undefined,
    syncType: 'all',
    status: 'all',
  });

  // Build query string based on filters
  const getQueryString = () => {
    const params = new URLSearchParams();
    
    if (filter.dateRange?.from) {
      params.append('fromDate', filter.dateRange.from.toISOString());
    }
    
    if (filter.dateRange?.to) {
      params.append('toDate', filter.dateRange.to.toISOString());
    }
    
    if (filter.syncType && filter.syncType !== 'all') {
      params.append('syncType', filter.syncType);
    }
    
    if (filter.status && filter.status !== 'all') {
      params.append('status', filter.status);
    }
    
    return params.toString() ? `?${params.toString()}` : '';
  };

  // Handle filter changes
  useEffect(() => {
    if (refetch) {
      refetch();
    }
  }, [filter]);
  
  const { data, isLoading, error, refetch } = useQuery<{ logs: SyncLog[] }>({
    queryKey: ['/api/sync/logs', filter],
    queryFn: ({ queryKey }) => {
      const endpoint = `/api/sync/logs${getQueryString()}`;
      return fetch(endpoint).then(res => {
        if (!res.ok) throw new Error('Failed to fetch sync logs');
        return res.json();
      });
    },
    staleTime: 30000,
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleFilterChange = (newFilter: Partial<SyncFilterState>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  const renderStatus = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-500">Success</Badge>
    ) : (
      <Badge variant="destructive">Failed</Badge>
    );
  };

  const renderSyncType = (type: string) => {
    switch (type) {
      case 'auto':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Auto</Badge>;
      case 'manual':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Manual</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">API Sync Logs</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter sync logs by date, type, and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-fit">
              <DateRangePicker
                date={filter.dateRange}
                onChange={(date) => handleFilterChange({ dateRange: date })}
              />
            </div>
            
            <div className="w-[180px]">
              <Select
                value={filter.syncType}
                onValueChange={(value) => handleFilterChange({ syncType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sync Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[180px]">
              <Select
                value={filter.status}
                onValueChange={(value) => handleFilterChange({ status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync Logs</CardTitle>
          <CardDescription>
            Last {data?.logs.length || 0} sync operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-500">
              Error loading sync logs
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{log.endpoint}</TableCell>
                      <TableCell>{log.method}</TableCell>
                      <TableCell>{renderSyncType(log.syncType)}</TableCell>
                      <TableCell>{renderStatus(log.success)}</TableCell>
                      <TableCell>{log.duration ? formatDuration(log.duration) : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">View</Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px]" align="end">
                            <ScrollArea className="h-[300px]">
                              <div className="space-y-2">
                                <h4 className="font-semibold">Response Code: {log.statusCode || 'N/A'}</h4>
                                
                                {log.error && (
                                  <div className="space-y-1">
                                    <h4 className="font-semibold text-red-500">Error</h4>
                                    <pre className="bg-red-50 p-2 rounded text-xs overflow-auto max-h-[100px]">
                                      {log.error}
                                    </pre>
                                  </div>
                                )}
                                
                                {log.requestData && (
                                  <div className="space-y-1">
                                    <h4 className="font-semibold">Request Data</h4>
                                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-[100px]">
                                      {typeof log.requestData === 'string' 
                                        ? log.requestData 
                                        : JSON.stringify(log.requestData || {}, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                
                                {log.responseData && (
                                  <div className="space-y-1">
                                    <h4 className="font-semibold">Response Data</h4>
                                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-[100px]">
                                      {typeof log.responseData === 'string' 
                                        ? log.responseData 
                                        : JSON.stringify(log.responseData || {}, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                
                                <div className="text-sm text-gray-500 mt-2">
                                  <p>Location Count: {log.locationCount || 0}</p>
                                  <p>Machine Count: {log.machineCount || 0}</p>
                                  <p>Program Count: {log.programCount || 0}</p>
                                </div>
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {(!data?.logs || data.logs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                        No sync logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}