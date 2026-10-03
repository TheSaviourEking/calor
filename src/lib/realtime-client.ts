// Socket.io handshake auth for the realtime services.
//
//   io(url, { auth: realtimeAuth })
//
// Socket.io calls this for every connection attempt, including reconnects, so
// each attempt carries a fresh token instead of one that expired minutes ago.
export function realtimeAuth(cb: (data: { token: string | null }) => void): void {
  fetch('/api/realtime/token', { cache: 'no-store' })
    .then((res) => res.json())
    .then((data: { token?: string | null }) => cb({ token: data.token ?? null }))
    .catch(() => cb({ token: null }))
}
