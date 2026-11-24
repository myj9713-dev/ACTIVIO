export function isAdminRole(role?: string | null): role is 'admin' {
  return role === 'admin';
}

export function isManagerRole(role?: string | null): role is 'manager' {
  return role === 'manager';
}

export function getHomePathByRole(role?: string | null): string {
  return isAdminRole(role) ? '/admin' : '/dashboard';
}
