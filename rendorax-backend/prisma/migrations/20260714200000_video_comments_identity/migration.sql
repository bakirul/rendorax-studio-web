-- Additive identity + resolve fields for legacy Supabase video_comments.
-- file_name is preserved for display and backward-compatible reads.
--
-- media_asset_id / agency_project_id are TEXT (not uuid) because Prisma
-- stores MediaAsset.id and AgencyProject.id as Postgres text even when
-- values are UUID strings. Native uuid FK cannot be implemented.
-- resolved_by remains uuid to match auth.users(id) / existing user_id.

ALTER TABLE public.video_comments
  ADD COLUMN IF NOT EXISTS media_asset_id text NULL,
  ADD COLUMN IF NOT EXISTS agency_project_id text NULL,
  ADD COLUMN IF NOT EXISTS is_resolved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS resolved_by uuid NULL;

CREATE INDEX IF NOT EXISTS video_comments_media_asset_id_idx
  ON public.video_comments (media_asset_id);

CREATE INDEX IF NOT EXISTS video_comments_agency_project_id_idx
  ON public.video_comments (agency_project_id);

CREATE INDEX IF NOT EXISTS video_comments_agency_project_id_is_resolved_idx
  ON public.video_comments (agency_project_id, is_resolved);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_comments_media_asset_id_fkey'
  ) THEN
    ALTER TABLE public.video_comments
      ADD CONSTRAINT video_comments_media_asset_id_fkey
      FOREIGN KEY (media_asset_id)
      REFERENCES public."MediaAsset"(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_comments_agency_project_id_fkey'
  ) THEN
    ALTER TABLE public.video_comments
      ADD CONSTRAINT video_comments_agency_project_id_fkey
      FOREIGN KEY (agency_project_id)
      REFERENCES public."AgencyProject"(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'video_comments_resolved_by_fkey'
  ) THEN
    ALTER TABLE public.video_comments
      ADD CONSTRAINT video_comments_resolved_by_fkey
      FOREIGN KEY (resolved_by)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;
