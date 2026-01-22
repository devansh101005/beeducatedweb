// Clerk Webhook Handler
// Syncs user data from Clerk to Supabase

import { Request, Response, Router } from 'express';
import { Webhook } from 'svix';
import { getSupabase } from '../config/supabase.js';

const router = Router();

// Clerk webhook event types we handle
type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{
      id: string;
      email_address: string;
      verification: { status: string };
    }>;
    phone_numbers?: Array<{
      id: string;
      phone_number: string;
      verification: { status: string };
    }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    created_at?: number;
    updated_at?: number;
    public_metadata?: Record<string, unknown>;
    private_metadata?: Record<string, unknown>;
  };
};

// Webhook secret from Clerk dashboard
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

/**
 * Verify the webhook signature from Clerk
 */
function verifyWebhook(req: Request): ClerkWebhookEvent | null {
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return null;
  }

  const svixId = req.headers['svix-id'] as string;
  const svixTimestamp = req.headers['svix-timestamp'] as string;
  const svixSignature = req.headers['svix-signature'] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing svix headers');
    return null;
  }

  try {
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    const payload = wh.verify(JSON.stringify(req.body), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;

    return payload;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return null;
  }
}

/**
 * Handle user.created event
 */
async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  const supabase = getSupabase();

  const primaryEmail = data.email_addresses?.find(
    (e) => e.verification?.status === 'verified'
  ) || data.email_addresses?.[0];

  const primaryPhone = data.phone_numbers?.find(
    (p) => p.verification?.status === 'verified'
  ) || data.phone_numbers?.[0];

  const userData = {
    clerk_id: data.id,
    email: primaryEmail?.email_address || '',
    phone: primaryPhone?.phone_number || null,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    avatar_url: data.image_url || null,
    role: 'student' as const, // Default role, can be changed by admin
    email_verified: primaryEmail?.verification?.status === 'verified',
    phone_verified: primaryPhone?.verification?.status === 'verified',
    metadata: {
      clerk_created_at: data.created_at,
      public_metadata: data.public_metadata || {},
    },
  };

  const { data: newUser, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    console.error('Error creating user in Supabase:', error);
    throw error;
  }

  console.log(`User created: ${newUser.id} (${newUser.email})`);
  return newUser;
}

/**
 * Handle user.updated event
 */
async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  const supabase = getSupabase();

  const primaryEmail = data.email_addresses?.find(
    (e) => e.verification?.status === 'verified'
  ) || data.email_addresses?.[0];

  const primaryPhone = data.phone_numbers?.find(
    (p) => p.verification?.status === 'verified'
  ) || data.phone_numbers?.[0];

  const updateData = {
    email: primaryEmail?.email_address,
    phone: primaryPhone?.phone_number || null,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    avatar_url: data.image_url || null,
    email_verified: primaryEmail?.verification?.status === 'verified',
    phone_verified: primaryPhone?.verification?.status === 'verified',
  };

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('clerk_id', data.id)
    .select()
    .single();

  if (error) {
    // User might not exist yet, create them
    if (error.code === 'PGRST116') {
      console.log('User not found, creating...');
      return handleUserCreated(data);
    }
    console.error('Error updating user in Supabase:', error);
    throw error;
  }

  console.log(`User updated: ${updatedUser.id} (${updatedUser.email})`);
  return updatedUser;
}

/**
 * Handle user.deleted event
 */
async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  const supabase = getSupabase();

  // Soft delete - just mark as inactive
  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('clerk_id', data.id);

  if (error) {
    console.error('Error deleting user in Supabase:', error);
    throw error;
  }

  console.log(`User deactivated: ${data.id}`);
}

/**
 * Main webhook handler
 */
router.post('/', async (req: Request, res: Response) => {
  // Skip verification in development if secret is not set
  let event: ClerkWebhookEvent | null;

  if (process.env.NODE_ENV === 'development' && !CLERK_WEBHOOK_SECRET) {
    console.warn('⚠️ Skipping webhook verification in development');
    event = req.body as ClerkWebhookEvent;
  } else {
    event = verifyWebhook(req);
    if (!event) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  console.log(`Received Clerk webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event.data);
        break;

      case 'user.updated':
        await handleUserUpdated(event.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(event.data);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
