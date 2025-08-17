import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Exportar todos os PDFs em um arquivo ZIP
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    // Buscar todos os anexos PDF
    const pdfAttachments = await prisma.signatureAttachment.findMany({
      where: {
        mimeType: 'application/pdf'
      },
      include: {
        signature: {
          include: {
            user: {
              select: { name: true, username: true }
            },
            sector: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    if (pdfAttachments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum PDF encontrado no sistema' },
        { status: 404 }
      )
    }

    console.log(`📦 Iniciando export de ${pdfAttachments.length} PDFs...`)

    const zip = new JSZip()
    let successCount = 0
    let errorCount = 0

    // Processar cada PDF
    for (const attachment of pdfAttachments) {
      try {
        // Baixar arquivo do Supabase
        const { data: fileData, error } = await supabase.storage
          .from('attachments')
          .download(attachment.storagePath)

        if (error) {
          console.error(`Erro ao baixar ${attachment.filename}:`, error)
          errorCount++
          continue
        }

        // Converter para ArrayBuffer
        const arrayBuffer = await fileData.arrayBuffer()

        // Gerar nome único para o arquivo no ZIP
        const sig = attachment.signature
        const timestamp = new Date(attachment.uploadedAt).toISOString().slice(0, 10)
        const safeFileName = attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_')
        const folderName = `${sig.incrementalId}_${sig.user.name.replace(/[^a-zA-Z0-9]/g, '_')}`
        const zipFileName = `${folderName}/${timestamp}_${safeFileName}`

        // Adicionar ao ZIP
        zip.file(zipFileName, arrayBuffer)
        successCount++

        console.log(`✅ Adicionado: ${zipFileName}`)

      } catch (error) {
        console.error(`Erro ao processar ${attachment.filename}:`, error)
        errorCount++
      }
    }

    if (successCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum PDF pôde ser processado com sucesso' },
        { status: 500 }
      )
    }

    // Adicionar arquivo de informações
    const infoText = `📋 RELATÓRIO DE EXPORT - PDFs DAS ASSINATURAS
=====================================

🗓️ Data de Export: ${new Date().toLocaleString('pt-BR')}
📊 Total de PDFs Processados: ${successCount}
❌ Erros: ${errorCount}
🏢 Sistema: Assinaturas Digitais

📁 ESTRUTURA DOS ARQUIVOS:
- Cada pasta representa uma assinatura (ID_NomeUsuario)
- Formato dos arquivos: YYYY-MM-DD_NomeOriginal.pdf
- Os arquivos mantêm seus nomes originais quando possível

⚠️  IMPORTANTE:
Este arquivo contém documentos sensíveis e deve ser tratado com confidencialidade.

© 2025 GOSZC SOLUTIONS
Gustavo Salmazo Custódio
+55 (17) 99703-8154
gust.cust047@gmail.com
https://goszc.space
`

    zip.file('📋_INFORMACOES_DO_EXPORT.txt', infoText)

    // Gerar o ZIP
    console.log(`🔄 Gerando arquivo ZIP...`)
    const zipBlob = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `PDFs_Assinaturas_${timestamp}.zip`

    console.log(`✅ ZIP gerado: ${filename} (${(zipBlob.byteLength / 1024 / 1024).toFixed(2)}MB)`)

    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/zip',
        'Content-Length': zipBlob.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Erro ao gerar export de PDFs:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao gerar export' },
      { status: 500 }
    )
  }
})
