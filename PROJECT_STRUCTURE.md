# Kiddos Project Structure

```
kiddos/
├── .env.local.example
├── .env.local
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── vercel.json
│
├── supabase/
│   ├── migrations/
│   │   ├── 000001_initial_schema.sql
│   │   ├── 000002_rls_policies.sql
│   │   └── 000003_storage_buckets.sql
│   └── config.toml
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   └── sign-up/
│   │   │       └── page.tsx
│   │   │
│   │   └── (app)/
│   │       ├── layout.tsx
│   │       ├── inbox/
│   │       │   ├── page.tsx
│   │       │   └── [messageId]/
│   │       │       └── page.tsx
│   │       ├── suggestions/
│   │       │   ├── page.tsx
│   │       │   └── [suggestionId]/
│   │       │       └── page.tsx
│   │       ├── today/
│   │       │   └── page.tsx
│   │       ├── kids/
│   │       │   ├── page.tsx
│   │       │   └── [kidId]/
│   │       │       └── page.tsx
│   │       ├── activities/
│   │       │   ├── page.tsx
│   │       │   └── [activityId]/
│   │       │       └── page.tsx
│   │       ├── calendar/
│   │       │   └── page.tsx
│   │       ├── chat/
│   │       │   └── page.tsx
│   │       └── settings/
│   │           └── page.tsx
│   │
│   ├── api/
│   │   ├── ingest/
│   │   │   ├── outlook/
│   │   │   │   └── sync/
│   │   │   │       └── route.ts
│   │   │   ├── manual/
│   │   │   │   └── route.ts
│   │   │   └── upload/
│   │   │       └── route.ts
│   │   │
│   │   ├── extract/
│   │   │   └── run/
│   │   │       └── route.ts
│   │   │
│   │   ├── suggestions/
│   │   │   ├── list/
│   │   │   │   └── route.ts
│   │   │   ├── approve/
│   │   │   │   └── route.ts
│   │   │   └── merge/
│   │   │       └── route.ts
│   │   │
│   │   ├── items/
│   │   │   └── route.ts
│   │   │
│   │   ├── calendar/
│   │   │   └── apple/
│   │   │       ├── connect/
│   │   │       │   └── route.ts
│   │   │       ├── sync-read/
│   │   │       │   └── route.ts
│   │   │       ├── write/
│   │   │       │   └── route.ts
│   │   │       └── import/
│   │   │           └── route.ts
│   │   │
│   │   ├── agent/
│   │   │   └── chat/
│   │   │       └── route.ts
│   │   │
│   │   └── actions/
│   │       └── undo/
│   │           └── route.ts
│   │
│   ├── core/
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   ├── repositories/
│   │   │   │   ├── kids.ts
│   │   │   │   ├── sourceMessages.ts
│   │   │   │   ├── documents.ts
│   │   │   │   ├── extractions.ts
│   │   │   │   ├── suggestions.ts
│   │   │   │   ├── familyItems.ts
│   │   │   │   ├── activities.ts
│   │   │   │   ├── contacts.ts
│   │   │   │   ├── places.ts
│   │   │   │   ├── links.ts
│   │   │   │   ├── appleCalendar.ts
│   │   │   │   └── agentActions.ts
│   │   │   └── rls.ts
│   │   │
│   │   ├── models/
│   │   │   ├── index.ts
│   │   │   ├── kid.ts
│   │   │   ├── sourceMessage.ts
│   │   │   ├── document.ts
│   │   │   ├── extraction.ts
│   │   │   ├── suggestion.ts
│   │   │   ├── familyItem.ts
│   │   │   ├── activity.ts
│   │   │   ├── contact.ts
│   │   │   ├── place.ts
│   │   │   ├── link.ts
│   │   │   ├── appleCalendar.ts
│   │   │   └── agentAction.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── client.ts
│   │   │   ├── prompts/
│   │   │   │   ├── extraction.ts
│   │   │   │   └── chat.ts
│   │   │   ├── tools/
│   │   │   │   ├── index.ts
│   │   │   │   ├── listSuggestions.ts
│   │   │   │   ├── approveSuggestions.ts
│   │   │   │   ├── createFamilyItem.ts
│   │   │   │   ├── updateFamilyItem.ts
│   │   │   │   ├── linkEntities.ts
│   │   │   │   └── calendarWrite.ts
│   │   │   └── orchestrator.ts
│   │   │
│   │   ├── ingest/
│   │   │   ├── outlook/
│   │   │   │   ├── client.ts
│   │   │   │   ├── oauth.ts
│   │   │   │   └── sync.ts
│   │   │   └── normalizer.ts
│   │   │
│   │   ├── attachments/
│   │   │   ├── storage.ts
│   │   │   ├── pdf.ts
│   │   │   └── ocr.ts
│   │   │
│   │   ├── extraction/
│   │   │   ├── builder.ts
│   │   │   └── runner.ts
│   │   │
│   │   ├── actions/
│   │   │   ├── approve.ts
│   │   │   ├── merge.ts
│   │   │   ├── link.ts
│   │   │   └── undo.ts
│   │   │
│   │   └── calendar/
│   │       ├── caldav/
│   │       │   ├── client.ts
│   │       │   └── parser.ts
│   │       ├── cache.ts
│   │       ├── write.ts
│   │       └── diff.ts
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── calendar.tsx
│   │   │   └── ...
│   │   ├── inbox/
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageView.tsx
│   │   │   └── UploadZone.tsx
│   │   ├── suggestions/
│   │   │   ├── SuggestionCard.tsx
│   │   │   ├── SuggestionQueue.tsx
│   │   │   └── ApprovalForm.tsx
│   │   ├── dashboard/
│   │   │   ├── Timeline.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── EventCard.tsx
│   │   │   └── SyncButton.tsx
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── PendingActions.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   └── shared/
│   │       ├── KidSelector.tsx
│   │       ├── ActivitySelector.tsx
│   │       └── DatePicker.tsx
│   │
│   └── lib/
│       ├── supabase/
│       │   ├── server.ts
│       │   ├── client.ts
│       │   └── middleware.ts
│       ├── auth.ts
│       ├── encryption.ts
│       ├── validation.ts
│       └── utils.ts
│
└── public/
    └── favicon.ico
```
