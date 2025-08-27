import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

export default function App({ Component, pageProps }: AppProps) {
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.getMe()
        .then((response) => {
          setAuth(response.data, token);
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, [setAuth]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </>
  );
}