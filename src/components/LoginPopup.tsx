import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

export const LoginPopup = () => {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (role) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [role]);

  if (!role) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-none bg-transparent p-0 shadow-none">
        <img
          src="/maryam-nawaz.png"
          alt="Maryam Nawaz popup"
          className="h-auto w-full rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
};

export default LoginPopup;
