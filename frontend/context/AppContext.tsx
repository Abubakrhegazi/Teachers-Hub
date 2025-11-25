import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../api";
import { User, Report, Homework, Chapter, Group } from "../types";

type CreateUserInput = Omit<User, "id">;
type UpdateUserInput = User & { password?: string };
type UpdateProfileInput = Partial<Omit<UpdateUserInput, "id">>;
type CreateChapterInput = Omit<Chapter, "id">;
type UpdateChapterInput = Chapter;
type CreateReportInput = Omit<Report, "id">;
type CreateHomeworkInput = Omit<Homework, "id">;

interface AppContextValue {
  currentUser: User | null;
  token: string | null;
  initializing: boolean;
  loading: boolean;
  users: User[];
  groups: Group[];
  chapters: Chapter[];
  reports: Report[];
  homeworks: Homework[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAll: () => Promise<boolean>;
  addUser: (input: CreateUserInput) => Promise<User | null>;
  updateUser: (input: UpdateUserInput) => Promise<User | null>;
  deleteUser: (userId: string) => Promise<boolean>;
  updateCurrentUser: (input: UpdateProfileInput) => Promise<User | null>;
  addChapter: (input: CreateChapterInput) => Promise<Chapter | null>;
  updateChapter: (input: UpdateChapterInput) => Promise<Chapter | null>;
  deleteChapter: (chapterId: string) => Promise<boolean>;
  addReport: (input: CreateReportInput) => Promise<Report | null>;
  deleteReport: (reportId: string) => Promise<boolean>;
  addHomework: (input: CreateHomeworkInput) => Promise<Homework | null>;
  deleteHomework: (homeworkId: string) => Promise<boolean>;
  addHomeworkComment: (
    homeworkId: string,
    comment: NonNullable<Homework["comment"]>
  ) => Promise<Homework | null>;
  createGroup: (input: { name: string; color: string }) => Promise<Group | null>;
  updateGroup: (id: string, input: { name?: string; color?: string }) => Promise<Group | null>;
  deleteGroup: (id: string) => Promise<boolean>;
  assignUserToGroup: (groupId: string, userId: string, role?: string) => Promise<void>;
  removeUserFromGroup: (groupId: string, userId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const statusToClient = (value: string | null | undefined): Chapter["status"] => {
  const sanitized = (value ?? "pending").replace(/_/g, "-");
  const allowed: Chapter["status"][] = ["completed", "in-progress", "pending"];
  return allowed.includes(sanitized as Chapter["status"])
    ? (sanitized as Chapter["status"])
    : "pending";
};

const statusToApi = (value: Chapter["status"]) => value.replace(/-/g, "_");

const toIsoString = (value: any) => {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  return new Date(value).toISOString();
};

const normalizeUser = (user: any): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  type: user.type,
  studentId: user.studentId ?? undefined,
  lastLoginAt: user.lastLoginAt
    ? toIsoString(user.lastLoginAt)
    : user.last_login_at
      ? toIsoString(user.last_login_at)
      : null,
  loginCount: user.loginCount ?? user.login_count ?? 0,
  failedLoginAttempts: user.failedLoginAttempts ?? user.failed_login_attempts ?? 0,
  groups:
    user.groups?.map((membership: any) => {
      const group = membership.group ?? membership;
      return {
        id: group.id,
        name: group.name,
        color: group.color ?? "#2563eb",
        role: membership.role ?? membership.groupRole ?? "Member"
      };
    }) ?? []
});

const normalizeChapter = (chapter: any): Chapter => ({
  id: chapter.id,
  title: chapter.title,
  description: chapter.description ?? "",
  status: statusToClient(chapter.status)
});

const normalizeReport = (report: any): Report => ({
  id: report.id,
  studentId: report.studentId,
  teacherId: report.teacherId,
  date: toIsoString(report.date),
  type: report.type,
  content: report.content
});

const normalizeHomework = (hw: any): Homework => {
  let comment: Homework["comment"];
  const type = hw.comment_type ?? hw.comment?.type;
  const teacherId = hw.comment_teacherId ?? hw.comment?.teacherId;
  const content = hw.comment_content ?? hw.comment?.content;

  if (type && teacherId && content) {
    comment = {
      teacherId,
      type,
      content
    };
  }

  return {
    id: hw.id,
    studentId: hw.studentId,
    chapter: hw.chapter,
    content: hw.content,
    submissionDate: toIsoString(hw.submissionDate),
    comment
  };
};

const extractReportsFromDashboard = (payload: any): Report[] => {
  const collection = payload?.reports ?? payload?.reportsAuthored ?? [];
  if (!Array.isArray(collection)) return [];
  return collection.map(normalizeReport);
};

const extractHomeworkFromDashboard = (payload: any): Homework[] => {
  const collection =
    payload?.homework ?? payload?.recentHomework ?? payload?.homeworks ?? [];
  if (!Array.isArray(collection)) return [];
  return collection.map(normalizeHomework);
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token")
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initializing, setInitializing] = useState<boolean>(!!token);
  const [hasBootstrapped, setHasBootstrapped] = useState<boolean>(false);

