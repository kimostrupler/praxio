import { unstable_cache } from 'next/cache'
import { prisma } from './db'

// All clients with last anamnese weight + last note date.
// Covers: /clients list, dashboard counts/birthdays/no-contact, statistiken status.
export const getCachedClients = unstable_cache(
  () => prisma.client.findMany({
    orderBy: { nachname: 'asc' },
    include: {
      _count:    { select: { anamnesen: true } },
      anamnesen: { orderBy: { datum: 'desc' }, take: 1, select: { aktuellesGewicht: true } },
      notizen:   { where: { deletedAt: null }, orderBy: { datum: 'desc' }, take: 1, select: { datum: true } },
    },
  }),
  ['clients'],
  { tags: ['clients'] },
)

// Top 5 recent clients with anamnese snapshot + latest training plan.
// Covers: dashboard "Zuletzt angelegt" section.
export const getCachedRecentClients = unstable_cache(
  () => prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      anamnesen: {
        orderBy: { datum: 'desc' },
        take: 1,
        select: {
          aktuellesGewicht: true, groesse: true, ziele: true,
          stressLevel: true, schlafStunden: true, wohlbefinden: true,
          erkrankungen: true, koerperfett: true,
        },
      },
      trainingsplaene: {
        orderBy: { datum: 'desc' },
        take: 1,
        select: { id: true, name: true, _count: { select: { uebungen: true } } },
      },
    },
  }),
  ['recent-clients'],
  // 'training' tag so a new plan also refreshes recent-clients on the dashboard.
  { tags: ['clients', 'training'] },
)

// All rechnungen with client info + line items.
// Covers: /rechnungen list, dashboard open invoices, statistiken revenue.
export const getCachedRechnungen = unstable_cache(
  () => prisma.rechnung.findMany({
    orderBy: { datum: 'desc' },
    include: {
      client:     { select: { id: true, vorname: true, nachname: true, email: true } },
      positionen: { select: { menge: true, einzelpreis: true } },
    },
  }),
  ['rechnungen'],
  { tags: ['rechnungen'] },
)

// All data needed for the /plaene page (all three tabs).
export const getCachedPlaeneData = unstable_cache(
  async () => {
    const [presets, ernaehrungsVorlagen, alleClients, alleUebungen, allePlaene, alleErnaehrungsPlaene] = await Promise.all([
      prisma.trainingsPreset.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { trainingsplaene: true } },
          uebungen: { orderBy: { reihenfolge: 'asc' }, include: { uebung: { select: { name: true, kategorie: true } } } },
          trainingsplaene: { include: { client: { select: { vorname: true, nachname: true } } } },
        },
      }),
      prisma.ernaehrungsVorlage.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          zeilen: { orderBy: { reihenfolge: 'asc' } },
          plaene: { select: { id: true, client: { select: { vorname: true, nachname: true } } } },
        },
      }),
      prisma.client.findMany({
        where: { status: 'AKTIV' },
        orderBy: [{ nachname: 'asc' }, { vorname: 'asc' }],
        select: { id: true, vorname: true, nachname: true },
      }),
      prisma.uebung.findMany({ orderBy: [{ kategorie: 'asc' }, { name: 'asc' }] }),
      prisma.trainingsPlan.findMany({
        orderBy: { datum: 'desc' },
        include: {
          client: { select: { id: true, vorname: true, nachname: true } },
          uebungen: { select: { id: true } },
        },
      }),
      prisma.ernaehrungsPlan.findMany({
        orderBy: { datum: 'desc' },
        include: {
          client: { select: { id: true, vorname: true, nachname: true } },
          zeilen: { select: { id: true, kalorien: true } },
        },
      }),
    ])
    return { presets, ernaehrungsVorlagen, alleClients, alleUebungen, allePlaene, alleErnaehrungsPlaene }
  },
  ['plaene-data'],
  { tags: ['clients', 'training', 'ernaehrung'] },
)

// Anamnese-level aggregates for the statistiken page (counts, averages, goals, top presets).
// Client counts and rechnung revenue are derived from getCachedClients / getCachedRechnungen.
export const getCachedStatistikenAggregates = unstable_cache(
  async () => {
    const [anamneseCount, planCount, presetTop, goalCounts, stressAvg, schlafAvg, weightData] = await Promise.all([
      prisma.anamnese.count(),
      prisma.trainingsPlan.count(),
      prisma.trainingsPreset.findMany({
        take: 8,
        orderBy: { trainingsplaene: { _count: 'desc' } },
        select: { name: true, _count: { select: { trainingsplaene: true } } },
      }),
      prisma.anamnese.findMany({ select: { ziele: true } }),
      prisma.anamnese.aggregate({ where: { stressLevel: { not: null } }, _avg: { stressLevel: true }, _count: { stressLevel: true } }),
      prisma.anamnese.aggregate({ where: { schlafStunden: { not: null } }, _avg: { schlafStunden: true } }),
      prisma.anamnese.aggregate({ _avg: { aktuellesGewicht: true, koerperfett: true }, _count: { aktuellesGewicht: true } }),
    ])
    return { anamneseCount, planCount, presetTop, goalCounts, stressAvg, schlafAvg, weightData }
  },
  ['statistiken-aggregates'],
  { tags: ['clients', 'training'] },
)
