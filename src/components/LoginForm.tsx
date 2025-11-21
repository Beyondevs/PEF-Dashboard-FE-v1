import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { forgotPassword } from '@/lib/api';

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef(false);
  const isLoginPageRef = useRef(true);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  // Prevent any navigation while on login page
  useEffect(() => {
    isLoginPageRef.current = true;
    
    // Block any attempts to reload the page during login
    const preventUnload = (e: BeforeUnloadEvent) => {
      if (isSubmittingRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', preventUnload);
    
    return () => {
      isLoginPageRef.current = false;
      window.removeEventListener('beforeunload', preventUnload);
    };
  }, []);

  const handleLogin = useCallback(async () => {
    // Prevent duplicate submissions
    if (isSubmittingRef.current || isLoading) {
      console.log('Login already in progress, skipping...');
      return;
    }

    // Validate inputs
    if (!identifier.trim()) {
      const errorMessage = 'Please enter your mobile number, CNIC, or email';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorMessage,
      });
      return;
    }

    if (!password.trim()) {
      const errorMessage = 'Please enter your password';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorMessage,
      });
      return;
    }

    console.log('Starting login attempt...');
    
    // Clear any previous errors
    setError('');
    setIsLoading(true);
    isSubmittingRef.current = true;

    try {
      console.log('Calling login API...');
      await login(identifier, password);
      console.log('Login successful!');
      
      // Only navigate on successful login
      if (isLoginPageRef.current) {
        onSuccess();
      }
    } catch (err: any) {
      // CRITICAL: Ensure we stay on the page - no navigation or refresh
      console.error('Login error caught:', err);
      
      // Check if it's an authentication error (401 Unauthorized)
      const isAuthError = 
        err?.response?.status === 401 || 
        err?.response?.statusCode === 401 ||
        err?.message?.toLowerCase().includes('invalid credentials') ||
        err?.message?.toLowerCase().includes('unauthorized') ||
        err?.message?.toLowerCase().includes('wrong');
      
      if (isAuthError) {
        console.log('Authentication failed - showing error message');
        const errorMessage = 'Wrong username or password';
        setError(errorMessage);
        
        // Show toast notification
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials. Please check your username and password.",
        });
      } else {
        console.log('Other error - showing generic message');
        // For other errors, show the actual error message
        const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your connection and try again.';
        setError(errorMessage);
        
        // Show toast notification
        toast({
          variant: "destructive",
          title: "Login Error",
          description: errorMessage,
        });
      }
    } finally {
      console.log('Login attempt completed');
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }, [identifier, password, login, onSuccess, isLoading, toast]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    // Prevent any default browser behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Form submitted');
    
    // Call our login handler without await to prevent blocking
    handleLogin();
    
    // Return false to ensure no default action
    return false;
  }, [handleLogin]);

  const handleIdentifierChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIdentifier(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  }, [error]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  }, [error]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleLogin();
    }
  }, [handleLogin]);

  const togglePasswordVisibility = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(prev => !prev);
  }, []);

  const handleRememberMeChange = useCallback((checked: boolean | string) => {
    setRememberMe(checked as boolean);
  }, []);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogin();
  }, [handleLogin]);

  const handleForgotPassword = useCallback(async () => {
    // Validate inputs
    if (!mobileNumber.trim()) {
      setForgotPasswordError('Please enter your mobile number');
      return;
    }

    if (!oldPassword.trim()) {
      setForgotPasswordError('Please enter your old password');
      return;
    }

    if (!newPassword.trim()) {
      setForgotPasswordError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setForgotPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (oldPassword === newPassword) {
      setForgotPasswordError('New password must be different from old password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotPasswordError('New password and confirm password do not match');
      return;
    }

    setIsResettingPassword(true);
    setForgotPasswordError('');

    try {
      await forgotPassword({
        mobileNumber: mobileNumber.trim(),
        oldPassword,
        newPassword,
        confirmPassword,
      });

      toast({
        variant: "default",
        title: "Success",
        description: "Password updated successfully. You can now login with your new password.",
      });

      // Reset form and close dialog
      setMobileNumber('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowForgotPassword(false);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to reset password. Please try again.';
      setForgotPasswordError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsResettingPassword(false);
    }
  }, [mobileNumber, oldPassword, newPassword, confirmPassword, toast]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier">Mobile Number / CNIC / Email</Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          value={identifier}
          onChange={handleIdentifierChange}
          onKeyPress={handleKeyPress}
          autoComplete="off"
          disabled={isLoading}
          className={error ? 'border-red-500' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Trainers must use mobile number format (+92xxxxxxxxxx)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter your password"
            autoComplete="new-password"
            disabled={isLoading}
            className={error ? 'border-red-500' : ''}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={togglePasswordVisibility}
            disabled={isLoading}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember"
          checked={rememberMe}
          onCheckedChange={handleRememberMeChange}
          disabled={isLoading}
        />
        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
          Remember me
        </Label>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 pt-4">
        <Button 
          type="button"
          className="flex-1" 
          disabled={isLoading || !identifier.trim() || !password.trim()}
          onClick={handleButtonClick}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </div>

      <div className="text-center pt-2">
        <Button
          type="button"
          variant="link"
          className="text-sm text-muted-foreground hover:text-primary"
          onClick={() => setShowForgotPassword(true)}
          disabled={isLoading}
        >
          Forgot Password? (Trainers Only)
        </Button>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your mobile number and new password. This feature is only available for trainers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="text"
                placeholder="+923001234567"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value);
                  setForgotPasswordError('');
                }}
                disabled={isResettingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oldPassword">Old Password</Label>
              <div className="relative">
                <Input
                  id="oldPassword"
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  value={oldPassword}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    setForgotPasswordError('');
                  }}
                  disabled={isResettingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  disabled={isResettingPassword}
                  tabIndex={-1}
                >
                  {showOldPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setForgotPasswordError('');
                  }}
                  disabled={isResettingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isResettingPassword}
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setForgotPasswordError('');
                  }}
                  disabled={isResettingPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isResettingPassword}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {forgotPasswordError && (
              <Alert variant="destructive" className="animate-in fade-in-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{forgotPasswordError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowForgotPassword(false);
                  setMobileNumber('');
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setForgotPasswordError('');
                }}
                disabled={isResettingPassword}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleForgotPassword}
                disabled={isResettingPassword || !mobileNumber.trim() || !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginForm;
