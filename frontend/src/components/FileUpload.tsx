import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { conversionsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { config } from '@/lib/config';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onUploadComplete: () => void;
}

const LANGUAGES = [
  { value: 'auto', label: 'Auto-detect', code: 'auto' },
  { value: 'en', label: 'English', code: 'en' },
  { value: 'es', label: 'Spanish', code: 'es' },
  { value: 'fr', label: 'French', code: 'fr' },
  { value: 'de', label: 'German', code: 'de' },
  { value: 'it', label: 'Italian', code: 'it' },
  { value: 'pt', label: 'Portuguese', code: 'pt' },
  { value: 'nl', label: 'Dutch', code: 'nl' },
  { value: 'hi', label: 'Hindi', code: 'hi' },
  { value: 'ja', label: 'Japanese', code: 'ja' },
  { value: 'zh', label: 'Chinese', code: 'zh' },
  { value: 'ko', label: 'Korean', code: 'ko' },
  { value: 'ru', label: 'Russian', code: 'ru' },
  { value: 'ar', label: 'Arabic', code: 'ar' },
  { value: 'tr', label: 'Turkish', code: 'tr' },
  { value: 'pl', label: 'Polish', code: 'pl' },
  { value: 'sv', label: 'Swedish', code: 'sv' },
  { value: 'no', label: 'Norwegian', code: 'no' },
  { value: 'da', label: 'Danish', code: 'da' },
  { value: 'fi', label: 'Finnish', code: 'fi' },
];

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const user = useAuthStore((state) => state.user);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    
    for (const file of acceptedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        const displayName = file.name.replace(/\.[^/.]+$/, '');
        const language = selectedLanguage === 'auto' ? null : selectedLanguage;
        await conversionsApi.upload(file, displayName, language);
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        toast.success(`${file.name} uploaded successfully!`);
      } catch (error: any) {
        toast.error(`Failed to upload ${file.name}: ${error.response?.data?.detail || 'Unknown error'}`);
      }
    }
    
    setUploading(false);
    setUploadProgress({});
    onUploadComplete();
  }, [onUploadComplete, selectedLanguage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.aac', '.ogg', '.opus'],
      'video/*': ['.mp4', '.webm', '.mkv', '.mov'],
    },
    multiple: true,
    disabled: uploading,
  });

  return (
    <div className="mb-8 space-y-4">
      {/* Credits Warning - Only show for non-admin users below threshold */}
      {user && !user.is_admin && user.credits < config.CREDITS_WARNING_THRESHOLD && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {user.credits === 0 ? (
                  <>You have <span className="font-semibold">no credits</span> remaining. Please contact your administrator to add more credits.</>
                ) : (
                  <>You have <span className="font-semibold">{user.credits.toFixed(1)} minutes</span> of credits remaining. Please contact your administrator if you need more.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Upload Section - Side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
          {isDragActive ? (
            <p className="text-base sm:text-lg text-gray-600">Drop the files here...</p>
          ) : (
            <>
              <p className="text-base sm:text-lg text-gray-600">
                Drag & drop audio files here, or click to select
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                Supports: MP3, WAV, M4A, FLAC, AAC, OGG, MP4, WebM, etc.
              </p>
            </>
          )}
        </div>

        {/* Settings Panel */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Transcription Settings</h3>
          <div>
            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {selectedLanguage === 'auto' 
                  ? 'Automatically detects the language of your audio' 
                  : 'Transcription will be optimized for this language'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="bg-white p-3 rounded-lg shadow">
              <div className="flex justify-between text-sm mb-1">
                <span>{filename}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}