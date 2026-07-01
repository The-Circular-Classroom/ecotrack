import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/roles'
import { prisma } from '@/lib/prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/analytics/assembly/recipes/[id] - Delete a product recipe.
 * Admin role required.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const role = request.headers.get('x-user-role')
  if (!requireRole(role, 'Admin')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Admin access required' },
      { status: 403 }
    )
  }

  const { id } = await params
  const recipeId = parseInt(id, 10)
  if (!Number.isInteger(recipeId) || recipeId < 1) {
    return NextResponse.json(
      { error: 'validation_error', message: 'recipeId must be a valid positive integer' },
      { status: 400 }
    )
  }

  const existing = await prisma.productRecipe.findUnique({ where: { id: recipeId } })
  if (!existing) {
    return NextResponse.json(
      { error: 'not_found', message: 'Recipe not found' },
      { status: 404 }
    )
  }

  try {
    await prisma.productRecipe.delete({ where: { id: recipeId } })
    return NextResponse.json({ success: true, message: 'Recipe deleted successfully' })
  } catch (error: unknown) {
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2003') {
      return NextResponse.json(
        { error: 'conflict', message: 'Cannot delete recipe because it has associated ingredients' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'database_error', message: 'Failed to delete recipe' },
      { status: 500 }
    )
  }
}
