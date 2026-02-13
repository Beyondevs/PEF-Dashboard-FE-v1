import { useState, useRef } from 'react';
import { LogOut, CheckCircle2, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getSignature, uploadSignature } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const AppHeader = () => {
  const { userName, role, logout, hasSignature, checkAuth } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewSignatureOpen, setViewSignatureOpen] = useState(false);
  const [addSignatureOpen, setAddSignatureOpen] = useState(false);
  const [signatureSvg, setSignatureSvg] = useState<string | null>(null);
  const [loadingSignature, setLoadingSignature] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTickClick = async () => {
    setViewSignatureOpen(true);
    setSignatureSvg(null);
    setLoadingSignature(true);
    try {
      const res = await getSignature();
      setSignatureSvg(res.data.signatureSvg);
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Could not load signature.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSignature(false);
    }
  };

  const handleErrorIconClick = () => {
    setAddSignatureOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadSignature(file);
      toast({ title: 'Success', description: 'Signature added successfully.' });
      await checkAuth();
      setAddSignatureOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err?.message || 'Could not upload signature.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const isTrainer = role === 'trainer';

  return (
    <header className="min-h-12 sm:min-h-14 md:h-16 border-b bg-card flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-0 sticky top-0 z-50 shadow-sm overflow-hidden">
      {/* Left: menu + logos; title only from md up */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1 overflow-hidden">
        <SidebarTrigger className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 touch-manipulation" />
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <img
            src="https://www.pef.edu.pk/images/logo/pef-logo_2.png"
            alt="PEF"
            className="h-6 sm:h-8 md:h-10 w-auto"
          />
          <img
            src="https://premierdlc.com/wp-content/uploads/2018/01/logo.png"
            alt="Premier DLC"
            className="h-6 sm:h-8 md:h-10 w-auto hidden sm:block"
          />
        </div>
        <div className="h-5 sm:h-6 md:h-8 w-px bg-border shrink-0 hidden md:block" />
        <div className="min-w-0 hidden md:block">
          <h1 className="text-sm md:text-base lg:text-xl font-bold text-foreground truncate">
            PEF Spoken English Training Portal
          </h1>
          <p className="text-[10px] md:text-xs text-muted-foreground hidden lg:block">
            Monitoring & Management System
          </p>
        </div>
      </div>

      {/* Right: signature + user + logout — compact on mobile */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
        {isTrainer && (
          <TooltipProvider>
            {hasSignature ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleTickClick}
                    className="flex items-center gap-1.5 sm:gap-2 min-h-9 min-w-9 sm:min-w-0 px-2 sm:px-3 py-2 rounded-md text-green-600 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring touch-manipulation"
                    aria-label="View my signature"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap hidden sm:inline">
                      My signature
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[min(16rem,90vw)]">
                  Signature added — tap to view
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleErrorIconClick}
                    className="flex items-center gap-1.5 sm:gap-2 min-h-9 min-w-9 sm:min-w-0 px-2 sm:px-3 py-2 rounded-md text-destructive hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring touch-manipulation"
                    aria-label="Add your signature"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap hidden sm:inline">
                      Add your signature
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[min(16rem,90vw)]">
                  Tap here to add your signature (required for trainers)
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        )}
        <div className="text-right hidden sm:block min-w-0">
          <p className="text-xs md:text-sm font-medium text-foreground truncate max-w-[80px] md:max-w-[140px] lg:max-w-none">{userName}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground capitalize hidden md:block">{role}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0 h-9 w-9 sm:h-9 sm:w-auto sm:min-h-10 sm:px-3 touch-manipulation p-0 sm:p-2">
          <LogOut className="h-4 w-4 sm:mr-1.5 md:mr-2 shrink-0" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </div>

      {/* View signature modal — responsive for mobile */}
      <Dialog open={viewSignatureOpen} onOpenChange={setViewSignatureOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Your signature</DialogTitle>
            <DialogDescription>Your saved signature is shown below.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center min-h-[140px] sm:min-h-[180px] bg-muted/30 rounded-lg p-3 sm:p-4">
            {loadingSignature ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : signatureSvg ? (
              <div
                className="w-full max-h-[200px] sm:max-h-[240px] flex items-center justify-center [&>svg]:max-h-[180px] sm:[&>svg]:max-h-[220px] [&>svg]:w-full [&>svg]:object-contain"
                dangerouslySetInnerHTML={{ __html: signatureSvg }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No signature to display.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add signature modal — responsive for mobile */}
      <Dialog open={addSignatureOpen} onOpenChange={setAddSignatureOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Add your signature</DialogTitle>
            <DialogDescription className="text-left">
              Upload a photo of your handwritten signature. It will be converted to a clear vector format. Use JPEG, PNG, WebP or BMP (max 10MB). Tap the button below to choose an image from your device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-11 sm:min-h-10 touch-manipulation"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2 shrink-0" />
                  Choose image
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};
