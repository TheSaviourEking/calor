import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  const customers = await db.customer.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, isAdmin: true, passwordHash: true },
    take: 10
  })
  console.log('Existing customers:', JSON.stringify(customers, null, 2))
  
  if (customers.length === 0) {
    console.log('\nNo customers found. Creating test user...')
    
    // Create test user
    const passwordHash = await bcrypt.hash('Test123!', 12)
    const testUser = await db.customer.create({
      data: {
        email: 'test@calor.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      }
    })
    console.log('Created test user:', testUser.email)
    
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('Admin123!', 12)
    const adminUser = await db.customer.create({
      data: {
        email: 'admin@calor.com',
        passwordHash: adminPasswordHash,
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      }
    })
    console.log('Created admin user:', adminUser.email)
  } else {
    console.log('\nUsers already exist in database.')
  }
}

main().catch(console.error).finally(() => db.$disconnect())
