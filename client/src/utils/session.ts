const SESSION_KEY = 'verilens_session';
const TOKEN_KEY = 'verilens_token';

export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface StoredSession<TUser = unknown> {
    user?: TUser;
    tokenType?: string;
    loggedInAt?: string;
}

export function clearAuthSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
}

function parseStoredSession<TUser = unknown>(): StoredSession<TUser> | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as StoredSession<TUser>;
    } catch {
        clearAuthSession();
        return null;
    }
}

export function isSessionExpired(loggedInAt?: string): boolean {
    if (!loggedInAt) {
        return true;
    }

    const loggedInAtMs = Date.parse(loggedInAt);
    if (Number.isNaN(loggedInAtMs)) {
        return true;
    }

    return Date.now() - loggedInAtMs >= SESSION_MAX_AGE_MS;
}

export function getValidSession<TUser = unknown>(): StoredSession<TUser> | null {
    const session = parseStoredSession<TUser>();
    if (!session) {
        return null;
    }

    if (isSessionExpired(session.loggedInAt)) {
        clearAuthSession();
        return null;
    }

    return session;
}
