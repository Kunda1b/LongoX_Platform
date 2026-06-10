export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0 ml-4">{children}</div>
      )}
    </div>
  );
}
