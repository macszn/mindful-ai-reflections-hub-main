
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, PlusCircle, Edit, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

type MoodEntry = {
  _id: string;
  date: Date;
  mood: string;
  content: string;
  tags: string[];
};

const moods = [
  { value: 'happy', label: 'Happy 😊', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'calm', label: 'Calm 😌', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'anxious', label: 'Anxious 😰', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'sad', label: 'Sad 😢', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'angry', label: 'Angry 😠', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'tired', label: 'Tired 😴', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'excited', label: 'Excited 🤩', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'grateful', label: 'Grateful 🙏', color: 'bg-teal-100 text-teal-800 border-teal-200' },
];

const JournalPage = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [mood, setMood] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to clear form and exit edit mode
  const clearForm = () => {
    setDate(new Date());
    setMood('');
    setContent('');
    setTags('');
    setIsEditing(null);
  };

  useEffect(() => {
    if (!user) {
      // Clear entries when user logs out
      setEntries([]);
      clearForm();
      return;
    }

    if (!user.id) {
      return; // Don't fetch if user ID is not available yet
    }

    const fetchEntries = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:4000/api/journal?userId=${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          // Convert date strings to Date objects
          const parsedEntries = data.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
          }));
          setEntries(parsedEntries);
        } else {
          toast.error('Failed to fetch journal entries');
        }
      } catch (error) {
        toast.error('An error occurred while fetching entries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [user, user?.id]);

  // Clear form when user changes to prevent data leakage
  useEffect(() => {
    if (user) {
      clearForm();
    }
  }, [user?.id]);

  // Clear form when user logs out
  useEffect(() => {
    if (!user) {
      clearForm();
    }
  }, [user]);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Function to check if user can perform actions
  const canPerformAction = () => {
    return !!user;
  };

  // Function to get user-specific storage key
  const getUserStorageKey = (key: string) => {
    return user ? `${key}_${user.id}` : key;
  };

  const handleAddEntry = async () => {
    if (!canPerformAction()) {
      toast.error('Please log in to add journal entries');
      return;
    }

    if (!user?.id) {
      toast.error('User ID is missing. Please try logging in again.');
      return;
    }

    if (!date || !mood || !content) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/journal?userId=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          mood,
          content,
          tags
        }),
      });

      if (response.ok) {
        const savedEntry = await response.json();
        // Convert date string to Date object if needed
        const entryWithDate: MoodEntry = {
          ...savedEntry,
          date: new Date(savedEntry.date),
        };
        setEntries([entryWithDate, ...entries]);
        toast.success('Journal entry added!');
        // Clear form
        clearForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to add journal entry');
      }
    } catch (error: any) {
      toast.error('An error occurred while adding the entry');
    }
  };

  const handleEditEntry = async (id: string) => {
    if (!canPerformAction()) {
      toast.error('Please log in to edit journal entries');
      return;
    }

    const entry = entries.find(e => e._id === id);
    if (!entry) return;

    setIsEditing(id);
    setDate(new Date(entry.date));
    setMood(entry.mood);
    setContent(entry.content);
    setTags(Array.isArray(entry.tags) ? entry.tags.join(', ') : '');
    
    // Scroll to the form for better UX
    setTimeout(() => {
      const formElement = document.querySelector('[data-form="journal-form"]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleUpdateEntry = async () => {
    if (!canPerformAction()) {
      toast.error('Please log in to update journal entries');
      return;
    }

    if (!user?.id) {
      toast.error('User ID is missing. Please try logging in again.');
      return;
    }

    if (!isEditing) return;

    if (!date || !mood || !content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:4000/api/journal/${isEditing}?userId=${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          mood,
          content,
          tags
        }),
      });

      if (response.ok) {
        const updatedEntry = await response.json();
        // Convert date string to Date object if needed
        const entryWithDate = {
          ...updatedEntry,
          date: new Date(updatedEntry.date),
        };
        const updatedEntries = entries.map(entry =>
          entry._id === isEditing ? entryWithDate : entry
        );
        setEntries(updatedEntries);
        toast.success('Journal entry updated!');
        // Clear form and exit edit mode
        clearForm();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update journal entry');
      }
    } catch (error: any) {
      toast.error('An error occurred while updating the entry');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!canPerformAction()) {
      toast.error('Please log in to delete journal entries');
      return;
    }

    if (!user?.id) {
      toast.error('User ID is missing. Please try logging in again.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/journal/${id}?userId=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Only remove from local state if server deletion was successful
        setEntries(entries.filter(entry => entry._id !== id));
        toast.success('Journal entry deleted');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete entry');
      }
    } catch (error: any) {
      console.log(error);
      toast.error('An error occurred while deleting the entry');
    }
  };

  const getMoodLabel = (moodValue: string) => {
    const foundMood = moods.find(m => m.value === moodValue);
    return foundMood ? foundMood.label : moodValue;
  };
  
  const getMoodColor = (moodValue: string) => {
    const foundMood = moods.find(m => m.value === moodValue);
    return foundMood ? foundMood.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Show loading state while fetching entries
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-center py-20">
          <div className="text-muted-foreground">Loading your journal entries...</div>
        </div>
      </div>
    );
  }

  // Show authentication required message if user is not logged in
  if (!user) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access your mood journal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Mood Journal</h1>
        <p className="text-muted-foreground">Track your emotions and reflect on your mental wellbeing</p>
        <p className="text-sm text-muted-foreground mt-2">Welcome back, {user.name}!</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Journal Entry Form */}
        <Card className="lg:col-span-1" data-form="journal-form">
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Entry' : 'New Entry'}</CardTitle>
            <CardDescription>
              How are you feeling today? Share your thoughts and emotions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Mood</label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your mood" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Journal Entry</label>
              <Textarea
                placeholder="Write about how you're feeling..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                placeholder="work, family, self-care (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            {isEditing ? (
              <div className="flex space-x-2 w-full">
                <Button variant="outline" className="flex-1" onClick={clearForm}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleUpdateEntry} disabled={isUpdating}>
                  <Save className="mr-2 h-4 w-4" /> {isUpdating ? 'Updating...' : 'Update'}
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={handleAddEntry}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Entry
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Journal Entries List */}
        <div key={entries.length} className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Your Journal Entries</h2>
          
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 bg-secondary/30 rounded-lg border border-border">
              <div className="text-4xl mb-2">📓</div>
              <h3 className="font-medium text-lg">No entries yet</h3>
              <p className="text-muted-foreground text-center max-w-xs mt-1">
                Start tracking your moods by adding your first journal entry.
              </p>
            </div>
          ) : (
            entries.map((entry) => (
              <Card key={entry._id} className={`overflow-hidden ${isEditing === entry._id ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {format(entry.date, 'EEEE, MMMM d, yyyy')}
                      </CardTitle>
                      <CardDescription>{format(entry.date, 'h:mm a')}</CardDescription>
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-xs font-medium", getMoodColor(entry.mood))}>
                      {getMoodLabel(entry.mood)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{entry.content}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {entry.tags.map((tag, i) => (
                      <span key={i} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditEntry(entry._id)}
                    disabled={!canPerformAction()}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteEntry(entry._id)}
                    disabled={!canPerformAction()}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalPage;
