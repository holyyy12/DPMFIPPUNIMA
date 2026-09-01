import { OrmawaProfile } from '@/components/v5-directories';
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <OrmawaProfile slug={slug}/>}
