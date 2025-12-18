import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { OpenAITools, type ToolName } from '@/core/ai/agent/tools'
import {
  ListItemsArgsSchema,
  CreateItemArgsSchema,
  UpdateItemArgsSchema,
  DeleteItemArgsSchema,
  ListInboxArgsSchema,
  ListSuggestionsArgsSchema,
  ApproveSuggestionsArgsSchema,
  RunExtractionArgsSchema,
} from '@/core/ai/agent/tools'
import { createConfirmToken, verifyConfirmToken } from '@/core/ai/confirmToken'
import { getFamilyItems, updateFamilyItem, deleteFamilyItem, createFamilyItem } from '@/core/db/repositories/familyItems'
import { listSuggestions, approveSuggestions } from '@/core/db/repositories/suggestions'
import { getSourceMessageById } from '@/core/db/repositories/sourceMessages'
import { getDocumentsBySourceMessage } from '@/core/db/repositories/documents'
import { EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_PROMPT_TEMPLATE } from '@/core/ai/prompts/extraction'
import { createExtractionWithSuggestions } from '@/core/db/repositories/extractions'
import { logAgentAction } from '@/core/db/repositories/agentActions'
import { getSupabaseClient } from '@/core/db/client'
import { listSourceMessages } from '@/core/db/repositories/sourceMessages'

export const dynamic = 'force-dynamic'

const ChatRequestSchema = z.object({
  message: z.string().min(1).optional(),
  confirmToken: z.string().optional(),
})

type RiskLevel = 'low' | 'medium' | 'high'

function isRisky(action: ToolName, args: any): { risky: boolean; riskLevel: RiskLevel; description: string } {
  switch (action) {
    case 'delete_item':
      return { risky: true, riskLevel: 'high', description: `Delete item ${args.id}` }
    case 'update_item': {
      const changingDates = 'start_at' in args || 'end_at' in args || 'deadline_at' in args
      if (changingDates) {
        return { risky: true, riskLevel: 'medium', description: `Change date/time fields on item ${args.id}` }
      }
      return { risky: false, riskLevel: 'low', description: `Update item ${args.id}` }
    }
    case 'approve_suggestions': {
      const count = Array.isArray(args.suggestionIds) ? args.suggestionIds.length : 0
      if (count > 5) {
        return { risky: true, riskLevel: 'medium', description: `Approve ${count} suggestions` }
      }
      return { risky: false, riskLevel: 'low', description: `Approve ${count} suggestions` }
    }
    default:
      return { risky: false, riskLevel: 'low', description: action }
  }
}

