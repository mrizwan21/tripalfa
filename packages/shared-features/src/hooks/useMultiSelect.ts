import { useState, useCallback } from 'react';

export function useMultiSelect(initialSelected: string[] = []) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  return {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected
  };
}