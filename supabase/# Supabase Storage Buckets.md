# Supabase Storage Buckets

These are the storage buckets used in this project:

- `project-images`  
  _Stores images related to projects._

- `category-icons`  
  _Stores icons for categories._

- `skill-icons`  
  _Stores icons for skills._

- `about-images`  
  _Stores images for the About section._

- `certification-images`  
  _Stores images of certifications._

- `resume-pdfs`  
  _Stores PDF versions of resumes._

- `admin-profile-photos`  
  _Stores admin profile photos._

---

**Note:**  
Buckets and their contents are managed in the Supabase Storage dashboard and are not included in the SQL schema.  
To migrate, manually recreate these buckets and upload files as needed.


**create RLS policy**

project-images
category-icons
skill-icons
about-images
certification-images
resume-pdfs
admin-profile-photos



-- ----------------------------------------------------
-- Bucket: project-images
-- Description: General project-related images.
-- Policies:
--   - Public can read.
--   - Authenticated users can upload.
--   - Owners can update/delete their uploads.
-- ----------------------------------------------------
CREATE POLICY "project_images_select_public"
ON storage.objects FOR SELECT
USING ( bucket_id = 'project-images' );

CREATE POLICY "project_images_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'project-images' );

CREATE POLICY "project_images_update_owner"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'project-images' AND auth.uid() = owner )
WITH CHECK ( auth.uid() = owner );

CREATE POLICY "project_images_delete_owner"
ON storage.objects FOR DELETE
USING ( bucket_id = 'project-images' AND auth.uid() = owner );

-- ----------------------------------------------------
-- Bucket: category-icons
-- Description: Icons for categories.
-- Policies:
--   - Public can read.
--   - (Management assumed via service_role or specific admin policies)
-- ----------------------------------------------------
CREATE POLICY "category_icons_select_public"
ON storage.objects FOR SELECT
USING ( bucket_id = 'category-icons' );

-- ----------------------------------------------------
-- Bucket: skill-icons
-- Description: Icons for skills.
-- Policies:
--   - Public can read.
--   - (Management assumed via service_role or specific admin policies)
-- ----------------------------------------------------
CREATE POLICY "skill_icons_select_public"
ON storage.objects FOR SELECT
USING ( bucket_id = 'skill-icons' );

-- ----------------------------------------------------
-- Bucket: about-images
-- Description: Images for "about" sections/pages.
-- Policies:
--   - Public can read.
--   - (Management assumed via service_role or specific admin policies)
-- ----------------------------------------------------
CREATE POLICY "about_images_select_public"
ON storage.objects FOR SELECT
USING ( bucket_id = 'about-images' );

-- ----------------------------------------------------
-- Bucket: certification-images
-- Description: User-uploaded certification images.
-- Policies:
--   - Owner can select.
--   - Authenticated users can upload (owner will be the uploader).
--   - Owner can update/delete.
-- ----------------------------------------------------
CREATE POLICY "certification_images_select_owner"
ON storage.objects FOR SELECT
USING ( bucket_id = 'certification-images' AND auth.uid() = owner );

CREATE POLICY "certification_images_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'certification-images' );

CREATE POLICY "certification_images_update_owner"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'certification-images' AND auth.uid() = owner )
WITH CHECK ( auth.uid() = owner );

CREATE POLICY "certification_images_delete_owner"
ON storage.objects FOR DELETE
USING ( bucket_id = 'certification-images' AND auth.uid() = owner );

-- ----------------------------------------------------
-- Bucket: resume-pdfs
-- Description: User-uploaded resume PDFs.
-- Policies:
--   - Owner can select.
--   - Authenticated users can upload (owner will be the uploader).
--   - Owner can update/delete.
-- ----------------------------------------------------
CREATE POLICY "resume_pdfs_select_owner"
ON storage.objects FOR SELECT
USING ( bucket_id = 'resume-pdfs' AND auth.uid() = owner );

CREATE POLICY "resume_pdfs_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'resume-pdfs' );

CREATE POLICY "resume_pdfs_update_owner"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'resume-pdfs' AND auth.uid() = owner )
WITH CHECK ( auth.uid() = owner );

CREATE POLICY "resume_pdfs_delete_owner"
ON storage.objects FOR DELETE
USING ( bucket_id = 'resume-pdfs' AND auth.uid() = owner );

-- ----------------------------------------------------
-- Bucket: admin-profile-photos
-- Description: Profile photos for admin users.
-- Policies:
--   - Public can read.
--   - Authenticated users (admins) can upload their photo.
--   - Owners (admins) can update/delete their photo.
-- ----------------------------------------------------
CREATE POLICY "admin_profile_photos_select_public"
ON storage.objects FOR SELECT
USING ( bucket_id = 'admin-profile-photos' );

CREATE POLICY "admin_profile_photos_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'admin-profile-photos' );

CREATE POLICY "admin_profile_photos_update_owner"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'admin-profile-photos' AND auth.uid() = owner )
WITH CHECK ( auth.uid() = owner );

CREATE POLICY "admin_profile_photos_delete_owner"
ON storage.objects FOR DELETE
USING ( bucket_id = 'admin-profile-photos' AND auth.uid() = owner );
