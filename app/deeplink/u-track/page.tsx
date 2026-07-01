import { redirect } from 'next/navigation'

export default function UTrackRedirect() {
  redirect('/auth/login?continue=/inventory')
}
