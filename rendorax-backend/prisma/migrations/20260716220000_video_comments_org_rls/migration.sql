-- P0: Scope video_comments RLS to AgencyProject organization membership.
-- Admin: all projects. Editor: owned or assigned projects.
-- Client: project clientId or active ClientOrganizationMember of that primary contact.
-- Observers may read but not insert. Own-row update/delete still required.

CREATE OR REPLACE FUNCTION public.rendorax_jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

CREATE OR REPLACE FUNCTION public.rendorax_can_access_comment_project(project_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN project_id IS NULL OR btrim(project_id) = '' THEN false
    WHEN public.rendorax_jwt_role() = 'admin' THEN true
    WHEN public.rendorax_jwt_role() = 'editor' THEN EXISTS (
      SELECT 1
      FROM "AgencyProject" p
      WHERE p.id = project_id
        AND (
          p."ownerId" = auth.uid()::text
          OR EXISTS (
            SELECT 1
            FROM "Task" t
            WHERE t."projectId" = p.id
              AND t."assigneeId" = auth.uid()::text
          )
        )
    )
    ELSE EXISTS (
      SELECT 1
      FROM "AgencyProject" p
      WHERE p.id = project_id
        AND (
          p."clientId" = auth.uid()::text
          OR EXISTS (
            SELECT 1
            FROM "ClientOrganizationMember" m
            INNER JOIN "ClientOrganization" o ON o.id = m."organizationId"
            WHERE m."userId" = auth.uid()::text
              AND m.status = 'active'
              AND o."primaryContactUserId" = p."clientId"
          )
        )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.rendorax_can_create_comment_on_project(project_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN project_id IS NULL OR btrim(project_id) = '' THEN false
    WHEN public.rendorax_jwt_role() IN ('admin', 'editor') THEN
      public.rendorax_can_access_comment_project(project_id)
    ELSE EXISTS (
      SELECT 1
      FROM "AgencyProject" p
      WHERE p.id = project_id
        AND (
          (
            p."clientId" = auth.uid()::text
            AND NOT EXISTS (
              SELECT 1
              FROM "ClientOrganizationMember" m
              INNER JOIN "ClientOrganization" o ON o.id = m."organizationId"
              WHERE m."userId" = auth.uid()::text
                AND m.status = 'active'
                AND o."primaryContactUserId" = p."clientId"
                AND m.role = 'observer'
            )
          )
          OR EXISTS (
            SELECT 1
            FROM "ClientOrganizationMember" m
            INNER JOIN "ClientOrganization" o ON o.id = m."organizationId"
            WHERE m."userId" = auth.uid()::text
              AND m.status = 'active'
              AND m.role <> 'observer'
              AND o."primaryContactUserId" = p."clientId"
          )
        )
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.rendorax_jwt_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rendorax_can_access_comment_project(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rendorax_can_create_comment_on_project(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rendorax_jwt_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rendorax_can_access_comment_project(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rendorax_can_create_comment_on_project(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "video_comments_select_authenticated" ON public.video_comments;
DROP POLICY IF EXISTS "video_comments_insert_own" ON public.video_comments;
DROP POLICY IF EXISTS "video_comments_update_own" ON public.video_comments;
DROP POLICY IF EXISTS "video_comments_delete_own" ON public.video_comments;
DROP POLICY IF EXISTS "video_comments_select_project_org" ON public.video_comments;
DROP POLICY IF EXISTS "video_comments_insert_project_org" ON public.video_comments;
DROP POLICY IF EXISTS "video_comments_update_own_project_org" ON public.video_comments;
DROP POLICY IF EXISTS "video_comments_delete_own_project_org" ON public.video_comments;

CREATE POLICY "video_comments_select_project_org"
  ON public.video_comments
  FOR SELECT
  TO authenticated
  USING (
    (
      agency_project_id IS NOT NULL
      AND public.rendorax_can_access_comment_project(agency_project_id)
    )
    OR (
      agency_project_id IS NULL
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "video_comments_insert_project_org"
  ON public.video_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND agency_project_id IS NOT NULL
    AND public.rendorax_can_create_comment_on_project(agency_project_id)
  );

CREATE POLICY "video_comments_update_own_project_org"
  ON public.video_comments
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      (
        agency_project_id IS NOT NULL
        AND public.rendorax_can_access_comment_project(agency_project_id)
      )
      OR agency_project_id IS NULL
    )
  )
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "video_comments_delete_own_project_org"
  ON public.video_comments
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      (
        agency_project_id IS NOT NULL
        AND public.rendorax_can_access_comment_project(agency_project_id)
      )
      OR agency_project_id IS NULL
    )
  );

NOTIFY pgrst, 'reload schema';