async function openAIChat(params: {
  messages: any[]
  tools?: any[]
  toolChoice?: 'auto' | 'none'
}) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      messages: params.messages,
      tools: params.tools,
      tool_choice: params.toolChoice || 'auto',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI error: ${text}`)
  }
  return (await res.json()) as any
}

async function executeTool(params: {
  userId: string
  name: ToolName
  args: any
  actor: 'ai' | 'user'
}) {
  const { userId, name, args, actor } = params
  const supabase = await getSupabaseClient()

  switch (name) {
    case 'list_items': {
      const parsed = ListItemsArgsSchema.parse(args)
      const result = await getFamilyItems(userId, {
        status: parsed.status,
        type: parsed.type,
        limit: parsed.limit || 25,
      })
      return { items: result.items, total: result.total }
    }
    case 'create_item': {
      const parsed = CreateItemArgsSchema.parse(args)
      const item = await createFamilyItem(
        userId,
        {
          type: parsed.type,
          title: parsed.title,
          description: parsed.description ?? undefined,
          start_at: parsed.start_at ?? null,
          end_at: parsed.end_at ?? null,
          deadline_at: parsed.deadline_at ?? null,
          status: 'open',
          priority: parsed.priority ?? null,
          checklist: undefined,
          tags: undefined,
        },
        'chat'
      )
      await logAgentAction({
        user_id: userId,
        actor,
        action_type: 'create_family_item',
        target_table: 'family_items',
        target_id: item.id,
        before_json: null,
        after_json: item,
        diff_json: null,
      })
      return { item }
    }
    case 'update_item': {
      const parsed = UpdateItemArgsSchema.parse(args)
      const { data: beforeRow } = await supabase
        .from('family_items')
        .select('*')
        .eq('user_id', userId)
        .eq('id', parsed.id)
        .single()
      const updated = await updateFamilyItem(userId, parsed.id, {
        title: parsed.title,
        description: parsed.description === undefined ? undefined : parsed.description,
        start_at: parsed.start_at === undefined ? undefined : parsed.start_at,
        end_at: parsed.end_at === undefined ? undefined : parsed.end_at,
        deadline_at: parsed.deadline_at === undefined ? undefined : parsed.deadline_at,
        status: parsed.status,
        priority: parsed.priority === undefined ? undefined : (parsed.priority as any),
      })
      await logAgentAction({
        user_id: userId,
        actor,
        action_type: 'update_family_item',
        target_table: 'family_items',
        target_id: updated.id,
        before_json: beforeRow ?? null,
        after_json: updated,
        diff_json: null,
      })
      return { item: updated }
    }
    case 'delete_item': {
      const parsed = DeleteItemArgsSchema.parse(args)
      const { data: beforeRow } = await supabase
        .from('family_items')
        .select('*')
        .eq('user_id', userId)
        .eq('id', parsed.id)
        .single()
      await deleteFamilyItem(userId, parsed.id)
      await logAgentAction({
        user_id: userId,
        actor,
        action_type: 'delete_family_item',
        target_table: 'family_items',
        target_id: parsed.id,
        before_json: beforeRow ?? null,
        after_json: null,
        diff_json: null,
      })
      return { deleted: true }
    }
    case 'list_inbox': {
      const parsed = ListInboxArgsSchema.parse(args)
      const messages = await listSourceMessages(userId, parsed.limit || 25)
      return {
        messages: messages.map((m) => ({
          id: m.id,
          provider: m.provider,
          subject: m.subject,
          sender_email: m.sender_email,
          received_at: m.received_at,
          created_at: m.created_at,
        })),
      }
    }
    case 'list_suggestions': {
      const parsed = ListSuggestionsArgsSchema.parse(args)
      const suggestions = await listSuggestions(userId, [parsed.state])
      return { suggestions: parsed.limit ? suggestions.slice(0, parsed.limit) : suggestions }
    }
    case 'approve_suggestions': {
      const parsed = ApproveSuggestionsArgsSchema.parse(args)
      const { familyItems } = await approveSuggestions({ userId, suggestionIds: parsed.suggestionIds })
      for (const item of familyItems) {
        await logAgentAction({
          user_id: userId,
          actor,
          action_type: 'create_family_item',
          target_table: 'family_items',
          target_id: item.id,
          before_json: null,
          after_json: item,
          diff_json: null,
        })
      }
      return { familyItems }
    }
    case 'run_extraction': {
      const parsed = RunExtractionArgsSchema.parse(args)
      const sourceMessage = await getSourceMessageById(userId, parsed.sourceMessageId)
      if (!sourceMessage) throw new Error('Source message not found')
      const documents = await getDocumentsBySourceMessage(userId, parsed.sourceMessageId)

      const promptUser = EXTRACTION_USER_PROMPT_TEMPLATE({
        emailSubject: sourceMessage.subject,
        emailBody: sourceMessage.body_text,
        senderName: sourceMessage.sender_name || '',
        senderEmail: sourceMessage.sender_email,
        receivedAt: sourceMessage.received_at || new Date().toISOString(),
        timezone: 'UTC',
        kids: [],
        activities: [],
        documentTexts: documents
          .filter((d) => !!d.text_content)
          .map((d) => ({ filename: d.filename, text: d.text_content || '' })),
      })

      const completion = await openAIChat({
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: promptUser },
        ],
        toolChoice: 'none',
      })
      const content = completion.choices?.[0]?.message?.content
      if (!content) throw new Error('No content from OpenAI')
      const parsedJson = JSON.parse(content)

      const { extraction, suggestions } = await createExtractionWithSuggestions({
        userId,
        sourceMessage,
        extractorVersion: 'v1',
        inputSnapshot: { sourceMessage, documents: documents.map((d) => ({ id: d.id, filename: d.filename })) },
        output: parsedJson,
      })

      return { extractionId: extraction.id, suggestions }
    }
    default:
      throw new Error(`Unsupported tool ${name}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsedReq = ChatRequestSchema.parse(body)

    // Confirm flow: execute a previously proposed risky action.
    if (parsedReq.confirmToken) {
      const payload = verifyConfirmToken(parsedReq.confirmToken)
      if (payload.userId !== user.id) {
        return NextResponse.json({ error: 'Invalid confirm token user' }, { status: 403 })
      }
      const toolName = payload.action as ToolName
      const result = await executeTool({ userId: user.id, name: toolName, args: payload.args, actor: 'user' })
      return NextResponse.json({
        response: 'Done. I applied the confirmed change.',
        requiresConfirm: false,
        toolCalls: [{ tool: toolName, result }],
      })
    }

    if (!parsedReq.message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    // Provide lightweight context
    const items = await getFamilyItems(user.id, { limit: 20, offset: 0 })
    const suggestions = await listSuggestions(user.id, ['new'])

    const system = `You are Kiddos Assistant.\n\nRules:\n- Use tools to read/write data.\n- Never delete items or change date/time fields without confirmation.\n- For bulk mutations (>5), require confirmation.\n- If you need confirmation, explain what you want to do and wait.\n`

    const context = `Context:\n- Recent items (max 20): ${JSON.stringify(items.items)}\n- New suggestions: ${JSON.stringify(suggestions.slice(0, 20))}\n`

    const completion = await openAIChat({
      messages: [
        { role: 'system', content: system },
        { role: 'system', content: context },
        { role: 'user', content: parsedReq.message },
      ],
      tools: OpenAITools as any,
      toolChoice: 'auto',
    })

    const msg = completion.choices?.[0]?.message
    const toolCalls = msg?.tool_calls

    if (!toolCalls || toolCalls.length === 0) {
      return NextResponse.json({ response: msg?.content || '', requiresConfirm: false })
    }

    const toolCall = toolCalls[0]
    const toolName = toolCall.function?.name as ToolName
    const rawArgs = toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {}

    const risk = isRisky(toolName, rawArgs)
    if (risk.risky) {
      const token = createConfirmToken({
        userId: user.id,
        action: toolName,
        args: rawArgs,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      return NextResponse.json({
        response: `I can do that, but it needs confirmation: ${risk.description}.`,
        requiresConfirm: true,
        confirmToken: token,
        pendingAction: {
          type: toolName,
          description: risk.description,
          riskLevel: risk.riskLevel,
        },
      })
    }

    const result = await executeTool({ userId: user.id, name: toolName, args: rawArgs, actor: 'ai' })

    // Ask model to summarize result
    const final = await openAIChat({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: parsedReq.message },
        msg,
        { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result) },
      ],
      tools: OpenAITools as any,
      toolChoice: 'none',
    })

    const finalText = final.choices?.[0]?.message?.content || 'Done.'
    return NextResponse.json({
      response: finalText,
      requiresConfirm: false,
      toolCalls: [{ tool: toolName, result }],
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
