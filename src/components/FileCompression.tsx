import imageCompression from 'browser-image-compression'
import { PDFDocument } from 'pdf-lib'

export interface CompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight: number
  useWebWorker: boolean
  fileType?: string
}

export class FileCompressor {
  static async compressFile(file: File): Promise<File> {
    // Verificar se é imagem
    if (file.type.startsWith('image/')) {
      return await this.compressImage(file)
    }
    
    // Verificar se é PDF
    if (file.type === 'application/pdf') {
      return await this.compressPDF(file)
    }
    
    // Para outros documentos, retornar sem compressão
    return file
  }

  private static async compressImage(file: File): Promise<File> {
    const options: CompressionOptions = {
      maxSizeMB: 2, // Máximo 2MB após compressão
      maxWidthOrHeight: 1920, // Máximo 1920px em qualquer dimensão
      useWebWorker: true,
      fileType: file.type
    }

    try {
      console.log(`📐 Comprimindo imagem: ${file.name}`)
      console.log(`   Tamanho original: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      
      const compressedFile = await imageCompression(file, options)
      
      console.log(`   Tamanho comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
      console.log(`   Redução: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`)
      
      // Manter o nome original
      const finalFile = new File([compressedFile], file.name, {
        type: compressedFile.type,
        lastModified: Date.now()
      })
      
      return finalFile
    } catch (error) {
      console.error('Erro na compressão da imagem:', error)
      console.log('Usando arquivo original sem compressão')
      return file
    }
  }

  private static async compressPDF(file: File): Promise<File> {
    // Se o arquivo já é pequeno (menos de 2MB), não comprimir
    if (file.size < 2 * 1024 * 1024) {
      console.log(`📄 PDF já é pequeno (${(file.size / 1024 / 1024).toFixed(2)}MB), mantendo original`)
      return file
    }

    try {
      console.log(`📄 Comprimindo PDF: ${file.name}`)
      console.log(`   Tamanho original: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      // Salvar com compressão básica
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      })
      
      const compressedSize = compressedBytes.length
      const reduction = ((1 - compressedSize / file.size) * 100)
      
      console.log(`   Tamanho comprimido: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`)
      console.log(`   Redução: ${reduction.toFixed(1)}%`)
      
      // Só usar a versão comprimida se a redução for significativa (>5%)
      if (reduction > 5) {
        const compressedFile = new File([new Uint8Array(compressedBytes)], file.name, {
          type: 'application/pdf',
          lastModified: Date.now()
        })
        
        return compressedFile
      } else {
        console.log('   Redução não significativa, mantendo original')
        return file
      }
      
    } catch (error) {
      console.error('Erro na compressão do PDF:', error)
      console.log('Usando arquivo PDF original sem compressão')
      return file
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static getCompressionInfo(originalSize: number, compressedSize: number) {
    const reduction = ((1 - compressedSize / originalSize) * 100)
    return {
      originalSize: this.formatFileSize(originalSize),
      compressedSize: this.formatFileSize(compressedSize),
      reduction: reduction.toFixed(1) + '%',
      wasCompressed: reduction > 5 // Só considera comprimido se reduziu mais de 5%
    }
  }
}
