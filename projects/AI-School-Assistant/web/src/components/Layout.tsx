import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Moon, Sun, LogOut, Users, MessageSquare, BarChart3, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">AI School Assistant</h1>
            <span className="text-sm text-muted-foreground">
              {user?.displayName} ({user?.role})
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-accent"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-accent text-destructive"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card min-h-screen">
          <nav className="p-4 space-y-2">
            <Link
              to="/app"
              className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                location.pathname === '/app' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Chat</span>
            </Link>

            {isAdmin && (
              <>
                <Link
                  to="/admin/users"
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    location.pathname === '/admin/users' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span>Users</span>
                </Link>

                <Link
                  to="/admin/chats"
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    location.pathname === '/admin/chats' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Chats</span>
                </Link>

                <Link
                  to="/admin/reports"
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    location.pathname === '/admin/reports' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Reports</span>
                </Link>
              </>
            )}

            {user?.role === 'SUPERADMIN' && (
              <Link
                to="/admin/settings"
                className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                  location.pathname === '/admin/settings' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Author: Shekhar Bhattacharya (for techies only) · Free for Non-Profit schools and educational institutes · LAN-only</p>
        </div>
      </footer>
    </div>
  );
}
