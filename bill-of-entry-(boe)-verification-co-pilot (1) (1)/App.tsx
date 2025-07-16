import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { VerifyChecklist } from './components/VerifyChecklist';
import { Connectors } from './components/Connectors';
import { ManualVerification } from './components/ManualVerification';
import { Settings } from './components/Settings';
import { Products } from './components/Products';
import { GlobalDataProvider } from './contexts/GlobalDataProvider';
import { DraftEmail } from './components/DraftEmail';
import { PtpLetter } from './components/PtpLetter';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    if (route.startsWith('#/verify/')) {
      const emailId = route.replace('#/verify/', '');
      return <VerifyChecklist emailId={emailId} />;
    }
    if (route.startsWith('#/manual')) {
      return <ManualVerification />;
    }
    if (route.startsWith('#/products')) {
      return <Products />;
    }
    if (route.startsWith('#/connectors')) {
      return <Connectors />;
    }
    if (route.startsWith('#/settings')) {
      return <Settings />;
    }
    if (route.startsWith('#/draft-email')) {
      return <DraftEmail />;
    }
    if (route.startsWith('#/ptp-letter')) {
      return <PtpLetter />;
    }
    // Default route
    return <Dashboard />;
  };

  return (
    <GlobalDataProvider>
      <div className="flex h-screen bg-slate-900 font-sans">
        <Sidebar currentRoute={route} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </GlobalDataProvider>
  );
};

export default App;