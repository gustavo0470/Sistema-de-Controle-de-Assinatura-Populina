import { PrismaClient } from '@prisma/client'

// Cliente Prisma robusto com retry automático e connection pooling
class RobustPrismaClient {
  private static instance: RobustPrismaClient
  private client: PrismaClient
  private retryAttempts = 3
  private retryDelay = 1000

  private constructor() {
    this.client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: ['error', 'warn']
    })
  }

  public static getInstance(): RobustPrismaClient {
    if (!RobustPrismaClient.instance) {
      RobustPrismaClient.instance = new RobustPrismaClient()
    }
    return RobustPrismaClient.instance
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error
        
        // Se é erro de conectividade (P1001), tenta novamente
        if (error.code === 'P1001' && attempt < this.retryAttempts) {
          console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${this.retryDelay}ms...`)
          await this.delay(this.retryDelay * attempt) // Exponential backoff
          continue
        }
        
        // Para outros erros, não tenta novamente
        throw error
      }
    }

    throw lastError
  }

  // Wrapper para operações do Prisma
  async user() {
    return {
      findUnique: (args: any) => this.executeWithRetry(() => this.client.user.findUnique(args)),
      findMany: (args: any) => this.executeWithRetry(() => this.client.user.findMany(args)),
      create: (args: any) => this.executeWithRetry(() => this.client.user.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.client.user.update(args)),
      delete: (args: any) => this.executeWithRetry(() => this.client.user.delete(args)),
      deleteMany: (args: any) => this.executeWithRetry(() => this.client.user.deleteMany(args)),
      count: (args: any) => this.executeWithRetry(() => this.client.user.count(args)),
    }
  }

  async sector() {
    return {
      findUnique: (args: any) => this.executeWithRetry(() => this.client.sector.findUnique(args)),
      findMany: (args: any) => this.executeWithRetry(() => this.client.sector.findMany(args)),
      create: (args: any) => this.executeWithRetry(() => this.client.sector.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.client.sector.update(args)),
      delete: (args: any) => this.executeWithRetry(() => this.client.sector.delete(args)),
      count: (args: any) => this.executeWithRetry(() => this.client.sector.count(args)),
    }
  }

  async signature() {
    return {
      findUnique: (args: any) => this.executeWithRetry(() => this.client.signature.findUnique(args)),
      findMany: (args: any) => this.executeWithRetry(() => this.client.signature.findMany(args)),
      create: (args: any) => this.executeWithRetry(() => this.client.signature.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.client.signature.update(args)),
      delete: (args: any) => this.executeWithRetry(() => this.client.signature.delete(args)),
      count: (args: any) => this.executeWithRetry(() => this.client.signature.count(args)),
    }
  }

  async request() {
    return {
      findUnique: (args: any) => this.executeWithRetry(() => this.client.request.findUnique(args)),
      findMany: (args: any) => this.executeWithRetry(() => this.client.request.findMany(args)),
      findFirst: (args: any) => this.executeWithRetry(() => this.client.request.findFirst(args)),
      create: (args: any) => this.executeWithRetry(() => this.client.request.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.client.request.update(args)),
      delete: (args: any) => this.executeWithRetry(() => this.client.request.delete(args)),
      count: (args: any) => this.executeWithRetry(() => this.client.request.count(args)),
    }
  }

  async chatMessage() {
    return {
      findUnique: (args: any) => this.executeWithRetry(() => this.client.chatMessage.findUnique(args)),
      findMany: (args: any) => this.executeWithRetry(() => this.client.chatMessage.findMany(args)),
      findFirst: (args: any) => this.executeWithRetry(() => this.client.chatMessage.findFirst(args)),
      create: (args: any) => this.executeWithRetry(() => this.client.chatMessage.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.client.chatMessage.update(args)),
      updateMany: (args: any) => this.executeWithRetry(() => this.client.chatMessage.updateMany(args)),
      delete: (args: any) => this.executeWithRetry(() => this.client.chatMessage.delete(args)),
      deleteMany: (args: any) => this.executeWithRetry(() => this.client.chatMessage.deleteMany(args)),
      count: (args: any) => this.executeWithRetry(() => this.client.chatMessage.count(args)),
    }
  }

  async signatureAttachment() {
    return {
      findUnique: (args: any) => this.executeWithRetry(() => this.client.signatureAttachment.findUnique(args)),
      findMany: (args: any) => this.executeWithRetry(() => this.client.signatureAttachment.findMany(args)),
      findFirst: (args: any) => this.executeWithRetry(() => this.client.signatureAttachment.findFirst(args)),
      create: (args: any) => this.executeWithRetry(() => this.client.signatureAttachment.create(args)),
      update: (args: any) => this.executeWithRetry(() => this.client.signatureAttachment.update(args)),
      delete: (args: any) => this.executeWithRetry(() => this.client.signatureAttachment.delete(args)),
      deleteMany: (args: any) => this.executeWithRetry(() => this.client.signatureAttachment.deleteMany(args)),
      count: (args: any) => this.executeWithRetry(() => this.client.signatureAttachment.count(args)),
    }
  }

  // Método para testar conectividade
  async testConnection(): Promise<boolean> {
    try {
      await this.executeWithRetry(() => this.client.$queryRaw`SELECT 1`)
      return true
    } catch (error) {
      console.error('Falha no teste de conectividade:', error)
      return false
    }
  }

  // Método para fechar conexão
  async disconnect() {
    await this.client.$disconnect()
  }
}

// Exportar instância singleton
export const robustPrisma = RobustPrismaClient.getInstance()
export default robustPrisma

