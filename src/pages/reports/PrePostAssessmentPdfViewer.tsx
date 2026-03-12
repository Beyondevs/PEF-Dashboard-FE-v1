import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Download, ExternalLink, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPrePostAssessmentPdf } from '@/lib/api';

type LoadState = 'loading' | 'ready' | 'error';

const PrePostAssessmentPdfViewer = () => {
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const objectRef = useRef<HTMLObjectElement>(null);

  // Fetch PDF blob with auth token then create an object URL
  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchPdf = async () => {
      try {
        const res = await getPrePostAssessmentPdf();
        objectUrl = URL.createObjectURL(res.data);
        setBlobUrl(objectUrl);
        setLoadState('ready');
      } catch (err) {
        console.error('Failed to load PDF', err);
        toast.error('Failed to load the PDF report. Please try again.');
        setLoadState('error');
      }
    };

    fetchPdf();

    // Revoke blob URL on unmount to free memory
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'Pre Post Assessment Final Report.pdf';
    a.click();
  };

  const handleOpenNewTab = () => {
    if (!blobUrl) return;
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mb-6">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 sm:gap-3 px-4 py-3 bg-card border-b border-border shrink-0">
        {/* Back */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/reports/pre-post-assessment')}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Icon + title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 shrink-0">
            <FileText className="h-4 w-4 text-indigo-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              Pre &amp; Post Assessment Final Report
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Punjab Spoken English Programme · Official PDF
            </p>
          </div>
        </div>

        {/* Status badge */}
        {loadState === 'loading' && (
          <Badge variant="outline" className="shrink-0 text-xs gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="hidden sm:inline">Loading…</span>
          </Badge>
        )}
        {loadState === 'ready' && (
          <Badge className="shrink-0 bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
            Ready
          </Badge>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex gap-1.5"
            onClick={handleOpenNewTab}
            disabled={!blobUrl}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            New Tab
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleDownload}
            disabled={!blobUrl}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      {/* ── Viewer area ── */}
      <div className="flex-1 bg-neutral-100 relative overflow-hidden">
        {/* Loading state */}
        {loadState === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-100 z-10">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Loading PDF Report</p>
              <p className="text-xs text-muted-foreground mt-1">Fetching official document…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {loadState === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-100 z-10 px-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-sm font-semibold text-foreground">Failed to Load PDF</p>
              <p className="text-xs text-muted-foreground mt-1">
                The report could not be fetched. Please check your connection and try again.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/reports/pre-post-assessment')}>
                Go Back
              </Button>
              <Button size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* PDF embed — rendered inside the system shell (not a raw browser PDF tab) */}
        {blobUrl && (
          <object
            ref={objectRef}
            data={blobUrl}
            type="application/pdf"
            className="w-full h-full border-0"
            aria-label="Pre Post Assessment Final Report PDF"
          >
            {/* Fallback for browsers that can't render PDFs inline (e.g. mobile Chrome) */}
            <div className="flex flex-col items-center justify-center h-full gap-6 px-6 py-12 bg-neutral-50">
              <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-100">
                <FileText className="h-10 w-10 text-indigo-600" />
              </div>
              <div className="text-center max-w-xs">
                <p className="text-base font-semibold text-foreground">
                  PDF Preview Not Supported
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your browser doesn't support inline PDF viewing. Use one of the options below.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <Button
                  className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleOpenNewTab}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Tab
                </Button>
              </div>
            </div>
          </object>
        )}
      </div>
    </div>
  );
};

export default PrePostAssessmentPdfViewer;
