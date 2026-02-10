interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
}

export default function EmptyState({ emoji = '🌿', title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-5xl mb-4">{emoji}</span>
      <h3 className="font-heading font-bold text-lg text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
