import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, Link as LinkIcon, Plus, ExternalLink } from 'lucide-react';
import { resources } from '@/lib/mockData';
import { toast } from 'sonner';

const Repository = () => {
  const handleAddResource = () => {
    toast.success('Resource added successfully');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Video': return <Video className="h-5 w-5 text-primary" />;
      case 'PDF': return <FileText className="h-5 w-5 text-destructive" />;
      case 'Link': return <LinkIcon className="h-5 w-5 text-secondary" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      Video: 'default',
      PDF: 'destructive',
      Link: 'secondary',
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap">
        <div className="mb-mobile-2">
          <h1 className="text-3xl font-bold text-foreground">Training Materials Repository</h1>
          <p className="text-muted-foreground">Access and manage training resources</p>
        </div>
        <Button className="mb-mobile-2" onClick={handleAddResource}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map(resource => (
          <Card key={resource.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                {getTypeIcon(resource.type)}
                {getTypeBadge(resource.type)}
              </div>
              <CardTitle className="mt-4">{resource.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {resource.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button className="w-full" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Resource
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Repository;
