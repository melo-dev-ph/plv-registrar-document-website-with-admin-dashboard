# plv-registrar-document-website-with-admin-dashboard
It is a DOCUMENT REQUEST SYSTEM for PLV Students. This project contains Client Webpage and Admin Webpage.

## Project structure

- `web/index.html` — main homepage
- `web/admin-login.html` — admin login page
- `web/admin.html` — admin dashboard page
- `web/css/` — styles for the site
- `web/js/` — page scripts
- `web/assets/img/` — optional static images

Tester Pass: WS4!D%QWyjcapv!

## Deploying to Vercel

1. Create a new Vercel project.
2. Point the project root to the `web/` folder or deploy the `web` directory as your static site.
3. In Vercel dashboard, go to Project Settings > Environment Variables, and add:
   - `SUPABASE_URL` with your Supabase project URL
   - `SUPABASE_ANON_KEY` with your Supabase anon key
4. Vercel will automatically replace `$SUPABASE_URL` and `$SUPABASE_ANON_KEY` in your JS files during build.
5. No build step is required for this static HTML/CSS/JS site.
