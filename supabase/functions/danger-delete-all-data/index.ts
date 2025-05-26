// supabase/functions/danger-delete-all-data/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';

// --- Data Group Configuration ---
interface DataGroup {
  tablesToClear?: string[];
  tablesToReset?: { tableName: string; id: string; defaults: Record<string, any> }[];
  legalDocumentsToReset?: { tableName: string; id: string; defaults: Record<string, any> }[];
  bucketsToEmpty?: string[];
  specialHandling?: 'delete_user_quick_notes' | 'reset_site_maintenance_message';
}

const DATA_GROUPS: Record<string, DataGroup> = {
  hero: {
    tablesToReset: [{
      tableName: "hero_content",
      id: "00000000-0000-0000-0000-000000000004",
      defaults: { main_name: "Hero Content Reset by Admin", subtitles: [], social_media_links: '[]' as any, updated_at: new Date().toISOString() }
    }]
  },
  about: {
    tablesToReset: [{
      tableName: "about_content",
      id: "00000000-0000-0000-0000-000000000001",
      defaults: { headline_main: "About Content Reset by Admin", headline_code_keyword: null, headline_connector: null, headline_creativity_keyword: null, paragraph1: "Please update the 'About Me' section from the admin dashboard.", paragraph2: null, paragraph3: null, image_url: null, image_tagline: null, updated_at: new Date().toISOString() }
    }],
    bucketsToEmpty: ["about-images"]
  },
  projects_all: { // "All Projects Data"
    tablesToClear: ["projects", "project_views"], // Also clearing related project_views
    bucketsToEmpty: ["project-images"]
  },
  project_views_analytics: { // "Project Views Data (Analytics)"
    tablesToClear: ["project_views"]
  },
  skills_all: { // "All Skills & Categories Data"
    tablesToClear: ["skills", "skill_categories", "skill_interactions"], // Also clearing related skill_interactions
    bucketsToEmpty: ["category-icons", "skill-icons"]
  },
  skill_interactions_analytics: { // "Skill Interactions Data (Analytics)"
    tablesToClear: ["skill_interactions"]
  },
  journey_events: { // "Journey/Timeline Events Data"
    tablesToClear: ["timeline_events"]
  },
  certifications_all: { // "All Certifications Data"
    tablesToClear: ["certifications"],
    bucketsToEmpty: ["certification-images"]
  },
  resume_all: { // "All Resume Data (Meta, Experience, Education, Skills, Languages)"
    tablesToClear: ["resume_experience", "resume_education", "resume_key_skills", "resume_key_skill_categories", "resume_languages", "resume_downloads"], // Also clearing resume_downloads
    tablesToReset: [{
        tableName: "resume_meta",
        id: "00000000-0000-0000-0000-000000000003",
        defaults: { description: "Resume overview has been reset. Please update from the admin panel.", resume_pdf_url: null, updated_at: new Date().toISOString() }
    }],
    bucketsToEmpty: ["resume-pdfs", "resume-experience-icons", "resume-education-icons", "resume-language-icons"]
  },
  resume_downloads_analytics: { // "Resume Downloads Data (Analytics)"
    tablesToClear: ["resume_downloads"]
  },
  contact_page_content: { // "Contact Page Details & Page Social Links"
    tablesToReset: [{
      tableName: "contact_page_details",
      id: "00000000-0000-0000-0000-000000000005",
      defaults: { address: "Contact Address Reset by Admin", phone: null, phone_href: null, email: "contact-reset@example.com", email_href: null, updated_at: new Date().toISOString() }
    }],
    tablesToClear: ["social_links"] // General social links
  },
  contact_submissions_all: { // "All Contact Form Submissions"
    tablesToClear: ["contact_submissions"]
  },
  legal_docs_content: { // "Legal Documents Content"
    legalDocumentsToReset: [
        { tableName: "legal_documents", id: "terms-and-conditions", defaults: { title: "Terms & Conditions", content: "Terms content reset by admin. Please update.", updated_at: new Date().toISOString() }},
        { tableName: "legal_documents", id: "privacy-policy", defaults: { title: "Privacy Policy", content: "Privacy content reset by admin. Please update.", updated_at: new Date().toISOString() }}
    ]
  },
  visitor_analytics: { // "Visitor Analytics Data (Analytics)"
    tablesToClear: ["visitor_logs"]
  },
  admin_activity_log: { // "Admin Activity Log"
    tablesToClear: ["admin_activity_log"]
  },
  social_media_clicks_all: { // "All Social Media Clicks"
    tablesToClear: ["social_media_clicks"]
  },
  quick_notes_user: { // "All My Quick Notes" - specific to the user
    specialHandling: "delete_user_quick_notes"
  },
  site_maintenance_message_reset: { // For resetting just the maintenance message
      specialHandling: "reset_site_maintenance_message"
  }
  // IMPORTANT: "admin-profile-photos" bucket is deliberately EXCLUDED from any group.
  // Core site settings like maintenance mode toggle itself are also not part of this.
};

