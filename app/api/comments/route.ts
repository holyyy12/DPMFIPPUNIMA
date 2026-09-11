import { commentCreateSchema } from '@/lib/contracts/comments';
import { supabaseRequest, supabaseRpc } from '@/lib/supabase/rest';

const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: Request) {
  try {
    const threadKey = new URL(request.url).searchParams.get('threadKey') ?? '';
    if (!/^publication:[a-z0-9-]{3,160}$/.test(threadKey))
      return Response.json(
        { ok: false, message: 'Ruang diskusi tidak valid.' },
        { status: 400, headers },
      );
    const threads = await supabaseRequest<Array<{ id: string }>>(
      `/rest/v1/comment_threads?select=id&resource_key=eq.${encodeURIComponent(threadKey)}&limit=1`,
      {},
      { noStore: true },
    );
    if (!threads[0]) return Response.json({ ok: true, data: [] }, { headers });
    const data = await supabaseRequest<
      Array<{
        id: string;
        parent_id: string | null;
        depth: number;
        display_mode: string;
        display_name: string | null;
        body: string;
        published_at: string | null;
        delete_tombstone: boolean;
      }>
    >(
      `/rest/v1/public_comments?select=id,parent_id,depth,display_mode,display_name,body,published_at,delete_tombstone&thread_id=eq.${threads[0].id}&order=published_at.asc`,
      {},
      { noStore: true },
    );
    return Response.json({ ok: true, data }, { headers });
  } catch (error) {
    const unavailable =
      error instanceof Error &&
      error.message.includes('BACKEND_NOT_CONFIGURED');
    return Response.json(
      {
        ok: false,
        message: unavailable
          ? 'Diskusi belum diaktifkan pada backend greenfield.'
          : 'Diskusi belum dapat dimuat.',
      },
      { status: unavailable ? 503 : 502, headers },
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const input = commentCreateSchema.parse(await request.json());
    if (input.website)
      return Response.json(
        { ok: true, data: null, requestId },
        { status: 202, headers },
      );
    const commentId = await supabaseRpc<string>(
      'create_public_comment',
      {
        p_thread_key: input.threadKey,
        p_parent_id: input.parentId ?? null,
        p_display_mode: input.displayMode,
        p_display_name: input.displayName || null,
        p_body: input.body,
        p_credential_hash: null,
        p_request_id: requestId,
      },
      { noStore: true },
    );
    return Response.json(
      {
        ok: true,
        data: { commentId },
        message: 'Komentar berhasil dipublikasikan.',
        requestId,
      },
      { status: 201, headers },
    );
  } catch (error) {
    const unavailable =
      error instanceof Error &&
      error.message.includes('BACKEND_NOT_CONFIGURED');
    return Response.json(
      {
        ok: false,
        message: unavailable
          ? 'Diskusi belum diaktifkan pada backend greenfield.'
          : 'Komentar tidak dapat dikirim. Periksa isian Anda.',
        requestId,
      },
      { status: unavailable ? 503 : 400, headers },
    );
  }
}

export async function DELETE() {
  return Response.json(
    {
      ok: false,
      message:
        'Hanya admin yang dapat menghapus komentar melalui Portal Admin.',
    },
    { status: 403, headers },
  );
}
