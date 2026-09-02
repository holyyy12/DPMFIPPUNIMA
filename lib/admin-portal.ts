export type AdminPortalSnapshot = {
  me?: { id: string; name: string; email?: string; roles: string[] };
  periods: Array<{ id: string; name: string; slug: string; is_current: boolean; status: string }>;
  units: Array<{ id: string; period_id: string; name: string; code: string; status: string; sort_order: number }>;
  users: Array<{ id: string; display_name: string; email_normalized?: string; status: string; last_active_at?: string; roles: Array<{ key: string; name: string; unitId?: string }> }>;
  roles: Array<{ id: string; key: string; name: string; description: string; status: string }>;
  permissions: Array<{ id: string; key: string; description: string; risk_level: string; roles: Record<string, boolean> }>;
  contents: Array<{ id: string; title: string; slug: string; summary: string; body: unknown; status: string; content_type?: string; content_type_id?: string; unit_id?: string; unit_name?: string; updated_at: string; published_at?: string }>;
  contentTypes: Array<{ id: string; key: string; name: string; route_pattern: string; status: string }>;
  ddasCases: Array<{ id: string; ticket_public_id: string; status: string; subject: string; priority: string; risk_class: string; assigned_unit?: string; assigned_unit_id?: string; submitted_at: string; timeline: Array<{ state: string; message: string; occurredAt: string }> }>;
  comments: Array<{ id: string; thread_id: string; parent_id?: string; display_mode: string; display_name?: string; body: string; status: string; created_at: string; resource_type: string; resource_key: string; report_count: number }>;
  notifications: Array<{ id: string; type: string; title: string; message_safe: string; target_path?: string; priority: string; read_at?: string; created_at: string }>;
  organizations: Array<{ id: string; name: string; slug: string; short_name?: string; description: string; status: string; members: Array<{ id: string; name: string; position: string; sortOrder: number }> }>;
  media: Array<{ id: string; bucket: string; object_path: string; original_filename: string; mime_type: string; byte_size: number; status: string; created_at: string }>;
  settings: Record<string, unknown>;
  surveys: Array<{ id: string; title: string; slug: string; status: string; response_count: number; created_at: string }>;
  audit: Array<{ id: string; occurred_at: string; actor_name?: string; actor_type: string; action: string; target_type: string; target_id?: string; result: string; reason?: string }>;
};

export const emptyAdminPortal: AdminPortalSnapshot = {
  periods: [], units: [], users: [], roles: [], permissions: [], contents: [], contentTypes: [],
  ddasCases: [], comments: [], notifications: [], organizations: [], media: [], settings: {}, surveys: [], audit: [],
};
