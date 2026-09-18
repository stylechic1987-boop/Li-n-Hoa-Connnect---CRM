import { FormEvent,useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LogIn } from "lucide-react";
import { auth,firebaseConfigured } from "../lib/firebase";

export default function Login({onDemo}:{onDemo:()=>void}){
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function submit(e:FormEvent){e.preventDefault();if(!auth)return;setBusy(true);setError("");try{await signInWithEmailAndPassword(auth,email,password)}catch(err:any){setError(err?.message||"Đăng nhập thất bại")}finally{setBusy(false)}}
 if(!firebaseConfigured)return <div className="login-page"><div className="login-box"><div className="brand">LIÊN HOA<small>CONNECT • HR & CRM</small></div><h2>Cấu hình Firebase</h2><p className="muted">Chưa có cấu hình Firebase. Hãy thêm các biến VITE_FIREBASE_* vào GitHub Actions để bật đăng nhập thật.</p><button className="btn" onClick={onDemo}><LogIn size={15}/> Vào bản demo</button></div></div>;
 return <div className="login-page"><form className="login-box" onSubmit={submit}><div className="brand">LIÊN HOA<small>CONNECT • HR & CRM</small></div><h2>Đăng nhập hệ thống</h2><label>Email<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Mật khẩu<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{error&&<div className="badge danger">{error}</div>}<button className="btn" disabled={busy}>{busy?"Đang đăng nhập…":"Đăng nhập"}</button></form></div>;
}
