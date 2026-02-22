import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  // Check for test user
  const testUser = await db.customer.findUnique({
    where: { email: 'test@calor.com' }
  })
  
  if (!testUser) {
    console.log('Creating test user...')
    const passwordHash = await bcrypt.hash('Test123!', 12)
    await db.customer.create({
      data: {
        email: 'test@calor.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      }
    })
    console.log('Created test@calor.com with password: Test123!')
  } else {
    // Reset password to known value
    const passwordHash = await bcrypt.hash('Test123!', 12)
    await db.customer.update({
      where: { email: 'test@calor.com' },
      data: { passwordHash, emailVerified: true, emailVerifiedAt: new Date() }
    })
    console.log('Reset test@calor.com password to: Test123!')
  }
  
  // Reset admin password too
  const adminPasswordHash = await bcrypt.hash('Admin123!', 12)
  await db.customer.upsert({
    where: { email: 'admin@calor.com' },
    update: { passwordHash: adminPasswordHash, emailVerified: true, emailVerifiedAt: new Date() },
    create: {
      email: 'admin@calor.com',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    }
  })
  console.log('Reset admin@calor.com password to: Admin123!')
  
  // List all users
  const users = await db.customer.findMany({
    select: { email: true, firstName: true, lastName: true, isAdmin: true }
  })
  console.log('\n=== AVAILABLE USERS ===')
  for (const u of users) {
    console.log(`- ${u.email} (${u.firstName} ${u.lastName}) ${u.isAdmin ? '[ADMIN]' : ''}`)
  }
}

main().catch(console.error).finally(() => db.$disconnect())
