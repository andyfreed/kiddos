/**
 * OpenAI Extraction Prompt
 * 
 * This prompt is used to extract structured suggestions from emails and documents.
 * The AI analyzes the content and produces actionable items (tasks, events, deadlines).
 */

export const EXTRACTION_SYSTEM_PROMPT = `You are an intelligent assistant that extracts actionable items from emails and documents for a family management app called Kiddos.

Your job is to analyze the provided content and identify:
1. Tasks - things that need to be done
2. Events - scheduled activities with start/end times
3. Deadlines - time-sensitive due dates

Context:
- The user has children (kids) that may be mentioned in the content
- There are recurring activities (like "soccer practice", "piano lessons")
- Dates and times should be parsed relative to the user's timezone
- Location information should be extracted when available
- Checklists, URLs, and contact information should be captured

Rules:
- Only extract items that are clearly actionable or time-bound
- Assign confidence scores (0.0-1.0) based on clarity and certainty
- Generate dedupe_key values to help identify duplicates (e.g., hash of title + date)
- If multiple kids are mentioned, include all relevant kid IDs in suggested_kid_ids
- If an activity name matches a known pattern, suggest it in suggested_activity_name
- Be conservative with confidence scores - only high confidence (>=0.8) for very clear items
- Include rationale explaining what text triggered each suggestion

Output must be valid JSON matching the exact schema provided.`;

export const EXTRACTION_USER_PROMPT_TEMPLATE = (params: {
  emailSubject: string;
  emailBody: string;
  senderName: string;
  senderEmail: string;
  receivedAt: string;
  timezone: string;
  kids: Array<{ id: string; name: string; birthday?: string; grade?: string }>;
  activities: Array<{ id: string; name: string }>;
  documentTexts: Array<{ filename: string; text: string }>;
}) => {
  const kidsList = params.kids.length > 0
    ? params.kids.map(k => `- ${k.name}${k.grade ? ` (${k.grade})` : ''}${k.birthday ? `, born ${k.birthday}` : ''}`).join('\n')
    : 'None';

  const activitiesList = params.activities.length > 0
    ? params.activities.map(a => `- ${a.name}`).join('\n')
    : 'None';

  const documentSection = params.documentTexts.length > 0
    ? `\n\nAttached Documents:\n${params.documentTexts.map(d => `\n--- ${d.filename} ---\n${d.text.substring(0, 2000)}${d.text.length > 2000 ? '...' : ''}`).join('\n\n')}`
    : '';

  return `Analyze the following email and extract actionable items.

Email Details:
- Subject: ${params.emailSubject}
- From: ${params.senderName} <${params.senderEmail}>
- Received: ${params.receivedAt} (timezone: ${params.timezone})

Email Body:
${params.emailBody}
${documentSection}

User Context:
Kids:
${kidsList}

Known Activities:
${activitiesList}

Extract all actionable items (tasks, events, deadlines) from this content. For each item:
- Determine the type (task/event/deadline)
- Extract title, description, dates/times
- Identify which kid(s) it relates to (if any)
- Match to known activities if applicable
- Extract location, URLs, checklist items if present
- Assign confidence score (0.0-1.0)
- Generate dedupe_key (e.g., hash of title + primary date)
- Provide rationale for why this item was extracted

Return your analysis as JSON matching the extraction schema.`;
};

/**
 * Zod schema for extraction output
 * This matches what OpenAI will return
 */
export const EXTRACTION_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['task', 'event', 'deadline'],
            description: 'The type of actionable item'
          },
          title: {
            type: 'string',
            description: 'Short, clear title for the item'
          },
          description: {
            type: 'string',
            description: 'Detailed description or notes'
          },
          start_at: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 datetime for start (events only)',
            nullable: true
          },
          end_at: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 datetime for end (events only)',
            nullable: true
          },
          deadline_at: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 datetime for deadline (tasks/deadlines)',
            nullable: true
          },
          location_text: {
            type: 'string',
            description: 'Location name or address',
            nullable: true
          },
          urls: {
            type: 'array',
            items: { type: 'string' },
            description: 'Relevant URLs found in content',
            nullable: true
          },
          checklist: {
            type: 'array',
            items: { type: 'string' },
            description: 'Checklist items if mentioned',
            nullable: true
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Confidence score 0.0-1.0'
          },
          suggested_kid_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of kid IDs this item relates to',
            nullable: true
          },
          suggested_activity_name: {
            type: 'string',
            description: 'Name of matching activity if found',
            nullable: true
          },
          dedupe_key: {
            type: 'string',
            description: 'Unique key for deduplication (e.g., hash of title + date)'
          },
          rationale: {
            type: 'string',
            description: 'Explanation of what text/context triggered this extraction'
          }
        },
        required: ['type', 'title', 'confidence', 'dedupe_key', 'rationale']
      }
    }
  },
  required: ['suggestions']
} as const;
