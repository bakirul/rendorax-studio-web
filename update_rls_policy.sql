-- Drop existing potentially restrictive policies
DROP POLICY IF EXISTS "client_vault_select" ON storage.objects;
DROP POLICY IF EXISTS "client_vault_insert" ON storage.objects;
DROP POLICY IF EXISTS "client_vault_update" ON storage.objects;
DROP POLICY IF EXISTS "client_vault_delete" ON storage.objects;

-- Create permissive policies for the unified "shared" workspace structure
CREATE POLICY "Allow authenticated full access to client-vault"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'client-vault')
WITH CHECK (bucket_id = 'client-vault');
