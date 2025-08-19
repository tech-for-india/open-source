import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Users, Plus, Upload, Trash2, X, Eye, EyeOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
  class?: string;
  roll?: string;
  createdAt: string;
  mustChangePassword: boolean;
  defaultPassword?: string;
  dob?: string;
  fatherName?: string;
  motherName?: string;
  classTeacherName?: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    role: 'USER',
    class: '',
    roll: '',
    dob: '',
    fatherName: '',
    motherName: '',
    classTeacherName: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const resetUserPassword = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s password?')) return;

    try {
      const response = await api.post(`/users/${userId}/reset-password`);
      toast.success(`Password reset successfully! New password: ${response.data.defaultPassword}. User will be required to change password on next login.`);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post('/users', formData);
      toast.success(`User created successfully! Default password: ${response.data.defaultPassword}`);
      setShowAddModal(false);
      setFormData({
        username: '',
        displayName: '',
        role: 'USER',
        class: '',
        roll: '',
        dob: '',
        fatherName: '',
        motherName: '',
        classTeacherName: '',
      });
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const importUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('csv', csvFile);

    try {
      const response = await api.post('/users/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success(`Imported ${response.data.created} users successfully!`);
      setShowImportModal(false);
      setCsvFile(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to import users');
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and their permissions</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="btn-secondary"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </button>
          {currentUser?.role === 'SUPERADMIN' && (
            <button 
              onClick={() => setShowPasswords(!showPasswords)}
              className="btn-secondary"
            >
              {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showPasswords ? 'Hide' : 'Show'} Passwords
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Username</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Class</th>
                  <th className="text-left p-3">Created</th>
                  {currentUser?.role === 'SUPERADMIN' && showPasswords && (
                    <th className="text-left p-3">Password</th>
                  )}
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.displayName}</div>
                        {user.mustChangePassword && (
                          <span className="text-xs text-destructive">Must change password</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{user.username}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'SUPERADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">{user.class || '-'}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    {currentUser?.role === 'SUPERADMIN' && showPasswords && (
                      <td className="p-3">
                        <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {user.defaultPassword || 'N/A'}
                        </div>
                      </td>
                    )}
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => resetUserPassword(user.id)}
                          className="text-primary hover:text-primary/80"
                          title="Reset password"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-destructive hover:text-destructive/80"
                          title="Delete user"
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={addUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Display Name *</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="input w-full"
                  required
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Class</label>
                  <input
                    type="text"
                    value={formData.class}
                    onChange={(e) => setFormData({...formData, class: e.target.value})}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Roll</label>
                  <input
                    type="text"
                    value={formData.roll}
                    onChange={(e) => setFormData({...formData, roll: e.target.value})}
                    className="input w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Father's Name</label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                  className="input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Mother's Name</label>
                <input
                  type="text"
                  value={formData.motherName}
                  onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                  className="input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Class Teacher Name</label>
                <input
                  type="text"
                  value={formData.classTeacherName}
                  onChange={(e) => setFormData({...formData, classTeacherName: e.target.value})}
                  className="input w-full"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Import Users from CSV</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={importUsers} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">CSV File *</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="input w-full"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  CSV should have columns: class, roll, dob, displayName, fatherName, motherName, classTeacherName
                </p>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Importing...' : 'Import Users'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
