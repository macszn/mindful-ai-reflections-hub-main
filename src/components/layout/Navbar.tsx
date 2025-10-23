import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import UserMenu from './UserMenu';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="py-4 border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container-custom flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="font-bold text-xl">MentAI</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-foreground/80 hover:text-primary transition-colors">Home</Link>
          <Link to="/chat" className="text-foreground/80 hover:text-primary transition-colors">Chat</Link>
          <Link to="/journal" className="text-foreground/80 hover:text-primary transition-colors">Journal</Link>
          <Link to="/insights" className="text-foreground/80 hover:text-primary transition-colors">Insights</Link>
          <Link to="/resources" className="text-foreground/80 hover:text-primary transition-colors">Resources</Link>
          <Button onClick={toggleTheme} variant="ghost" size="icon" className="ml-2">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        

          {user ? (
            <UserMenu />
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" className="mr-2">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}

        </div>
        
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center">
          <Button onClick={toggleTheme} variant="ghost" size="icon" className="mr-2">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user && (
            <div className="mr-2">
              <UserMenu />
            </div>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col space-y-4 mt-8">
                <Link to="/" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>Home</Link>
                <Link to="/chat" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>Chat</Link>
                <Link to="/journal" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>Journal</Link>
                <Link to="/insights" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>Insights</Link>
                <Link to="/resources" className="text-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>Resources</Link>
                <div className="pt-4 border-t border-border">
                 {user ? (
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        const { logout } = useAuth();
                        logout();
                        setIsOpen(false);
                      }}
                    >
                      Log Out
                    </Button>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        <Button className="w-full mb-2">Sign In</Button>
                      </Link>
                      <Link to="/register" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">Sign Up</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
