import React from 'react';
import { AppLogo } from './Icons';
import { LayoutDashboard, FileUp, PlugZap, Settings, Database, MailPlus, FileSignature } from 'lucide-react';

interface SidebarProps {
  currentRoute: string;
}

const NavLink: React.FC<{ href: string; current: boolean; children: React.ReactNode }> = ({ href, current, children }) => {
    // Manually handle navigation to prevent any full-page reloads.
    // This provides a more robust client-side routing mechanism against
    // environments that might misinterpret hash-based anchor links, fixing the 403 error.
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.location.hash = href;
    };

    return (
      <a
        href={href}
        onClick={handleClick}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          current ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
        }`}
      >
        {children}
      </a>
    );
};


export const Sidebar: React.FC<SidebarProps> = ({ currentRoute }) => {
  const isDashboard = currentRoute === '#/' || currentRoute.startsWith('#/verify/');

  return (
    <nav className="w-64 h-full bg-slate-950 p-4 flex flex-col flex-shrink-0">
      <div className="flex items-center mb-8">
        <AppLogo className="h-8 w-8 text-cyan-400" />
        <span className="ml-3 text-lg font-semibold text-white">BOE Co-pilot</span>
      </div>
      <div className="flex-grow space-y-2">
        <NavLink href="#/" current={isDashboard}>
          <LayoutDashboard className="mr-3 h-5 w-5" />
          Dashboard
        </NavLink>
        <NavLink href="#/manual" current={currentRoute.startsWith('#/manual')}>
           <FileUp className="mr-3 h-5 w-5" />
          Manual Verification
        </NavLink>
        <NavLink href="#/draft-email" current={currentRoute.startsWith('#/draft-email')}>
            <MailPlus className="mr-3 h-5 w-5" />
            Draft Email
        </NavLink>
        <NavLink href="#/ptp-letter" current={currentRoute.startsWith('#/ptp-letter')}>
            <FileSignature className="mr-3 h-5 w-5" />
            PTP Letter
        </NavLink>
        <NavLink href="#/products" current={currentRoute.startsWith('#/products')}>
           <Database className="mr-3 h-5 w-5" />
          Products
        </NavLink>
        <NavLink href="#/connectors" current={currentRoute.startsWith('#/connectors')}>
          <PlugZap className="mr-3 h-5 w-5" />
          Connectors
        </NavLink>
      </div>
      <div className="mt-auto">
         <NavLink href="#/settings" current={currentRoute.startsWith('#/settings')}>
            <Settings className="mr-3 h-5 w-5" />
            Settings
         </NavLink>
      </div>
    </nav>
  );
};