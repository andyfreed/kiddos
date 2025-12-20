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
  ListKidsArgsSchema,
  RenameKidArgsSchema,
  UpdateKidArgsSchema,
  DeleteKidArgsSchema,
  GetItemLinksArgsSchema,
  LinkItemToKidsArgsSchema,
  UnlinkItemFromKidsArgsSchema,
  SetItemActivityArgsSchema,
  ClearItemActivityArgsSchema,
  ListActivitiesArgsSchema,
  CreateActivityArgsSchema,
  UpdateActivityArgsSchema,
  DeleteActivityArgsSchema,
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
import { getKids, updateKid, deleteKid } from '@/core/db/repositories/kids'
import { listActivities, createActivity, updateActivity, deleteActivity, upsertActivityByName } from '@/core/db/repositories/activities'
import {
  listLinksForItem,
  linkItemToKids,
  unlinkItemFromKids,
  setItemActivity,
  clearItemActivity,
} from '@/core/db/repositories/familyItemLinks'

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
    case 'delete_kid':
      return { risky: true, riskLevel: 'high', description: `Delete kid ${args.id}` }
    case 'delete_activity':
      return { risky: true, riskLevel: 'high', description: `Delete activity ${args.id}` }
    case 'rename_kid':
      return { risky: true, riskLevel: 'medium', description: `Rename kid "${args.fromName}" to "${args.toName}"` }
    case 'update_kid': {
      const changingName = 'name' in args
      if (changingName) {
        return { risky: true, riskLevel: 'medium', description: `Update kid ${args.id} (including name)` }
      }
      return { risky: false, riskLevel: 'low', description: `Update kid ${args.id}` }
    }
    case 'unlink_item_from_kids': {
      const count = Array.isArray(args.kidIds) ? args.kidIds.length : 0
      const bulk = count > 5
      return { risky: true, riskLevel: bulk ? 'medium' : 'medium', description: `Unlink item ${args.itemId} from ${count || 'some'} kid(s)` }
    }
    case 'clear_item_activity':
      return { risky: true, riskLevel: 'medium', description: `Clear activity for item ${args.itemId}` }
    case 'set_item_activity': {
      // Setting/replacing is usually safe, but bulk or replacing an existing activity can be sensitive.
      return { risky: false, riskLevel: 'low', description: `Set activity for item ${args.itemId}` }
    }
    case 'update_item': {
      const changingDates = 'start_at' in args || 'end_at' in args || 'deadline_at' in args
      if (changingDates) {
        return { risky: true, riskLevel: 'medium', description: `Change date/time fields on item ${args.id}` }
      }
      return { risky: false, riskLevel: 'low', description: `Update item ${args.id}` }
    }
    case 'update_activity': {
      const renaming = 'name' in args
      if (renaming) {
        return { risky: true, riskLevel: 'medium', description: `Rename/update activity ${args.id}` }
      }
      return { risky: false, riskLevel: 'low', description: `Update activity ${args.id}` }
    }
    case 'approve_suggestions': {
      const count = Array.isArray(args.suggestionIds) ? args.suggestionIds.length : 0
      if (count > 5) {
        return { risky: true, riskLevel: 'medium', description: `Approve ${count} suggestions` }
      }
      return { risky: false, riskLevel: 'low', description: `Approve ${count} suggestions` }
    }
    case 'link_item_to_kids': {
      const count = Array.isArray(args.kidIds) ? args.kidIds.length : 0
      if (count > 5) return { risky: true, riskLevel: 'medium', description: `Link item ${args.itemId} to ${count} kids` }
      return { risky: false, riskLevel: 'low', description: `Link item ${args.itemId} to kid(s)` }
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
    case 'list_kids': {
      const parsed = ListKidsArgsSchema.parse(args)
      const kids = await getKids(userId)
      const limited = parsed.limit ? kids.slice(0, parsed.limit) : kids
      return {
        kids: limited.map((k) => ({
          id: k.id,
          name: k.name,
          grade: k.grade,
          birthday: k.birthday,
        })),
      }
    }
    case 'rename_kid': {
      const parsed = RenameKidArgsSchema.parse(args)
      const kids = await getKids(userId)
      const from = parsed.fromName.trim().toLowerCase()
      const matches = kids.filter((k) => k.name.trim().toLowerCase() === from)
      if (matches.length === 0) {
        return { ok: false, message: `No kid found with name "${parsed.fromName}".`, kids: kids.map((k) => ({ id: k.id, name: k.name })) }
      }
      if (matches.length > 1) {
        return { ok: false, message: `Multiple kids match "${parsed.fromName}". Please specify which one by id.`, matches: matches.map((k) => ({ id: k.id, name: k.name })) }
      }
      const kid = matches[0]
      const updated = await updateKid(userId, kid.id, { name: parsed.toName })
      await logAgentAction({
        user_id: userId,
        actor,
        action_type: 'update_kid',
        target_table: 'kids',
        target_id: updated.id,
        before_json: kid,
        after_json: updated,
        diff_json: { name: { from: kid.name, to: updated.name } },
      })
      return { ok: true, kid: updated }
    }
    case 'update_kid': {
      const parsed = UpdateKidArgsSchema.parse(args)
      const { data: beforeRow } = await supabase
        .from('kids')
        .select('*')
        .eq('user_id', userId)
        .eq('id', parsed.id)
        .single()
      const updated = await updateKid(userId, parsed.id, {
        name: parsed.name,
        birthday: parsed.birthday === undefined ? undefined : parsed.birthday,
        grade: parsed.grade === undefined ? undefined : parsed.grade,
        notes: parsed.notes === undefined ? undefined : parsed.notes,
      })
      await logAgentAction({
        user_id: userId,
        actor,
        action_type: 'update_kid',
        target_table: 'kids',
        target_id: updated.id,
        before_json: beforeRow ?? null,
        after_json: updated,
        diff_json: null,
      })
      return { kid: updated }
    }
    case 'delete_kid': {
      const parsed = DeleteKidArgsSchema.parse(args)
      const { data: beforeRow } = await supabase
        .from('kids')
        .select('*')
        .eq('user_id', userId)
        .eq('id', parsed.id)
        .single()
      await deleteKid(userId, parsed.id)
      await logAgentAction({
        user_id: userId,
        actor,
        action_type: 'delete_kid',
        target_table: 'kids',
        target_id: parsed.id,
        before_json: beforeRow ?? null,
        after_json: null,
        diff_json: null,
      })
      return { deleted: true }
    }
    case 'get_item_links': {
      const parsed = GetItemLinksArgsSchema.parse(args)
      const links = await listLinksForItem(userId, parsed.itemId)
      const kidIds = Array.from(new Set(links.map((l) => l.kid_id).filter(Boolean) as string[]))
      const activityIds = Array.from(new Set(links.map((l) => l.activity_id).filter(Boolean) as string[]))
      return { itemId: parsed.itemId, kidIds, activityIds, links }
    }
    case 'link_item_to_kids': {
      const parsed = LinkItemToKidsArgsSchema.parse(args)
      const { created } = await linkItemToKids(userId, parsed.itemId, parsed.kidIds)
      for (const link of created) {
        await logAgentAction({
          user_id: userId,
          actor,
          action_type: 'link_item_to_kid',
          target_table: 'family_item_links',
          target_id: link.id,
          before_json: null,
          after_json: link,
          diff_json: null,
        })
      }
      return { createdCount: created.length, created }
    }
    case 'unlink_item_from_kids': {
      const parsed = UnlinkItemFromKidsArgsSchema.parse(args)
      const { deleted } = await unlinkItemFromKids(userId, parsed.itemId, parsed.kidIds)
      for (const link of deleted) {
        await logAgentAction({
          user_id: userId,
          actor,
          action_type: 'unlink_item_from_kid',
          target_table: 'family_item_links',
          target_id: link.id,
          before_json: link,
          after_json: null,
          diff_json: null,
        })
      }
      return { deletedCount: deleted.length, deleted }
    }
    case 'set_item_activity': {
      const parsed = SetItemActivityArgsSchema.parse(args)
      const result = await setItemActivity({
        userId,
        familyItemId: parsed.itemId,
        activityId: parsed.activityId ?? null,
        activityName: parsed.activityName ?? null,
      })
      for (const link of result.replaced) {
        await logAgentAction({
          user_id: userId,
          actor,
          action_type: 'clear_item_activity',
          target_table: 'family_item_links',
          target_id: link.id,
          before_json: link,
          after_json: null,
          diff_json: null,
        })
      }
      await logAgentAction({
        user_id: userId,
        actor,
        action_type: 'set_item_activity',
        target_table: 'family_item_links',
        target_id: result.created.id,
        before_json: null,
        after_json: result.created,
        diff_json: null,
      })
      return { replacedCount: result.replaced.length, created: result.created }
    }
    case 'clear_item_activity': {
      const parsed = ClearItemActivityArgsSchema.parse(args)
      const { deleted } = await clearItemActivity(userId, parsed.itemId)
      for (const link of deleted) {
        await logAgentAction({
          user_id: userId,
          actor,
          action_type: 'clear_item_activity',
          target_table: 'family_item_links',
          target_id: link.id,
          before_json: link,
          after_json: null,
          diff_json: null,
        })
      }
      return { deletedCount: deleted.length, deleted }
    }
    case 'list_activities': {
      const parsed = ListActivitiesArgsSchema.parse(args)
      const activities = await listActivities(userId, parsed.limit || 200)
      return {
        activities: activities.map((a) => ({ id: a.id, name: a.name, notes: a.notes })),
      }
    }
    case 'create_activity': {
      const parsed = CreateActivityArgsSchema.parse(args)
      const activity = await createActivity(userId, { name: parsed.name, notes: parsed.notes ?? null })
      await logAgentAction({
        user_id: userId,
        actor,
        action_type: 'create_activity',
        target_table: 'activities',
        target_id: activity.id,
        before_json: null,
        after_json: activity,
        diff_json: null,
      })
      return { activity }
    }
    case 'update_activity': {
      const parsed = UpdateActivityArgsSchema.parse(args)
      const { data: beforeRow } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .eq('id', parsed.id)
        .single()
      const activity = await updateActivity(userId, parsed.id, {
        name: parsed.name,
        notes: parsed.notes === undefined ? undefined : parsed.notes,
      })
      await logAgentAction({
        user_id: userId,
        actor,
        action_type: 'update_activity',
        target_table: 'activities',
        target_id: activity.id,
        before_json: beforeRow ?? null,
        after_json: activity,
        diff_json: null,
      })
      return { activity }
    }
    case 'delete_activity': {
      const parsed = DeleteActivityArgsSchema.parse(args)
      const { data: beforeRow } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .eq('id', parsed.id)
        .single()
      await deleteActivity(userId, parsed.id)
      await logAgentAction({
        user_id: userId,
        actor,
        action_type: 'delete_activity',
        target_table: 'activities',
        target_id: parsed.id,
        before_json: beforeRow ?? null,
        after_json: null,
        diff_json: null,
      })
      return { deleted: true }
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
      const kids = await getKids(userId)
      const activities = await listActivities(userId)

      const promptUser = EXTRACTION_USER_PROMPT_TEMPLATE({
        emailSubject: sourceMessage.subject,
        emailBody: sourceMessage.body_text,
        senderName: sourceMessage.sender_name || '',
        senderEmail: sourceMessage.sender_email,
        receivedAt: sourceMessage.received_at || new Date().toISOString(),
        timezone: 'UTC',
        kids: kids.map((k) => ({ id: k.id, name: k.name, birthday: k.birthday || undefined, grade: k.grade || undefined })),
        activities: activities.map((a) => ({ id: a.id, name: a.name })),
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

      // Best-effort: ensure suggested activity templates exist
      try {
        const activityNames: string[] = (Array.isArray(parsedJson?.suggestions) ? parsedJson.suggestions : [])
          .map((s: any) => s?.suggested_activity_name)
          .filter((n: any): n is string => typeof n === 'string' && n.trim().length > 0)
        const unique: string[] = Array.from(new Set(activityNames.map((n) => n.trim())))
        for (const name of unique) {
          await upsertActivityByName(userId, name)
        }
      } catch {
        // ignore
      }

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

    // Confirm flow: execute a previously proposed risky action (and optionally continue).
    if (parsedReq.confirmToken) {
      const payload = verifyConfirmToken(parsedReq.confirmToken)
      if (payload.userId !== user.id) {
        return NextResponse.json({ error: 'Invalid confirm token user' }, { status: 403 })
      }
      const toolName = payload.action as ToolName
      const results: Array<{ tool: string; result: any }> = []
      const first = await executeTool({ userId: user.id, name: toolName, args: payload.args, actor: 'user' })
      results.push({ tool: toolName, result: first })

      // Continue executing any remaining tool calls until a new risky action is encountered.
      const remaining = (payload as any)?.remainingToolCalls as any[] | undefined
      if (Array.isArray(remaining) && remaining.length) {
        for (let idx = 0; idx < remaining.length; idx++) {
          const next = remaining[idx]
          const nextName = next?.name as ToolName
          const nextArgs = next?.args ?? {}
          const risk = isRisky(nextName, nextArgs)
          if (risk.risky) {
            const token = createConfirmToken({
              userId: user.id,
              action: nextName,
              args: nextArgs,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
              remainingToolCalls: remaining.slice(idx + 1),
            } as any)
            return NextResponse.json({
              response: `I applied the confirmed change. Next I can do this, but it needs confirmation: ${risk.description}.`,
              requiresConfirm: true,
              confirmToken: token,
              pendingAction: {
                type: nextName,
                description: risk.description,
                riskLevel: risk.riskLevel,
              },
              toolCalls: results,
            })
          }
          const r = await executeTool({ userId: user.id, name: nextName, args: nextArgs, actor: 'user' })
          results.push({ tool: nextName, result: r })
        }
      }

      return NextResponse.json({
        response: 'Done. I applied the confirmed change.',
        requiresConfirm: false,
        toolCalls: results,
      })
    }

    if (!parsedReq.message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    // Provide lightweight context
    const items = await getFamilyItems(user.id, { limit: 20, offset: 0 })
    const suggestions = await listSuggestions(user.id, ['new'])
    const kids = await getKids(user.id)
    const activities = await listActivities(user.id)

    const system = `You are Kiddos Assistant.\n\nYou can help manage:\n- Kids (rename/update/delete)\n- Activities (create/update/delete)\n- Items (tasks/events/deadlines)\n- Relationships between items and kids/activities\n- Inbox + extraction + suggestions\n\nNon-negotiable rules:\n- ALWAYS use tools for ANY data mutation. Do not just “talk about” making changes.\n- If a user asks to change data (rename/update/link/etc.), call the appropriate tool with the intended arguments.\n- The server may respond that confirmation is required for risky operations. If confirmation is required, stop and wait.\n\nSafety rules:\n- Never delete anything or change date/time fields without confirmation.\n- Renaming activities and kids requires confirmation.\n- Unlinking relationships requires confirmation.\n- For bulk mutations (>5), require confirmation.\n\nExamples:\n- User: “Change Isla’s name to Isla Bear” -> call rename_kid({fromName:\"Isla\", toName:\"Isla Bear\"}).\n- User: “Link this item to Isla” -> call link_item_to_kids({itemId:\"...\", kidIds:[\"...\"]}) after identifying ids from context.\n`

    const context = `Context:\n- Kids: ${JSON.stringify(kids.map((k) => ({ id: k.id, name: k.name })))}\n- Activities: ${JSON.stringify(activities.map((a) => ({ id: a.id, name: a.name })))}\n- Recent items (max 20): ${JSON.stringify(items.items)}\n- New suggestions: ${JSON.stringify(suggestions.slice(0, 20))}\n`

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

    // Execute tool calls in order until a risky action is hit.
    const executed: Array<{ id: string; name: ToolName; args: any; result: any }> = []
    for (let i = 0; i < toolCalls.length; i++) {
      const tc = toolCalls[i]
      const name = tc.function?.name as ToolName
      const args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {}
      const risk = isRisky(name, args)
      if (risk.risky) {
        const remainingToolCalls = toolCalls
          .slice(i + 1)
          .map((t: any) => ({
            name: t?.function?.name,
            args: t?.function?.arguments ? JSON.parse(t.function.arguments) : {},
          }))
        const token = createConfirmToken({
          userId: user.id,
          action: name,
          args,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          remainingToolCalls,
        } as any)
        return NextResponse.json({
          response: `I can do that, but it needs confirmation: ${risk.description}.`,
          requiresConfirm: true,
          confirmToken: token,
          pendingAction: {
            type: name,
            description: risk.description,
            riskLevel: risk.riskLevel,
          },
          toolCalls: executed.map((e) => ({ tool: e.name, result: e.result })),
        })
      }
      const result = await executeTool({ userId: user.id, name, args, actor: 'ai' })
      executed.push({ id: tc.id, name, args, result })
    }

    // Ask model to summarize results (can include multiple tool outputs)
    const toolMessages: any[] = executed.map((e) => ({
      role: 'tool',
      tool_call_id: e.id,
      content: JSON.stringify(e.result),
    }))

    const final = await openAIChat({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: parsedReq.message },
        msg,
        ...toolMessages,
      ],
      tools: OpenAITools as any,
      toolChoice: 'none',
    })

    const finalText = final.choices?.[0]?.message?.content || 'Done.'
    return NextResponse.json({
      response: finalText,
      requiresConfirm: false,
      toolCalls: executed.map((e) => ({ tool: e.name, result: e.result })),
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
