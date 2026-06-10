export interface DashboardPermissions {
  canView: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
  canShare: boolean;
}

const ROLE_PERMISSIONS: Record<string, DashboardPermissions> = {
  admin: {
    canView: true,
    canEdit: true,
    canPublish: true,
    canDelete: true,
    canShare: true,
  },
  editor: {
    canView: true,
    canEdit: true,
    canPublish: true,
    canDelete: false,
    canShare: true,
  },
  viewer: {
    canView: true,
    canEdit: false,
    canPublish: false,
    canDelete: false,
    canShare: false,
  },
};

export function resolveDashboardPermissions(
  role: string,
): DashboardPermissions {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS["viewer"];
}