const SITE_SETTINGS_ID = 'global_settings';
// --- End Configuration ---


async function deleteAllFilesInBucket(supabaseAdmin: SupabaseClient, bucketName: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data: files, error: listError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .list('', { limit: 10000, offset: 0 }); 

    if (listError) {
      console.error(`Error listing files in bucket ${bucketName}:`, listError);
      return { success: false, message: `Error listing files in ${bucketName}: ${listError.message}` };
    }

    if (files && files.length > 0) {
      const filePathsToRemove = files.map(file => file.name);
      console.log(`Found ${filePathsToRemove.length} files in bucket ${bucketName}. Attempting to remove...`);
      
      const { data: removeData, error: removeError } = await supabaseAdmin
        .storage
        .from(bucketName)
        .remove(filePathsToRemove);

      if (removeError) {
        console.error(`Error removing files from bucket ${bucketName}:`, removeError);
        return { success: false, message: `Error removing files from ${bucketName}: ${removeError.message}` };
      }
      console.log(`Successfully removed files from bucket ${bucketName}:`, removeData);
      return { success: true, message: `Successfully emptied bucket ${bucketName}.` };
    } else {
      console.log(`Bucket ${bucketName} was already empty or no files found.`);
      return { success: true, message: `Bucket ${bucketName} was already empty or no files found.` };
    }
  } catch (e) {
    console.error(`Unexpected error processing bucket ${bucketName}:`, e);
    return { success: false, message: `Unexpected error processing bucket ${bucketName}: ${e.message}` };
  }
}


