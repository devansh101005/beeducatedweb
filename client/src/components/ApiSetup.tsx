// ApiSetup component - Initializes API client with Clerk authentication
// This component should be rendered inside ClerkProvider

import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '../api/client';

interface ApiSetupProps {
  children: React.ReactNode;
}

/**
 * Component that sets up the API client with Clerk's getToken function
 * Must be rendered inside ClerkProvider
 */
export const ApiSetup: React.FC<ApiSetupProps> = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the token getter for the API client
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
};

export default ApiSetup;
