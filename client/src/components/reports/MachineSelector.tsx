import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Machine } from "@shared/schema";

interface MachineSelectorProps {
  selectedMachine: string;
  onMachineChange: (value: string) => void;
  locationId?: string;
  label?: string;
  className?: string;
}

export function MachineSelector({
  selectedMachine,
  onMachineChange,
  locationId,
  label = "Select Machine",
  className = "w-[200px]"
}: MachineSelectorProps) {
  // Fetch all machines
  const { data: machinesData, isLoading } = useQuery<{ machines: Machine[] }>({
    queryKey: ['/api/machines', locationId],
  });

  // Filter machines by location if locationId is provided
  const filteredMachines = machinesData?.machines?.filter(machine => 
    !locationId || locationId === 'all' || machine.locationId === parseInt(locationId, 10)
  ) || [];

  return (
    <Select
      value={selectedMachine}
      onValueChange={onMachineChange}
      disabled={isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Machines</SelectItem>
        {filteredMachines.map((machine) => (
          <SelectItem key={machine.id} value={machine.id.toString()}>
            {machine.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}