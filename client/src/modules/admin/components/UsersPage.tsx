// Admin Users Management Page
// User management with search, filters, and role management

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  Button,
  Badge,
  SearchInput,
  EmptyState,
  Spinner,
  Skeleton,
  Pagination,
  Input,
  Select,
} from '@shared/components/ui';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@shared/components/ui/Modal';
import { fadeInUp } from '@shared/components/ui/motion';
import clsx from 'clsx';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'batch_manager' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
  avatar?: string;
}

const roleColors: Record<string, string> = {
  admin: 'danger',
  teacher: 'primary',
  student: 'success',
  parent: 'info',
  batch_manager: 'warning',
  user: 'default',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  batch_manager: 'Batch Manager',
  user: 'User',
};

export function UsersPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    teachers: 0,
    students: 0,
  });

  useEffect(() => {
    fetchUsers(true);
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers(false);
  }, [currentPage, roleFilter, statusFilter, searchQuery]);

  const fetchUsers = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' ? 'true' : 'false' }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`${API_URL}/v2/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        const items = data.data?.items || data.data || [];
        setUsers(Array.isArray(items) ? items.map((u: any) => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name || '',
          lastName: u.last_name || '',
          phone: u.phone,
          role: u.role || 'user',
          status: u.is_active ? 'active' : 'inactive',
          createdAt: u.created_at,
          lastLoginAt: u.last_login_at,
          avatar: u.avatar_url,
        })) : []);
        setTotalPages(data.data?.totalPages || 1);
        setTotalItems(data.data?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats({
          total: data.data.users || 0,
          active: data.data.users || 0,
          admins: data.data.admins || 0,
          teachers: data.data.teachers || 0,
          students: data.data.students || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleStatusToggle = async (user: User) => {
    const newIsActive = user.status !== 'active';
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newIsActive }),
      });

      if (response.ok) {
        fetchUsers(false);
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUserToDelete(null);
        fetchUsers(false);
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = () => {
    fetchUsers(false);
    fetchStats();
  };

  const getRoleBadge = (role: string) => {
    return (
      <Badge variant={roleColors[role] as any} size="sm">
        {roleLabels[role] || role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-600 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.admins}</p>
              <p className="text-sm text-slate-500">Admins</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.teachers}</p>
              <p className="text-sm text-slate-500">Teachers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.students}</p>
              <p className="text-sm text-slate-500">Students</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'user', label: 'User (Pending)' },
                { value: 'admin', label: 'Admin' },
                { value: 'teacher', label: 'Teacher' },
                { value: 'student', label: 'Student' },
                { value: 'parent', label: 'Parent' },
                { value: 'batch_manager', label: 'Batch Manager' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Users List */}
      <Card>
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description={searchQuery ? 'Try adjusting your search or filters' : 'Add your first user to get started'}
            icon={<Users className="w-12 h-12" />}
            action={{
              label: 'Add User',
              onClick: () => setShowAddModal(true),
            }}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => {
              const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Unknown User';
              return (
                <motion.div
                  key={user.id}
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                      {fullName.charAt(0).toUpperCase()}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-slate-900">{fullName}</p>
                        {getRoleBadge(user.role)}
                        <Badge
                          variant={user.status === 'active' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {user.phone}
                          </span>
                        )}
                        {user.createdAt && (
                          <span className="text-slate-400">
                            Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Edit"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                        onClick={() => handleStatusToggle(user)}
                        className={user.status === 'active' ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-success-600 hover:text-success-700 hover:bg-success-50'}
                      >
                        {user.status === 'active' ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete"
                        onClick={() => setUserToDelete(user)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              pageSize={10}
            />
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal isOpen={true} onClose={() => setEditingUser(null)} size="md">
          <ModalHeader title="Edit User" onClose={() => setEditingUser(null)} />
          <EditUserForm
            user={editingUser}
            onSave={() => {
              setEditingUser(null);
              fetchUsers(false);
            }}
            onCancel={() => setEditingUser(null)}
          />
        </Modal>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <Modal isOpen={true} onClose={() => setShowAddModal(false)} size="md">
          <ModalHeader title="Add New User" onClose={() => setShowAddModal(false)} />
          <AddUserForm
            onSave={() => {
              setShowAddModal(false);
              fetchUsers(false);
              fetchStats();
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setUserToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 bg-rose-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Delete User</h2>
                  <p className="text-sm text-slate-500">This action cannot be undone</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-600">
                  Are you sure you want to delete <span className="font-semibold">{userToDelete.firstName} {userToDelete.lastName}</span>?
                  This will deactivate their account.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setUserToDelete(null)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleting}
                  leftIcon={deleting ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                >
                  {deleting ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// Edit User Form Component
function EditUserForm({
  user,
  onSave,
  onCancel,
}: {
  user: User;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onSave();
      } else {
        setError(data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalBody>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            options={[
              { value: 'user', label: 'User (Pending)' },
              { value: 'admin', label: 'Admin' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'student', label: 'Student' },
              { value: 'parent', label: 'Parent' },
              { value: 'batch_manager', label: 'Batch Manager' },
            ]}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={saving}>
          Save Changes
        </Button>
      </ModalFooter>
    </form>
  );
}

// Add User Form Component
function AddUserForm({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'student',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onSave();
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      setError('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalBody>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'user', label: 'User (Pending)' },
              { value: 'admin', label: 'Admin' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'student', label: 'Student' },
              { value: 'parent', label: 'Parent' },
              { value: 'batch_manager', label: 'Batch Manager' },
            ]}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={saving}>
          Add User
        </Button>
      </ModalFooter>
    </form>
  );
}

export default UsersPage;
