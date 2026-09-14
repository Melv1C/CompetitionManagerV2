import { CalendarIcon, XIcon } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import type { DayPicker } from "react-day-picker";

import {
  Button,
  Calendar,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export interface DateTimePickerProps {
  /**
   * The selected date and time
   */
  value?: Date;
  /**
   * Callback when the date or time changes
   */
  onChange?: (date: Date | undefined) => void;
  /**
   * Label for the picker
   */
  label?: string;
  /**
   * Placeholder text when no date is selected
   */
  placeholder?: string;
  /**
   * Whether to show the clear button
   */
  showClear?: boolean;
  /**
   * Disable the entire picker
   */
  disabled?: boolean;
  /**
   * Apply the disabled modifier to matching days.
   * Supports Date, Date[], DateRange, DateBefore, DateAfter, DateInterval, DayOfWeek, or a function.
   * @see https://daypicker.dev/selections/disabling-dates
   */
  disabledDates?: React.ComponentProps<typeof DayPicker>["disabled"];
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Date time format function
   */
  formatDateTime?: (date: Date) => string;
}

function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Select date and time",
  showClear = true,
  disabled = false,
  disabledDates,
  className,
  formatDateTime,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(value);
  const [previousValue, setPreviousValue] = useState(value);

  if (value !== previousValue) {
    setPreviousValue(value);
    setDate(value);
  }

  const handleClear = () => {
    setDate(undefined);
    onChange?.(undefined);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined);
      onChange?.(undefined);
      return;
    }

    let updatedDate = newDate;

    if (date) {
      updatedDate = new Date(newDate);
      updatedDate.setHours(date.getHours());
      updatedDate.setMinutes(date.getMinutes());
      updatedDate.setSeconds(date.getSeconds());
    }

    setDate(updatedDate);
    onChange?.(updatedDate);
  };

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const timeValue = event.target.value;
    if (!timeValue) return;

    const [hours = "0", minutes = "0", seconds = "0"] = timeValue.split(":");
    const updatedDate = date ? new Date(date) : new Date();
    updatedDate.setHours(parseInt(hours, 10));
    updatedDate.setMinutes(parseInt(minutes, 10));
    updatedDate.setSeconds(parseInt(seconds, 10));

    setDate(updatedDate);
    onChange?.(updatedDate);
  };

  const formatTimeValue = (date: Date | undefined) => {
    if (!date) return "";

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const defaultFormatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <Label htmlFor="datetime-picker" className="px-1">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                id="datetime-picker"
                className={cn(
                  "w-full justify-start font-normal",
                  showClear && date && "pr-9",
                  !date && "text-muted-foreground",
                )}
                disabled={disabled}
              />
            }
          >
            <CalendarIcon className="mr-2 size-4" />
            {date
              ? formatDateTime
                ? formatDateTime(date)
                : defaultFormatDateTime(date)
              : placeholder}
          </PopoverTrigger>
          {showClear && date && (
            <button
              type="button"
              aria-label="Clear selected date and time"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="hover:bg-accent absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1"
              disabled={disabled}
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={handleDateChange}
            disabled={disabledDates}
          />
          <div className="border-t p-3">
            <Label htmlFor="time-input" className="mb-2 block text-xs">
              Time
            </Label>
            <Input
              type="time"
              id="time-input"
              step="60"
              value={formatTimeValue(date)}
              onChange={handleTimeChange}
              disabled={!date || disabled}
              className="bg-background h-8 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DateTimePicker };
