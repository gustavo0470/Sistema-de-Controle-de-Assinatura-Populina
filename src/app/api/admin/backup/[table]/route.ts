import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'
import ExcelJS from 'exceljs'

const allowed = {
  'users': { 
    columns:[{h:'Username',k:'username'},{h:'Nome',k:'name'},{h:'Role',k:'role'},{h:'Setor',k:'sectorName'},{h:'Criado',k:'createdAt'}], 
    fetch:()=>prisma.user.findMany({include:{sector:true}}).then(users=>users.map(u=>({...u,sectorName:u.sector.name})))
  },
  'sectors': { 
    columns:[{h:'Nome',k:'name'},{h:'Descrição',k:'description'},{h:'Total Usuários',k:'userCount'},{h:'Total Assinaturas',k:'signatureCount'}], 
    fetch:()=>prisma.sector.findMany({include:{_count:{select:{users:true,signatures:true}}}}).then(s=>s.map(sec=>({...sec,userCount:sec._count.users,signatureCount:sec._count.signatures})))
  },
  'signatures': { 
    columns:[{h:'ID',k:'incrementalId'},{h:'Motivo',k:'reason'},{h:'Token',k:'token'},{h:'Servidor',k:'serverName'},{h:'Setor',k:'sectorName'},{h:'Usuário',k:'userName'},{h:'Criado',k:'createdAt'}], 
    fetch:()=>prisma.signature.findMany({include:{user:true,sector:true}}).then(sigs=>sigs.map(s=>({...s,userName:s.user.name})))
  },
  'requests': { 
    columns:[{h:'Tipo',k:'type'},{h:'Status',k:'status'},{h:'Motivo',k:'reason'},{h:'Usuário',k:'userName'},{h:'Assinatura',k:'signatureReason'},{h:'Respondido por',k:'respondedByName'},{h:'Criado',k:'createdAt'}], 
    fetch:()=>prisma.request.findMany({include:{user:true,signature:true,respondedBy:true}}).then(reqs=>reqs.map(r=>({...r,userName:r.user.name,signatureReason:r.signature.reason,respondedByName:r.respondedBy?.name||'N/A'})))
  },
  'chat-messages': { 
    columns:[{h:'De',k:'fromUserName'},{h:'Para',k:'toUserName'},{h:'Mensagem',k:'message'},{h:'Lida',k:'isRead'},{h:'Criado',k:'createdAt'}], 
    fetch:async()=>{
      const msgs = await prisma.chatMessage.findMany({orderBy:{createdAt:'desc'},take:500})
      return Promise.all(msgs.map(async m=>{
        let fromUserName = m.fromUserId.startsWith('guest-') ? `Visitante (${m.fromUserId.replace('guest-','')})` : 'N/A'
        let toUserName = m.toUserId.startsWith('guest-') ? `Visitante (${m.toUserId.replace('guest-','')})` : 'N/A'
        
        if(!m.fromUserId.startsWith('guest-')){
          const user = await prisma.user.findUnique({where:{id:m.fromUserId},select:{name:true}})
          if(user) fromUserName = user.name
        }
        if(!m.toUserId.startsWith('guest-')){
          const user = await prisma.user.findUnique({where:{id:m.toUserId},select:{name:true}})
          if(user) toUserName = user.name
        }
        
        return {...m,fromUserName,toUserName}
      }))
    }
  }
} as const

type TableKey = keyof typeof allowed

export const GET = requireAdmin(async (_req: NextRequest, ctx:{params:{table:TableKey}})=>{
  const { table } = ctx.params
  if(!allowed[table]) return NextResponse.json({success:false,error:'Tabela não permitida'},{status:400})

  const data = await allowed[table].fetch()
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(table)
  ws.columns = allowed[table].columns.map(c=>({header:c.h,key:c.k,width:20}))
  data.forEach((row:any)=>ws.addRow(row))
  const buf = await wb.xlsx.writeBuffer()
  const filename = `${table}-${new Date().toISOString().slice(0,10)}.xlsx`
  const res = new NextResponse(buf)
  res.headers.set('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.headers.set('Content-Disposition',`attachment; filename="${filename}"`)
  return res
})
