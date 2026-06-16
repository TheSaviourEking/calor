'use client'

import { useState } from 'react'
import { Search, ChevronDown, CheckCircle, XCircle } from 'lucide-react'

interface AuditLog {
  id: string
  adminId: string | null
  adminEmail: string | null
  action: string
  entity: string
  entityId: string | null
  description: string
  changes: string | null
  ipAddress: string | null
  success: boolean
  errorMessage: string | null
  createdAt: string
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-red-50 text-red-600',
  login: 'bg-sand text-mid-gray',
  export: 'bg-gold/10 text-gold',
}

const ENTITIES = ['all', 'product', 'order', 'customer', 'promotion', 'review', 'ticket', 'campaign']
const ACTIONS = ['all', 'create', 'update', 'delete', 'login', 'export']

export default function AdminAuditLogsClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = initialLogs.filter((l) => {
    const matchSearch = l.description.toLowerCase().includes(search.toLowerCase()) ||
      (l.adminEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.entityId || '').toLowerCase().includes(search.toLowerCase())
    const matchEntity = entityFilter === 'all' || l.entity === entityFilter
    const matchAction = actionFilter === 'all' || l.action === actionFilter
    return matchSearch && matchEntity && matchAction
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-charcoal text-2xl" style={{ fontWeight: 400 }}>Audit Logs</h1>
        <p className="font-body text-warm-gray text-sm mt-1">
          {initialLogs.length} entries (last 200) · {initialLogs.filter((l) => !l.success).length} errors
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description, email, ID..."
            className="pl-9 pr-4 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta w-72" />
        </div>
        <div className="relative">
          <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta">
            {ENTITIES.map((e) => <option key={e} value={e}>{e === 'all' ? 'All Entities' : e}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
        </div>
        <div className="relative">
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-sand bg-warm-white font-body text-sm focus:outline-none focus:border-terracotta">
            {ACTIONS.map((a) => <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray pointer-events-none" />
        </div>
        <span className="font-body text-xs text-warm-gray ml-auto">{filtered.length} results</span>
      </div>

      <div className="bg-warm-white border border-sand overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand bg-sand/20">
              {['Time', 'Admin', 'Action', 'Entity', 'Description', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-body text-warm-gray text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center font-body text-warm-gray text-sm">No logs match this filter.</td></tr>
            ) : filtered.map((log) => (
              <>
                <tr key={log.id} className={`hover:bg-sand/10 transition-colors ${!log.success ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-body text-warm-gray text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-body text-warm-gray text-xs">{log.adminEmail || log.adminId?.slice(0, 8) || 'system'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-body ${actionColors[log.action] || 'bg-sand text-mid-gray'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-warm-gray text-xs">{log.entity}{log.entityId && <span className="ml-1 font-mono opacity-50">{log.entityId.slice(0, 6)}</span>}</td>
                  <td className="px-4 py-3 font-body text-charcoal text-sm max-w-xs truncate">{log.description}</td>
                  <td className="px-4 py-3">
                    {log.success
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <XCircle className="w-4 h-4 text-red-500" />
                    }
                  </td>
                  <td className="px-4 py-3">
                    {(log.changes || log.errorMessage) && (
                      <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                        className="font-body text-xs text-terracotta hover:underline">
                        {expanded === log.id ? 'hide' : 'details'}
                      </button>
                    )}
                  </td>
                </tr>
                {expanded === log.id && (
                  <tr key={`${log.id}-exp`}>
                    <td colSpan={7} className="px-4 pb-3 bg-cream/40 border-b border-sand">
                      {log.errorMessage && (
                        <div className="mb-2">
                          <p className="font-body text-xs text-warm-gray uppercase tracking-wider mb-1">Error</p>
                          <p className="font-body text-xs text-red-600 font-mono">{log.errorMessage}</p>
                        </div>
                      )}
                      {log.changes && (
                        <div>
                          <p className="font-body text-xs text-warm-gray uppercase tracking-wider mb-1">Changes</p>
                          <pre className="font-body text-xs text-charcoal bg-sand/30 p-2 overflow-x-auto max-h-32 whitespace-pre-wrap">
                            {JSON.stringify(JSON.parse(log.changes), null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.ipAddress && <p className="font-body text-xs text-warm-gray mt-2">IP: {log.ipAddress}</p>}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
