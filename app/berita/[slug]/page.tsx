import { V4PublicationDetail } from '@/components/v4-public';
export default async function PublicationDetail({params}:{params:Promise<{slug:string}>}){const{slug}=await params;return <V4PublicationDetail slug={slug}/>}
