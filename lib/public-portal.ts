export type PublicContent = {
  id:string; title:string; slug:string; summary:string; body:unknown; status:string;
  content_type?:string; content_type_id?:string; unit_name?:string; organization_id?:string;
  organization_name?:string; published_at?:string; updated_at:string; seo?:Record<string,unknown>;
  featured_object_path?:string; featured_bucket?:string; progress_percent?:number;
  success_percent?:number; public_note?:string; progress_updated_at?:string;
};

export type PublicPortalSnapshot = {
  period: { id?:string; name?:string; slug?:string; startsAt?:string; endsAt?:string };
  settings: Record<string,unknown>;
  contents: PublicContent[];
  ddas: { total:number; inProgress:number; followedUp:number; completed:number };
  surveys: Array<{ id:string; title:string; slug:string; status:string; opensAt?:string; closesAt?:string; responseCount:number }>;
  organizations: Array<{ id:string; name:string; slug:string; shortName?:string; description:string; websiteUrl?:string; contact?:Record<string,unknown>; sortOrder:number; members:Array<{id:string;name:string;position:string;sortOrder:number}> }>;
};

export const emptyPublicPortal:PublicPortalSnapshot={period:{},settings:{},contents:[],ddas:{total:0,inProgress:0,followedUp:0,completed:0},surveys:[],organizations:[]};

export function publicAssetUrl(item:PublicContent){
  const direct=(item.seo as {program?:{image?:string}}|undefined)?.program?.image;
  if(direct)return direct;
  if(!item.featured_object_path)return '/fipp-campus-hero.png';
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'');
  return base ? `${base}/storage/v1/object/public/${item.featured_bucket ?? 'public-media'}/${item.featured_object_path}` : '/fipp-campus-hero.png';
}

export function formatPublicDate(value?:string){return value?new Intl.DateTimeFormat('id-ID',{dateStyle:'medium'}).format(new Date(value)):'—'}
