import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../utils/cn";

export interface TableColumn<T> {
  /** Key unik kolom, dipakai untuk React key. */
  key: string;
  /** Header kolom. */
  header: ReactNode;
  /** Render isi cell untuk satu baris data. */
  render: (row: T, rowIndex: number) => ReactNode;
  /** Lebar kolom (opsional), mis. "120px" atau "20%". */
  width?: string;
  align?: "left" | "center" | "right";
  /** Sembunyikan kolom ini di layar sempit (mobile). */
  hideOnMobile?: boolean;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  /** Ambil key unik per baris (id, dsb). Fallback ke index kalau tidak diisi. */
  getRowKey?: (row: T, index: number) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  /** Panggil saat baris diklik. Kalau diisi, baris jadi punya hover + cursor pointer. */
  onRowClick?: (row: T) => void;
  className?: string;
}

const ALIGN_CLASS: Record<
  NonNullable<TableColumn<unknown>["align"]>,
  string
> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIdx) => (
        <tr key={`skeleton-${rowIdx}`}>
          {Array.from({ length: columns }).map((__, colIdx) => (
            <td key={`skeleton-cell-${colIdx}`} className="px-4 py-3">
              <div className="h-4 w-full max-w-32 animate-pulse rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function Table<T>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  emptyMessage = "Belum ada data",
  emptyDescription,
  onRowClick,
  className,
}: TableProps<T>) {
  const showEmpty = !isLoading && data.length === 0;

  return (
    <div className={cn("overflow-x-auto scrollbar-thin", className)}>
      <table className="w-full min-w-160 border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-alpha-400">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{ width: col.width }}
                className={cn(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-700",
                  ALIGN_CLASS[col.align ?? "left"],
                  col.hideOnMobile && "hidden sm:table-cell",
                )}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-alpha-300">
          {isLoading && <SkeletonRows columns={columns.length} />}

          {!isLoading &&
            data.map((row, rowIndex) => (
              <tr
                key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-gray-100",
                )}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-gray-1000",
                      ALIGN_CLASS[col.align ?? "left"],
                      col.hideOnMobile && "hidden sm:table-cell",
                    )}>
                    {col.render(row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>

      {showEmpty && (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700">
            <Inbox size={20} />
          </div>
          <p className="text-sm font-medium text-gray-1000">{emptyMessage}</p>
          {emptyDescription && (
            <p className="max-w-xs text-xs text-gray-700">{emptyDescription}</p>
          )}
        </div>
      )}
    </div>
  );
}
