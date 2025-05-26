import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers inlined for manual copy-pasting into Supabase UI
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // IMPORTANT: For production, restrict this to your actual frontend domain(s)
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS", 
};

interface DeletableSection {
  key: string;
  label: string;
  tables?: string[];
  buckets?: string[];
  description?: string;
}

// This configuration might need to be kept in sync with the client-side deletableSectionsConfig
// Or a more robust solution would be to pass only keys and have the function fetch/define this.
// For simplicity now, we can duplicate essential parts or assume keys are enough.
const deletableSectionsConfigData: DeletableSection[] = [
    { key: 'hero', label: 'Hero Section Content', tables: ['hero_content'], buckets: [] },
    { key: 'about', label: 'About Section Content', tables: ['about_content'], buckets: ['about-images'] },
    { key: 'projects', label: 'All Projects Data', tables: ['projects'], buckets: ['project-images'] },
    { key: 'project_views_analytics', label: 'Project Views Data (Analytics)', tables: ['project_views'], buckets: [] },
    { key: 'skills', label: 'All Skills & Categories Data', tables: ['skills', 'skill_categories'], buckets: ['category-icons', 'skill-icons'] },
    { key: 'skill_interactions_analytics', label: 'Skill Interactions Data (Analytics)', tables: ['skill_interactions'], buckets: [] },
    { key: 'journey', label: 'Journey/Timeline Events Data', tables: ['timeline_events'], buckets: [] },
    { key: 'certifications', label: 'All Certifications Data', tables: ['certifications'], buckets: ['certification-images'] },
    { key: 'resume', label: 'All Resume Data', tables: ['resume_meta', 'resume_experience', 'resume_education', 'resume_key_skills', 'resume_key_skill_categories', 'resume_languages'], buckets: ['resume-pdfs', 'resume-experience-icons', 'resume-education-icons', 'resume-language-icons'] },
    { key: 'resume_downloads_analytics', label: 'Resume Downloads Data (Analytics)', tables: ['resume_downloads'], buckets: [] },
    { key: 'contact_page_content', label: 'Contact Page Details & Social Links', tables: ['contact_page_details', 'social_links'], buckets: [] },
    { key: 'contact_submissions', label: 'All Contact Form Submissions', tables: ['contact_submissions'], buckets: [] },
    { key: 'legal_docs', label: 'Legal Documents Content', tables: ['legal_documents'], buckets: [] },
    { key: 'visitor_analytics', label: 'Visitor Analytics Data', tables: ['visitor_logs'], buckets: [] },
    { key: 'activity_log', label: 'Admin Activity Log', tables: ['admin_activity_log'], buckets: [] },
    { key: 'social_media_clicks_all', label: 'All Social Media Clicks', tables: ['social_media_clicks'] },
    { key: 'quick_notes_user', label: 'All My Quick Notes', tables: ['quick_notes'] } 
];

