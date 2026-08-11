import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanup() {
  console.log("Cleaning up Hotmart and Abandoned Carts tables...");
  
  const { error: err1 } = await supabase.rpc("admin_execute_sql", {
    sql_query: "DROP TABLE IF EXISTS public.hotmart_purchases CASCADE;"
  });
  if (err1) console.error("Error dropping hotmart_purchases:", err1);

  const { error: err2 } = await supabase.rpc("admin_execute_sql", {
    sql_query: "DROP TABLE IF EXISTS public.abandoned_carts CASCADE;"
  });
  if (err2) console.error("Error dropping abandoned_carts:", err2);

  console.log("Cleanup finished.");
}

cleanup();
