import ApprovedSendersForm from '@/components/settings/ApprovedSendersForm'
import OutlookConnectPanel from '@/components/settings/OutlookConnectPanel'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-700">Connect Outlook and control which senders we ingest.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Outlook Connection</h2>
        <OutlookConnectPanel />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Approved Senders</h2>
        <p className="text-sm text-gray-600">Only messages from these emails will be ingested from Outlook.</p>
        <ApprovedSendersForm />
      </section>
    </div>
  )
}
