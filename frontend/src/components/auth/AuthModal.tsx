import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'signin' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, loading, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    signIn: {
      email: '',
      password: '',
    },
    register: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    }
  });
  
  const [formErrors, setFormErrors] = useState({
    signIn: '',
    register: '',
  });

  const resetForms = useCallback(() => {
    setFormData({
      signIn: { email: '', password: '' },
      register: { email: '', password: '', confirmPassword: '', fullName: '' }
    });
    setFormErrors({ signIn: '', register: '' });
    setRegistrationSuccess(false);
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (!isOpen) {
      resetForms();
    }
  }, [isOpen, resetForms]);

  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      return 'Password must contain both uppercase and lowercase letters';
    }
    return '';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = formData.signIn;
    
    // Clear previous errors
    setFormErrors(prev => ({ ...prev, signIn: '' }));
    clearError();

    if (!email || !password) {
      setFormErrors(prev => ({ ...prev, signIn: 'Please fill in all fields' }));
      return;
    }

    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An error occurred during sign in';
      setFormErrors(prev => ({ ...prev, signIn: errorMessage }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password, confirmPassword, fullName } = formData.register;
    
    // Clear previous errors
    setFormErrors(prev => ({ ...prev, register: '' }));
    clearError();

    try {
      // Validate all fields are filled
      if (!email || !password || !confirmPassword || !fullName) {
        throw new Error('Please fill in all fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password
      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await register(email, password, fullName);
      setRegistrationSuccess(true);
      
      // Switch to sign in after successful registration
      setTimeout(() => {
        setActiveTab('signin');
        resetForms();
      }, 2000);
    } catch (err: any) {
      setRegistrationSuccess(false);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An error occurred during registration';
      setFormErrors(prev => ({ ...prev, register: errorMessage }));
    }
  };

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    resetForms();
  };

  if (!isOpen) return null;

  const renderError = (errorMessage: unknown, formError: string) => {
    const message = formError || (errorMessage instanceof Error ? errorMessage.message : String(errorMessage));
    
    if (!message) return null;
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {message}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-4">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex space-x-4 border-b">
              <button
                className={`pb-2 px-4 transition-colors ${
                  activeTab === 'signin'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => handleTabChange('signin')}
                type="button"
              >
                Sign In
              </button>
              <button
                className={`pb-2 px-4 transition-colors ${
                  activeTab === 'register'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => handleTabChange('register')}
                type="button"
              >
                Register
              </button>
            </div>
          </CardHeader>

          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn}>
              <CardContent className="space-y-4">
                {renderError(error, formErrors.signIn)}
                
                <div className="space-y-2">
                  <Input
                    label="Email"
                    type="email"
                    value={formData.signIn.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      signIn: { ...prev.signIn, email: e.target.value }
                    }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Input
                    label="Password"
                    type="password"
                    value={formData.signIn.password}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      signIn: { ...prev.signIn, password: e.target.value }
                    }))}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    resetForms();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                {registrationSuccess && (
                  <Alert className="bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      Registration successful! Redirecting to sign in...
                    </AlertDescription>
                  </Alert>
                )}
                
                {renderError(error, formErrors.register)}
                
                <div className="space-y-2">
                  <Input
                    label="Full Name"
                    type="text"
                    value={formData.register.fullName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      register: { ...prev.register, fullName: e.target.value }
                    }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Input
                    label="Email"
                    type="email"
                    value={formData.register.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      register: { ...prev.register, email: e.target.value }
                    }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Input
                    label="Password"
                    type="password"
                    value={formData.register.password}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      register: { ...prev.register, password: e.target.value }
                    }))}
                    placeholder="Create a password"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={formData.register.confirmPassword}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      register: { ...prev.register, confirmPassword: e.target.value }
                    }))}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    resetForms();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || registrationSuccess}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};