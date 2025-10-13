"use client";

import React, { useMemo, useState } from "react";
import { cn, getChangeColorClass, formatPrice } from "@/lib/utils";
import { WatchlistTable } from "@/components/WatchlistTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  watchlist: StockWithData[];
};

import { upsertAlert, removeAlert } from "@/lib/actions/alerts.actions";

export default function WatchlistWithAlerts({ watchlist, initialAlerts = {} }: WatchlistWithAlertsProps) {
  const [alerts, setAlerts] = useState<Record<string, AlertFormValues>>(initialAlerts);

  const alertSymbols = useMemo(() => Object.keys(alerts), [alerts]);

  const handleRemoveAlert = async (symbol: string) => {
    await removeAlert(symbol);
    setAlerts((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
  };

  const handleSaveAlert = async (symbol: string, values: AlertFormValues) => {
    // company looked up from watchlist for persistence
    const company = watchlist.find((w) => w.symbol === symbol)?.company || "";
    await upsertAlert(symbol, company, values);
    setAlerts((prev) => ({ ...prev, [symbol]: values }));
  };

  const activeAlerts = useMemo(
    () => watchlist.filter((w) => alertSymbols.includes(w.symbol)),
    [watchlist, alertSymbols]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <WatchlistTable
          watchlist={watchlist}
          alertSymbols={alertSymbols}
          onToggleAlert={handleRemoveAlert}
          alertDetails={alerts}
          onSaveAlert={(symbol, _company, values) => handleSaveAlert(symbol, values)}
        />
      </div>
      <aside className="lg:col-span-1">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Alerts</h3>
          {activeAlerts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No alerts selected.</div>
          ) : (
            <ul className="space-y-3">
              {activeAlerts.map((item) => {
                const settings = alerts[item.symbol];
                const sign = settings?.lesserGreaterEqual === 'lesser' ? '<' : settings?.lesserGreaterEqual === 'equal' ? '=' : '>';
                return (
                  <li key={item.symbol} className="rounded-md border p-4 bg-card">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          {/* If logo URL becomes available on item.logoUrl, it will render here */}
                          <AvatarImage src={(item as any).logoUrl as string} alt={item.company} />
                          <AvatarFallback className="text-sm font-semibold">
                            {item.company?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium leading-tight">{item.company}</div>
                          <div className="text-xs text-muted-foreground">{item.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{item.priceFormatted || "—"}</div>
                        <div className={cn("text-xs", getChangeColorClass(item.changePercent))}>
                          {item.changeFormatted || "—"}
                        </div>
                      </div>
                    </div>
                    {settings && (
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground mr-1">Alert:</span>
                          <span className="font-semibold">Price {sign} {formatPrice(settings.alertPrice)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-xs">
                            {settings.alertFrequency === 'minute' ? 'Once per minute' : settings.alertFrequency === 'hour' ? 'Once per hour' : 'Once per day'}
                          </span>
                          <Button size="icon-sm" variant="ghost" onClick={() => handleRemoveAlert(item.symbol)} title="Remove alert">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
