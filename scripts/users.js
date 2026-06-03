#!/usr/bin/env node
'use strict'

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

const [,, command, ...args] = process.argv

const HELP = `
Praxis User Management
Usage: node scripts/users.js <command> [args]

Commands:
  list                                    List all users
  add <email> <name> <password> <role>    Create a user (role: ADMIN or STAFF)
  reset-password <email> <newpassword>    Reset a user's password
  set-role <email> <role>                 Change role (ADMIN or STAFF)
  activate <email>                        Re-activate a deactivated user
  deactivate <email>                      Deactivate a user (blocks login)
  delete <email>                          Permanently delete a user
`

async function run() {
  try {
    switch (command) {
      case 'list': {
        const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
        if (users.length === 0) { console.log('\nNo users found.\n'); break }
        console.log('\n' + '─'.repeat(70))
        console.log('  STATUS  EMAIL                               ROLE    NAME')
        console.log('─'.repeat(70))
        for (const u of users) {
          const status = u.active ? '  ✓   ' : '  ✗   '
          console.log(`${status}  ${u.email.padEnd(36)}  ${u.role.padEnd(6)}  ${u.name}`)
        }
        console.log('─'.repeat(70) + '\n')
        break
      }

      case 'add': {
        const [email, name, password, role] = args
        if (!email || !name || !password || !role) {
          console.error('Usage: add <email> <name> <password> <ADMIN|STAFF>')
          process.exit(1)
        }
        if (!['ADMIN', 'STAFF'].includes(role.toUpperCase())) {
          console.error('Role must be ADMIN or STAFF')
          process.exit(1)
        }
        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
        if (existing) { console.error(`Error: ${email} already exists`); process.exit(1) }
        const passwordHash = await bcrypt.hash(password, 12)
        const user = await prisma.user.create({
          data: { email: email.toLowerCase(), name, passwordHash, role: role.toUpperCase() },
        })
        console.log(`\n✓ Created ${user.email} (${user.role})\n`)
        break
      }

      case 'reset-password': {
        const [email, password] = args
        if (!email || !password) {
          console.error('Usage: reset-password <email> <newpassword>')
          process.exit(1)
        }
        if (password.length < 8) { console.error('Password must be at least 8 characters'); process.exit(1) }
        const passwordHash = await bcrypt.hash(password, 12)
        await prisma.user.update({ where: { email: email.toLowerCase() }, data: { passwordHash } })
        console.log(`\n✓ Password updated for ${email}\n`)
        break
      }

      case 'set-role': {
        const [email, role] = args
        if (!email || !role || !['ADMIN', 'STAFF'].includes(role.toUpperCase())) {
          console.error('Usage: set-role <email> <ADMIN|STAFF>')
          process.exit(1)
        }
        await prisma.user.update({
          where: { email: email.toLowerCase() },
          data: { role: role.toUpperCase() },
        })
        console.log(`\n✓ ${email} is now ${role.toUpperCase()}\n`)
        break
      }

      case 'activate': {
        const [email] = args
        if (!email) { console.error('Usage: activate <email>'); process.exit(1) }
        await prisma.user.update({ where: { email: email.toLowerCase() }, data: { active: true } })
        console.log(`\n✓ Activated ${email}\n`)
        break
      }

      case 'deactivate': {
        const [email] = args
        if (!email) { console.error('Usage: deactivate <email>'); process.exit(1) }
        await prisma.user.update({ where: { email: email.toLowerCase() }, data: { active: false } })
        console.log(`\n✓ Deactivated ${email}\n`)
        break
      }

      case 'delete': {
        const [email] = args
        if (!email) { console.error('Usage: delete <email>'); process.exit(1) }
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
        if (!user) { console.error(`User ${email} not found`); process.exit(1) }
        if (user.role === 'ADMIN') {
          const count = await prisma.user.count({ where: { role: 'ADMIN' } })
          if (count <= 1) { console.error('Cannot delete the last ADMIN'); process.exit(1) }
        }
        await prisma.user.delete({ where: { email: email.toLowerCase() } })
        console.log(`\n✓ Deleted ${email}\n`)
        break
      }

      default:
        console.log(HELP)
    }
  } catch (err) {
    if (err.code === 'P2025') {
      console.error('User not found')
    } else {
      console.error('Error:', err.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

run()
