import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, LogOut, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import NotificationSettingsCard from '@/components/insights/NotificationSettingsCard';
import DataPrivacyCard from '@/components/insights/DataPrivacyCard';

const UserMenu = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountDataOpen, setAccountDataOpen] = useState(false);

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

  const handleAccountDeleted = () => {
    setAccountDataOpen(false);
    logout();
    toast.success('Your account and data have been deleted');
    navigate('/');
  };

  return (
    <>
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
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setNotificationsOpen(true)}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Device Notification</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setAccountDataOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Account &amp; Data</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onSelect={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Device Notification</DialogTitle>
            <DialogDescription>
              Manage notifications for this device.
            </DialogDescription>
          </DialogHeader>
          <NotificationSettingsCard />
        </DialogContent>
      </Dialog>

      <Dialog open={accountDataOpen} onOpenChange={setAccountDataOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delete Account &amp; Data</DialogTitle>
            <DialogDescription>
              Review saved-memory settings or permanently remove your account and personal data.
            </DialogDescription>
          </DialogHeader>
          <DataPrivacyCard onAccountDeleted={handleAccountDeleted} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserMenu;
