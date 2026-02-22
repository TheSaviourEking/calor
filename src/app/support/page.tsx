import ClientWrapper from '@/components/layout/ClientWrapper'
import SupportChatClient from './SupportChatClient'

export const metadata = {
  title: 'Support Chat | CALŌR',
  description: 'Get anonymous, private support from our team.',
}

export default function SupportPage() {
  return (
    <ClientWrapper>
      <SupportChatClient />
    </ClientWrapper>
  )
}
