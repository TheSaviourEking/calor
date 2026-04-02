import EditStreamClient from './EditStreamClient'

export default function EditStreamPage({ params }: { params: Promise<{ streamId: string }> }) {
  return <EditStreamClient params={params} />
}
