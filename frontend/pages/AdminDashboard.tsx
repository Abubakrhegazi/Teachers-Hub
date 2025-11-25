import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User, UserType, Chapter, Group, AuditLogEntry, MonitorOverview } from '../types';
import { Card } from '../components/ui/Card';
import { apiGet } from '../api';
// FIX: Removed local icon declarations that conflicted with these imports.
import { Plus, Edit, Trash2 } from 'lucide-react';

type UserFormPayload = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  type: UserType;
  password?: string;
  groupIds: string[];
  studentId?: string | null;
};

interface UserModalProps {
  user: User | null;
  groups: Group[];
  students: User[];
  onClose: () => void;
  onSubmit: (payload: UserFormPayload) => Promise<void>;
}

const UserModal: React.FC<UserModalProps> = ({ user, groups, students, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    type: user?.type ?? UserType.Student,
    password: "",
    confirmPassword: "",
    groupIds: user?.groups?.map((group) => group.id) ?? [],
    studentId: user?.studentId ?? ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === "type" && value !== UserType.Parent) {
        return { ...prev, [name]: value as UserType, studentId: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const toggleGroup = (groupId: string) => {
    setFormData(prev => {
      const exists = prev.groupIds.includes(groupId);
      return {
        ...prev,
        groupIds: exists ? prev.groupIds.filter(id => id !== groupId) : [...prev.groupIds, groupId]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!user && !formData.password) {
        setError("Password is required for new users");
        setSubmitting(false);
        return;
      }
      if (formData.password && formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setSubmitting(false);
        return;
      }
      if (formData.type === UserType.Parent && !formData.studentId) {
        setError("Parents must be linked to a student");
        setSubmitting(false);
        return;
      }

      await onSubmit({
        id: user?.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        type: formData.type,
        password: formData.password || undefined,
        groupIds: formData.groupIds,
        studentId: formData.type === UserType.Parent ? formData.studentId || null : undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{user ? 'Edit User' : 'Add New User'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Full Name</span>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Email Address</span>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">Phone Number</span>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-gray-700">User Role</span>
              <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                {Object.values(UserType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            {!user && (
              <>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-gray-700">Password</span>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-gray-700">Confirm Password</span>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                </label>
              </>
            )}
            {user && (
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">New Password (optional)</span>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
              </label>
            )}

            {formData.type === UserType.Parent && (
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">Link to Student</span>
                <select name="studentId" value={formData.studentId} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                  <option value="">Select student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.name} ({student.email})</option>
                  ))}
                </select>
              </label>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Groups</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {groups.map(group => {
                  const selected = formData.groupIds.includes(group.id);
                  return (
                    <label
                      key={group.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition ${selected ? "border-primary-500 bg-primary-50" : "border-gray-200"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleGroup(group.id)}
                      />
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />
                        {group.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">
              {submitting ? 'Saving...' : user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Chapter Modal for adding/editing chapters
interface ChapterModalProps {
  chapter: Chapter | null;
  onClose: () => void;
  onSubmit: (chapter: Omit<Chapter, 'id'> | Chapter) => void;
}

const ChapterModal: React.FC<ChapterModalProps> = ({ chapter, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: chapter?.title || '',
    description: chapter?.description || '',
    status: chapter?.status || 'pending',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as Chapter['status'] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (chapter) {
        await onSubmit({ ...chapter, ...formData });
      } else {
        await onSubmit(formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save chapter. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{chapter ? 'Edit Chapter' : 'Add New Chapter'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"></textarea>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">
              {submitting ? 'Saving...' : chapter ? 'Save Changes' : 'Create Chapter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    token,
    users,
    addUser,
    updateUser,
    deleteUser,
    chapters,
    addChapter,
    updateChapter,
    deleteChapter,
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
    assignUserToGroup,
    removeUserFromGroup,
    refreshAll
  } = useAppContext();

  const studentOptions = useMemo(() => users.filter(user => user.type === UserType.Student), [users]);

  // State for User Management
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", color: "#2563eb" });
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditCursor, setAuditCursor] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [monitorData, setMonitorData] = useState<MonitorOverview | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleGroupFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!groupForm.name.trim()) return;
    if (editingGroup) {
      await updateGroup(editingGroup.id, {
        name: groupForm.name.trim(),
        color: groupForm.color
      });
    } else {
      await createGroup({ name: groupForm.name.trim(), color: groupForm.color });
    }
    setGroupForm({ name: "", color: "#2563eb" });
    setEditingGroup(null);
  };

  const handleCancelGroupEdit = () => {
    setEditingGroup(null);
    setGroupForm({ name: "", color: "#2563eb" });
  };

  const handleUserFormSubmit = async (payload: UserFormPayload) => {
    if (payload.id) {
      await updateUser({
        id: payload.id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        type: payload.type,
        studentId: payload.studentId ?? undefined,
        password: payload.password
      });

      const existing = users.find(u => u.id === payload.id);
      const existingGroupIds = existing?.groups?.map(group => group.id) ?? [];
      const desiredGroupIds = payload.groupIds;
      const toAdd = desiredGroupIds.filter(id => !existingGroupIds.includes(id));
      const toRemove = existingGroupIds.filter(id => !desiredGroupIds.includes(id));

      for (const groupId of toAdd) {
        await assignUserToGroup(groupId, payload.id);
      }
      for (const groupId of toRemove) {
        await removeUserFromGroup(groupId, payload.id);
      }
    } else {
      const selectedGroups = groups.filter(group => payload.groupIds.includes(group.id));
      await addUser({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        type: payload.type,
        studentId: payload.studentId ?? undefined,
        groups: selectedGroups
      });
    }
    await refreshAll();
    setIsUserModalOpen(false);
  };

  // State for Roadmap Management
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  const openAddChapterModal = () => {
    setEditingChapter(null);
    setIsChapterModalOpen(true);
  };

  const openEditChapterModal = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setIsChapterModalOpen(true);
  };

  const handleChapterFormSubmit = async (chapter: Omit<Chapter, 'id'> | Chapter) => {
    if ('id' in chapter) {
      await updateChapter(chapter);
    } else {
      await addChapter(chapter);
    }
    setIsChapterModalOpen(false);
  };

  const getStatusBadge = (status: Chapter['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = useCallback((value?: string | null) => {
    if (!value) return "Never";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleString();
  }, []);

  const formatNumber = useCallback((value: number, digits = 0) => {
    const options: Intl.NumberFormatOptions = {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    };
    return Number.isFinite(value) ? value.toLocaleString(undefined, options) : "0";
  }, []);

  const formatChanges = useCallback((changes: unknown) => {
    if (changes === null || changes === undefined) return "—";
    if (typeof changes === "string") {
      return changes.length > 120 ? `${changes.slice(0, 117)}...` : changes;
    }
    try {
      const payload = JSON.stringify(changes);
      return payload.length > 120 ? `${payload.slice(0, 117)}...` : payload;
    } catch (error) {
      console.warn("Unable to serialise audit log changes", error);
      return "[unavailable]";
    }
  }, []);

  const loadAuditLogs = useCallback(
    async (cursorValue?: string, append = false) => {
      if (!token) return;
      setLogsLoading(true);
      setLogsError(null);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (cursorValue) params.set("cursor", cursorValue);
        const response = await apiGet<{ items: AuditLogEntry[]; nextCursor: string | null }>(
          `/admin/audit-logs?${params.toString()}`,
          token
        );
        setAuditLogs(prev => (append ? [...prev, ...response.items] : response.items));
        setAuditCursor(response.nextCursor);
      } catch (error) {
        console.error("Failed to load audit logs", error);
        setLogsError(error instanceof Error ? error.message : "Failed to load audit logs");
        if (!append) {
          setAuditLogs([]);
          setAuditCursor(null);
        }
      } finally {
        setLogsLoading(false);
      }
    },
    [token]
  );

  const refreshLogs = useCallback(() => loadAuditLogs(undefined, false), [loadAuditLogs]);

  const handleLoadMoreLogs = useCallback(() => {
    if (auditCursor) {
      loadAuditLogs(auditCursor, true);
    }
  }, [auditCursor, loadAuditLogs]);

  const refreshMonitor = useCallback(async () => {
    if (!token) return;
    setMonitorLoading(true);
    setMonitorError(null);
    try {
      const data = await apiGet<MonitorOverview>("/admin/monitor/users", token);
      setMonitorData(data);
    } catch (error) {
      console.error("Failed to load monitor overview", error);
      setMonitorError(error instanceof Error ? error.message : "Failed to load monitor data");
      setMonitorData(null);
    } finally {
      setMonitorLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (currentUser?.type !== UserType.Admin || !token) return;
    refreshMonitor();
    loadAuditLogs();
  }, [currentUser?.type, token, refreshMonitor, loadAuditLogs]);

  return (
    <div className="space-y-12">
      {/* User Management Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white-800">User Management</h1>
          <button
            onClick={openAddModal}
            className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" /> Add User
          </button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">
                      <div className="font-semibold text-gray-800">{user.name}</div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>Last login: {formatDateTime(user.lastLoginAt ?? null)}</span>
                        <span>Logins: {formatNumber(user.loginCount ?? 0)}</span>
                        {user.failedLoginAttempts && user.failedLoginAttempts > 0 && (
                          <span className="text-red-600">Failed: {user.failedLoginAttempts}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-white-600">{user.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                        {user.type}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100">
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete ${user.name}?`)) {
                            await deleteUser(user.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        {isUserModalOpen && (
          <UserModal
            user={editingUser}
            groups={groups}
            students={studentOptions}
            onClose={() => setIsUserModalOpen(false)}
            onSubmit={handleUserFormSubmit}
          />
        )}
      </div>

      <hr className="border-gray-200" />

      {currentUser?.type === UserType.Admin && (
        <>
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white-800">System Monitor</h2>
                <p className="text-sm text-gray-500">Track sign-ins and audit noise over the past 24 hours.</p>
              </div>
              <button
                type="button"
                onClick={refreshMonitor}
                disabled={monitorLoading}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-white-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {monitorLoading ? "Refreshing..." : "Refresh monitor"}
              </button>
            </div>
            <Card>
              {monitorLoading ? (
                <div className="p-6 text-sm text-gray-500">Loading monitor data…</div>
              ) : monitorError ? (
                <div className="p-6 text-sm text-red-600">{monitorError}</div>
              ) : monitorData ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase text-gray-500">Active users</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-800">
                        {monitorData.stats.activeUsers.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Total registered: {monitorData.stats.totalUsers.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase text-gray-500">Sign-ins (24h)</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-800">
                        {monitorData.stats.loginsLast24h.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Avg / user: {formatNumber(monitorData.stats.avgLoginsPerUser, 1)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase text-gray-500">Audit entries (24h)</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-800">
                        {monitorData.stats.auditLogsLast24h.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Most frequent actions below</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase text-gray-500">Role breakdown</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-white-600">
                        {Object.entries(monitorData.stats.roleBreakdown).map(([role, count]) => (
                          <span key={role} className="rounded-full bg-white px-2.5 py-1 font-semibold shadow-sm">
                            {role}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-white-600">Recent sign-ins</h3>
                      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                        {monitorData.recentLogins.length ? (
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              <tr>
                                <th className="p-3">User</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Last login</th>
                                <th className="p-3 text-right">Logins</th>
                                <th className="p-3 text-right">Failed</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {monitorData.recentLogins.map(entry => (
                                <tr key={entry.id}>
                                  <td className="p-3">
                                    <div className="font-medium text-gray-800">{entry.name}</div>
                                    <div className="text-xs text-gray-500">{entry.email}</div>
                                  </td>
                                  <td className="p-3 text-sm text-white-600">{entry.type}</td>
                                  <td className="p-3 text-sm text-white-600">{formatDateTime(entry.lastLoginAt)}</td>
                                  <td className="p-3 text-right text-sm text-gray-700">
                                    {formatNumber(entry.loginCount ?? 0)}
                                  </td>
                                  <td className="p-3 text-right text-sm text-gray-700">
                                    {entry.failedLoginAttempts ?? 0}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="p-4 text-sm text-gray-500">No sign-ins recorded yet.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-white-600">
                        Accounts with high failures
                      </h3>
                      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                        {monitorData.highRiskUsers.length ? (
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              <tr>
                                <th className="p-3">User</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Last login</th>
                                <th className="p-3 text-right">Logins</th>
                                <th className="p-3 text-right">Failed</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {monitorData.highRiskUsers.map(entry => (
                                <tr key={entry.id} className="bg-red-50/60">
                                  <td className="p-3">
                                    <div className="font-medium text-gray-800">{entry.name}</div>
                                    <div className="text-xs text-gray-500">{entry.email}</div>
                                  </td>
                                  <td className="p-3 text-sm text-white-600">{entry.type}</td>
                                  <td className="p-3 text-sm text-white-600">{formatDateTime(entry.lastLoginAt)}</td>
                                  <td className="p-3 text-right text-sm text-gray-700">
                                    {formatNumber(entry.loginCount ?? 0)}
                                  </td>
                                  <td className="p-3 text-right text-sm font-semibold text-red-600">
                                    {entry.failedLoginAttempts ?? 0}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="p-4 text-sm text-gray-500">No accounts are currently flagged.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-white-600">
                      Most common actions (24h)
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(monitorData.auditActionsLast24h).length ? (
                        Object.entries(monitorData.auditActionsLast24h).map(([action, count]) => (
                          <span
                            key={action}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                          >
                            <span className="uppercase text-gray-500">{action}</span>
                            <span>{count}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No audit activity recorded.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-sm text-gray-500">No monitoring data captured yet.</div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white-800">Audit trail</h2>
                <p className="text-sm text-gray-500">Review the most recent backend actions.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={refreshLogs}
                  disabled={logsLoading}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-white-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {logsLoading && !auditLogs.length ? "Loading…" : "Refresh logs"}
                </button>
                <button
                  type="button"
                  onClick={handleLoadMoreLogs}
                  disabled={logsLoading || !auditCursor}
                  className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Load more
                </button>
              </div>
            </div>
            <Card>
              {logsError && (
                <div className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700">{logsError}</div>
              )}
              <div className="overflow-x-auto">
                {auditLogs.length ? (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Actor</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Target</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {auditLogs.map(entry => (
                        <tr key={entry.id} className="align-top">
                          <td className="whitespace-nowrap p-3 text-gray-500">{formatDateTime(entry.createdAt)}</td>
                          <td className="p-3">
                            {entry.actor ? (
                              <div>
                                <div className="font-medium text-gray-800">{entry.actor.name}</div>
                                <div className="text-xs text-gray-500">{entry.actor.email}</div>
                                <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-gray-500">
                                  {entry.actor.type}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">System</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap p-3 font-semibold uppercase tracking-wide text-gray-700">
                            {entry.action}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-gray-800">{entry.entity}</div>
                            <div className="text-xs text-gray-500">{entry.entityId ?? "—"}</div>
                          </td>
                          <td className="p-3 text-xs text-white-600">{formatChanges(entry.changes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-5 text-sm text-gray-500">
                    {logsLoading ? "Loading audit logs…" : "No activity recorded yet."}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                <span className="text-gray-500">
                  {logsLoading && auditLogs.length
                    ? "Loading more results…"
                    : auditCursor
                      ? "More results available"
                      : "Showing latest entries"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={refreshLogs}
                    disabled={logsLoading}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-white-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadMoreLogs}
                    disabled={logsLoading || !auditCursor}
                    className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Load more
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <hr className="border-gray-200" />
        </>
      )}

      {/* Group Management */}
      <div className="space-y-6">
        <Card>
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Group Management</h2>
                <p className="text-sm text-gray-500">Organise users by campus, cohort, or school. Colors help distinguish groups at a glance.</p>
              </div>
              {editingGroup && (
                <button
                  type="button"
                  onClick={handleCancelGroupEdit}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-white-600 transition hover:bg-gray-100"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <form onSubmit={handleGroupFormSubmit} className="grid gap-4 sm:grid-cols-[1.5fr,1fr,auto]">
              <input
                type="text"
                name="groupName"
                value={groupForm.name}
                onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Group name (e.g., Downtown Campus)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                required
              />
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <span className="text-sm font-medium text-white-600">Color</span>
                <input
                  type="color"
                  value={groupForm.color}
                  onChange={(e) => setGroupForm((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-8 w-12 cursor-pointer rounded border border-gray-300"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
              >
                {editingGroup ? "Update Group" : "Create Group"}
              </button>
            </form>

            <div className="grid gap-4">
              {groups.length === 0 && (
                <p className="text-sm text-gray-500">No groups yet. Create one to get started.</p>
              )}
              {groups.map((group) => {
                const memberCount = group.members?.length ?? 0;
                return (
                  <div key={group.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: group.color }} />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{group.name}</p>
                          <p className="text-xs text-gray-500">{memberCount} member{memberCount === 1 ? "" : "s"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGroup(group);
                            setGroupForm({ name: group.name, color: group.color });
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Delete group "${group.name}"?`)) {
                              await deleteGroup(group.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                    {memberCount > 0 && (
                      <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
                        <span className="font-semibold text-white-600">Members:</span>{" "}
                        {group.members?.map((member, index) => (
                          <span key={member.id} className="inline-flex items-center gap-1 pr-2">
                            <span>{member.name}</span>
                            <span className="uppercase text-[0.65rem] font-semibold text-gray-400">{member.type}</span>
                            {index < memberCount - 1 && <span className="text-gray-300">•</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Roadmap Management Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white-800">Roadmap Management</h1>
          <button
            onClick={openAddChapterModal}
            className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Plus size={20} className="mr-2" /> Add Chapter
          </button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b">
                <tr>
                  <th className="p-4 text-gray-800">Chapter Details</th>
                  <th className="p-4 text-gray-800">Status</th>
                  <th className="p-4 text-right text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map(chapter => (
                  <tr key={chapter.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">
                      {chapter.title}
                      <p className="text-sm text-gray-500 font-normal max-w-md">{chapter.description}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadge(chapter.status)}`}
                      >
                        {chapter.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEditChapterModal(chapter)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete chapter "${chapter.title}"?`)) {
                            await deleteChapter(chapter.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {isChapterModalOpen && (
          <ChapterModal
            chapter={editingChapter}
            onClose={() => setIsChapterModalOpen(false)}
            onSubmit={handleChapterFormSubmit}
          />
        )}
      </div>
    </div>
  );
};
