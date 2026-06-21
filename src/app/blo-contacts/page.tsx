import BloContactsClient from './BloContactsClient'

export const metadata = {
  title: 'BLO Contacts - Proddatur 157 Congress',
  description: 'Directory of Booth Level Officers for Proddatur 157',
}

export default function BloContactsPage() {
  return (
    <main className="min-h-screen bg-slate-950 pt-20 pb-12">
      <BloContactsClient />
    </main>
  )
}
