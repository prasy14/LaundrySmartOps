import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Re-export DateRange type for consistency
export type { DateRange };

// DateRangePicker component for use in reports
interface DateRangePickerProps {
  date: DateRange;
  onDateChange: (date: DateRange) => void;
}

export function DateRangePicker({
  date,
  onDateChange
}: DateRangePickerProps) {
  return (
    <DatePickerWithRange 
      date={date} 
      setDate={onDateChange} 
    />
  );
}

interface DatePickerWithRangeProps {
  className?: string;
  date: DateRange | undefined;
  setDate: (date: DateRange) => void;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Preset date ranges
  const handleSelectPreset = (preset: number) => {
    const to = new Date();
    const from = addDays(to, -preset);
    setDate({ from, to });
    setIsOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size="sm"
            className={cn(
              "h-9 w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="border-r p-2 space-y-2">
              <h4 className="font-medium text-sm pl-3 pt-1">Quick Select</h4>
              <div className="flex flex-col gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={() => handleSelectPreset(7)}
                >
                  Last 7 days
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={() => handleSelectPreset(30)}
                >
                  Last 30 days
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start"
                  onClick={() => handleSelectPreset(90)}
                >
                  Last 90 days
                </Button>
              </div>
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(range) => range && setDate(range)}
              numberOfMonths={2}
              className="rounded-md"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}