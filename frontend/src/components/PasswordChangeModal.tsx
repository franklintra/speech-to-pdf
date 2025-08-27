import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { authApi } from '@/lib/api';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordRequirement {
  regex: RegExp;
  text: string;
  icon?: string;
}

const passwordRequirements: PasswordRequirement[] = [
  { regex: /.{8,}/, text: 'At least 8 characters', icon: '📏' },
  { regex: /[A-Z]/, text: 'One uppercase letter', icon: '🔠' },
  { regex: /[a-z]/, text: 'One lowercase letter', icon: '🔡' },
  { regex: /\d/, text: 'One number', icon: '🔢' },
];

export default function PasswordChangeModal({ isOpen, onClose }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess(false);
        setPasswordFocused(false);
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }, 300);
    }
  }, [isOpen]);

  const checkPasswordRequirement = (requirement: PasswordRequirement) => {
    return requirement.regex.test(newPassword);
  };

  const isPasswordValid = () => {
    return passwordRequirements.every(req => checkPasswordRequirement(req));
  };

  const passwordStrength = () => {
    const metRequirements = passwordRequirements.filter(req => checkPasswordRequirement(req)).length;
    if (metRequirements === 0) return { text: '', color: '', width: '0%' };
    if (metRequirements === 1) return { text: 'Weak', color: 'bg-red-500', width: '25%' };
    if (metRequirements === 2) return { text: 'Fair', color: 'bg-orange-500', width: '50%' };
    if (metRequirements === 3) return { text: 'Good', color: 'bg-yellow-500', width: '75%' };
    return { text: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password complexity
    if (!isPasswordValid()) {
      setError('Password does not meet complexity requirements');
      return;
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="h-6 w-6 text-white mr-2" />
                      <Dialog.Title as="h3" className="text-lg font-semibold text-white">
                        Change Password
                      </Dialog.Title>
                    </div>
                    <button
                      type="button"
                      className="rounded-md text-white/80 hover:text-white transition-colors"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-4">
                  {success ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 animate-pulse">
                        <CheckCircleIcon className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">Success!</h3>
                      <p className="mt-2 text-sm text-gray-600">Your password has been changed successfully.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {error && (
                        <div className="rounded-lg bg-red-50 p-4">
                          <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                            <p className="ml-3 text-sm font-medium text-red-800">{error}</p>
                          </div>
                        </div>
                      )}

                      {/* Current Password */}
                      <div>
                        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            id="current-password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onFocus={() => setPasswordFocused(true)}
                            required
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                        
                        {/* Password strength indicator */}
                        {newPassword && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Password strength</span>
                              {strength.text && (
                                <span className={`text-xs font-medium ${
                                  strength.text === 'Strong' ? 'text-green-600' :
                                  strength.text === 'Good' ? 'text-yellow-600' :
                                  strength.text === 'Fair' ? 'text-orange-600' :
                                  'text-red-600'
                                }`}>
                                  {strength.text}
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${strength.color}`}
                                style={{ width: strength.width }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Password requirements with icons */}
                        {(passwordFocused || newPassword) && (
                          <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-2">
                            <p className="text-xs font-medium text-gray-700 mb-2">Password requirements:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {passwordRequirements.map((req, idx) => {
                                const isMet = checkPasswordRequirement(req);
                                return (
                                  <div 
                                    key={idx} 
                                    className={`flex items-center text-xs transition-all ${
                                      isMet ? 'text-green-700' : 'text-gray-500'
                                    }`}
                                  >
                                    <span className="mr-1">{req.icon}</span>
                                    <span className={isMet ? 'font-medium' : ''}>{req.text}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                        {confirmPassword && (
                          <div className="mt-2 flex items-center">
                            {newPassword === confirmPassword ? (
                              <>
                                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-xs text-green-600">Passwords match</span>
                              </>
                            ) : (
                              <>
                                <XMarkIcon className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-xs text-red-600">Passwords do not match</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                          onClick={onClose}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !isPasswordValid() || newPassword !== confirmPassword || !currentPassword}
                          className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Changing...
                            </span>
                          ) : (
                            'Change Password'
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}