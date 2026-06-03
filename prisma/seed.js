const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const uebungen = [
  // BRUST
  { name: 'Bankdrücken', kategorie: 'Brust', schwierigkeit: 'Fortgeschritten', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau', 'Leistungssteigerung'] },
  { name: 'Kurzhantel Bankdrücken', kategorie: 'Brust', schwierigkeit: 'Anfänger', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },
  { name: 'Liegestütze', kategorie: 'Brust', schwierigkeit: 'Anfänger', ausruestung: 'Körpergewicht', ziele: ['Muskelaufbau', 'Gesünder leben', 'Körperfett reduzieren'] },
  { name: 'Schrägbankdrücken', kategorie: 'Brust', schwierigkeit: 'Fortgeschritten', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },
  { name: 'Kabelzug Fliegende', kategorie: 'Brust', schwierigkeit: 'Fortgeschritten', ausruestung: 'Maschine', ziele: ['Muskelaufbau'] },
  { name: 'Dips', kategorie: 'Brust', schwierigkeit: 'Fortgeschritten', ausruestung: 'Körpergewicht', ziele: ['Muskelaufbau', 'Leistungssteigerung'] },

  // RÜCKEN
  { name: 'Klimmzüge', kategorie: 'Rücken', schwierigkeit: 'Fortgeschritten', ausruestung: 'Körpergewicht', ziele: ['Muskelaufbau', 'Leistungssteigerung'] },
  { name: 'Langhantel Rudern', kategorie: 'Rücken', schwierigkeit: 'Fortgeschritten', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },
  { name: 'Kurzhantel Rudern', kategorie: 'Rücken', schwierigkeit: 'Anfänger', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau', 'Gesünder leben'] },
  { name: 'Kreuzheben', kategorie: 'Rücken', schwierigkeit: 'Profi', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau', 'Leistungssteigerung'] },
  { name: 'Lat Pulldown', kategorie: 'Rücken', schwierigkeit: 'Anfänger', ausruestung: 'Maschine', ziele: ['Muskelaufbau'] },
  { name: 'Seilzug Rudern', kategorie: 'Rücken', schwierigkeit: 'Anfänger', ausruestung: 'Maschine', ziele: ['Muskelaufbau', 'Gesünder leben'] },

  // BEINE
  { name: 'Kniebeugen', kategorie: 'Beine', schwierigkeit: 'Fortgeschritten', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau', 'Leistungssteigerung', 'Körperfett reduzieren'] },
  { name: 'Beinpresse', kategorie: 'Beine', schwierigkeit: 'Anfänger', ausruestung: 'Maschine', ziele: ['Muskelaufbau', 'Körperfett reduzieren'] },
  { name: 'Ausfallschritte', kategorie: 'Beine', schwierigkeit: 'Anfänger', ausruestung: 'Körpergewicht', ziele: ['Muskelaufbau', 'Gesünder leben', 'Körperfett reduzieren'] },
  { name: 'Rumänisches Kreuzheben', kategorie: 'Beine', schwierigkeit: 'Fortgeschritten', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },
  { name: 'Bein Curl', kategorie: 'Beine', schwierigkeit: 'Anfänger', ausruestung: 'Maschine', ziele: ['Muskelaufbau'] },
  { name: 'Wadenheben', kategorie: 'Beine', schwierigkeit: 'Anfänger', ausruestung: 'Körpergewicht', ziele: ['Muskelaufbau', 'Gesünder leben'] },
  { name: 'Goblet Squat', kategorie: 'Beine', schwierigkeit: 'Anfänger', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau', 'Körperfett reduzieren'] },

  // SCHULTERN
  { name: 'Schulterdrücken', kategorie: 'Schultern', schwierigkeit: 'Fortgeschritten', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau', 'Leistungssteigerung'] },
  { name: 'Seitheben', kategorie: 'Schultern', schwierigkeit: 'Anfänger', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },
  { name: 'Frontheben', kategorie: 'Schultern', schwierigkeit: 'Anfänger', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },
  { name: 'Face Pull', kategorie: 'Schultern', schwierigkeit: 'Anfänger', ausruestung: 'Maschine', ziele: ['Muskelaufbau', 'Gesünder leben'] },
  { name: 'Arnold Press', kategorie: 'Schultern', schwierigkeit: 'Fortgeschritten', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },

  // ARME
  { name: 'Bizeps Curl', kategorie: 'Arme', schwierigkeit: 'Anfänger', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },
  { name: 'Hammer Curl', kategorie: 'Arme', schwierigkeit: 'Anfänger', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },
  { name: 'Trizeps Pushdown', kategorie: 'Arme', schwierigkeit: 'Anfänger', ausruestung: 'Maschine', ziele: ['Muskelaufbau'] },
  { name: 'Trizeps Dips', kategorie: 'Arme', schwierigkeit: 'Fortgeschritten', ausruestung: 'Körpergewicht', ziele: ['Muskelaufbau', 'Leistungssteigerung'] },
  { name: 'Skull Crusher', kategorie: 'Arme', schwierigkeit: 'Fortgeschritten', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },
  { name: 'Konzentrations Curl', kategorie: 'Arme', schwierigkeit: 'Anfänger', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau'] },

  // BAUCH
  { name: 'Planke', kategorie: 'Bauch', schwierigkeit: 'Anfänger', ausruestung: 'Körpergewicht', ziele: ['Körperfett reduzieren', 'Gesünder leben', 'Leistungssteigerung'] },
  { name: 'Crunches', kategorie: 'Bauch', schwierigkeit: 'Anfänger', ausruestung: 'Körpergewicht', ziele: ['Körperfett reduzieren', 'Gesünder leben'] },
  { name: 'Russian Twist', kategorie: 'Bauch', schwierigkeit: 'Anfänger', ausruestung: 'Körpergewicht', ziele: ['Körperfett reduzieren', 'Leistungssteigerung'] },
  { name: 'Beinheben', kategorie: 'Bauch', schwierigkeit: 'Anfänger', ausruestung: 'Körpergewicht', ziele: ['Körperfett reduzieren', 'Leistungssteigerung'] },
  { name: 'Hollow Hold', kategorie: 'Bauch', schwierigkeit: 'Fortgeschritten', ausruestung: 'Körpergewicht', ziele: ['Leistungssteigerung'] },
  { name: 'Ab Wheel Rollout', kategorie: 'Bauch', schwierigkeit: 'Fortgeschritten', ausruestung: 'Kein Equipment', ziele: ['Leistungssteigerung', 'Muskelaufbau'] },

  // KARDIO
  { name: 'Laufen', kategorie: 'Kardio', schwierigkeit: 'Anfänger', ausruestung: 'Kein Equipment', ziele: ['Abnehmen', 'Mehr Energie', 'Gesünder leben', 'Körperfett reduzieren'] },
  { name: 'Seilspringen', kategorie: 'Kardio', schwierigkeit: 'Anfänger', ausruestung: 'Kein Equipment', ziele: ['Abnehmen', 'Mehr Energie', 'Körperfett reduzieren'] },
  { name: 'Fahrradfahren', kategorie: 'Kardio', schwierigkeit: 'Anfänger', ausruestung: 'Kein Equipment', ziele: ['Abnehmen', 'Mehr Energie', 'Gesünder leben'] },
  { name: 'Burpees', kategorie: 'Kardio', schwierigkeit: 'Fortgeschritten', ausruestung: 'Körpergewicht', ziele: ['Abnehmen', 'Körperfett reduzieren', 'Leistungssteigerung'] },
  { name: 'Box Jumps', kategorie: 'Kardio', schwierigkeit: 'Fortgeschritten', ausruestung: 'Körpergewicht', ziele: ['Leistungssteigerung', 'Körperfett reduzieren', 'Mehr Energie'] },
  { name: 'Mountain Climbers', kategorie: 'Kardio', schwierigkeit: 'Anfänger', ausruestung: 'Körpergewicht', ziele: ['Abnehmen', 'Körperfett reduzieren', 'Mehr Energie'] },
  { name: 'Rudermaschine', kategorie: 'Kardio', schwierigkeit: 'Anfänger', ausruestung: 'Maschine', ziele: ['Abnehmen', 'Gesünder leben', 'Leistungssteigerung'] },
  { name: 'Schwimmen', kategorie: 'Kardio', schwierigkeit: 'Anfänger', ausruestung: 'Kein Equipment', ziele: ['Abnehmen', 'Gesünder leben', 'Mehr Energie'] },
  { name: 'High Knees', kategorie: 'Kardio', schwierigkeit: 'Anfänger', ausruestung: 'Körpergewicht', ziele: ['Abnehmen', 'Körperfett reduzieren', 'Mehr Energie'] },

  // GANZKÖRPER
  { name: 'Kettlebell Schwingen', kategorie: 'Ganzkörper', schwierigkeit: 'Fortgeschritten', ausruestung: 'Freie Gewichte', ziele: ['Abnehmen', 'Körperfett reduzieren', 'Leistungssteigerung'] },
  { name: 'Clean & Press', kategorie: 'Ganzkörper', schwierigkeit: 'Profi', ausruestung: 'Freie Gewichte', ziele: ['Muskelaufbau', 'Leistungssteigerung'] },
  { name: 'Turkish Get-Up', kategorie: 'Ganzkörper', schwierigkeit: 'Profi', ausruestung: 'Freie Gewichte', ziele: ['Leistungssteigerung', 'Gesünder leben'] },
  { name: 'Thruster', kategorie: 'Ganzkörper', schwierigkeit: 'Fortgeschritten', ausruestung: 'Freie Gewichte', ziele: ['Körperfett reduzieren', 'Leistungssteigerung'] },
  { name: 'Man Maker', kategorie: 'Ganzkörper', schwierigkeit: 'Profi', ausruestung: 'Freie Gewichte', ziele: ['Körperfett reduzieren', 'Leistungssteigerung'] },
]

const mahlzeiten = [
  // Frühstück
  { name: 'Haferflocken',        kategorie: 'Frühstück',      kalorien: 370, protein: 13, kohlenhydrate: 58, fett: 7  },
  { name: 'Müesli',              kategorie: 'Frühstück',      kalorien: 380, protein: 11, kohlenhydrate: 60, fett: 8  },
  // Brot & Getreide
  { name: 'Vollkornbrot',        kategorie: 'Brot & Getreide',kalorien: 247, protein:  9, kohlenhydrate: 44, fett: 3  },
  // Milchprodukte
  { name: 'Joghurt (natur)',     kategorie: 'Milchprodukt',   kalorien:  61, protein:  4, kohlenhydrate:  5, fett: 3  },
  { name: 'Quark (mager)',       kategorie: 'Milchprodukt',   kalorien:  68, protein: 12, kohlenhydrate:  3, fett: 1  },
  { name: 'Hüttenkäse',         kategorie: 'Milchprodukt',   kalorien:  98, protein: 11, kohlenhydrate:  3, fett: 4  },
  // Proteinquellen
  { name: 'Ei (hart gekocht)',   kategorie: 'Proteinquelle',  kalorien:  78, protein:  6, kohlenhydrate:  1, fett: 5  },
  { name: 'Hähnchenbrust',       kategorie: 'Proteinquelle',  kalorien: 165, protein: 31, kohlenhydrate:  0, fett: 4  },
  { name: 'Lachs',               kategorie: 'Proteinquelle',  kalorien: 208, protein: 20, kohlenhydrate:  0, fett: 13 },
  { name: 'Thunfisch (Dose)',    kategorie: 'Proteinquelle',  kalorien: 116, protein: 26, kohlenhydrate:  0, fett: 1  },
  { name: 'Rindfleisch (mager)', kategorie: 'Proteinquelle',  kalorien: 170, protein: 26, kohlenhydrate:  0, fett: 7  },
  { name: 'Tofu',                kategorie: 'Proteinquelle',  kalorien:  76, protein:  8, kohlenhydrate:  2, fett: 4  },
  // Beilagen
  { name: 'Reis (gekocht)',      kategorie: 'Beilage',        kalorien: 130, protein:  3, kohlenhydrate: 28, fett: 0  },
  { name: 'Nudeln (gekocht)',    kategorie: 'Beilage',        kalorien: 158, protein:  6, kohlenhydrate: 31, fett: 1  },
  { name: 'Süsskartoffeln',     kategorie: 'Beilage',        kalorien:  86, protein:  2, kohlenhydrate: 20, fett: 0  },
  { name: 'Kartoffeln (gekocht)',kategorie: 'Beilage',        kalorien:  77, protein:  2, kohlenhydrate: 17, fett: 0  },
  { name: 'Quinoa',              kategorie: 'Beilage',        kalorien: 120, protein:  4, kohlenhydrate: 21, fett: 2  },
  // Obst & Gemüse
  { name: 'Banane',              kategorie: 'Obst & Gemüse',  kalorien:  89, protein:  1, kohlenhydrate: 23, fett: 0  },
  { name: 'Apfel',               kategorie: 'Obst & Gemüse',  kalorien:  52, protein:  0, kohlenhydrate: 14, fett: 0  },
  { name: 'Beeren (gemischt)',   kategorie: 'Obst & Gemüse',  kalorien:  55, protein:  1, kohlenhydrate: 12, fett: 0  },
  { name: 'Brokkoli',            kategorie: 'Obst & Gemüse',  kalorien:  34, protein:  3, kohlenhydrate:  7, fett: 0  },
  { name: 'Spinat',              kategorie: 'Obst & Gemüse',  kalorien:  23, protein:  3, kohlenhydrate:  4, fett: 0  },
  // Snacks
  { name: 'Proteinriegel',       kategorie: 'Snack',          kalorien: 200, protein: 20, kohlenhydrate: 22, fett: 6  },
  { name: 'Nüsse (gemischt)',    kategorie: 'Snack',          kalorien: 607, protein: 20, kohlenhydrate: 13, fett: 55 },
  // Getränke
  { name: 'Protein-Shake',       kategorie: 'Getränk',        kalorien: 150, protein: 25, kohlenhydrate:  8, fett: 3  },
  { name: 'Grüner Tee',          kategorie: 'Getränk',        kalorien:   2, protein:  0, kohlenhydrate:  0, fett: 0  },
  { name: 'Schwarzer Kaffee',    kategorie: 'Getränk',        kalorien:   5, protein:  0, kohlenhydrate:  1, fett: 0  },
  { name: 'Wasser',              kategorie: 'Getränk',        kalorien:   0, protein:  0, kohlenhydrate:  0, fett: 0  },
  { name: 'Milch (1.5%)',        kategorie: 'Getränk',        kalorien:  46, protein:  3, kohlenhydrate:  5, fett: 2  },
]

async function main() {
  // Seed exercises
  const uebungCount = await prisma.uebung.count()
  if (uebungCount > 0) {
    console.log(`Exercise catalog already seeded (${uebungCount} exercises), skipping...`)
  } else {
    await prisma.uebung.createMany({ data: uebungen })
    console.log(`Seeded ${uebungen.length} exercises.`)
  }

  // Seed users
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    console.log(`Users already seeded (${userCount} users), skipping...`)
  } else {
    const bcrypt = require('bcryptjs')
    const rootHash = await bcrypt.hash('AdminPraxis2026!', 12)
    const infoHash = '$2a$12$qGlxU4Zhx3UWvVipDd/3QOqTVGqoaZnd8jGufCgrYzwBp06PJ2vc.'
    await prisma.user.createMany({
      data: [
        { email: 'root@fitallcoach.ch', name: 'Admin', role: 'ADMIN', passwordHash: rootHash },
        { email: 'info@fitallcoach.ch', name: 'Joelle', role: 'STAFF', passwordHash: infoHash },
      ],
    })
    console.log('Seeded users: root@fitallcoach.ch (ADMIN) + info@fitallcoach.ch (STAFF)')
    console.log('>>> Change root password after first login! Temp: AdminPraxis2026!')
  }

}

main().catch(console.error).finally(() => prisma.$disconnect())
