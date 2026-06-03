const COLOURS = [
  'bg-blue-950 text-blue-300',
  'bg-purple-950 text-purple-300',
  'bg-emerald-950 text-emerald-300',
  'bg-orange-950 text-orange-300',
  'bg-rose-950 text-rose-300',
  'bg-cyan-950 text-cyan-300',
  'bg-amber-950 text-amber-300',
  'bg-indigo-950 text-indigo-300',
]

export function avatarColor(name: string): string {
  const hash = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COLOURS[hash % COLOURS.length]
}
