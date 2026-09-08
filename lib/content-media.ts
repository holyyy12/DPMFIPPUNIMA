import type { PublicContent } from './public-portal';
export type ContentMedia = { url:string; name:string; mimeType?:string };
export function contentMedia(item: PublicContent): ContentMedia[] {
  const body=item.body as {attachments?:unknown[]}|undefined;
  const program=item.seo?.program as {documentation?:unknown[]}|undefined;
  return (program?.documentation??body?.attachments??[]).flatMap(value=>{
    const m=value as {url?:string;publicUrl?:string;name?:string;mimeType?:string};
    const url=m.url??m.publicUrl??'';
    return /^https?:\/\//.test(url)?[{url,name:m.name??'Dokumentasi',mimeType:m.mimeType}]:[];
  });
}
