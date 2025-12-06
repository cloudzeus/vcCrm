"use client";

import * as React from "react";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Eye, EyeOff, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ColumnDef<T> = {
  id: string;
  header: string | ((props: { column: any }) => React.ReactNode);
  accessorKey?: keyof T;
  cell?: (props: { row: { original: T } }) => React.ReactNode;
  enableSorting?: boolean;
  enableHiding?: boolean;
};

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  onBulkAction?: (selectedRows: T[], action: string) => void;
  bulkActions?: Array<{ label: string; value: string; variant?: "default" | "destructive" }>;
  rowActions?: Array<{ label: string; value: string; onClick: (row: T) => void; variant?: "default" | "destructive" }>;
  getRowId?: (row: T) => string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  onBulkAction,
  bulkActions = [],
  rowActions,
  getRowId = (row) => row.id || String(row),
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  
  // Initialize column visibility - same on server and client
  const storageKey = `data-table-columns-${columns.map(c => c.id).join('-')}`;
  const defaultColumnVisibility = columns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {});
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(defaultColumnVisibility);
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Load column visibility from localStorage after mount (client-side only)
  React.useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setColumnVisibility(parsed);
      } catch {
        // Fallback to default
      }
    }
  }, [storageKey]);
  
  // Save column visibility to localStorage whenever it changes (client-side only)
  React.useEffect(() => {
    if (isMounted) {
      localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility, storageKey, isMounted]);
  
  const [sorting, setSorting] = React.useState<{ id: string; desc: boolean } | null>(null);

  const visibleColumns = columns.filter((col) => columnVisibility[col.id] !== false);

  const sortedData = React.useMemo(() => {
    if (!sorting) return data;
    return [...data].sort((a, b) => {
      const column = columns.find((col) => col.id === sorting.id);
      if (!column || !column.accessorKey) return 0;
      const aVal = a[column.accessorKey];
      const bVal = b[column.accessorKey];
      if (aVal === bVal) return 0;
      const result = aVal < bVal ? -1 : 1;
      return sorting.desc ? -result : result;
    });
  }, [data, sorting, columns]);

  const toggleRowSelection = (rowId: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedData.map((row) => getRowId(row))));
    }
  };

  const handleSort = (columnId: string) => {
    setSorting((prev) => {
      if (prev?.id === columnId) {
        if (prev.desc) {
          return null;
        }
        return { id: columnId, desc: true };
      }
      return { id: columnId, desc: false };
    });
  };

  const selectedRowsData = React.useMemo(
    () => sortedData.filter((row) => selectedRows.has(getRowId(row))),
    [sortedData, selectedRows, getRowId]
  );

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && bulkActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="h-7 text-xs px-2 bg-[#142030] text-white hover:bg-[#142030]/90">
                  Actions ({selectedRows.size})
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {bulkActions.map((action) => (
                  <DropdownMenuItem
                    key={action.value}
                    onClick={() => onBulkAction?.(selectedRowsData, action.value)}
                    className={action.variant === "destructive" ? "text-destructive" : ""}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="h-7 text-xs px-2 bg-[#142030] text-white hover:bg-[#142030]/90">
              <Eye className="mr-1 h-3 w-3" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={columnVisibility[column.id] !== false}
                onCheckedChange={(checked) =>
                  setColumnVisibility((prev) => ({ ...prev, [column.id]: checked }))
                }
              >
                {typeof column.header === "string" ? column.header : column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border border-dotted border-gray-200 bg-white/95 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-dotted border-border/60">
              {bulkActions.length > 0 && (
                <TableHead className="w-6">
                      <Checkbox
                        checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                        onCheckedChange={toggleAllRows}
                      />
                </TableHead>
              )}
              {visibleColumns.map((column) => (
                <TableHead key={column.id} className="h-8">
                  {typeof column.header === "string" ? (
                    column.enableSorting !== false && column.accessorKey ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 -ml-1.5 text-xs font-light uppercase tracking-wider hover:bg-transparent"
                        onClick={() => handleSort(column.id)}
                      >
                        {column.header}
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    ) : (
                      <span className="text-xs font-light uppercase tracking-wider text-muted-foreground">{column.header}</span>
                    )
                  ) : (
                    column.header({ column: { toggleSorting: () => handleSort(column.id) } })
                  )}
                </TableHead>
              ))}
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row) => {
              const rowId = getRowId(row);
              const isSelected = selectedRows.has(rowId);
              return (
                <TableRow
                  key={rowId}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(
                    "border-b border-dotted border-gray-200 cursor-pointer hover:bg-[#F5EDE5]/30 transition-colors",
                    isSelected && "bg-[#E9D8C8]/20"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {bulkActions.length > 0 && (
                    <TableCell onClick={(e) => e.stopPropagation()} className="w-6">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRowSelection(rowId)}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id} className="text-xs font-light text-foreground">
                      {column.cell ? (
                        column.cell({ row: { original: row } })
                      ) : column.accessorKey ? (
                        row[column.accessorKey]
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {rowActions ? (
                          <>
                            {rowActions.map((action) => (
                              <DropdownMenuItem
                                key={action.value}
                                onClick={() => action.onClick(row)}
                                className={action.variant === "destructive" ? "text-destructive" : ""}
                              >
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => onRowClick?.(row)}>
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onRowClick?.(row)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onBulkAction?.([row], "delete")}
                            >
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (bulkActions.length > 0 ? 2 : 1)}
                  className="h-16 text-center text-sm text-muted-foreground"
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

