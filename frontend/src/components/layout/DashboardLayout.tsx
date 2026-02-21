import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AIChat } from '@/components/AIChat';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardLayout() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <AIChat />
      <main className="pl-64 min-h-screen">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-border bg-background/80 px-6 backdrop-blur-sm">
          <Button variant="ghost" size="icon" onClick={toggle} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} className="rounded-full">
            {theme === 'dark' ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
          </Button>
        </div>
        <div className="container mx-auto max-w-7xl p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
