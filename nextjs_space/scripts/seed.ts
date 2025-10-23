
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.comment.deleteMany({})
  await prisma.attachment.deleteMany({})
  await prisma.shiftReport.deleteMany({})
  await prisma.dailyPostTracker.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.user.deleteMany({})
  console.log('✅ Database cleared')

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create one user of each type
  const users = [
    {
      username: 'admin',
      email: 'admin@hotel.com',
      password: hashedPassword,
      name: 'Sarah Johnson',
      role: UserRole.SUPER_ADMIN,
    },
    {
      username: 'manager',
      email: 'manager@hotel.com', 
      password: hashedPassword,
      name: 'Michael Rodriguez',
      role: UserRole.MANAGER,
    },
    {
      username: 'employee',
      email: 'employee@hotel.com',
      password: hashedPassword,
      name: 'David Thompson',
      role: UserRole.EMPLOYEE,
    },
  ]

  console.log('Creating users...')
  
  // Create all users
  for (const user of users) {
    const createdUser = await prisma.user.create({
      data: user,
    })
    console.log(`✅ Created ${user.role}: ${user.name} (${user.username})`)
  }

  console.log('🎉 Database seeding completed!')
  console.log('\n📝 Login Credentials:')
  console.log('Super Admin: admin / password123')
  console.log('Manager:     manager / password123')
  console.log('Employee:    employee / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
