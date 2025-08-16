import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar setores obrigatórios
  const sectors = [
    { name: "Suporte TI", description: "Setor de Tecnologia da Informação" },
    { name: "Administração", description: "Setor Administrativo" },
    { name: "Financeiro", description: "Setor Financeiro" }
  ]

  console.log('📁 Criando setores...')
  const createdSectors = []
  for (const sector of sectors) {
    const existingSector = await prisma.sector.findUnique({
      where: { name: sector.name }
    })

    if (!existingSector) {
      const newSector = await prisma.sector.create({
        data: sector
      })
      createdSectors.push(newSector)
      console.log(`✅ Setor criado: ${sector.name}`)
    } else {
      createdSectors.push(existingSector)
      console.log(`ℹ️  Setor já existe: ${sector.name}`)
    }
  }

  // Encontrar setor de Suporte TI
  const supportSector = await prisma.sector.findUnique({
    where: { name: "Suporte TI" }
  })

  if (!supportSector) {
    throw new Error('Setor Suporte TI não encontrado')
  }

  // Criar usuário gustavo obrigatório
  console.log('👤 Criando usuário gustavo...')
  const existingUser = await prisma.user.findUnique({
    where: { username: 'gustavo' }
  })

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('live2017G!', 12)
    
    const gustavoUser = await prisma.user.create({
      data: {
        username: 'gustavo',
        password: hashedPassword,
        name: 'Gustavo - Suporte TI',
        role: UserRole.SUPPORT,
        sectorId: supportSector.id,
        isFirstLogin: false,
        securityQuestion: 'Qual o nome da sua cidade natal?',
        securityAnswer: await bcrypt.hash('São Paulo', 12) // Exemplo
      }
    })
    console.log('✅ Usuário gustavo criado com sucesso')
  } else {
    console.log('ℹ️  Usuário gustavo já existe')
  }

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
