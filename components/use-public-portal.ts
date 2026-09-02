'use client';
import {useCallback,useEffect,useState} from 'react';
import {emptyPublicPortal,PublicPortalSnapshot} from '@/lib/public-portal';

export function usePublicPortal(){
  const[data,setData]=useState<PublicPortalSnapshot>(emptyPublicPortal);
  const[loading,setLoading]=useState(true);const[error,setError]=useState('');
  const reload=useCallback(async()=>{setLoading(true);setError('');try{const response=await fetch('/api/public/portal',{cache:'no-store'});const payload=await response.json() as {ok:boolean;data?:PublicPortalSnapshot;message?:string};if(!response.ok||!payload.ok||!payload.data)throw new Error(payload.message??'Data publik tidak tersedia.');setData(payload.data)}catch(reason){setError(reason instanceof Error?reason.message:'Data publik tidak tersedia.');setData(emptyPublicPortal)}finally{setLoading(false)}},[]);
  useEffect(()=>{void reload()},[reload]);return{data,loading,error,reload};
}
