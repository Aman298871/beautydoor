import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {},
  params: {}
});

export const useRouter = () => useContext(RouterContext);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getFullLocation = () => {
    if (typeof window === 'undefined') return '/';
    return (window.location.pathname || '/') + (window.location.search || '');
  };

  const [path, setPath] = useState<string>(getFullLocation);

  useEffect(() => {
    const handlePopState = () => {
      setPath(getFullLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    const current = getFullLocation();
    if (to !== current) {
      window.history.pushState({}, '', to);
      setPath(to);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // If clicking same path with different query or re-triggering
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Simple route param parser for /services/:category and /service/:slug
  const pathname = path.split('?')[0];
  const params: Record<string, string> = {};
  if (pathname.startsWith('/services/')) {
    params.category = pathname.replace('/services/', '').split('/')[0];
  } else if (pathname.startsWith('/service/')) {
    params.slug = pathname.replace('/service/', '').split('/')[0];
  }

  return (
    <RouterContext.Provider value={{ path, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
};
