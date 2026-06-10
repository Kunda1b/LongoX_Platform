export interface DashboardPage {
  id: string;
  name: string;
  order: number;
  componentCount: number;
}

interface PlacedComponent {
  page?: string;
  pageId?: string;
}

/**
 * Dashboard pages are an authoring concept layered over the flat `widgets`
 * array stored on a dashboard. Each placed component may declare the page it
 * belongs to; components without one fall back to the default "main" page.
 */
export function derivePages(components: unknown[]): DashboardPage[] {
  const counts = new Map<string, number>();

  for (const raw of components) {
    const placed = (raw ?? {}) as PlacedComponent;
    const key = placed.pageId ?? placed.page ?? "main";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  if (counts.size === 0) counts.set("main", 0);

  return Array.from(counts.entries()).map(([key, componentCount], index) => ({
    id: key,
    name: key === "main" ? "Main" : key,
    order: index,
    componentCount,
  }));
}
