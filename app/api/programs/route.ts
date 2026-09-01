import { z } from 'zod';
import { verifyAdminSession } from '@/lib/supabase/auth';
import { supabaseRequest, supabaseRpc } from '@/lib/supabase/rest';

type PublishedProgramRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  updated_at: string;
  seo: {
    program?: {
      unit?: string;
      media?: string;
      image?: string;
    };
  } | null;
};

type ProgramProgressRow = {
  content_id: string;
  progress_percent: number;
  success_percent: number;
  public_note: string;
  updated_at: string;
};

const updateSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  title: z.string().trim().min(3).max(180),
  copy: z.string().trim().min(10).max(1200),
  unit: z.string().trim().min(2).max(120),
  media: z.enum(['photo', 'video', 'gallery']),
  image: z.string().url().max(2000),
  progress: z.number().int().min(0).max(100),
  success: z.number().int().min(0).max(100),
  updateNote: z.string().trim().min(3).max(2000),
});

export async function GET() {
  try {
    const content = await supabaseRequest<PublishedProgramRow[]>(
      '/rest/v1/published_content?select=id,slug,title,summary,updated_at,seo&type=eq.program&order=published_at.desc',
      {},
      { noStore: true },
    );

    if (content.length === 0) {
      return Response.json({ ok: true, data: [] });
    }

    const ids = content.map((item) => item.id).join(',');
    const progress = await supabaseRequest<ProgramProgressRow[]>(
      `/rest/v1/program_progress?select=content_id,progress_percent,success_percent,public_note,updated_at&content_id=in.(${ids})`,
      {},
      { noStore: true },
    );
    const progressByContent = new Map(
      progress.map((item) => [item.content_id, item]),
    );

    const data = content.map((item) => {
      const detail = progressByContent.get(item.id);
      const metadata = item.seo?.program;
      return {
        slug: item.slug,
        title: item.title,
        copy: item.summary,
        unit: metadata?.unit ?? 'DPM FIPP',
        media: metadata?.media ?? 'photo',
        image: metadata?.image ?? '/fipp-campus-hero.png',
        progress: detail?.progress_percent ?? 0,
        success: detail?.success_percent ?? 0,
        updateNote: detail?.public_note ?? 'Belum ada pembaruan publik.',
        updatedAt: detail?.updated_at ?? item.updated_at,
      };
    });

return Response.json(
  { ok: true, data },
  {
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
    },
  },
);
  } catch {
    return Response.json(
      { ok: false, message: 'Data program belum tersedia.' },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session) {
      return Response.json(
        { ok: false, message: 'Sesi admin diperlukan.' },
        { status: 401 },
      );
    }

    const input = updateSchema.parse(await request.json());
    const data = await supabaseRpc<Record<string, unknown>>(
      'update_program_progress',
      {
        p_slug: input.slug,
        p_title: input.title,
        p_summary: input.copy,
        p_unit_label: input.unit,
        p_media_kind: input.media,
        p_image_url: input.image,
        p_progress_percent: input.progress,
        p_success_percent: input.success,
        p_public_note: input.updateNote,
      },
      { accessToken: session.token, noStore: true },
    );

    return Response.json(
      { ok: true, data },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { ok: false, message: 'Data program belum lengkap atau tidak valid.' },
        { status: 400 },
      );
    }
    return Response.json(
      { ok: false, message: 'Pembaruan program gagal disimpan.' },
      { status: 403 },
    );
  }
}
