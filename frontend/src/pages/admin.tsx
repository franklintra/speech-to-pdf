import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/store';
import { adminApi } from '@/lib/api';
import Layout from '@/components/Layout';
import toast from 'react-hot-toast';
import {
  UserIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  KeyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_admin: boolean;
  credits: number;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    is_admin: false,
    credits: 60,
  });

  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!currentUser.is_admin) {
      toast.error('Access denied. Admin privileges required.');
      router.push('/');
      return;
    }
    loadUsers();
  }, [currentUser, router]);

  const loadUsers = async () => {
    try {
      const response = await adminApi.listUsers();
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.username || !newUser.password) {
      toast.error('All fields are required');
      return;
    }

    try {
      await adminApi.createUser(newUser);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setNewUser({ email: '', username: '', password: '', is_admin: false, credits: 60 });
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (user: User) => {
    try {
      await adminApi.updateUser(user.id, {
        is_active: user.is_active,
        is_admin: user.is_admin,
        credits: user.credits,
      });
      toast.success('User updated successfully');
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt('Enter new password for user:');
    if (!newPassword) return;

    try {
      await adminApi.updateUser(userId, { password: newPassword });
      toast.success('Password reset successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading...</div>
      </Layout>
    );
  }

  if (!currentUser?.is_admin) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm sm:text-base"
          >
            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Create User
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white shadow overflow-hidden rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credits (min)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser?.id === user.id ? (
                      <input
                        type="checkbox"
                        checked={editingUser.is_active}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, is_active: e.target.checked })
                        }
                      />
                    ) : (
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser?.id === user.id ? (
                      <input
                        type="checkbox"
                        checked={editingUser.is_admin}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, is_admin: e.target.checked })
                        }
                        disabled={user.id === currentUser.id}
                      />
                    ) : (
                      user.is_admin && (
                        <span className="flex items-center text-sm text-indigo-600">
                          <ShieldCheckIcon className="h-5 w-5 mr-1" />
                          Admin
                        </span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingUser?.id === user.id ? (
                      user.is_admin ? (
                        <span className="font-medium text-indigo-600">Unlimited</span>
                      ) : (
                        <input
                          type="number"
                          step="0.1"
                          value={editingUser.credits}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, credits: parseFloat(e.target.value) || 0 })
                          }
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                        />
                      )
                    ) : (
                      <span className="font-medium">
                        {user.is_admin ? 'Unlimited' : user.credits.toFixed(1)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {editingUser?.id === user.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateUser(editingUser)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Reset Password"
                          >
                            <KeyIcon className="h-5 w-5" />
                          </button>
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {users.map((user) => (
            <div key={user.id} className="bg-white shadow rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                {editingUser?.id === user.id ? (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleUpdateUser(editingUser)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Reset Password"
                    >
                      <KeyIcon className="h-5 w-5" />
                    </button>
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Status</p>
                  {editingUser?.id === user.id ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingUser.is_active}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, is_active: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <span>Active</span>
                    </label>
                  ) : (
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
                
                <div>
                  <p className="text-gray-500">Role</p>
                  {editingUser?.id === user.id ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingUser.is_admin}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, is_admin: e.target.checked })
                        }
                        disabled={user.id === currentUser.id}
                        className="mr-2"
                      />
                      <span>Admin</span>
                    </label>
                  ) : (
                    user.is_admin ? (
                      <span className="flex items-center text-sm text-indigo-600">
                        <ShieldCheckIcon className="h-4 w-4 mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="text-gray-600">User</span>
                    )
                  )}
                </div>
                
                <div>
                  <p className="text-gray-500">Credits</p>
                  {editingUser?.id === user.id ? (
                    user.is_admin ? (
                      <span className="font-medium text-indigo-600">Unlimited</span>
                    ) : (
                      <input
                        type="number"
                        step="0.1"
                        value={editingUser.credits}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, credits: parseFloat(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    )
                  ) : (
                    <span className="font-medium">
                      {user.is_admin ? 'Unlimited' : `${user.credits.toFixed(1)} min`}
                    </span>
                  )}
                </div>
                
                <div>
                  <p className="text-gray-500">Created</p>
                  <span className="font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_admin"
                    checked={newUser.is_admin}
                    onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">
                    Administrator
                  </label>
                </div>
                {!newUser.is_admin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Credits (minutes): {newUser.credits}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="10"
                      value={newUser.credits}
                      onChange={(e) => setNewUser({ ...newUser, credits: parseInt(e.target.value) })}
                      className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span className="hidden sm:inline">60 (default)</span>
                      <span className="sm:hidden">60</span>
                      <span>150</span>
                      <span>300</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}