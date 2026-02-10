// Premium Table Component
// Data tables with sorting, selection, and pagination

import { ReactNode, useState, useMemo, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { IconButton } from './Button';
import { staggerItem } from './motion';

// ============================================
// TYPES
// ============================================

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectedRows?: (string | number)[];
  onSelectionChange?: ((selectedKeys: (string | number)[]) => void) | Dispatch<SetStateAction<(string | number)[]>>;
  className?: string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// ============================================
// TABLE COMPONENT
// ============================================

export function Table<T>({
  data,
  columns,
  keyExtractor = ((_row: T, index?: number) => index ?? 0) as unknown as (row: T) => string | number,
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  selectedRows = [],
  onSelectionChange,
  className,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Handle sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    const column = columns.find((col) => col.key === sortKey);
    if (!column) return data;

    return [...data].sort((a, b) => {
      if (!column.accessor) return 0;
      const aValue = typeof column.accessor === 'function'
        ? column.accessor(a)
        : a[column.accessor as keyof T];
      const bValue = typeof column.accessor === 'function'
        ? column.accessor(b)
        : b[column.accessor as keyof T];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, columns, sortKey, sortDirection]);

  // Get cell value
  const getCellValue = (row: T, column: Column<T>): ReactNode => {
    if (column.render) {
      return column.render(row);
    }
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    if (column.accessor) {
      const value = row[column.accessor];
      if (value === null || value === undefined) return '—';
      return String(value);
    }
    return '—';
  };

  // Handle row selection
  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedRows.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(keyExtractor));
    }
  };

  const handleSelectRow = (key: string | number) => {
    if (!onSelectionChange) return;

    if (selectedRows.includes(key)) {
      onSelectionChange(selectedRows.filter((k) => k !== key));
    } else {
      onSelectionChange([...selectedRows, key]);
    }
  };

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;
  const isSomeSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  return (
    <div className={clsx('w-full overflow-hidden rounded-xl border border-slate-200', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {/* Selection checkbox */}
              {onSelectionChange && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                </th>
              )}

              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer select-none hover:bg-slate-100',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className={clsx(
                    'flex items-center gap-1',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end'
                  )}>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="text-slate-400">
                        {sortKey === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-slate-100">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {onSelectionChange && (
                    <td className="px-4 py-4">
                      <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4">
                      <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data rows
              <AnimatePresence>
                {sortedData.map((row) => {
                  const key = keyExtractor(row);
                  const isSelected = selectedRows.includes(key);

                  return (
                    <motion.tr
                      key={key}
                      variants={staggerItem}
                      initial="initial"
                      animate="animate"
                      className={clsx(
                        'transition-colors duration-150',
                        onRowClick && 'cursor-pointer',
                        isSelected ? 'bg-amber-50' : 'hover:bg-slate-50/50'
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {onSelectionChange && (
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(key)}
                            className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                          />
                        </td>
                      )}

                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={clsx(
                            'px-4 py-3.5 text-slate-700',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right',
                            column.className
                          )}
                        >
                          {getCellValue(row, column)}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// PAGINATION COMPONENT
// ============================================

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const hasItemInfo = totalItems !== undefined && pageSize !== undefined;
  const startItem = hasItemInfo ? (currentPage - 1) * pageSize! + 1 : 0;
  const endItem = hasItemInfo ? Math.min(currentPage * pageSize!, totalItems!) : 0;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-4 py-4',
        className
      )}
    >
      {/* Info text */}
      {hasItemInfo ? (
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-700">{startItem}</span> to{' '}
          <span className="font-medium text-slate-700">{endItem}</span> of{' '}
          <span className="font-medium text-slate-700">{totalItems}</span> results
        </p>
      ) : (
        <p className="text-sm text-slate-500">
          Page <span className="font-medium text-slate-700">{currentPage}</span> of{' '}
          <span className="font-medium text-slate-700">{totalPages}</span>
        </p>
      )}

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={<ChevronLeft className="w-4 h-4" />}
          aria-label="Previous page"
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        />

        {getPageNumbers().map((page, index) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={clsx(
                'min-w-[32px] h-8 px-2 text-sm font-medium rounded-lg transition-colors',
                page === currentPage
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {page}
            </button>
          )
        )}

        <IconButton
          icon={<ChevronRight className="w-4 h-4" />}
          aria-label="Next page"
          variant="ghost"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </div>
    </div>
  );
}

export default Table;
