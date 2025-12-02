// Cookie management utilities

export interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }

  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = `${encodeURIComponent(name)}=`;
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
};

export const deleteCookie = (name: string, path?: string, domain?: string): void => {
  setCookie(name, '', {
    expires: new Date(0),
    path,
    domain,
  });
};

// Recent workspace management
export interface RecentWorkspace {
  id: number;
  name: string;
  description?: string;
  lastAccessed: string;
}

const RECENT_WORKSPACES_KEY = 'recent-workspaces';
const MAX_RECENT_WORKSPACES = 5;

export const addRecentWorkspace = (workspace: Omit<RecentWorkspace, 'lastAccessed'>): void => {
  const recentWorkspaces = getRecentWorkspaces();
  
  // Remove existing entry if it exists
  const filteredWorkspaces = recentWorkspaces.filter(w => w.id !== workspace.id);
  
  // Add new entry at the beginning
  const newRecentWorkspace: RecentWorkspace = {
    ...workspace,
    lastAccessed: new Date().toISOString(),
  };
  
  const updatedWorkspaces = [newRecentWorkspace, ...filteredWorkspaces].slice(0, MAX_RECENT_WORKSPACES);
  
  setCookie(RECENT_WORKSPACES_KEY, JSON.stringify(updatedWorkspaces), {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
};

export const getRecentWorkspaces = (): RecentWorkspace[] => {
  try {
    const cookieValue = getCookie(RECENT_WORKSPACES_KEY);
    if (!cookieValue) return [];
    
    const workspaces = JSON.parse(cookieValue) as RecentWorkspace[];
    return workspaces.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
  } catch (error) {
    console.error('Failed to parse recent workspaces from cookie:', error);
    return [];
  }
};

export const removeRecentWorkspace = (workspaceId: number): void => {
  const recentWorkspaces = getRecentWorkspaces();
  const filteredWorkspaces = recentWorkspaces.filter(w => w.id !== workspaceId);
  
  setCookie(RECENT_WORKSPACES_KEY, JSON.stringify(filteredWorkspaces), {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
};

export const clearRecentWorkspaces = (): void => {
  deleteCookie(RECENT_WORKSPACES_KEY, '/');
};
