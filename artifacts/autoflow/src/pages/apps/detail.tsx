import { useRoute, Link } from "wouter";
import { useGetApp, getGetAppQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, LayoutGrid, PlusCircle, Eye, Settings2 } from "lucide-react";

export default function AppDetailPage() {
  const [, params] = useRoute("/apps/:id");
  const id = Number(params?.id);

  const app = useGetApp(id, { query: { enabled: !!id, queryKey: getGetAppQueryKey(id) } });

  if (app.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const a = app.data;
  if (!a) return <div className="p-6 text-sm text-muted-foreground">App not found.</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3 border-b bg-card shrink-0">
        <Link href="/apps">
          <a className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </a>
        </Link>
        <div className="flex-1 flex items-center gap-2">
          <span className="font-semibold text-sm">{a.name}</span>
          <Badge variant="secondary" className="text-xs capitalize">{a.status}</Badge>
          <Badge variant="outline" className="text-xs capitalize">{a.type}</Badge>
        </div>
        <Button size="sm" variant="outline">
          <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
        </Button>
        <Button size="sm">
          <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center max-w-md px-8">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-base font-semibold mb-1">{a.name}</h2>
          {a.description && <p className="text-sm text-muted-foreground mb-4">{a.description}</p>}
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-6">
            <span>{a.pageCount} page{a.pageCount !== 1 ? "s" : ""}</span>
            <span>{a.viewCount} views</span>
            <span className="capitalize">{a.type}</span>
          </div>
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add Component
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            The visual app editor will be available in an upcoming release.
          </p>
        </div>
      </div>
    </div>
  );
}
