import { useEffect, useState } from "react";
import { doc, getDoc, onAuthStateChanged, db } from "./backend";

export type HRRole="company_director"|"branch_director"|"center_director"|"mkt"|"sale"|"teacher_chinese"|"teacher_english"|"teacher_korean"|"admin";
export type HRProfile={user_id:string;role:HRRole;branch:string|null;center:string|null;employee_id:string|null};

export function useHRAuth(){
 const [session,setSession]=useState<any|null>(null); const [profile,setProfile]=useState<HRProfile|null>(null); const [loading,setLoading]=useState(Boolean(db));
 useEffect(()=>{if(!db){setLoading(false);return} return onAuthStateChanged(async user=>{setSession(user);if(!user){setProfile(null);setLoading(false);return} try{const s=await getDoc(doc(db,"profiles",user.uid));setProfile(s.exists()?({user_id:user.uid,...s.data()} as HRProfile):null)}finally{setLoading(false)}})},[]);
 return {session,profile,loading};
}
