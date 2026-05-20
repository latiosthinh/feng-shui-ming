import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createPocketBase } from '@/lib/pocketbase/client'
import AdminClient, { AdminLogin } from './admin-client'

/**
 * Server component that verifies admin authentication before rendering.
 *
 * This prevents unauthorized access to the admin panel by validating
 * the PocketBase superuser session on the server side, not just client-side.
 */
export default async function AdminPage() {
  const cookieStore = await cookies()
  const pbCookie = cookieStore.get('pb_auth')?.value

  if (!pbCookie) {
    return <AdminLogin />
  }

  let token: string
  let email: string
  try {
    const parsed = JSON.parse(pbCookie)
    token = parsed.token
    email = parsed.model?.email
  } catch {
    return <AdminLogin />
  }

  // Server-side verification: authenticate as admin with the stored token
  const pb = createPocketBase(token)
  try {
    const admin = await pb.admins.authRefresh()
    if (!admin || !admin.record) {
      return <AdminLogin />
    }
  } catch {
    return <AdminLogin />
  }

  return <AdminClient adminToken={token} />
}
