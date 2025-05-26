# 4. Storage Bucket Setup

This document outlines the Supabase Storage buckets required for the project and their configurations.

## Buckets

Below is a list of storage buckets that need to be created. You can create these using the Supabase Dashboard (Storage > Buckets > Create bucket) or via SQL commands (see Supabase documentation for examples).

| Bucket Name             | Public/Private | Allowed MIME Types (Example)                     | Max File Size (Example) | RLS Policies & Notes                                                                    |
| ----------------------- | -------------- | ------------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------- |
| `project-images`        | Public         | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | 5MB                     | Public read access. Admin write access. See RLS examples below.                         |
| `category-icons`        | Public         | `image/svg+xml`, `image/png`                     | 1MB                     | Public read access. Admin write access. See RLS examples below.                         |
| `skill-icons`           | Public         | `image/svg+xml`, `image/png`                     | 1MB                     | Public read access. Admin write access. See RLS examples below.                         |
| `about-images`          | Public         | `image/jpeg`, `image/png`, `image/webp`          | 5MB                     | Public read access. Admin write access. See RLS examples below.                         |
| `certification-images`  | Public         | `image/jpeg`, `image/png`, `image/webp`          | 5MB                 | Public read access. Admin write access. See RLS examples below.                         |
| `resume-pdfs`           | Private        | `application/pdf`                                | 10MB                      | RLS: Admin full access. No public access.                   |                                                                   |
| `admin-profile-photos`  | Public         | `image/jpeg`, `image/png`, `image/webp`          | 2MB                     | Public read. Authenticated admin can manage (upload/delete). See RLS examples below.    |




***THIS ARE THE CURRENT USED STORAGE BUCKETS***

*project-images*
*category-icons*
*skill-icons*
*about-images*
*certification-images*
*resume-pdfs*
*admin-profile-photos*




**Notes:**

*   Replace the example configurations (MIME types, file sizes) with your actual requirements.
*   **Public Buckets:** Files are accessible via a public URL. Use for assets like public images.
*   **Private Buckets:** Files require signed URLs or appropriate RLS policies to access. Use for sensitive files.
*   **RLS Policies for Storage:** You define Row Level Security policies on the `storage.objects` and `storage.buckets` tables to control access. This is crucial for private buckets and for fine-grained control over public ones.
    *   Place these RLS policies in `docs/03_DATABASE_SETUP/rls_policies.sql` or a dedicated storage RLS file.
    *   Always enable RLS on `storage.objects` and `storage.buckets` before applying policies:
        ```sql
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
        ```

## RLS Policy Examples



**1. Public Read, Admin Write (for `project-images`, `category-icons`, `skill-icons`, `about-images`, `certification-images`,`resume-pdfs`,`admin-profile-photos`)**

Replace `<bucket_name>` with the actual bucket name in each policy.

```sql

CREATE POLICY "Allow public read on <bucket_name>"
ON storage.objects FOR SELECT
USING (bucket_id = '<bucket_name>');

CREATE POLICY "Allow admin management of <bucket_name>"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = '<bucket_name>' AND auth.role() = 'authenticated');

CREATE POLICY "Allow admin updates of <bucket_name>"
ON storage.objects FOR UPDATE
USING (bucket_id = '<bucket_name>' AND auth.role() = 'authenticated');

CREATE POLICY "Allow admin deletes from <bucket_name>"
ON storage.objects FOR DELETE
USING (bucket_id = '<bucket_name>' AND auth.role() = 'authenticated');
```

**2. Private, Admin Full Access (for `resume-pdfs`)**

```sql
-- Policy: Disallow public read for resume-pdfs (implicitly private if no public select policy)
-- No explicit policy needed to disallow if bucket is private and no SELECT policy grants access.

-- Policy: Allow admin full access to resume-pdfs
-- Replace with your specific admin role check if not using service_role directly for this
CREATE POLICY "Allow admin full access to resume-pdfs" ON storage.objects
FOR ALL
USING (bucket_id = 'resume-pdfs' AND auth.role() = 'service_role') -- Or your custom admin check
WITH CHECK (bucket_id = 'resume-pdfs' AND auth.role() = 'service_role'); -- Or your custom admin check
```

**3. Public Read, Specific User Management (for `admin-profile-photos`)**

```sql
-- Policy: Allow public read access to admin-profile-photos
CREATE POLICY "Allow public read on admin-profile-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-profile-photos');

-- Policy: Allow the specific admin user to upload their profile photo
-- This assumes there's a known ADMIN_PROFILE_ID or the uploader is the admin.
-- If the admin's user ID is fixed and known, you can use it directly:
-- USING (bucket_id = 'admin-profile-photos' AND auth.uid() = 'YOUR_ADMIN_USER_ID_HERE')
-- For a more general approach where any authenticated user can manage this if they are the sole admin:
CREATE POLICY "Allow admin to upload to admin-profile-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'admin-profile-photos' AND auth.role() = 'authenticated');
-- This policy also assumes that the file naming convention or path within the bucket ensures
-- the user is only affecting their own photo, e.g., files named `admin_user_id.jpg` or stored in `admin_user_id/profile.jpg`.
-- A more robust policy would check owner based on file path if possible or a metadata column.

-- Policy: Allow admin to update/delete their profile photo
CREATE POLICY "Allow admin to update their admin-profile-photo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'admin-profile-photos' AND auth.role() = 'authenticated'); -- Add owner check if possible

CREATE POLICY "Allow admin to delete their admin-profile-photo"
ON storage.objects FOR DELETE
USING (bucket_id = 'admin-profile-photos' AND auth.role() = 'authenticated'); -- Add owner check if possible
```

## Creating Buckets via SQL (Example)

While the dashboard is often easier for initial setup, buckets can also be created via SQL (e.g., in a migration file or one of the `docs/03_DATABASE_SETUP/` files):

```sql
-- Example for a public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('project-images', 'project-images', true, 5242880, '{"image/jpeg","image/png","image/webp","image/gif"}'),
  ('category-icons', 'category-icons', true, 1048576, '{"image/svg+xml","image/png"}'),
  ('skill-icons', 'skill-icons', true, 1048576, '{"image/svg+xml","image/png"}'),
  ('about-images', 'about-images', true, 5242880, '{"image/jpeg","image/png","image/webp"}'),
  ('certification-images', 'certification-images', true, 5242880, '{"image/jpeg","image/png","image/webp","application/pdf"}'),
  ('admin-profile-photos', 'admin-profile-photos', true, 2097152, '{"image/jpeg","image/png","image/webp"}');

-- Example for a private bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('resume-pdfs', 'resume-pdfs', false, 10485760, '{"application/pdf"}');
```
Ensure you set the `id` to be the same as the `name` if you want them to match, which is common. You might want to create these with `SELECT storage.create_bucket(...)` function as well. 