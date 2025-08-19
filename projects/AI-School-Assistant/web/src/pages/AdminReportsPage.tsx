import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart3, Users, MessageSquare, Activity } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalTokens: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/reports/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">System usage statistics and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Chats</p>
                <p className="text-2xl font-bold">{stats?.totalChats || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{stats?.totalMessages || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">{stats?.totalTokens?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Today's Activity</h3>
          </div>
          <div className="card-content">
            <p className="text-3xl font-bold">{stats?.activeUsersToday || 0}</p>
            <p className="text-sm text-muted-foreground">Active users today</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">This Week</h3>
          </div>
          <div className="card-content">
            <p className="text-3xl font-bold">{stats?.activeUsersThisWeek || 0}</p>
            <p className="text-sm text-muted-foreground">Active users this week</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">This Month</h3>
          </div>
          <div className="card-content">
            <p className="text-3xl font-bold">{stats?.activeUsersThisMonth || 0}</p>
            <p className="text-sm text-muted-foreground">Active users this month</p>
          </div>
        </div>
      </div>

      {/* Placeholder for charts */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Usage Trends</h3>
        </div>
        <div className="card-content">
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Usage charts will be implemented in the next version</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