  const resetState = useCallback(() => {
    setCurrentUser(null);
    setUsers([]);
    setGroups([]);
    setChapters([]);
    setReports([]);
    setHomeworks([]);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("auth_token");
    setToken(null);
    resetState();
    setLoading(false);
    setHasBootstrapped(false);
    setInitializing(false);
  }, [resetState]);

  const ensureToken = () => {
    if (!token) throw new Error("Not authenticated");
    return token;
  };

  const fetchUsers = useCallback(
    async (authToken: string): Promise<User[]> => {
      const collected: User[] = [];
      let cursor: string | null | undefined = undefined;
      let more = true;

      while (more) {
        const path = cursor ? `/users?cursor=${cursor}` : "/users";
        const response = await apiGet<any>(path, authToken);
        const list = Array.isArray(response)
          ? response
          : response?.items ?? [];
        collected.push(...list.map(normalizeUser));
        cursor = response?.nextCursor;
        more = Boolean(cursor);
      }

      return collected;
    },
    []
  );

  const fetchGroups = useCallback(
    async (authToken: string): Promise<Group[]> => {
      const response = await apiGet<any>("/groups", authToken);
      const items = Array.isArray(response?.items) ? response.items : [];
      return items.map((group: any) => ({
        id: group.id,
        name: group.name,
        color: group.color,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        members: Array.isArray(group.members)
          ? group.members.map((member: any) => ({
              id: member.id,
              name: member.name,
              email: member.email,
              type: member.type,
              role: member.role
            }))
          : []
      }));
    },
    []
  );

  const fetchChapters = useCallback(
    async (authToken: string): Promise<Chapter[]> => {
      const response = await apiGet<any[]>("/chapters", authToken);
      if (!Array.isArray(response)) return [];
      return response.map(normalizeChapter);
    },
    []
  );

