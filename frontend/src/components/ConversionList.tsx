import { useState, useEffect } from 'react';
import { conversionsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { 
  DocumentTextIcon, 
  DocumentIcon, 
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  username: string;
  email: string;
}

interface Conversion {
  id: number;
  display_name: string;
  original_filename: string;
  status: string;
  duration?: number;
  model_used?: string;
  language?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  has_docx: boolean;
  has_pdf: boolean;
  has_txt: boolean;
  user?: User;
}

interface ConversionListProps {
  refreshKey: number;
}

export default function ConversionList({ refreshKey }: ConversionListProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    loadConversions();
  }, [refreshKey, searchUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      const hasProcessing = conversions.some(c => c.status === 'pending' || c.status === 'processing');
      if (hasProcessing) {
        loadConversions();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [conversions]);

  const loadConversions = async () => {
    try {
      const response = await conversionsApi.list(0, 100, searchUser || undefined);
      setConversions(response.data.conversions);
    } catch (error) {
      toast.error('Failed to load conversions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchUser(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchUser('');
  };

  const handleDownload = async (id: number, fileType: 'docx' | 'pdf' | 'txt', displayName: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }
      
      const url = conversionsApi.download(id, fileType);
      // Create a link with authentication header
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Access denied. You can only download your own files.');
        } else {
          throw new Error('Download failed');
        }
        return;
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      // Use the display name for the downloaded file
      a.download = `${displayName}.${fileType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this conversion?')) {
      return;
    }

    try {
      await conversionsApi.delete(id);
      toast.success('Conversion deleted');
      loadConversions();
    } catch (error) {
      toast.error('Failed to delete conversion');
    }
  };

  const handleRename = async (id: number) => {
    try {
      await conversionsApi.update(id, editingName);
      toast.success('Name updated');
      setEditingId(null);
      loadConversions();
    } catch (error) {
      toast.error('Failed to update name');
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading conversions...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search bar for admins */}
      {currentUser?.is_admin && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Search
              </button>
              {searchUser && (
                <button
                  onClick={clearSearch}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {searchUser && (
            <p className="mt-2 text-sm text-gray-600">
              Showing results for: <span className="font-semibold">{searchUser}</span>
            </p>
          )}
        </div>
      )}

      {conversions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            {searchUser ? 'No conversions found for this user.' : 'No conversions yet. Upload an audio file to get started!'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {conversions.map((conversion) => (
          <li key={conversion.id} className="px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start sm:items-center">
                  <div className="flex-shrink-0 mt-1 sm:mt-0">
                    {getStatusIcon(conversion.status)}
                  </div>
                  {editingId === conversion.id ? (
                    <div className="ml-3 flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                        onKeyPress={(e) => e.key === 'Enter' && handleRename(conversion.id)}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleRename(conversion.id)}
                          className="p-1 text-green-600 hover:text-green-900 transition-colors"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-red-600 hover:text-red-900 transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ml-3 flex-1">
                      <p className="text-sm sm:text-base font-medium text-gray-900 break-words">
                        {conversion.display_name}
                      </p>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1">
                        {conversion.status === 'completed' && (
                          <>
                            <span className="inline-block">Duration: {formatDuration(conversion.duration)}</span>
                            <span className="hidden sm:inline"> • </span>
                            <br className="sm:hidden" />
                          </>
                        )}
                        {conversion.status === 'processing' && 'Processing...'}
                        {conversion.status === 'pending' && 'Waiting to process...'}
                        {conversion.status === 'failed' && (
                          <span className="text-red-500 break-words">Failed: {conversion.error_message}</span>
                        )}
                        {conversion.status === 'completed' && (
                          <>
                            <span className="inline-block">Language: {conversion.language?.toUpperCase()}</span>
                            <span className="hidden sm:inline"> • </span>
                            <br className="sm:hidden" />
                            <span className="inline-block">Model: {conversion.model_used}</span>
                          </>
                        )}
                      </div>
                      {/* Show user info for admins */}
                      {currentUser?.is_admin && conversion.user && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center">
                          <UserIcon className="h-3 w-3 mr-1" />
                          <span className="truncate">{conversion.user.username} ({conversion.user.email})</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {conversion.status === 'completed' && (
                  <div className="flex flex-wrap items-center gap-1">
                    {conversion.has_txt && (
                      <button
                        onClick={() => handleDownload(conversion.id, 'txt', conversion.display_name)}
                        className="flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                        title="Download plain text transcript"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">TXT</span>
                      </button>
                    )}
                    {conversion.has_docx && (
                      <button
                        onClick={() => handleDownload(conversion.id, 'docx', conversion.display_name)}
                        className="flex items-center px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors"
                        title="Download Word document"
                      >
                        <DocumentIcon className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">WORD</span>
                      </button>
                    )}
                    {conversion.has_pdf && (
                      <button
                        onClick={() => handleDownload(conversion.id, 'pdf', conversion.display_name)}
                        className="flex items-center px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-700 transition-colors"
                        title="Download PDF document"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-1 sm:ml-2">
                  <button
                    onClick={() => {
                      setEditingId(conversion.id);
                      setEditingName(conversion.display_name);
                    }}
                    className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Rename"
                  >
                    <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(conversion.id)}
                    className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}