'use client'

import * as React from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
    onChange({ from: newDate, to: value?.to });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
    onChange({ from: value?.from, to: newDate });
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <div className="relative">
        <input
          id="start-date"
          type="date"
          value={formatDateForInput(value?.from)}
          onChange={handleStartChange}
          placeholder="From"
          className="w-full h-10 px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-600 [color-scheme:dark]"
          style={{
            colorScheme: 'dark'
          }}
        />
      </div>
      <div className="relative">
        <input
          id="end-date"
          type="date"
          value={formatDateForInput(value?.to)}
          onChange={handleEndChange}
          placeholder="To"
          className="w-full h-10 px-3 py-2 bg-gray-900/50 border border-gray-700/50 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-600 [color-scheme:dark]"
          style={{
            colorScheme: 'dark'
          }}
        />
      </div>
    </div>
  );
}
