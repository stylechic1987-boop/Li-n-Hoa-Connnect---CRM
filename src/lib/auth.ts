import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type HRRole="company_director"|"branch_director"|"center_director"|"mkt"|"sale"|"teacher_chinese"|"teacher_english"|"teacher_korean"|"admin";
export type HRProfile={user_id:string;role:HRRole;branch:string|null;center:string|null;employee_id:string|null};

export function useHRAuth(){
 const [session,setSession]=useState<User|null>(null); const [profile,setProfile]=useState<HRProfile|null>(null); const [loading,setLoading]=useState(Boolean(auth));
 useEffect(()=>{if(!auth){setLoading(false);return}
  return onAuthStateChanged(auth,async user=>{setSession(user);if(!user){setProfile(null);setLoading(false);return}
   try{const s=db?await getDoc(doc(db,"profiles",user.uid)):null;setProfile(s?.exists()?({user_id:user.uid,...s.data()} as HRProfile):null)}finally{setLoading(false)}
  })
 },[]);
 return {session,profile,loading};
}
