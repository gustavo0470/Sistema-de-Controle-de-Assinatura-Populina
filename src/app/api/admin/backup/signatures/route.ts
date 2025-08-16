import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'
import { requireAdmin } from '@/lib/middleware'

// Backup de todas as assinaturas (apenas admin/suporte)
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    // Buscar todas as assinaturas com dados completos
    const signatures = await prisma.signature.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            role: true
          }
        },
        sector: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        requests: {
          select: {
            id: true,
            type: true,
            status: true,
            reason: true,
            adminResponse: true,
            createdAt: true,
            updatedAt: true,
            respondedBy: {
              select: {
                name: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Gerar XLSX
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Assinaturas')

    ws.columns = [
      { header: 'ID Incremental', key: 'incId', width: 15 },
      { header: 'Motivo', key: 'reason', width: 25 },
      { header: 'Token', key: 'token', width: 12 },
      { header: 'Servidor', key: 'server', width: 20 },
      { header: 'Setor', key: 'sector', width: 20 },
      { header: 'Criado em', key: 'created', width: 20 },
      { header: 'Usuário', key: 'user', width: 20 },
      { header: 'Username', key: 'username', width: 20 }
    ]

    signatures.forEach(sig => {
      ws.addRow({
        incId: `${sig.incrementalId} - © 2025 GOSZC SOLUTIONS - Gustavo Salmazo Custódio - +55 (17) 99703-8154 - gust.cust047@gmail.com - <a href="https://goszc.space">goszc.space</a>`,
        reason: sig.reason,
        token: sig.token,
        server: sig.serverName,
        sector: sig.sectorName,
        created: sig.createdAt,
        user: sig.user.name,
        username: sig.user.username
      })
    })

    const buffer = await wb.xlsx.writeBuffer()

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0,19)
    const filename = `assinaturas-${timestamp}.xlsx`

    const response = new NextResponse(buffer)
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    return response

  } catch (error) {
    console.error('Erro ao gerar backup:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})

