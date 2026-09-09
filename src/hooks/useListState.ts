import { useMemo, useState } from 'react'
import { filterByQuery, paginate, sortRows } from '../utils'

export function useListState<T extends Record<string, unknown>>(
  rows: T[],
  searchKeys: (keyof T)[],
  pageSize = 10,
) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => filterByQuery(rows, search, searchKeys), [rows, search, searchKeys])
  const sorted = useMemo(() => sortRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir])
  const paged = useMemo(() => paginate(sorted, page, pageSize), [sorted, page, pageSize])

  const onSort = (key: string) => {
    const k = key as keyof T
    if (sortKey === k) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(k)
      setSortDir('asc')
    }
  }

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    const ids = paged.rows.map((r) => String((r as unknown as { id: string }).id))
    const allSelected = ids.every((id) => selectedIds.includes(id))
    setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedIds, ...ids])))
  }

  const simulateLoad = async (fn?: () => void) => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 450))
    fn?.()
    setLoading(false)
  }

  return {
    search,
    setSearch: (v: string) => {
      setSearch(v)
      setPage(1)
    },
    sortKey: sortKey as string | null,
    sortDir,
    onSort,
    page,
    setPage,
    pageSize,
    rows: paged.rows as T[],
    total: paged.total,
    pageCount: paged.pageCount,
    allFiltered: sorted as T[],
    selectedIds,
    setSelectedIds,
    toggleRow,
    toggleAll,
    loading,
    setLoading,
    simulateLoad,
  }
}
