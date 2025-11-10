import { Download, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ImportResult {
  totalRows: number;
  successCount: number;
  duplicateCount: number;
  errorCount: number;
  duplicates: Array<{ row: number; identifier: string; reason: string }>;
  errors: Array<{ row: number; data: any; errors: string[] }>;
  created?: Array<{ row: number; identifier: string; defaultPassword?: string }>;
  updatedCount?: number;
  updated?: Array<{ row: number; identifier: string }>;
}

interface ImportResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ImportResult | null;
}

export function ImportResultsDialog({
  open,
  onOpenChange,
  result,
}: ImportResultsDialogProps) {
  if (!result) return null;

  const downloadErrorLog = () => {
    const lines: string[] = [];
    lines.push('Import Results Summary');
    lines.push('======================');
    lines.push(`Total Rows: ${result.totalRows}`);
    lines.push(`Successfully Imported: ${result.successCount}`);
    lines.push(`Duplicates Skipped: ${result.duplicateCount}`);
    lines.push(`Errors: ${result.errorCount}`);
    lines.push('');

    if (result.duplicates.length > 0) {
      lines.push('Duplicates:');
      lines.push('-----------');
      result.duplicates.forEach((dup) => {
        lines.push(`Row ${dup.row}: ${dup.identifier} - ${dup.reason}`);
      });
      lines.push('');
    }

    if (result.updated && result.updated.length > 0) {
      lines.push('Updated Sessions:');
      lines.push('-----------------');
      result.updated.forEach((updated) => {
        lines.push(`Row ${updated.row}: ${updated.identifier}`);
      });
      lines.push('');
    }

    if (result.created && result.created.length > 0) {
      lines.push('Created Accounts:');
      lines.push('-----------------');
      result.created.forEach((created) => {
        lines.push(
          `Row ${created.row}: ${created.identifier}${
            created.defaultPassword ? ` (Password: ${created.defaultPassword})` : ''
          }`,
        );
      });
      lines.push('');
    }

    if (result.errors.length > 0) {
      lines.push('Errors:');
      lines.push('-------');
      result.errors.forEach((err) => {
        lines.push(`Row ${err.row}:`);
        err.errors.forEach((e) => lines.push(`  - ${e}`));
        lines.push(`  Data: ${JSON.stringify(err.data)}`);
        lines.push('');
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import-log-${new Date().toISOString()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Results</DialogTitle>
          <DialogDescription>
            Summary of the import operation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Rows</div>
              <div className="text-2xl font-bold">{result.totalRows}</div>
            </div>
            <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-sm text-muted-foreground">Imported</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="h-5 w-5" />
                {result.successCount}
              </div>
            </div>
            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="text-sm text-muted-foreground">Updated</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <RefreshCw className="h-5 w-5" />
                {result.updatedCount ?? result.updated?.length ?? 0}
              </div>
            </div>
            <div className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="text-sm text-muted-foreground">Duplicates</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                <AlertTriangle className="h-5 w-5" />
                {result.duplicateCount}
              </div>
            </div>
            <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-950">
              <div className="text-sm text-muted-foreground">Errors</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                <XCircle className="h-5 w-5" />
                {result.errorCount}
              </div>
            </div>
          </div>

          {/* Expandable Lists */}
          {(result.duplicates.length > 0 ||
            result.errors.length > 0 ||
            (result.created && result.created.length > 0) ||
            (result.updated && result.updated.length > 0)) && (
            <Accordion type="single" collapsible className="w-full">
              {result.updated && result.updated.length > 0 && (
                <AccordionItem value="updated">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                      <span>Updated ({result.updatedCount ?? result.updated.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.updated.map((updated, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm border border-blue-200 dark:border-blue-800"
                        >
                          <div className="font-medium">Row {updated.row}</div>
                          <div className="text-muted-foreground">
                            {updated.identifier}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {result.created && result.created.length > 0 && (
                <AccordionItem value="created">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Created Accounts ({result.created.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.created.map((created, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-green-50 dark:bg-green-950 rounded text-sm border border-green-200 dark:border-green-800"
                        >
                          <div className="font-medium">Row {created.row}</div>
                          <div className="text-muted-foreground">
                            {created.identifier}
                          </div>
                          {created.defaultPassword && (
                            <div className="text-xs mt-1 font-mono">
                              Password: {created.defaultPassword}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {result.duplicates.length > 0 && (
                <AccordionItem value="duplicates">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span>Duplicates ({result.duplicates.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.duplicates.map((dup, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-sm border border-yellow-200 dark:border-yellow-800"
                        >
                          <div className="font-medium">Row {dup.row}</div>
                          <div className="text-muted-foreground">
                            {dup.identifier}
                          </div>
                          <div className="text-xs mt-1">{dup.reason}</div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {result.errors.length > 0 && (
                <AccordionItem value="errors">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Errors ({result.errors.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.errors.map((err, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-red-50 dark:bg-red-950 rounded text-sm border border-red-200 dark:border-red-800"
                        >
                          <div className="font-medium">Row {err.row}</div>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {err.errors.map((e, i) => (
                              <li key={i} className="text-xs text-red-700 dark:text-red-300">
                                {e}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}

          {/* Success Message */}
          {result.errorCount === 0 && result.duplicateCount === 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              <div>
                <div className="font-medium text-green-900 dark:text-green-100">
                  All rows imported successfully!
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  {result.successCount} records have been added to the database.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadErrorLog}
              disabled={result.duplicates.length === 0 && result.errors.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Log
            </Button>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

