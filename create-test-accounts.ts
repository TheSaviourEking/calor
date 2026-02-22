import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
    const passwordHash = await bcrypt.hash('Password123!', 12)

    // Create Admin
    await db.customer.upsert({
        where: { email: 'admin@calor.test' },
        update: {
            passwordHash,
            isAdmin: true,
            emailVerified: true
        },
        create: {
            email: 'admin@calor.test',
            firstName: 'Admin',
            lastName: 'User',
            passwordHash,
            isAdmin: true,
            emailVerified: true
        }
    })

    // Create Normal User
    await db.customer.upsert({
        where: { email: 'user@calor.test' },
        update: {
            passwordHash,
            isAdmin: false,
            emailVerified: true
        },
        create: {
            email: 'user@calor.test',
            firstName: 'Normal',
            lastName: 'User',
            passwordHash,
            isAdmin: false,
            emailVerified: true
        }
    })

    console.log('Successfully created test accounts:')
    console.log('1. admin@calor.test / Password123! (Admin)')
    console.log('2. user@calor.test / Password123! (User)')
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect())
