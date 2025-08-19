import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MessageSquare, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Chat {
  id: string;
  title: string;
  userId: string;
  user: {
    username: string;
    displayName: string;
    class?: string;
  };
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export default function AdminChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data.chats);
    } catch (error) {
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
      await api.delete(`/chats/${chatId}`);
      toast.success('Chat deleted successfully');
      loadChats();
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chat Management</h1>
        <p className="text-muted-foreground">Monitor and manage chat sessions</p>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Class</th>
                  <th className="text-left p-3">Messages</th>
                  <th className="text-left p-3">Created</th>
                  <th className="text-left p-3">Updated</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((chat) => (
                  <tr key={chat.id} className="border-b border-border">
                    <td className="p-3 font-medium">{chat.title}</td>
                    <td className="p-3">
                      <div>
                        <div>{chat.user.displayName}</div>
                        <div className="text-sm text-muted-foreground">{chat.user.username}</div>
                      </div>
                    </td>
                    <td className="p-3">{chat.user.class || '-'}</td>
                    <td className="p-3">{chat._count.messages}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <button
                          className="text-primary hover:text-primary/80"
                          title="View chat"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteChat(chat.id)}
                          className="text-destructive hover:text-destructive/80"
                          title="Delete chat"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
