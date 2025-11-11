import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImportResultsDialog } from './ImportResultsDialog';
import { Progress } from '@/components/ui/progress';
import { ToastAction } from '@/components/ui/toast';

interface ImportResult {
  totalRows: number;
  successCount: number;
  duplicateCount: number;
  errorCount: number;
  duplicates: Array<{ row: number; identifier: string; reason: string }>;
  errors: Array<{ row: number; data: any; errors: string[] }>;
}

interface ImportButtonProps {
  label?: string;
  importFn: (file: File) => Promise<ImportResult>;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSuccess?: () => void;
}

export function ImportButton({
  label = 'Import CSV',
  importFn,
  variant = 'outline',
  size = 'default',
  onSuccess,
}: ImportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (result) {
      setShowResults(true);
    }
  }, [result]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const importResult = await importFn(file);
      setResult(importResult);

      if (importResult.successCount > 0) {
        toast({
          title: 'Import completed',
          description: `${importResult.successCount} records imported successfully`,
        });
        if (onSuccess) {
          onSuccess();
        }
      }

      if (importResult.errorCount > 0 || importResult.duplicateCount > 0) {
        toast({
          title: 'Import completed with warnings',
          description: `${importResult.duplicateCount} duplicates, ${importResult.errorCount} errors. Check the detailed results dialog to see what needs to be fixed in your CSV.`,
          variant: 'destructive',
          duration: 6000,
          action: (
            <ToastAction altText="View import details" onClick={() => setShowResults(true)}>
              View details
            </ToastAction>
          ),
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error?.message || 'Failed to import data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        variant={variant}
        size={size}
        onClick={handleButtonClick}
        disabled={loading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {loading ? 'Importing...' : label}
      </Button>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Importing data...</h3>
            <Progress value={undefined} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Please wait while we process your file
            </p>
          </div>
        </div>
      )}

      <ImportResultsDialog
        open={showResults}
        onOpenChange={setShowResults}
        result={result}
      />
    </>
  );
}

