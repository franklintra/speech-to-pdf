import { useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { useAuthStore } from '@/lib/store';
import { 
  ArrowRightOnRectangleIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  HomeIcon,
  UserCircleIcon,
  KeyIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import PasswordChangeModal from './PasswordChangeModal';

interface LayoutProps {
  children: React.ReactNode;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-indigo-600 mr-3" />
                <h1 className="text-xl font-semibold">Speech to PDF</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-gray-500">
                    Credits: {user.is_admin ? 'Unlimited' : `${user.credits?.toFixed(1) || '0.0'} min`}
                  </span>
                  <Link
                    href="/"
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <HomeIcon className="h-5 w-5 mr-1" />
                    Dashboard
                  </Link>
                  {user.is_admin && (
                    <Link
                      href="/admin"
                      className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <UserGroupIcon className="h-5 w-5 mr-1" />
                      Admin
                    </Link>
                  )}
                  
                  {/* User Menu Dropdown */}
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center space-x-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1.5 text-sm font-medium text-gray-700 hover:from-indigo-100 hover:to-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 p-0.5">
                        <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                          <UserCircleIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>
                      <span>{user.username}</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </Menu.Button>
                    
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-3 w-56 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden">
                        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50">
                          <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{user.email}</p>
                          {user.is_admin && (
                            <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                              Administrator
                            </span>
                          )}
                        </div>
                        
                        {/* Mobile-only menu items */}
                        <div className="sm:hidden py-1">
                          {user.is_admin && (
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  href="/admin"
                                  className={classNames(
                                    active ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : '',
                                    'group flex w-full items-center px-4 py-2.5 text-sm text-gray-700 transition-colors'
                                  )}
                                >
                                  <div className={classNames(
                                    active ? 'bg-gradient-to-r from-indigo-400 to-purple-400 text-white' : 'bg-gray-200 text-gray-500',
                                    'mr-3 h-8 w-8 rounded-lg flex items-center justify-center transition-all'
                                  )}>
                                    <UserGroupIcon className="h-4 w-4" />
                                  </div>
                                  <div className="text-left">
                                    <p className="font-medium">Admin Panel</p>
                                    <p className="text-xs text-gray-500">Manage users</p>
                                  </div>
                                </Link>
                              )}
                            </Menu.Item>
                          )}
                          <Menu.Item>
                            {({ active }) => (
                              <div className={classNames(
                                active ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : '',
                                'px-4 py-2.5 text-sm text-gray-700'
                              )}>
                                <div className="flex items-center">
                                  <div className="mr-3 h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-600">CR</span>
                                  </div>
                                  <div>
                                    <p className="font-medium">Credits</p>
                                    <p className="text-xs text-gray-500">
                                      {user.is_admin ? 'Unlimited' : `${user.credits?.toFixed(1) || '0.0'} min`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Menu.Item>
                        </div>
                        
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setShowPasswordModal(true)}
                                className={classNames(
                                  active ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : '',
                                  'group flex w-full items-center px-4 py-2.5 text-sm text-gray-700 transition-colors'
                                )}
                              >
                                <div className={classNames(
                                  active ? 'bg-gradient-to-r from-indigo-400 to-purple-400 text-white' : 'bg-gray-200 text-gray-500',
                                  'mr-3 h-8 w-8 rounded-lg flex items-center justify-center transition-all'
                                )}>
                                  <KeyIcon className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                  <p className="font-medium">Change Password</p>
                                  <p className="text-xs text-gray-500">Update your security settings</p>
                                </div>
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                        
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleLogout}
                                className={classNames(
                                  active ? 'bg-red-50' : '',
                                  'group flex w-full items-center px-4 py-2.5 text-sm text-gray-700 transition-colors'
                                )}
                              >
                                <div className={classNames(
                                  active ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500',
                                  'mr-3 h-8 w-8 rounded-lg flex items-center justify-center transition-all'
                                )}>
                                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                </div>
                                <div className="text-left">
                                  <p className="font-medium">Sign Out</p>
                                  <p className="text-xs text-gray-500">Log out of your account</p>
                                </div>
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      
      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </div>
  );
}