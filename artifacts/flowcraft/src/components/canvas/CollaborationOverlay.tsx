import type { Collaborator, PresenceState } from "@autoflow/workflow-canvas";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CollaborationOverlayProps {
  presence: PresenceState;
  currentUserId?: string;
}

export function CollaborationCursors({ presence, currentUserId }: CollaborationOverlayProps) {
  const collaborators = Array.from(presence.collaborators.values()).filter(
    (c) => c.userId !== currentUserId && c.cursor
  );

  if (collaborators.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {collaborators.map((collaborator) => {
        if (!collaborator.cursor) return null;
        return (
          <TooltipProvider key={collaborator.userId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute flex items-center gap-1 transition-all duration-150"
                  style={{
                    left: collaborator.cursor.x,
                    top: collaborator.cursor.y,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2 2L6.5 14L8 8.5L13.5 7L2 2Z"
                      fill={collaborator.color}
                      stroke="white"
                      strokeWidth="1"
                    />
                  </svg>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm whitespace-nowrap"
                    style={{ backgroundColor: collaborator.color, color: "white" }}
                  >
                    {collaborator.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>{collaborator.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

export function CollaboratorAvatars({
  presence,
  currentUserId,
}: CollaborationOverlayProps) {
  const collaborators = Array.from(presence.collaborators.values()).filter(
    (c) => c.userId !== currentUserId
  );

  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2">
      {collaborators.slice(0, 5).map((c) => (
        <TooltipProvider key={c.userId}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar
                className="h-6 w-6 border-2 border-background ring-1"
                style={{ ringColor: c.color }}
              >
                <AvatarFallback
                  className="text-[9px] font-medium"
                  style={{ backgroundColor: c.color, color: "white" }}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>{c.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {collaborators.length > 5 && (
        <Avatar className="h-6 w-6 border-2 border-background bg-muted">
          <AvatarFallback className="text-[9px]">+{collaborators.length - 5}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
