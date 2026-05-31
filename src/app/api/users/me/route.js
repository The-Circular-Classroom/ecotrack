import { getRequestContext } from '@/lib/request-context';

export async function GET(request) {
  const context = await getRequestContext(request);

  if (!context.isAuthenticated || !context.user) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  return Response.json({
    success: true,
    userId: context.user.id,
    email: context.user.email,
    role: context.user.role,
    schoolId: context.user.schoolId,
    schoolName: context.user.school?.schoolName ?? null,
    numberChild: context.user.numberChild,
    childDetails: context.user.childDetails,
    lastLogin: context.user.lastLogin,
    firstName: context.user.firstName,
    lastName: context.user.lastName,
    fullName: context.user.fullName,
    isActive: context.user.isActive,
  });
}