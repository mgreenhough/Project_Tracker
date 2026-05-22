import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Tab } from '../types'
import { fetchTabs, createTab, updateTab, deleteTab } from '../api'

interface TabStoreState {
  tabs: Tab[]
  activeTabId: string | null
  isLoading: boolean
  error: string | null
}

interface TabStoreActions {
  setActiveTabId: (id: string | null) => void
  setError: (error: string | null) => void
  loadTabs: () => Promise<void>
  addTab: (tab: Omit<Tab, 'id' | 'createdAt' | 'sortOrder'>) => Promise<Tab | undefined>
  updateTabById: (id: string, updates: Partial<Omit<Tab, 'id' | 'createdAt'>>) => void
  removeTab: (id: string) => void
  reorderTabs: (orderedIds: string[]) => void
}

type TabStore = TabStoreState & TabStoreActions

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      isLoading: false,
      error: null,

      setActiveTabId: (id) => set({ activeTabId: id }),
      setError: (error) => set({ error }),

      loadTabs: async () => {
        set({ isLoading: true, error: null })
        try {
          const data = await fetchTabs()
          const tabs = data.tabs as Tab[]
          set({ tabs, isLoading: false })
          // Auto-select first tab if none active
          if (!get().activeTabId && tabs.length > 0) {
            set({ activeTabId: tabs[0].id })
          }
        } catch (err: any) {
          set({ error: err.message || 'Failed to load tabs', isLoading: false })
        }
      },

      addTab: async (tab) => {
        const maxSort = get().tabs.length > 0
          ? Math.max(...get().tabs.map((t) => t.sortOrder))
          : -1
        const newTab: Tab = {
          ...tab,
          id: crypto.randomUUID(),
          sortOrder: maxSort + 1,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ tabs: [...state.tabs, newTab] }))

        try {
          const data = await createTab({
            name: newTab.name,
            visibility: newTab.visibility,
            sortOrder: newTab.sortOrder,
          })
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === newTab.id ? { ...t, id: data.tab.id, createdAt: data.tab.createdAt } : t
            ),
          }))
          return { ...newTab, id: data.tab.id }
        } catch (err: any) {
          set({ error: err.message || 'Failed to create tab' })
        }
      },

      updateTabById: (id, updates) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }))

        updateTab(id, updates).catch((err: any) => {
          set({ error: err.message || 'Failed to update tab' })
        })
      },

      removeTab: (id) => {
        set((state) => ({
          tabs: state.tabs.filter((t) => t.id !== id),
        }))

        // Switch active tab if deleting current
        if (get().activeTabId === id) {
          const remaining = get().tabs.filter((t) => t.id !== id)
          set({ activeTabId: remaining.length > 0 ? remaining[0].id : null })
        }

        deleteTab(id).catch((err: any) => {
          // If tab has projects, restore it in UI and show error
          if (err.message?.includes('Tab has projects') || err.status === 409) {
            set((state) => ({
              tabs: [...state.tabs],
              error: 'Cannot delete tab with projects. Move or delete projects first.',
            }))
          } else {
            set({ error: err.message || 'Failed to delete tab' })
          }
        })
      },

      reorderTabs: (orderedIds) => {
        set((state) => {
          const map = new Map(state.tabs.map((t) => [t.id, t]))
          const reordered = orderedIds
            .map((id) => map.get(id))
            .filter((t): t is Tab => !!t)
            .map((t, index) => ({ ...t, sortOrder: index }))
          const reorderedIds = new Set(orderedIds)
          const untouched = state.tabs.filter((t) => !reorderedIds.has(t.id))
          return { tabs: [...reordered, ...untouched] }
        })

        orderedIds.forEach((id, index) => {
          updateTab(id, { sortOrder: index }).catch(() => {})
        })
      },
    }),
    {
      name: 'tab-tracker-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeTabId: state.activeTabId }),
    }
  )
)