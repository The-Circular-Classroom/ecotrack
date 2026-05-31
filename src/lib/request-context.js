import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserRecordForAuthUser, upsertCurrentUserFromAuthUser } from '@/lib/data/users';

export async function getRequestContext(request) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const authUser = data.user ?? null;

  if (!authUser) {
    return {
      authUser: null,
      user: null,
      userId: null,
      role: null,
      schoolId: null,
      isAuthenticated: false,
    };
  }

  const user = (await getUserRecordForAuthUser(authUser)) ?? (await upsertCurrentUserFromAuthUser(authUser));

  return {
    authUser,
    user,
    userId: user?.id ?? authUser.id,
    role: user?.role ?? null,
    schoolId: user?.schoolId ?? null,
    isAuthenticated: true,
  };
}

export function isAdminRole(role) {
  return role === 'Admin';
}