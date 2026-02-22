import { Metadata } from 'next'
import EmailTestClient from './EmailTestClient'

export const metadata: Metadata = {
  title: 'Email Test | Admin | CALŌR',
  description: 'Test and verify email configuration',
}

export default function EmailTestPage() {
  return <EmailTestClient />
}