async function deleteDataForSection(supabaseAdmin: SupabaseClient, sectionKey: string, userIdForQuickNotes?: string) {
  const sectionConfig = deletableSectionsConfigData.find(s => s.key === sectionKey);
  if (!sectionConfig) {
    return { success: false, message: `Configuration for section key '${sectionKey}' not found.` };
  }

  let operationStatus = { success: true, message: `Data for ${sectionConfig.label} processed.`, details: [] as string[] };

  // Delete from tables
  if (sectionConfig.tables) {
    for (const tableName of sectionConfig.tables) {
      try {
        let query = supabaseAdmin.from(tableName).delete();
        
        if (tableName === 'quick_notes') {
          if (!userIdForQuickNotes) {
            operationStatus.details.push(`Skipped deleting from ${tableName}: User ID not provided.`);
            console.warn("Skipped quick_notes deletion: User ID missing.");
            continue; 
          }
          query = query.eq('user_id', userIdForQuickNotes);
        } else {
          // Generic non-user-specific table, apply neq if it was intended to protect some rows.
          // Replicating the client-side logic for now.
           query = query.neq('id', 'ffffffff-ffff-ffff-ffff-ffffffffffff'); 
        }

        const { error } = await query;
        if (error) {
          console.error(`Error deleting from ${tableName} (section ${sectionKey}):`, error);
          operationStatus.success = false;
          operationStatus.details.push(`Error for ${tableName}: ${error.message}`);
        } else {
          operationStatus.details.push(`OK: ${tableName} data cleared.`);
        }
      } catch (e) {
        console.error(`Exception for ${tableName} (section ${sectionKey}):`, e);
        operationStatus.success = false;
        operationStatus.details.push(`Exception for ${tableName}: ${e.message}`);
      }
    }
  }

  // Delete from storage buckets
  if (sectionConfig.buckets) {
    for (const bucketName of sectionConfig.buckets) {
      try {
        const { data: files, error: listError } = await supabaseAdmin.storage.from(bucketName).list();
        if (listError) {
          console.error(`Error listing ${bucketName} (section ${sectionKey}):`, listError);
          operationStatus.success = false;
          operationStatus.details.push(`Error listing ${bucketName}: ${listError.message}`);
          continue;
        }
        if (files && files.length > 0) {
          const fileNames = files.map(file => file.name);
          const { error: deleteError } = await supabaseAdmin.storage.from(bucketName).remove(fileNames);
          if (deleteError) {
            console.error(`Error deleting from ${bucketName} (section ${sectionKey}):`, deleteError);
            operationStatus.success = false;
            operationStatus.details.push(`Error deleting from ${bucketName}: ${deleteError.message}`);
          } else {
            operationStatus.details.push(`OK: ${bucketName} files cleared.`);
          }
        } else {
            operationStatus.details.push(`OK: No files in ${bucketName}.`);
        }
      } catch (e) {
        console.error(`Exception for bucket ${bucketName} (section ${sectionKey}):`, e);
        operationStatus.success = false;
        operationStatus.details.push(`Exception for ${bucketName}: ${e.message}`);
      }
    }
  }
  return operationStatus;
}

serve(async (req: Request) => {
  console.log("Edge Fn 'danger-delete-all-data' invoked.");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase Admin Client with the user's JWT to extract user ID,
    // but mainly will use SERVICE_ROLE_KEY for actual operations.
    const authHeader = req.headers.get("Authorization")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Verify user from JWT passed in Authorization header
    const { data: { user }, error: userError } = await createClient(supabaseUrl, supabaseServiceRoleKey, {
        global: { headers: { Authorization: authHeader } }
    }).auth.getUser();

    if (userError || !user) {
        console.error("Auth error or no user from JWT:", userError);
        return new Response(JSON.stringify({ error: "User not authenticated or JWT invalid." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }
    console.log("Authenticated admin user ID:", user.id);

    const { sectionKeys } = await req.json();
    if (!sectionKeys || !Array.isArray(sectionKeys) || sectionKeys.length === 0) {
      return new Response(JSON.stringify({ error: "'sectionKeys' (array of strings) is required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }
    console.log("Attempting deletion for sections:", sectionKeys);

    const results = [];
    let overallSuccess = true;
    const deletedSectionLabels: string[] = [];

    for (const key of sectionKeys) {
      const result = await deleteDataForSection(supabaseAdmin, key, user.id);
      results.push({ sectionKey: key, ...result });
      if (!result.success) overallSuccess = false;
      const s_config = deletableSectionsConfigData.find(s => s.key === key);
      if(s_config) deletedSectionLabels.push(s_config.label);
    }
    
    try {
        await supabaseAdmin.from("admin_activity_log").insert({
            action_type: overallSuccess ? "DATA_DELETION_SUCCESS" : "DATA_DELETION_PARTIAL_FAILURE",
            description: `Admin deleted data for sections: ${deletedSectionLabels.join(", ") || '[None]'}. Status: ${overallSuccess ? 'Complete' : 'Partial'}.`,
            user_identifier: user.id, 
            details: { requested_section_keys: sectionKeys, results: results },
        });
    } catch (logError) {
        console.error("Failed to log to admin_activity_log:", logError);
    }

    console.log("Deletion results:", results);
    return new Response(JSON.stringify({ success: overallSuccess, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});

console.log("'danger-delete-all-data' Edge Function script ready."); 