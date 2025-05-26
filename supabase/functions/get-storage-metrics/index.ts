import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// SQL function to get database size (create this in your Supabase SQL Editor if not already done)
/*
CREATE OR REPLACE FUNCTION get_current_database_size_pretty()
RETURNS TEXT AS $$
BEGIN
  RETURN pg_size_pretty(pg_database_size(current_database()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_current_database_size_pretty() TO authenticated, anon, service_role;
*/
async function getDatabaseSize(supabaseAdmin) {
  console.log("[EF] Fetching database size...");
  try {
    const { data, error } = await supabaseAdmin.rpc('get_current_database_size_pretty');
    if (error) {
      console.error("[EF] Error fetching database size via RPC:", error.message);
      // Fallback attempt if RPC is not set up or fails for permission reasons
      console.log("[EF] Attempting fallback direct query for database size...");
      const { data: directData, error: directError } = await supabaseAdmin
        .from('pg_database')
        .select('pg_database_size(datname) as raw_size, pg_size_pretty(pg_database_size(datname)) as pretty_size')
        .eq('datname', Deno.env.get('POSTGRES_DB') || 'postgres') 
        .single();
      if (directError) {
        console.error("[EF] Error fetching database size via direct query:", directError.message);
        return "Error (RPC & Query Failed)";
      }
      console.log("[EF] Fallback query successful. Pretty size:", directData?.pretty_size);
      return directData?.pretty_size || "N/A (Fallback)";
    }
    console.log("[EF] RPC successful. Database size:", data);
    return data || "N/A (RPC)";
  } catch (e) {
    console.error("[EF] Exception fetching database size:", e.message);
    return "Error (Exception)";
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i >= sizes.length) return `${(bytes / Math.pow(k, sizes.length - 1)).toFixed(dm)} ${sizes[sizes.length - 1]}`;
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function getTotalBucketStorageUsed(supabaseAdmin) {
  console.log("[EF] Attempting to calculate total bucket storage used...");
  let totalSizeInBytes = 0;
  const MAX_FILES_PER_BUCKET_TO_SCAN = 5000; 
  const LIST_LIMIT = 100; 
  const FUNCTION_PROCESSING_DEADLINE_MS = 4500; 
  const startTime = Date.now();

  try {
    console.log("[EF] Listing buckets...");
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    const timeAfterListBuckets = Date.now();
    console.log(`[EF] Listed buckets in ${timeAfterListBuckets - startTime}ms. Found: ${buckets?.length || 0}`);

    if (bucketsError) {
      console.error("[EF] Error listing buckets:", bucketsError.message);
      return { value: -1, pretty: "Error listing buckets" }; 
    }
    if (!buckets || buckets.length === 0) {
      console.log("[EF] No buckets found or empty list.");
      return { value: 0, pretty: "0 Bytes (No buckets)" }; 
    }

    for (let i = 0; i < buckets.length; i++){
      const bucket = buckets[i];
      const currentTime = Date.now();
      if (currentTime - startTime > FUNCTION_PROCESSING_DEADLINE_MS) {
        console.warn(`[EF] Approaching timeout (${FUNCTION_PROCESSING_DEADLINE_MS}ms), returning partial data. Processed ${i} of ${buckets.length} buckets.`);
        return { value: totalSizeInBytes, pretty: `~${formatBytes(totalSizeInBytes)} (Partial - Timeout)` };
      }

      if (bucket.name.startsWith('supabase-') || bucket.id.startsWith('supabase-')) {
        console.log(`[EF] Skipping internal bucket: ${bucket.name}`);
        continue;
      }
      if (bucket.name === 'migrations') {
        console.log(`[EF] Skipping migrations bucket: ${bucket.name}`);
        continue;
      }
      
      console.log(`[EF] Processing bucket: ${bucket.name} (${i+1}/${buckets.length})`);
      let currentBucketSize = 0;
      let filesScannedInBucket = 0;
      let offset = 0;
      let hasMoreFiles = true;
      const bucketStartTime = Date.now();

      while(hasMoreFiles && filesScannedInBucket < MAX_FILES_PER_BUCKET_TO_SCAN){
        if (Date.now() - startTime > FUNCTION_PROCESSING_DEADLINE_MS) {
          console.warn(`[EF] Approaching timeout during file scan in ${bucket.name}, returning partial data.`);
          totalSizeInBytes += currentBucketSize; 
          return { value: totalSizeInBytes, pretty: `~${formatBytes(totalSizeInBytes)} (Partial - Timeout in ${bucket.name})` };
        }
        // console.log(`[EF] Listing files in ${bucket.name}, offset: ${offset}, limit: ${LIST_LIMIT}`);
        const { data: files, error: listError } = await supabaseAdmin.storage.from(bucket.name).list('', {
          limit: LIST_LIMIT,
          offset: offset,
          sortBy: { column: 'name', order: 'asc' }
        });

        if (listError) {
          console.error(`[EF] Error listing files in bucket ${bucket.name} (offset ${offset}):`, listError.message);
          return { value: -1, pretty: `Error (List Fail ${bucket.name})` };
        }
        if (files && files.length > 0) {
          files.forEach((file)=>{
            if (file.name !== '.emptyFolderPlaceholder') {
              const fileSize = file.metadata?.size ?? 0;
              if (typeof fileSize === 'number') currentBucketSize += fileSize;
            }
          });
          offset += files.length;
          filesScannedInBucket += files.length;
          if (files.length < LIST_LIMIT) hasMoreFiles = false; 
        } else {
          hasMoreFiles = false; 
        }
        // console.log(`[EF] Scanned ${filesScannedInBucket} files so far in ${bucket.name}. Current bucket size: ${currentBucketSize} bytes.`);
      }
      
      const bucketEndTime = Date.now();
      console.log(`[EF] Finished processing bucket ${bucket.name} in ${bucketEndTime - bucketStartTime}ms. Size: ${formatBytes(currentBucketSize)}. Total files scanned: ${filesScannedInBucket}`);
      
      if (filesScannedInBucket >= MAX_FILES_PER_BUCKET_TO_SCAN) {
        console.warn(`[EF] Reached scan limit for bucket ${bucket.name}. Reported size for this bucket may be partial.`);
      }
      totalSizeInBytes += currentBucketSize; 
    }
    console.log(`[EF] Total calculated approximate storage size: ${formatBytes(totalSizeInBytes)}`);
    return { value: totalSizeInBytes, pretty: `~${formatBytes(totalSizeInBytes)}` };
  } catch (e) {
    console.error("[EF] Exception calculating total bucket storage:", e.message);
    if (e.name === 'DeadlineExceeded') { 
        return { value: totalSizeInBytes, pretty: `~${formatBytes(totalSizeInBytes)} (Partial - Deadline)` };
    }
    return { value: -1, pretty: "Error (Exception)" };
  }
}

Deno.serve(async (req)=>{
  console.log("[EF] get-storage-metrics function invoked. Method:", req.method);
  if (req.method === 'OPTIONS') {
    console.log("[EF] Handling OPTIONS request.");
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    });
  }
  try {
    console.log("[EF] Retrieving Supabase credentials and plan limits from env...");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const planDbMaxSizeMBString = Deno.env.get('SUPABASE_PLAN_DB_MAX_SIZE_MB') || '1024'; 
    const planDbMaxSizeMB = parseInt(planDbMaxSizeMBString, 10);

    const planBucketMaxSizeMBString = Deno.env.get('SUPABASE_PLAN_BUCKET_MAX_SIZE_MB') || '10240';
    const planBucketMaxSizeMB = parseInt(planBucketMaxSizeMBString, 10);
    console.log(`[EF] Configured Max DB: ${planDbMaxSizeMB}MB, Max Bucket: ${planBucketMaxSizeMB}MB`);

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[EF] Supabase credentials not configured in function secrets.");
      throw new Error("Supabase credentials not configured in function secrets.");
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log("[EF] Supabase admin client created. Fetching metrics...");
    
    const [dbMetrics, bucketMetricsResult] = await Promise.all([
      getDatabaseSize(supabaseAdmin),
      getTotalBucketStorageUsed(supabaseAdmin) 
    ]);
    console.log("[EF] Fetched DB size:", dbMetrics);
    console.log("[EF] Fetched Bucket metrics (raw object):", bucketMetricsResult);

    const responsePayload = {
      databaseSize: dbMetrics, 
      maxDatabaseSizeMB: planDbMaxSizeMB, 
      bucketStorageUsed: bucketMetricsResult.pretty, 
      bucketStorageUsedBytes: bucketMetricsResult.value, 
      maxBucketStorageMB: planBucketMaxSizeMB 
    };
    console.log("[EF] Preparing to send response payload:", responsePayload);

    return new Response(JSON.stringify(responsePayload), {
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
      status: 200
    });
  } catch (error) {
    console.error("[EF] Error in main Deno.serve handler:", error.message, error.stack);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
