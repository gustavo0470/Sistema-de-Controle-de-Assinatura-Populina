import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { User, UserRole } from '@prisma/client'

export interface AuthUser {
  id: string
  username: string
  name: string
  role: UserRole
  sectorId: string
  isFirstLogin: boolean
}

export async function validateUser(username: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { sector: true }
    })

    if (!user) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      sectorId: user.sectorId,
      isFirstLogin: user.isFirstLogin
    }
  } catch (error) {
    console.error('Erro na validação do usuário:', error)
    return null
  }
}

export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isFirstLogin: false
      }
    })

    return true
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return false
  }
}

export async function validateSecurityAnswer(username: string, answer: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user?.securityAnswer) {
      return false
    }

    return await bcrypt.compare(answer, user.securityAnswer)
  } catch (error) {
    console.error('Erro na validação da resposta de segurança:', error)
    return false
  }
}

export async function updateSecurityQuestion(userId: string, question: string, answer: string): Promise<boolean> {
  try {
    const hashedAnswer = await bcrypt.hash(answer, 12)
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        securityQuestion: question,
        securityAnswer: hashedAnswer
      }
    })

    return true
  } catch (error) {
    console.error('Erro ao atualizar pergunta de segurança:', error)
    return false
  }
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT
}

export function canManageUsers(user: AuthUser): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT
}
