import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from 'lucide-react';
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const UserMenu = () => {
  const { logout } = useAuth();
  const user = JSON.parse(localStorage.getItem('MentAI_users') || '{}');
  const navigate = useNavigate();

  if (!user) return null;

  // Get initials from the user's name
  const getInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 outline-none">
          <span className="hidden md:block">{user.name}</span>
          <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;

