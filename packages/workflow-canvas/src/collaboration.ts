export interface Collaborator {
  userId: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  selectedNodeIds: string[];
  lastActivity: string;
}

export interface PresenceState {
  collaborators: Map<string, Collaborator>;
  locks: Map<string, LockInfo>;
}

export interface LockInfo {
  nodeId: string;
  userId: string;
  userName: string;
  acquiredAt: string;
  type: "editing" | "moving" | "configuring";
}

export function createPresenceState(): PresenceState {
  return {
    collaborators: new Map(),
    locks: new Map(),
  };
}

const COLLABORATOR_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];

export function assignColor(index: number): string {
  return COLLABORATOR_COLORS[index % COLLABORATOR_COLORS.length];
}

export function tryAcquireLock(
  state: PresenceState,
  nodeId: string,
  userId: string,
  userName: string,
  type: LockInfo["type"],
): { success: boolean; existingLock?: LockInfo } {
  const existing = state.locks.get(nodeId);
  if (existing && existing.userId !== userId) {
    return { success: false, existingLock: existing };
  }

  const lock: LockInfo = {
    nodeId,
    userId,
    userName,
    acquiredAt: new Date().toISOString(),
    type,
  };

  state.locks.set(nodeId, lock);
  return { success: true };
}

export function releaseLock(
  state: PresenceState,
  nodeId: string,
  userId: string,
): boolean {
  const lock = state.locks.get(nodeId);
  if (lock && lock.userId === userId) {
    state.locks.delete(nodeId);
    return true;
  }
  return false;
}

export function getLockedNodes(state: PresenceState): string[] {
  return Array.from(state.locks.keys());
}

export function isNodeLocked(
  state: PresenceState,
  nodeId: string,
  excludeUserId?: string,
): boolean {
  const lock = state.locks.get(nodeId);
  if (!lock) return false;
  if (excludeUserId && lock.userId === excludeUserId) return false;
  return true;
}