  const loadAll = useCallback(
    async (authToken: string, overrideUser?: User | null): Promise<boolean> => {
      setLoading(true);
      try {
        const [dashboard, fetchedUsers, fetchedChapters] = await Promise.all([
          apiGet<any>("/dashboard", authToken),
          fetchUsers(authToken),
          fetchChapters(authToken)
        ]);

        const rawUser = dashboard?.user ?? overrideUser ?? currentUser ?? null;
        if (!rawUser) {
          throw new Error("Unable to determine current user");
        }

        const normalizedUser = normalizeUser(rawUser);

        if (normalizedUser.type === "Admin") {
          const fetchedGroups = await fetchGroups(authToken);
          setGroups(fetchedGroups);
        } else {
          setGroups(
            normalizedUser.groups?.map(group => ({
              id: group.id,
              name: group.name,
              color: group.color
            })) ?? []
          );
        }

        setCurrentUser(normalizedUser);
        setUsers(fetchedUsers);
        setChapters(fetchedChapters);
        setReports(extractReportsFromDashboard(dashboard));
        setHomeworks(extractHomeworkFromDashboard(dashboard));
        setHasBootstrapped(true);
        return true;
      } catch (error) {
        console.error("Failed to load data", error);
        clearSession();
        return false;
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    },
    [clearSession, currentUser, fetchChapters, fetchUsers]
  );

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }
    if (hasBootstrapped) return;
    loadAll(token).catch((error) => console.error(error));
  }, [token, hasBootstrapped, loadAll]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const response = await apiPost<{ token: string; user: User }>(
          "/auth/login",
          { email, password }
        );
        localStorage.setItem("auth_token", response.token);
        setToken(response.token);
        const normalized = normalizeUser(response.user);
        const success = await loadAll(response.token, normalized);
        if (!success) return false;
        return true;
      } catch (error) {
        console.error("Login failed", error);
        clearSession();
        return false;
      }
    },
    [clearSession, loadAll]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const refreshAll = useCallback(async (): Promise<boolean> => {
    const authToken = token;
    if (!authToken) return false;
    return loadAll(authToken);
  }, [token, loadAll]);

  const addUser = useCallback(
    async (input: CreateUserInput): Promise<User | null> => {
      try {
        const authToken = ensureToken();
        const payload = {
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          password: input.password ?? "password123",
          type: input.type,
          studentId: input.studentId ?? null,
          groupIds: input.groups?.map(group => group.id) ?? [],
        };
        const created = await apiPost<any>("/users", payload, authToken);
        const normalized = normalizeUser(created);
        setUsers((prev) => [...prev, normalized]);
        return normalized;
      } catch (error) {
        console.error("Failed to create user", error);
        throw error;
      }
    },
    [token]
  );

  const updateUser = useCallback(
    async (input: UpdateUserInput): Promise<User | null> => {
      try {
        const authToken = ensureToken();
        const payload: Record<string, unknown> = {
          name: input.name,
          email: input.email,
          type: input.type,
          studentId: input.studentId ?? null
        };
        if (input.password && input.password.trim()) {
          payload.password = input.password;
        }
        const updated = await apiPut<any>(
          `/users/${input.id}`,
          payload,
          authToken
        );
        const normalized = normalizeUser(updated);
        setUsers((prev) =>
          prev.map((user) => (user.id === normalized.id ? normalized : user))
        );
        setCurrentUser((prev) => (prev && prev.id === normalized.id ? normalized : prev));
        return normalized;
      } catch (error) {
        console.error("Failed to update user", error);
        throw error;
      }
    },
    [token]
  );

  const updateCurrentUser = useCallback(
    async (input: UpdateProfileInput): Promise<User | null> => {
      if (!currentUser) throw new Error("No authenticated user");
      const updated = await updateUser({ ...currentUser, ...input });
      if (updated) {
        setCurrentUser(updated);
      }
      return updated;
    },
    [currentUser, updateUser]
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<boolean> => {
      try {
        const authToken = ensureToken();
        await apiDelete(`/users/${userId}`, authToken);
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        return true;
      } catch (error) {
        console.error("Failed to delete user", error);
        throw error;
      }
    },
    [token]
  );

  const addChapter = useCallback(
    async (input: CreateChapterInput): Promise<Chapter | null> => {
      try {
        const authToken = ensureToken();
        const body = {
          title: input.title,
          description: input.description,
          status: statusToApi(input.status),
          orderIndex: chapters.length
        };
        const created = await apiPost<any>("/chapters", body, authToken);
        const normalized = normalizeChapter(created);
        setChapters((prev) => [...prev, normalized]);
        return normalized;
      } catch (error) {
        console.error("Failed to create chapter", error);
        throw error;
      }
    },
    [chapters.length, token]
  );

  const updateChapter = useCallback(
    async (input: UpdateChapterInput): Promise<Chapter | null> => {
      try {
        const authToken = ensureToken();
        const body = {
          title: input.title,
          description: input.description,
          status: statusToApi(input.status)
        };
        const updated = await apiPut<any>(
          `/chapters/${input.id}`,
          body,
          authToken
        );
        const normalized = normalizeChapter(updated);
        setChapters((prev) =>
          prev.map((chapter) =>
            chapter.id === normalized.id ? normalized : chapter
          )
        );
        return normalized;
      } catch (error) {
        console.error("Failed to update chapter", error);
        throw error;
      }
    },
    [token]
  );

  const deleteChapter = useCallback(
    async (chapterId: string): Promise<boolean> => {
      try {
        const authToken = ensureToken();
        await apiDelete(`/chapters/${chapterId}`, authToken);
        setChapters((prev) => prev.filter((chapter) => chapter.id !== chapterId));
        return true;
      } catch (error) {
        console.error("Failed to delete chapter", error);
        throw error;
      }
    },
    [token]
  );

  const addReport = useCallback(
    async (input: CreateReportInput): Promise<Report | null> => {
      try {
        const authToken = ensureToken();
        const created = await apiPost<any>(
          "/reports",
          {
            studentId: input.studentId,
            date: input.date,
            type: input.type,
            content: input.content
          },
          authToken
        );
        const normalized = normalizeReport(created);
        setReports((prev) => [...prev, normalized]);
        return normalized;
      } catch (error) {
        console.error("Failed to create report", error);
        throw error;
      }
    },
    [token]
  );

  const deleteReport = useCallback(
    async (reportId: string): Promise<boolean> => {
      try {
        const authToken = ensureToken();
        await apiDelete(`/reports/${reportId}`, authToken);
        setReports((prev) => prev.filter((report) => report.id !== reportId));
        return true;
      } catch (error) {
        console.error("Failed to delete report", error);
        throw error;
      }
    },
    [token]
  );
  const addHomework = useCallback(
  async (input: CreateHomeworkInput): Promise<Homework | null> => {
    try {
      const authToken = ensureToken();
      const body = {
        chapter: input.chapter,
        content: input.content,
        submissionDate: input.submissionDate,
      };
      const created = await apiPost<any>("/homework", body, authToken);
      const normalized = normalizeHomework(created);
      setHomeworks((prev) => [normalized, ...prev]);
      return normalized;
    } catch (error) {
      console.error("Failed to submit homework", error);
      throw error;
    }
  },
  [token]
);
    const deleteHomework = useCallback(
  async (homeworkId: string): Promise<boolean> => {
    try {
      const authToken = ensureToken();
      await apiDelete(`/homework/${homeworkId}`, authToken);
      setHomeworks((prev) =>
        prev.filter((hw) => hw.id !== homeworkId)
      );
      return true;
    } catch (error) {
      console.error("Failed to delete homework", error);
      throw error;
    }
  },
  [token]
);

    const addHomeworkComment = useCallback(
    async (
      homeworkId: string,
      comment: NonNullable<Homework["comment"]>
    ): Promise<Homework | null> => {
      try {
        const authToken = ensureToken();
        const updated = await apiPost<Homework>(
          `/homework/${homeworkId}/comment`,
          comment,
          authToken
        );
        const normalized = normalizeHomework(updated);
        setHomeworks((prev) =>
          prev.map((hw) => (hw.id === homeworkId ? normalized : hw))
        );
        return normalized;
      } catch (error) {
        console.error("Failed to add comment", error);
        throw error;
      }
    },
    [token]
  );

  // ✅ Define reloadGroups separately, not inside another callback
  const reloadGroups = useCallback(
    async (authToken: string) => {
      const latest = await fetchGroups(authToken);
      setGroups(latest);
    },
    [fetchGroups]
  );

  const createGroup = useCallback(
    async (input: { name: string; color: string }): Promise<Group | null> => {
      try {
        const authToken = ensureToken();
        const created = await apiPost<Group>("/groups", input, authToken);
        await reloadGroups(authToken);
        return created;
      } catch (error) {
        console.error("Failed to create group", error);
        throw error;
      }
    },
    [reloadGroups]
  );

  const updateGroup = useCallback(
    async (id: string, input: { name?: string; color?: string }): Promise<Group | null> => {
      try {
        const authToken = ensureToken();
        const updated = await apiPut<Group>(`/groups/${id}`, input, authToken);
        await reloadGroups(authToken);
        return updated;
      } catch (error) {
        console.error("Failed to update group", error);
        throw error;
      }
    },
    [reloadGroups]
  );

  const deleteGroup = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const authToken = ensureToken();
        await apiDelete(`/groups/${id}`, authToken);
        await reloadGroups(authToken);
        return true;
      } catch (error) {
        console.error("Failed to delete group", error);
        throw error;
      }
    },
    [reloadGroups]
  );

  const assignUserToGroup = useCallback(
    async (groupId: string, userId: string, role?: string) => {
      const authToken = ensureToken();
      await apiPost(`/groups/${groupId}/members`, { userId, role }, authToken);
      await reloadGroups(authToken);
    },
    [reloadGroups]
  );

  const removeUserFromGroup = useCallback(
    async (groupId: string, userId: string) => {
      const authToken = ensureToken();
      await apiDelete(`/groups/${groupId}/members`, authToken, { userId });
      await reloadGroups(authToken);
    },
    [reloadGroups]
  );


const value: AppContextValue = {
    currentUser,
    token,
    initializing,
    loading,
    users,
    groups,
    chapters,
    reports,
    homeworks,
    login,
    logout,
    refreshAll,
    addUser,
    updateUser,
    deleteUser,
    updateCurrentUser,
    addChapter,
    updateChapter,
    deleteChapter,
    addReport,
    deleteReport,
    addHomework,
    deleteHomework,
    addHomeworkComment,
    createGroup,
    updateGroup,
    deleteGroup,
    assignUserToGroup,
    removeUserFromGroup
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};






