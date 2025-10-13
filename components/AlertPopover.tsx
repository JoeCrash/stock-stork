"use client";

import React, { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  onSave: (values: AlertFormValues) => void;
  triggerLabel?: string;
  triggerClassName?: string;
  defaultValues?: Partial<AlertFormValues>;
};

const comparatorLabel: Record<AlertFormValues["lesserGreaterEqual"], string> = {
  lesser: "<",
  equal: "=",
  greater: ">",
};

const frequencyLabel: Record<AlertFormValues["alertFrequency"], string> = {
  minute: "Once per minute",
  hour: "Once per hour",
  day: "Once per day",
};

export default function AlertPopover({ onSave, triggerLabel = "Add Alert", triggerClassName, defaultValues }: Props) {
  const [open, setOpen] = useState(false);

  const [price, setPrice] = useState<string>(() => (defaultValues?.alertPrice ?? "").toString());
  const [cmp, setCmp] = useState<AlertFormValues["lesserGreaterEqual"]>(defaultValues?.lesserGreaterEqual ?? "greater");
  const [freq, setFreq] = useState<AlertFormValues["alertFrequency"]>(defaultValues?.alertFrequency ?? "day");

  const isValidPrice = useMemo(() => {
    const n = Number(price);
    return Number.isFinite(n) && n > 0;
  }, [price]);

  const handleSave = () => {
    if (!isValidPrice) return;
    const values: AlertFormValues = {
      alertPrice: Number(price),
      lesserGreaterEqual: cmp,
      alertFrequency: freq,
    };
    onSave(values);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className={
            triggerClassName ??
            "border-amber-600/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 hover:border-amber-500/80 transition-colors"
          }
          onClick={(e) => e.stopPropagation()}
        >
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={8} align="end" className="w-72 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Price</label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Comparator</label>
              <Select value={cmp} onValueChange={(v) => setCmp(v as any)}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue placeholder="Comparator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesser">Less than</SelectItem>
                  <SelectItem value="equal">Equal to</SelectItem>
                  <SelectItem value="greater">Greater than</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Frequency</label>
              <Select value={freq} onValueChange={(v) => setFreq(v as any)}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minute">Once per minute</SelectItem>
                  <SelectItem value="hour">Once per hour</SelectItem>
                  <SelectItem value="day">Once per day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button size='sm' variant='ghost' onClick={(e) => { e.stopPropagation(); setOpen(false); }}>Cancel</Button>
            <Button size='sm' onClick={(e) => { e.stopPropagation(); handleSave(); }} disabled={!isValidPrice}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
