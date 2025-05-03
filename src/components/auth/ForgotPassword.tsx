import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, ArrowLeft, Mail, KeyRound, CheckCircle } from 'lucide-react';
import { api } from '../../utils/apiService';

enum ForgotPasswordStep {
  REQUEST_RESET = 'REQUEST_RESET',
  RESET_PASSWORD = 'RESET_PASSWORD', // Combined step for OTP and password reset
  SUCCESS = 'SUCCESS',
}

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(ForgotPasswordStep.REQUEST_RESET);
  
  const navigate = useNavigate();

  // Handle reset password request
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/forgot-password', { email });
      
      if (response?.status) {
        setSuccessMessage('Verification code sent to your email.');
        setCurrentStep(ForgotPasswordStep.RESET_PASSWORD); // Go directly to combined step
      } else {
        setError(response?.message || 'Something went wrong. Please try again.');
      }
    } catch (error: any) {
      console.error('Reset request error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to request password reset. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Combined verification and reset function
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all password fields');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call API with the required format
      const response = await api.post('/reset-password', {
        email: email,
        otp: verificationCode,
        password: newPassword,
        password_confirmation: confirmPassword  // Changed from confirmation_password to password_confirmation
      });
      
      if (response?.status) {
        setSuccessMessage('Your password has been reset successfully.');
        setCurrentStep(ForgotPasswordStep.SUCCESS);
      } else {
        setError(response?.message || 'Failed to verify code or reset password. Please try again.');
      }
    } catch (error: any) {
      console.error('Reset error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('An error occurred. The code may be expired or invalid.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render different forms based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case ForgotPasswordStep.REQUEST_RESET:
        return (
          <form onSubmit={handleResetRequest}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                We'll send a verification code to this email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Sending...
                </span>
              ) : 'Send Reset Link'}
            </button>
          </form>
        );
        
      case ForgotPasswordStep.RESET_PASSWORD:
        return (
          <form onSubmit={handleVerifyAndReset}>
            <div className="mb-4">
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the verification code sent to {email}
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setCurrentStep(ForgotPasswordStep.REQUEST_RESET)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Resetting...
                  </span>
                ) : 'Reset Password'}
              </button>
            </div>
          </form>
        );
        
      case ForgotPasswordStep.SUCCESS:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Password Reset Successful</h3>
            <p className="mt-2 text-sm text-gray-500">
              Your password has been reset successfully.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/signin')}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-6">
          <div 
            onClick={() => navigate('/')}
            className="flex justify-center mb-3 cursor-pointer">
            <img
              src="https://res.cloudinary.com/dcliahekv/image/upload/v1745924858/logo_f6ikuk.png" 
              alt="Logo" 
              className="h-24 w-24" 
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
          {currentStep !== ForgotPasswordStep.SUCCESS && (
            <p className="text-gray-500 mt-2">
              {currentStep === ForgotPasswordStep.REQUEST_RESET && "Enter your email to receive a reset code"}
              {currentStep === ForgotPasswordStep.RESET_PASSWORD && "Enter the verification code and your new password"}
            </p>
          )}
        </div>

        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border">
          {/* Back to login button */}
          {currentStep !== ForgotPasswordStep.SUCCESS && (
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigate('/signin')}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </button>
            </div>
          )}
          
          {/* Show error message if any */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 text-sm">
              {error}
            </div>
          )}
          
          {/* Show success message if any */}
          {successMessage && currentStep !== ForgotPasswordStep.SUCCESS && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-3 mb-4 text-sm">
              {successMessage}
            </div>
          )}
          
          {/* Render content based on current step */}
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;