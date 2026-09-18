import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";

export default function Login({ onDemo }: { onDemo: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
    setBusy(false);
  }

  if (!supabaseConfigured) {
    return <div className="login-page"><div className="login-box"><div className="brand">LIÊN HOA<small>CONNECT • HR & CRM</small></div><h2>Cấu hình đăng nhập</h2><p className="muted">Ứng dụng đang ở chế độ demo. Thêm VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY vào môi trường triển khai để bật đăng nhập thật.</p><button className="btn" onClick={onDemo}><LogIn size={15}/> Vào bản demo</button></div></div>;
  }

  return <div className="login-page"><form className="login-box" onSubmit={submit}><div className="brand">LIÊN HOA<small>CONNECT • HR & CRM</small></div><h2>Đăng nhập hệ thống</h2><label>Email<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Mật khẩu<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>{error&&<div className="badge danger">{error}</div>}<button className="btn" disabled={busy}>{busy?"Đang đăng nhập…":"Đăng nhập"}</button></form></div>;
}
