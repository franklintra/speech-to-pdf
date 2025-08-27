import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/store';
import Layout from '@/components/Layout';
import FileUpload from '@/components/FileUpload';
import ConversionList from '@/components/ConversionList';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('token');
    if (!token && !user) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [user, router]);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Upload Audio Files</h2>
          <FileUpload onUploadComplete={handleUploadComplete} />
        </div>
        
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Your Conversions</h2>
          <ConversionList refreshKey={refreshKey} />
        </div>
      </div>
    </Layout>
  );
}