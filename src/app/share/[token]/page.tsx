import { getShareAction, getLikeCountsAction } from '@/lib/share/actions'
import { SharePageClient } from './SharePageClient'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: Props) {
  const { token } = await params
  const data = await getShareAction(token)
  if (!data) notFound()

  const likeCounts = await getLikeCountsAction(token)

  return (
    <SharePageClient
      token={token}
      names={data.names}
      surname={data.surname}
      locale={data.locale}
      likeCounts={likeCounts}
    />
  )
}
