-- Storage Buckets for Documents
-- Creates documents bucket with per-user folder prefix

-- Create documents bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800, -- 50MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
-- Users can only access files in their own folder (user_id prefix)

CREATE POLICY "Users can view own documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can upload own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update own documents"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete own documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
