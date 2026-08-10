-- Ensure all indexing channels have proper labeling and index
CREATE INDEX IF NOT EXISTS idx_indexing_events_url_channel ON public.indexing_events (url, channel);
CREATE INDEX IF NOT EXISTS idx_indexing_events_created_at ON public.indexing_events (created_at DESC);

-- No schema changes needed for grants as indexing_events already exists
-- but we ensure the grants are current for the admin panel.
GRANT SELECT, INSERT, UPDATE ON public.indexing_events TO authenticated;
GRANT ALL ON public.indexing_events TO service_role;