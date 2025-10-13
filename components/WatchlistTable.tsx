'use client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import WatchlistButton from "@/components/WatchlistButton";
import {Button} from "@/components/ui/button";
import AlertPopover from "@/components/AlertPopover";
import {cn, getChangeColorClass} from "@/lib/utils";
import {useRouter} from "next/navigation";

// Reordered headers: Star first, Add Alert last
const WATCHLIST_TABLE_HEADER = [
  "Watch",
  "Company",
  "Symbol",
  "Price",
  "Change",
  "Market Cap",
  "P/E",
  "Alert",
];

const SAMPLE_ROWS = [
  ["AAPL", "Apple Inc.", "2025-10-01"],
  ["MSFT", "Microsoft Corp.", "2025-09-20"],
  ["GOOGL", "Alphabet Inc.", "2025-09-15"],
];

export function WatchlistTable({ watchlist, alertSymbols = [], onToggleAlert, alertDetails = {}, onSaveAlert }: WatchlistTableProps) {
    const router = useRouter();

    return (
        <>
            <Table className='scrollbar-hide-default watchlist-table'>
                <TableHeader>
                    <TableRow className='table-header-row'>
                        {WATCHLIST_TABLE_HEADER.map((label) => (
                            <TableHead className='table-header' key={label}>
                                {label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {watchlist.map((item, index) => (
                        <TableRow
                            key={item.symbol + index}
                            className='table-row hover:bg-accent/50 transition-colors cursor-pointer'
                            onClick={() =>
                                router.push(`/stocks/${encodeURIComponent(item.symbol)}`)
                            }
                        >
                            {/* Star as first column (yellow) */}
                            <TableCell className='table-cell w-12'>
                                <WatchlistButton
                                    symbol={item.symbol}
                                    company={item.company}
                                    isInWatchlist={true}
                                    showTrashIcon={true}
                                    type='icon'
                                    className='text-yellow-400'
                                />
                            </TableCell>
                            <TableCell className='pl-4 table-cell'>{item.company}</TableCell>
                            <TableCell className='table-cell'>{item.symbol}</TableCell>
                            <TableCell className='table-cell'>
                                {item.priceFormatted || '—'}
                            </TableCell>
                            <TableCell
                                className={cn(
                                    'table-cell',
                                    getChangeColorClass(item.changePercent)
                                )}
                            >
                                {item.changeFormatted || '—'}
                            </TableCell>
                            <TableCell className='table-cell'>
                                {item.marketCap || '—'}
                            </TableCell>
                            <TableCell className='table-cell'>
                                {item.peRatio || '—'}
                            </TableCell>
                            {/* Add Alert as last column with popover form */}
                            <TableCell>
                                <AlertPopover
                                    triggerLabel={alertSymbols?.includes(item.symbol) ? 'Update' : 'Add Alert'}
                                    triggerClassName='add-alert border-amber-600/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 hover:border-amber-500/80 transition-colors'
                                    defaultValues={alertDetails?.[item.symbol] ?? { alertPrice: item.currentPrice }}
                                    onSave={(values) => {
                                        onSaveAlert?.(item.symbol, item.company, values);
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    );
}