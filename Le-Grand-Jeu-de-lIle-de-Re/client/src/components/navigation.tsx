import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Gamepad2 } from 'lucide-react';

interface NavigationProps {
  user: {
    displayName: string;
    isAdmin: boolean;
  };
}

export function Navigation({ user }: NavigationProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const navItems = [
    { href: '/', label: 'Mon coffre', adminOnly: false },
    { href: '/team', label: 'Équipe', adminOnly: false },
    { href: '/admin', label: 'Admin', adminOnly: false }, // Always visible but protected by password
    { href: '/audit', label: 'Audit', adminOnly: false }, // Always visible but protected by password
  ];

  const NavLink = ({ href, label, mobile = false }: { href: string; label: string; mobile?: boolean }) => {
    const isActive = location === href;
    const baseClasses = mobile 
      ? "block px-3 py-2 rounded-md text-base font-medium"
      : "px-3 py-2 rounded-md text-sm font-medium border-b-2 border-transparent";
    
    const activeClasses = isActive 
      ? "text-primary border-primary bg-blue-50" 
      : "text-gray-500 hover:text-gray-700 hover:border-gray-300";

    return (
      <Link 
        href={href} 
        className={`${baseClasses} ${activeClasses} transition-colors`} 
        onClick={() => setIsOpen(false)}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-gray-900">GJIR</h1>
            <span className="text-sm text-gray-500 hidden sm:block">Gestionnaire de défis</span>
          </div>
          
          {/* Mobile Navigation */}
          <div className="sm:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="mt-6 space-y-3">
                  {navItems.map((item) => (
                    <NavLink key={item.href} href={item.href} label={item.label} mobile />
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-6">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">{user.displayName}</span>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {getInitials(user.displayName)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
