// Dev Tools Component - Role Switcher
// Only visible in development mode

import { useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

const roles = [
  { value: 'admin', label: 'Admin', color: 'bg-red-500' },
  { value: 'teacher', label: 'Teacher', color: 'bg-blue-500' },
  { value: 'student', label: 'Student', color: 'bg-green-500' },
  { value: 'parent', label: 'Parent', color: 'bg-purple-500' },
  { value: 'batch_manager', label: 'Batch Manager', color: 'bg-orange-500' },
];

export function DevTools() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  // Don't show until Clerk is loaded and user is signed in
  if (!isLoaded || !isSignedIn || !user) {
    return null;
  }

  const fetchCurrentRole = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/v2/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCurrentRole(data.data.user.role);
      }
    } catch (error) {
      console.error('Failed to fetch role:', error);
    }
  };

  const changeRole = async (newRole: string) => {
    setLoading(true);
    setMessage('');

    try {
      const token = await getToken();
      const response = await fetch('/api/v2/auth/role', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentRole(newRole);
        setMessage(`✓ Changed to ${newRole}`);
        // Reload after 1 second to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setMessage(`✗ ${data.message}`);
      }
    } catch (error) {
      setMessage('✗ Failed to change role');
      console.error('Failed to change role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchCurrentRole();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center text-xl"
        title="Dev Tools - Role Switcher"
      >
        🛠️
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-80 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">🛠️ Dev Tools</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Current Role:</p>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    roles.find((r) => r.value === currentRole)?.color || 'bg-gray-400'
                  }`}
                />
                <span className="font-medium text-gray-900">
                  {currentRole || 'Loading...'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Switch to:</p>
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => changeRole(role.value)}
                  disabled={loading || currentRole === role.value}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all ${
                    currentRole === role.value
                      ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${role.color}`} />
                  <span className="font-medium">{role.label}</span>
                  {currentRole === role.value && (
                    <span className="ml-auto text-xs text-gray-400">Current</span>
                  )}
                </button>
              ))}
            </div>

            {message && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${
                  message.startsWith('✓')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message}
                {message.startsWith('✓') && (
                  <span className="block text-xs mt-1">Reloading page...</span>
                )}
              </div>
            )}

            {loading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                <span className="text-sm">Changing role...</span>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Dev only • Not available in production
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DevTools;
