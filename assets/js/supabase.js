"use strict";

const SUPABASE_URL =
    "https://xyjoyzxbvlppbqbwjrnz.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_74lbZv-gw9m0pPYTN_XG-Q_Pwk_KF9A";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);