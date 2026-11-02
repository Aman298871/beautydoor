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
  const [path, setPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    if (to !== path) {
      window.history.pushState({}, '', to);
      setPath(to);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Simple route param parser for /services/:category and /service/:slug
  const params: Record<string, string> = {};
  if (path.startsWith('/services/')) {
    params.category = path.replace('/services/', '').split('/')[0];
  } else if (path.startsWith('/service/')) {
    params.slug = path.replace('/service/', '').split('/')[0];
  }

  return (
    <RouterContext.Provider value={{ path, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
};
