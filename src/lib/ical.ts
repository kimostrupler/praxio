export type CalEvent = {
  uid:           string
  title:         string
  start:         Date
  end:           Date
  location:      string | null
  meetingUrl:    string | null
  description:   string | null
  attendeeName:  string | null
  attendeeEmail: string | null
  status:        'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'
}

type V2Booking = {
  id:          number
  uid:         string
  title:       string
  description: string | null
  start:       string
  end:         string
  duration:    number
  status:      string
  location:    string | null
  meetingUrl:  string | null
  hosts:       Array<{ email: string; name: string }>
  attendees:   Array<{ name: string; email: string }>
}

function mapStatus(s: string): CalEvent['status'] {
  if (s === 'cancelled' || s === 'rejected') return 'CANCELLED'
  if (s === 'pending')                       return 'TENTATIVE'
  return 'CONFIRMED'
}

// "Beratung between Joelle Aebi and Max" → "Beratung"
function cleanTitle(raw: string): string {
  const idx = raw.toLowerCase().indexOf(' between ')
  return idx !== -1 ? raw.slice(0, idx).trim() : raw
}

export async function fetchCalcomEvents(): Promise<{
  events:     CalEvent[]
  configured: boolean
  error?:     string
}> {
  const apiKey = process.env.CALCOM_API_KEY?.trim()
  if (!apiKey) return { events: [], configured: false }

  try {
    const res = await fetch('https://api.cal.com/v2/bookings?take=250', {
      headers: {
        'Authorization':    `Bearer ${apiKey}`,
        'cal-api-version':  '2024-08-13',
      },
      next: { revalidate: 300 }, // cache 5 minutes; shared across dashboard/termine/kalender
    })

    if (!res.ok) return { events: [], configured: true, error: `HTTP ${res.status}` }

    const json = await res.json()
    if (json.status !== 'success') return { events: [], configured: true, error: json.message ?? 'API error' }

    const bookings: V2Booking[] = json.data ?? []
    const hostEmails = new Set<string>()

    const events = bookings.map(b => {
      b.hosts?.forEach(h => hostEmails.add(h.email))
      // Attendee = first non-host participant
      const guest = b.attendees?.find(a => !hostEmails.has(a.email)) ?? b.attendees?.[0]

      return {
        uid:           b.uid ?? String(b.id),
        title:         cleanTitle(b.title),
        start:         new Date(b.start),
        end:           new Date(b.end),
        location:      b.location ?? null,
        meetingUrl:    b.meetingUrl ?? null,
        description:   b.description || null,
        attendeeName:  guest?.name  ?? null,
        attendeeEmail: guest?.email ?? null,
        status:        mapStatus(b.status),
      } satisfies CalEvent
    }).sort((a, b) => a.start.getTime() - b.start.getTime())

    return { events, configured: true }
  } catch (e) {
    return { events: [], configured: true, error: String(e) }
  }
}
