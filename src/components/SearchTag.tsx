import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function SearchTag({
  value,
  onClear,
  label = 'Search',
}: {
  value: string;
  onClear: () => void;
  label?: string;
}) {
  if (!value) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary" className="gap-2 py-1">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <span className="text-xs font-medium">{value}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={onClear}
          aria-label="Clear search"
          title="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </Badge>
    </div>
  );
}


