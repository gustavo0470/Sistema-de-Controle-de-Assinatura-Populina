import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware'

// Buscar servidores únicos para dropdown
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar servidores únicos das assinaturas
    const servers = await prisma.signature.findMany({
      select: {
        serverName: true
      },
      distinct: ['serverName'],
      orderBy: {
        serverName: 'asc'
      }
    })

    const uniqueServers = servers.map(item => item.serverName)

    return NextResponse.json({
      success: true,
      data: { servers: uniqueServers }
    })

  } catch (error) {
    console.error('Erro ao buscar servidores:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

