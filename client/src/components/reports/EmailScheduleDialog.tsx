import { useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { MultiSelect, type Option } from "@/components/ui/multi-select";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle } from "lucide-react";

// Form schema for email scheduling
const emailScheduleSchema = z.object({
  reportType: z.string(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  recipientEmails: z.array(z.string().email()),
  startDate: z.date().optional(),
  parameters: z.object({
    locationId: z.number().optional(),
    format: z.enum(["pdf", "csv"]).default("pdf"),
    includeCharts: z.boolean().default(true),
  }).optional(),
});

type EmailScheduleFormValues = z.infer<typeof emailScheduleSchema>;

interface EmailScheduleDialogProps {
  reportType: string;
  reportTitle: string;
  locationId?: number;
  children?: React.ReactNode;
  triggerButtonLabel?: string;
  recipientOptions?: Option[];
}

export function EmailScheduleDialog({
  reportType,
  reportTitle,
  locationId,
  children,
  triggerButtonLabel = "Schedule Email Reports",
  recipientOptions = [],
}: EmailScheduleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [recipientInput, setRecipientInput] = useState("");
  const [customRecipients, setCustomRecipients] = useState<Option[]>([]);

  // Setup default values based on report type
  const defaultValues: Partial<EmailScheduleFormValues> = {
    reportType,
    frequency: "monthly",
    recipientEmails: [],
    parameters: {
      locationId: locationId,
      format: "pdf",
      includeCharts: true,
    },
  };

  const form = useForm<EmailScheduleFormValues>({
    resolver: zodResolver(emailScheduleSchema),
    defaultValues,
  });

  const scheduleEmailMutation = useMutation({
    mutationFn: async (data: EmailScheduleFormValues) => {
      const res = await apiRequest("POST", "/api/reports/schedule", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Scheduled",
        description: `Your ${reportTitle} will be sent according to the schedule you specified.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/schedules"] });
      setOpen(false);
      form.reset(defaultValues);
    },
    onError: (error) => {
      toast({
        title: "Failed to schedule report",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: EmailScheduleFormValues) {
    scheduleEmailMutation.mutate(values);
  }

  function addCustomRecipient() {
    if (!recipientInput || !recipientInput.includes('@')) return;
    
    // Check if recipient already exists
    if (customRecipients.some(r => r.value === recipientInput)) return;
    
    const newRecipient = {
      label: recipientInput,
      value: recipientInput,
    };
    
    setCustomRecipients([...customRecipients, newRecipient]);
    setRecipientInput("");
  }

  // Combine predefined recipient options with custom ones
  const allRecipientOptions = [...recipientOptions, ...customRecipients];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            {triggerButtonLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule {reportTitle}</DialogTitle>
          <DialogDescription>
            Configure automated email delivery of this report to specified recipients.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Frequency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How often this report should be sent.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <DatePicker
                    date={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                  />
                  <FormDescription>
                    When to begin sending this report.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parameters.format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Format</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Format of the attached report.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="recipientEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipients</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={allRecipientOptions}
                        selected={field.value.map(email => {
                          const option = allRecipientOptions.find(o => o.value === email);
                          return option || { label: email, value: email };
                        })}
                        onChange={selected => field.onChange(selected.map(s => s.value))}
                        placeholder="Select recipients"
                      />
                    </FormControl>
                    <FormDescription>
                      Who should receive this report.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor="custom-recipient">Add Custom Recipient</Label>
                  <Input
                    id="custom-recipient"
                    placeholder="name@example.com"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addCustomRecipient}
                  size="icon"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                disabled={scheduleEmailMutation.isPending}
              >
                {scheduleEmailMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Schedule Report
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}