import { useState, useMemo, type ReactNode } from "react"
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, ChevronRight, ChevronLeft, ChevronsUpDown, ArrowUp, ArrowDown, Download, Settings2 } from "lucide-react"
import { toPersianDigits } from "@/lib/format"

export interface Column<T> {
  key: string
  header: string
  accessor?: (row: T) => string | number | ReactNode
  sortable?: boolean
  hideable?: boolean
  exportValue?: (row: T) => string | number
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
 getRowId: (row: T) => string
  searchKeys?: (keyof T)[]
  searchPlaceholder?: string
  pageSize?: number
  enableSelection?: boolean
  enableColumnToggle?: boolean
  enableExport?: boolean
  exportFilename?: string
  onBulkAction?: (action: string, selectedIds: string[]) => void
  bulkActions?: { label: string; value: string }[]
  toolbarSlot?: ReactNode
  emptyMessage?: string
}

type SortDirection = "asc" | "desc" | null

export function DataTable<T extends object>({
  data,
  columns,
  getRowId,
  searchKeys = [],
  searchPlaceholder = "جستجو...",
  pageSize = 10,
  enableSelection = false,
  enableColumnToggle = true,
  enableExport = false,
  exportFilename = "export.csv",
  onBulkAction,
  bulkActions = [],
  toolbarSlot,
  emptyMessage = "داده‌ای یافت نشد",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!search || searchKeys.length === 0) return data
    const lower = search.toLowerCase()
    return data.filter((row) =>
      searchKeys.some((key) => String((row as Record<string, unknown>)[key as string] ?? "").toLowerCase().includes(lower))
    )
  }, [data, search, searchKeys])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.accessor) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = col.accessor!(a)
      const bVal = col.accessor!(b)
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal)
      const bStr = String(bVal)
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [filtered, sortKey, sortDir, columns])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const currentPage = Math.min(page, Math.max(1, totalPages))
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc")
      if (sortDir === "desc") setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginated.map(getRowId)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.key))

  const handleExport = () => {
    const headers = visibleColumns.map((c) => c.header)
    const rows = sorted.map((row) =>
      visibleColumns.map((c) => {
        if (c.exportValue) return c.exportValue(row)
        const val = c.accessor ? c.accessor(row) : (row as Record<string, unknown>)[c.key]
        return String(val ?? "")
      })
    )
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = exportFilename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {searchKeys.length > 0 && (
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder={searchPlaceholder}
              className="pr-8"
            />
          </div>
        )}

        {toolbarSlot}

        {enableExport && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" />
            خروجی CSV
          </Button>
        )}

        {enableColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="size-4" />
                ستون‌ها
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {columns.filter((c) => c.hideable !== false).map((col) => (
                <DropdownMenuItem
                  key={col.key}
                  onClick={() => {
                    const next = new Set(hiddenCols)
                    if (next.has(col.key)) next.delete(col.key)
                    else next.add(col.key)
                    setHiddenCols(next)
                  }}
                >
                  <Checkbox checked={!hiddenCols.has(col.key)} className="ml-2" />
                  {col.header}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {enableSelection && selected.size > 0 && bulkActions.length > 0 && (
          <Select onValueChange={(action) => {
            if (onBulkAction) onBulkAction(action, [...selected])
            setSelected(new Set())
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={`${toPersianDigits(selected.size)} انتخاب شده`} />
            </SelectTrigger>
            <SelectContent>
              {bulkActions.map((a) => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {enableSelection && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              {visibleColumns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.sortable ? (
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + (enableSelection ? 1 : 0)} className="text-center text-muted-foreground py-8">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => {
                const id = getRowId(row)
                return (
                  <TableRow key={id} data-selected={selected.has(id)}>
                    {enableSelection && (
                      <TableCell>
                        <Checkbox checked={selected.has(id)} onCheckedChange={() => toggleSelect(id)} />
                      </TableCell>
                    )}
                    {visibleColumns.map((col) => (
                      <TableCell key={col.key} className={col.className}>
                        {col.accessor ? col.accessor(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="size-8" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
