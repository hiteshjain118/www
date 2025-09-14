# Supabase Edge Functions

This directory contains Supabase Edge Functions for the CoralBricks backend service.

## Directory Structure

```
supabase/
├── config.toml              # Supabase project configuration
├── functions/
│   ├── deno.json            # Deno configuration for edge functions
│   ├── _shared/
│   │   └── cors.ts          # Shared CORS utilities
│   └── hello-world/
│       └── index.ts         # Example edge function
└── README.md                # This file
```

## What are Edge Functions?

Supabase Edge Functions are server-side TypeScript functions that run on Deno at the edge, close to your users. They are perfect for:

- API endpoints that need custom logic
- Webhooks and integrations
- Data processing and transformations
- Authentication flows
- Real-time data processing

## Prerequisites

Before working with Supabase Edge Functions, you need:

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

2. **Deno** installed (for local development):
   ```bash
   # macOS
   brew install deno
   
   # Or via curl
   curl -fsSL https://deno.land/x/install/install.sh | sh
   ```

## Getting Started

### 1. Initialize Supabase (if not already done)

```bash
cd backend
supabase init
```

### 2. Start Local Development

```bash
# Start all Supabase services locally
supabase start

# This will start:
# - Database (PostgreSQL)
# - API (PostgREST)
# - Auth (GoTrue)
# - Storage
# - Edge Functions runtime
```

### 3. Test the Example Function

Once `supabase start` is running, you can test the hello-world function:

```bash
# GET request
curl "http://localhost:54321/functions/v1/hello-world?name=John"

# POST request
curl -X POST "http://localhost:54321/functions/v1/hello-world" \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "message": "Hello from CoralBricks!"}'
```

### 4. Create New Functions

```bash
# Create a new function
supabase functions new my-function-name

# This creates: supabase/functions/my-function-name/index.ts
```

## Function Development

### Basic Function Template

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCors } from "../_shared/cors.ts"

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Your function logic here
    const data = { message: "Hello from Edge Function!" }
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
```

### Environment Variables

Edge Functions can access environment variables:

```typescript
const apiKey = Deno.env.get('MY_API_KEY')
const dbUrl = Deno.env.get('SUPABASE_URL')
```

Set environment variables in your Supabase dashboard or locally:

```bash
# Local development
supabase secrets set MY_API_KEY=your-secret-key
```

### Database Access

Access your Supabase database from edge functions:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

// Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*')
```

## Deployment

### Local Testing

```bash
# Serve functions locally
supabase functions serve

# Serve specific function
supabase functions serve hello-world --no-verify-jwt
```

### Deploy to Production

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy hello-world
```

### Authentication

Edge functions respect Supabase auth by default:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  // Get the JWT from the Authorization header
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  
  // Create Supabase client with the user's JWT
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )
  
  // Get the authenticated user
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Continue with authenticated logic...
})
```

## Common Use Cases

### 1. Webhook Handler

```typescript
// Handle external webhooks (Stripe, SendGrid, etc.)
serve(async (req: Request) => {
  const payload = await req.json()
  
  // Process webhook data
  // Update database
  // Send notifications
  
  return new Response('OK', { status: 200 })
})
```

### 2. Email Sender

```typescript
// Send emails via external service
serve(async (req: Request) => {
  const { to, subject, html } = await req.json()
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@coralbricks.ai' },
      subject,
      content: [{ type: 'text/html', value: html }]
    })
  })
  
  return new Response(JSON.stringify({ sent: response.ok }))
})
```

### 3. Data Processing

```typescript
// Process data uploads or transformations
serve(async (req: Request) => {
  const data = await req.json()
  
  // Transform, validate, or enrich data
  const processedData = await processData(data)
  
  // Save to database
  const { error } = await supabase
    .from('processed_data')
    .insert(processedData)
  
  return new Response(JSON.stringify({ success: !error }))
})
```

## Debugging

### Logs

View function logs:

```bash
# View logs for all functions
supabase functions logs

# View logs for specific function
supabase functions logs hello-world
```

### Local Debugging

```bash
# Run with detailed logs
supabase functions serve --debug
```

## Best Practices

1. **Always handle CORS** - Use the shared CORS utility
2. **Validate input** - Check request data before processing
3. **Handle errors gracefully** - Return appropriate HTTP status codes
4. **Use TypeScript interfaces** - Define request/response types
5. **Keep functions focused** - One function per specific task
6. **Use environment variables** - Never hardcode secrets
7. **Test locally first** - Use `supabase start` for development

## Integration with CoralBricks Backend

These edge functions complement your Express.js backend (ports 3000/3001) by providing:

- **Serverless scaling** - Functions scale automatically
- **Global distribution** - Run at edge locations worldwide
- **Event-driven processing** - React to database changes
- **Third-party integrations** - Handle webhooks and external APIs

Use edge functions for operations that don't need the full Express.js stack but benefit from serverless execution.

## Support

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions) 