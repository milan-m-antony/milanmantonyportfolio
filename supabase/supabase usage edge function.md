**admin-dashbaord , Supabase Usage where Database Size shows error then**
**Run this in supabase sql editor**

        CREATE OR REPLACE FUNCTION get_current_database_size_pretty()
        RETURNS TEXT AS $$
        BEGIN
          RETURN pg_size_pretty(pg_database_size(current_database()));
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        GRANT EXECUTE ON FUNCTION get_current_database_size_pretty() TO authenticated, anon, service_role;
 
      
      
    
        

    