serve(async (req: Request) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  // 2. Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method Not Allowed. Only POST requests are accepted." }), {
      status: 405,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Supabase URL or Service Role Key is not configured in function secrets.");
      throw new Error("Server configuration error: Supabase credentials missing.");
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: "Missing or invalid Authorization header." }), {
            status: 401, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
        });
    }
    const jwt = authHeader.replace('Bearer ', '');
    
    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
        console.error("Error getting user from JWT:", userError);
        return new Response(JSON.stringify({ error: "Invalid token or user not found." }), {
            status: 401, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
        });
    }

    // Parse the request body to get sections to delete
    let sectionsToDelete: string[];
    try {
        const body = await req.json();
        sectionsToDelete = body.sections_to_delete;
        if (!Array.isArray(sectionsToDelete) || sectionsToDelete.length === 0) {
            throw new Error("sections_to_delete must be a non-empty array.");
        }
         // Validate section keys
        for (const key of sectionsToDelete) {
            if (typeof key !== 'string' || !DATA_GROUPS[key]) {
                throw new Error(`Invalid section key provided: ${key}`);
            }
        }
    } catch (parseError) {
        return new Response(JSON.stringify({ error: `Invalid request body: ${parseError.message}` }), {
            status: 400, headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
        });
    }

    const errors: { item: string, type: string, message: string }[] = [];
    const successes: string[] = [];

    for (const sectionKey of sectionsToDelete) {
        const groupConfig = DATA_GROUPS[sectionKey];
        if (!groupConfig) {
            console.warn(`No configuration found for section key: ${sectionKey}. Skipping.`);
            errors.push({ item: sectionKey, type: "config_not_found", message: "Configuration for this section key was not found."});
            continue;
        }

        console.log(`Processing section: ${sectionKey}...`);

        // Clear multi-row tables
        if (groupConfig.tablesToClear) {
            for (const tableName of groupConfig.tablesToClear) {
                console.log(`Clearing table: ${tableName} for section ${sectionKey}`);
                const { error: deleteError } = await supabaseAdmin.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Generic UUID, adjust if non-UUID pk
                if (deleteError) {
                    console.error(`Error clearing table ${tableName} for section ${sectionKey}:`, deleteError);
                    errors.push({ item: tableName, type: "table_clear", message: deleteError.message });
                } else {
                    successes.push(`Successfully cleared table: ${tableName} (for section ${sectionKey}).`);
                }
            }
        }

        // Reset single-row configuration tables
        if (groupConfig.tablesToReset) {
            for (const config of groupConfig.tablesToReset) {
                 console.log(`Resetting table: ${config.tableName} for section ${sectionKey}`);
                const { error: resetError } = await supabaseAdmin.from(config.tableName).update(config.defaults).eq('id', config.id);
                if (resetError) {
                    console.error(`Error resetting table ${config.tableName} (ID: ${config.id}) for section ${sectionKey}:`, resetError);
                    errors.push({ item: `${config.tableName} (ID: ${config.id})`, type: "table_reset", message: resetError.message });
                } else {
                    successes.push(`Successfully reset table: ${config.tableName} (ID: ${config.id}) (for section ${sectionKey}).`);
                }
            }
        }
        
        // Reset legal documents
        if (groupConfig.legalDocumentsToReset) {
            for (const doc of groupConfig.legalDocumentsToReset) {
                console.log(`Resetting legal document: ${doc.id} in ${doc.tableName} for section ${sectionKey}`);
                const { error: legalResetError } = await supabaseAdmin.from(doc.tableName).update(doc.defaults).eq('id', doc.id);
                if (legalResetError) {
                    console.error(`Error resetting ${doc.tableName} for id ${doc.id} (section ${sectionKey}):`, legalResetError);
                    errors.push({item: `${doc.tableName} (id: ${doc.id})`, type: "table_reset", message: legalResetError.message});
                } else {
                    successes.push(`Successfully reset ${doc.tableName} (id: ${doc.id}) (for section ${sectionKey}).`);
                }
            }
        }

        // Empty Storage Buckets
        if (groupConfig.bucketsToEmpty) {
            for (const bucketName of groupConfig.bucketsToEmpty) {
                 console.log(`Emptying bucket: ${bucketName} for section ${sectionKey}`);
                const result = await deleteAllFilesInBucket(supabaseAdmin, bucketName);
                if (result.success) {
                    successes.push(`${result.message} (for section ${sectionKey}).`);
                } else {
                    errors.push({ item: bucketName, type: "bucket_empty", message: result.message });
                }
            }
        }
        
        // Special Handling
        if (groupConfig.specialHandling) {
            if (groupConfig.specialHandling === 'delete_user_quick_notes') {
                console.log(`Performing special handling 'delete_user_quick_notes' for user ${user.id} (section ${sectionKey})`);
                const { error: quickNotesError } = await supabaseAdmin
                    .from('quick_notes')
                    .delete()
                    .eq('user_id', user.id);
                if (quickNotesError) {
                    console.error(`Error deleting quick notes for user ${user.id} (section ${sectionKey}):`, quickNotesError);
                    errors.push({ item: 'quick_notes_user', type: "special_handling_error", message: quickNotesError.message });
                } else {
                    successes.push(`Successfully deleted quick notes for user ${user.id} (for section ${sectionKey}).`);
                }
            } else if (groupConfig.specialHandling === 'reset_site_maintenance_message') {
                console.log(`Performing special handling 'reset_site_maintenance_message' (section ${sectionKey})`);
                 const { error: siteSettingsError } = await supabaseAdmin
                    .from('site_settings')
                    .update({ maintenance_message: 'Default maintenance message. Please update from admin panel.' })
                    .eq('id', SITE_SETTINGS_ID);
                if (siteSettingsError) {
                    console.error(`Error resetting site_settings maintenance message (section ${sectionKey}):`, siteSettingsError);
                    errors.push({item: 'site_settings_maintenance', type: "special_handling_error", message: siteSettingsError.message});
                } else {
                    successes.push(`Successfully reset site_settings maintenance message (for section ${sectionKey}).`);
                }
            }
        }
    }

    // Construct and send response
    if (errors.length > 0) {
      return new Response(JSON.stringify({
        message: "Data deletion/reset process completed. Some operations encountered errors.",
        successes,
        errors
      }), {
        status: 207, // Multi-Status
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ 
        message: "All selected data groups have been processed successfully.", 
        successes 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error("Critical Error in danger-delete-all-data Edge Function:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || "An unexpected server error occurred during data deletion." }), {
      status: 500,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    });
  }
});
