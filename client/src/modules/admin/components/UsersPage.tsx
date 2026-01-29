// Admin Users Management Page
// Premium user management with search, filters, and role management

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  PageTransition,
  FadeIn,
  Stagger,
  StaggerItem,
} from '@shared/components/ui/motion';
import { Button, IconButton } from '@shared/components/ui/Button';
import { Card, CardBody, StatCard } from '@shared/components/ui/Card';
import { Input, SearchInput, Select } from '@shared/components/ui/Input';
import { Badge, StatusBadge } from '@shared/components/ui/Badge';
import { Avatar, AvatarWithName } from '@shared/components/ui/Avatar';
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@shared/components/ui/Modal';
import { Table, Pagination } from '@shared/components/ui/Table';
import { SkeletonTable, InlineLoader } from '@shared/components/ui/Loading';
import { EmptyState } from '@shared/components/ui/EmptyState';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'batch_manager';
  status: 'active' | 'inactive' | 'suspended';
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
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  batch_manager: 'Batch Manager',
};

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    teachers: 0,
    students: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, roleFilter, statusFilter, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/v2/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v2/admin/users/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/v2/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleStatusToggle = async (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const response = await fetch(`/api/v2/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/v2/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        fetchUsers();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/v2/admin/users/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export users:', error);
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user: User) => (
        <AvatarWithName
          name={`${user.firstName} ${user.lastName}`}
          subtitle={user.email}
          src={user.avatar}
          size="sm"
        />
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <Badge variant={roleColors[user.role] as any}>
          {roleLabels[user.role]}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <StatusBadge
          status={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'danger' : 'warning'}
          label={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
        />
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (user: User) => (
        <div className="text-sm">
          {user.phone && (
            <div className="flex items-center gap-1 text-neutral-600">
              <Phone className="w-3.5 h-3.5" />
              {user.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user: User) => (
        <div className="text-sm text-neutral-600">
          {format(new Date(user.createdAt), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (user: User) => (
        <div className="flex items-center gap-1">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => setEditingUser(user)}
            title="Edit user"
          >
            <Edit2 className="w-4 h-4" />
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => handleStatusToggle(user)}
            title={user.status === 'active' ? 'Suspend user' : 'Activate user'}
          >
            {user.status === 'active' ? (
              <UserX className="w-4 h-4 text-warning-600" />
            ) : (
              <UserCheck className="w-4 h-4 text-success-600" />
            )}
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setUserToDelete(user);
              setShowDeleteConfirm(true);
            }}
            title="Delete user"
          >
            <Trash2 className="w-4 h-4 text-danger-600" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
              <p className="text-neutral-600 mt-1">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>
                Export
              </Button>
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                Add User
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Stats */}
        <Stagger className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StaggerItem>
            <StatCard
              title="Total Users"
              value={stats.total}
              icon={<Users className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Active"
              value={stats.active}
              icon={<UserCheck className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Admins"
              value={stats.admins}
              icon={<Shield className="w-5 h-5" />}
              color="danger"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Teachers"
              value={stats.teachers}
              icon={<Users className="w-5 h-5" />}
              color="primary"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              title="Students"
              value={stats.students}
              icon={<Users className="w-5 h-5" />}
              color="success"
            />
          </StaggerItem>
        </Stagger>

        {/* Filters */}
        <FadeIn delay={0.1}>
          <Card>
            <CardBody className="p-4">
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
                    className="w-40"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                    <option value="batch_manager">Batch Manager</option>
                  </Select>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-40"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </Select>
                  <IconButton variant="outline" onClick={fetchUsers} title="Refresh">
                    <RefreshCw className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            </CardBody>
          </Card>
        </FadeIn>

        {/* Users Table */}
        <FadeIn delay={0.2}>
          <Card>
            {loading ? (
              <SkeletonTable rows={5} columns={6} />
            ) : users.length === 0 ? (
              <EmptyState
                title="No users found"
                description={searchQuery ? 'Try adjusting your search or filters' : 'Add your first user to get started'}
                icon={<Users className="w-12 h-12" />}
                action={
                  <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
                    Add User
                  </Button>
                }
              />
            ) : (
              <>
                <Table
                  data={users}
                  columns={columns}
                  selectable
                  selectedIds={selectedUsers}
                  onSelectionChange={setSelectedUsers}
                />
                <div className="px-6 py-4 border-t border-neutral-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </Card>
        </FadeIn>

        {/* Edit User Modal */}
        <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} size="md">
          <ModalHeader onClose={() => setEditingUser(null)}>
            Edit User
          </ModalHeader>
          {editingUser && (
            <EditUserForm
              user={editingUser}
              onSave={() => {
                setEditingUser(null);
                fetchUsers();
              }}
              onCancel={() => setEditingUser(null)}
            />
          )}
        </Modal>

        {/* Add User Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} size="md">
          <ModalHeader onClose={() => setShowAddModal(false)}>
            Add New User
          </ModalHeader>
          <AddUserForm
            onSave={() => {
              setShowAddModal(false);
              fetchUsers();
              fetchStats();
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
        />
      </div>
    </PageTransition>
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
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/v2/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalBody>
        <div className="space-y-4">
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
          >
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="batch_manager">Batch Manager</option>
          </Select>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'student',
    sendInvite: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/v2/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalBody>
        <div className="space-y-4">
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
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="batch_manager">Batch Manager</option>
          </Select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.sendInvite}
              onChange={(e) => setFormData({ ...formData, sendInvite: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">Send invite email to user</span>
          </label>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Add User
        </Button>
      </ModalFooter>
    </form>
  );
}
