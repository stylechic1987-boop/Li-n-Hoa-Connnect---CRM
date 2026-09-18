import { useEffect, useMemo, useState } from "react";
import { Users, Clock3, CalendarDays, Building2, LayoutDashboard, Network, BriefcaseBusiness, Plus, LogIn, LogOut, Search } from "lucide-react";
import Login from "./components/Login";
import { useHRAuth } from "./lib/auth";
import { supabase, supabaseConfigured } from "./lib/supabase";
import ClassAttendance from "./components/ClassAttendance";

type Emp={id:string;name:string;role:string;dept:string;branch:string;center:string;status:"Đang làm"|"Tạm nghỉ"|"Nghỉ việc";specialty:string;join:string;user_id?:string|null;db_id?:string};
type Att={id:string;date:string;employee:string;in?:string;out?:string;hours?:number;status:string};

const seed:Emp[]=[
{id:"LH001",name:"Nguyễn Minh Anh",role:"company_director",dept:"Ban Giám đốc",branch:"Toàn công ty",center:"Trụ sở",status:"Đang làm",specialty:"Quản trị",join:"2025-01-01"},
{id:"LH002",name:"Trần Quốc Nam",role:"branch_director",dept:"Ban Giám đốc",branch:"Lạng Sơn",center:"Lạng Sơn",status:"Đang làm",specialty:"Điều hành",join:"2025-03-01"},
{id:"LH003",name:"Lê Thu Hà",role:"center_director",dept:"Điều hành",branch:"Bắc Ninh",center:"Bắc Ninh",status:"Đang làm",specialty:"Đào tạo",join:"2025-04-10"},
{id:"LH004",name:"Phạm Ngọc Mai",role:"mkt",dept:"Marketing",branch:"Lạng Sơn",center:"Lạng Sơn",status:"Đang làm",specialty:"Digital Marketing",join:"2026-05-05"},
{id:"LH005",name:"Vũ Đức Thành",role:"sale",dept:"Kinh doanh",branch:"Bắc Ninh",center:"Bắc Ninh",status:"Đang làm",specialty:"Tư vấn khóa học",join:"2026-06-12"},
{id:"LH006",name:"Hoàng Linh",role:"teacher_chinese",dept:"Giảng dạy",branch:"Lạng Sơn",center:"Lạng Sơn",status:"Đang làm",specialty:"HSK 1-6",join:"2026-07-01"},
{id:"LH007",name:"Nguyễn Lan",role:"teacher_english",dept:"Giảng dạy",branch:"Bắc Ninh",center:"Bắc Ninh",status:"Đang làm",specialty:"IELTS/TOEIC",join:"2026-07-15"},
{id:"LH008",name:"Kim Hương",role:"teacher_korean",dept:"Giảng dạy",branch:"Lạng Sơn",center:"Lạng Sơn",status:"Đang làm",specialty:"TOPIK",join:"2026-08-01"}];

const roleName:Record<string,string>={company_director:"Giám đốc công ty",branch_director:"Giám đốc chi nhánh",center_director:"Giám đốc trung tâm",mkt:"MKT",sale:"Sale",teacher_chinese:"Giáo viên tiếng Trung",teacher_english:"Giáo viên tiếng Anh",teacher_korean:"Giáo viên tiếng Hàn",admin:"Admin"};
const today=new Date().toISOString().slice(0,10);
const load=<T,>(k:string,d:T):T=>{try{return JSON.parse(localStorage.getItem(k)||"null")??d}catch{return d}};

export default function App(){
 const {session,profile,loading}=useHRAuth();
 const [demo,setDemo]=useState(!supabaseConfigured);
 const [tab,setTab]=useState("dashboard");
 const [employees,setEmployees]=useState<Emp[]>(()=>load("lh_employees",seed));
 const [attendance,setAttendance]=useState<Att[]>(()=>load("lh_attendance",[]));
 const [query,setQuery]=useState(""); const [show,setShow]=useState(false); const [busy,setBusy]=useState(false);
 const [form,setForm]=useState<Emp>({id:"",name:"",role:"mkt",dept:"Marketing",branch:"Lạng Sơn",center:"Lạng Sơn",status:"Đang làm",specialty:"",join:today});

 const isLive=Boolean(supabase&&session&&!demo);
 const canManage=Boolean(profile&&["company_director","admin","branch_director","center_director"].includes(profile.role));

 useEffect(()=>{ if(!isLive)return; refreshLive(); },[isLive,profile?.user_id]);
 async function refreshLive(){
   if(!supabase)return;
   setBusy(true);
   const [{data:es},{data:as}]=await Promise.all([
     supabase.from("hr_employees").select("id,employee_code,full_name,title,department,role,branch,center,specialty,start_date,status,user_id").order("employee_code"),
     supabase.from("hr_attendance").select("id,work_date,employee_id,check_in,check_out,worked_minutes,status").eq("work_date",today)
   ]);
   if(es)setEmployees(es.map((e:any)=>({id:e.employee_code,name:e.full_name,role:e.role,dept:e.department,branch:e.branch,center:e.center||"",status:e.status,specialty:e.specialty||"",join:e.start_date,user_id:e.user_id,db_id:e.id})));
   if(as)setAttendance(as.map((a:any)=>({id:a.id,date:a.work_date,employee:((es||[]).find((e:any)=>e.id===a.employee_id)?.employee_code||a.employee_id),in:a.check_in?new Date(a.check_in).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}):undefined,out:a.check_out?new Date(a.check_out).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}):undefined,hours:a.worked_minutes?Math.round(a.worked_minutes/60*100)/100:undefined,status:a.status})));
   setBusy(false);
 }
 const saveAtt=(list:Att[])=>{setAttendance(list);localStorage.setItem("lh_attendance",JSON.stringify(list))};

 async function checkIn(e:Emp){
   if(isLive&&supabase&&e.user_id){
     const {error}=await supabase.from("hr_attendance").upsert({employee_id:e.user_id,work_date:today,check_in:new Date().toISOString(),status:"Đang làm"},{onConflict:"employee_id,work_date"});
     if(!error) await refreshLive(); else alert(error.message); return;
   }
   if(attendance.some(a=>a.employee===e.id&&a.date===today))return;
   saveAtt([...attendance,{id:e.id+"-"+today,date:today,employee:e.id,in:new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}),status:"Đang làm"}]);
 }
 async function checkOut(e:Emp){
   const a=attendance.find(x=>x.employee===e.id&&x.date===today); if(isLive&&supabase&&a){
     const out=new Date(); const {error}=await supabase.from("hr_attendance").update({check_out:out.toISOString(),status:"Đã hoàn thành"}).eq("id",a.id);
     if(!error)await refreshLive(); else alert(error.message); return;
   }
   if(a)saveAtt(attendance.map(x=>x===a?{...x,out:new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}),status:"Đã hoàn thành"}:x));
 }
 async function addEmployee(){
   if(isLive&&supabase){
     const {error}=await supabase.from("hr_employees").insert({employee_code:form.id,full_name:form.name,title:form.role,department:form.dept,role:form.role,branch:form.branch,center:form.center,specialty:form.specialty,start_date:form.join,status:form.status});
     if(error){alert(error.message);return} await refreshLive();setShow(false);return;
   }
   setEmployees(x=>[...x,form]); localStorage.setItem("lh_employees",JSON.stringify([...employees,form])); setShow(false);
 }
 const checked=attendance.filter(a=>a.date===today);
 const visibleEmployees=useMemo(()=>employees.filter(e=>(e.name+e.id+(roleName[e.role]||e.role)+e.branch).toLowerCase().includes(query.toLowerCase())),[employees,query]);
 const stats={total:employees.length,active:employees.filter(e=>e.status==="Đang làm").length,checked:checked.length,missing:Math.max(0,employees.filter(e=>e.status==="Đang làm").length-checked.length)};
 const nav: Array<[string, string, React.ComponentType<{size?: number; style?: React.CSSProperties}>]>=[["dashboard","Tổng quan",LayoutDashboard],["employees","Nhân viên",Users],["attendance","Chấm công",Clock3],["schedule","Lịch làm việc",CalendarDays],["leave","Nghỉ phép",BriefcaseBusiness],["org","Sơ đồ tổ chức",Network],["branches","Chi nhánh & trung tâm",Building2],["class-attendance","Điểm danh lớp học",Users]];

 if(loading)return <div className="login-page"><div className="login-box"><h2>Đang tải hệ thống…</h2></div></div>;
 if(supabaseConfigured&&!session&&!demo)return <Login onDemo={()=>setDemo(true)}/>;

 return <div className="app"><aside className="side"><div className="brand">LIÊN HOA<small>CONNECT • HR & CRM</small></div><div className="nav">{nav.map(([id,label,I])=><button className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}><I size={16} style={{verticalAlign:"middle",marginRight:9}}/>{label}</button>)}</div><div style={{position:"absolute",bottom:22,color:"#9ca3af",fontSize:11}}>Liên Hoa Global Education</div></aside>
 <main className="main"><div className="top"><div><div className="title">{nav.find(x=>x[0]===tab)?.[1]}</div><div className="sub">Quản lý nhân sự • ngày {new Date().toLocaleDateString("vi-VN")} {isLive&&profile?("• "+(roleName[profile.role]||profile.role)):"• Bản demo"}</div></div><div style={{display:"flex",gap:8}}>{isLive&&<button className="btn gray" onClick={()=>supabase?.auth.signOut()}>Đăng xuất</button>}{canManage||demo?<button className="btn" onClick={()=>{setForm({...form,id:"LH"+String(employees.length+1).padStart(3,"0")});setShow(true)}}><Plus size={15}/> Thêm nhân viên</button>:null}</div></div>

 {tab==="class-attendance"&&<ClassAttendance/>}
 {tab==="dashboard"&&<><div className="cards">{[["Tổng nhân sự",stats.total],["Đang làm",stats.active],["Đã chấm công",stats.checked],["Chưa chấm công",stats.missing]].map(x=><div className="card" key={x[0] as string}><div className="muted">{x[0]}</div><div className="metric">{x[1]}</div></div>)}</div><div className="grid"><div className="card"><h3>Chấm công hôm nay</h3><table className="table"><thead><tr><th>Nhân viên</th><th>Vào</th><th>Ra</th><th>Trạng thái</th></tr></thead><tbody>{employees.filter(e=>e.status==="Đang làm").map(e=>{const a=checked.find(x=>x.employee===e.user_id||x.employee===e.id);return <tr key={e.id}><td><b>{e.name}</b><div className="muted">{roleName[e.role]||e.role} • {e.branch}</div></td><td>{a?.in||"—"}</td><td>{a?.out||"—"}</td><td><span className={"badge "+(a?.out?"ok":a?.in?"warn":"danger")}>{a?.status||"Chưa chấm công"}</span></td></tr>})}</tbody></table></div><div className="card"><h3>Phân bổ nhân sự</h3>{["mkt","sale","teacher_chinese","teacher_english","teacher_korean"].map(r=><p key={r}>{roleName[r]}<b style={{float:"right"}}>{employees.filter(e=>e.role===r).length}</b></p>)}</div></div></>}

 {tab==="employees"&&<><div className="toolbar"><div style={{position:"relative"}}><Search size={16} style={{position:"absolute",left:10,top:11}}/><input className="input" style={{paddingLeft:34,width:300}} placeholder="Tìm tên, mã, chức danh..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div><table className="table"><thead><tr><th>Mã</th><th>Nhân viên</th><th>Chức danh</th><th>Cơ sở</th><th>Chuyên môn</th><th>Trạng thái</th></tr></thead><tbody>{visibleEmployees.map(e=><tr key={e.id}><td>{e.id}</td><td><b>{e.name}</b><div className="muted">{e.join}</div></td><td>{roleName[e.role]||e.role}</td><td>{e.branch}</td><td>{e.specialty}</td><td><span className="badge ok">{e.status}</span></td></tr>)}</tbody></table></>}

 {tab==="attendance"&&<div className="card"><h3>Chấm công hôm nay</h3><p className="muted">Ca mặc định: 08:00–17:30 • nghỉ 60 phút • dung sai 10 phút {busy&&"• đang đồng bộ…"}</p>{employees.filter(e=>e.status==="Đang làm").map(e=>{const a=checked.find(x=>x.employee===e.user_id||x.employee===e.id);const self=profile?.employee_id===e.id;return <div key={e.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderTop:"1px solid #eee"}}><div><b>{e.name}</b><div className="muted">{roleName[e.role]||e.role} • {e.branch}</div></div><div>{a?.in&&<span className="badge ok" style={{marginRight:8}}>Vào {a.in}</span>}{a?.out&&<span className="badge ok">Ra {a.out}</span>}{!a?.in&&(demo||canManage||self)&&<button className="btn" onClick={()=>checkIn(e)}><LogIn size={14}/> Bắt đầu ca</button>}{a?.in&&!a?.out&&(demo||canManage||self)&&<button className="btn gray" onClick={()=>checkOut(e)} style={{marginLeft:8}}><LogOut size={14}/> Kết thúc ca</button>}</div></div>})}</div>}

 {tab==="schedule"&&<div className="card"><h3>Lịch làm việc</h3><p>Ca mặc định 08:00–17:30, Thứ 2–Thứ 7. Dữ liệu ca được chuẩn bị trong bảng hr_shifts.</p><table className="table"><thead><tr><th>Nhân viên</th><th>Cơ sở</th><th>Ca</th><th>Ngày làm</th></tr></thead><tbody>{employees.map(e=><tr key={e.id}><td>{e.name}</td><td>{e.branch}</td><td>08:00–17:30</td><td>Thứ 2–Thứ 7</td></tr>)}</tbody></table></div>}

 {tab==="leave"&&<div className="card"><h3>Nghỉ phép / vắng mặt</h3><p className="muted">Bảng hr_leave_requests đã có workflow Chờ duyệt → Đã duyệt / Từ chối.</p></div>}
 {tab==="org"&&<div className="card"><h3>Sơ đồ tổ chức</h3><div style={{padding:16,borderLeft:"3px solid #2563eb"}}><b>GIÁM ĐỐC CÔNG TY</b><div style={{marginLeft:24,marginTop:15}}><p>└─ <b>GIÁM ĐỐC CHI NHÁNH</b></p><div style={{marginLeft:24}}><p>├─ Lạng Sơn → Giám đốc trung tâm</p><p>└─ Bắc Ninh → Giám đốc trung tâm</p></div><p>└─ <b>Marketing / Sale / Giảng dạy</b></p></div></div></div>}
 {tab==="branches"&&<div className="cards"><div className="card"><Building2/><h3>Chi nhánh Lạng Sơn</h3><div className="metric">{employees.filter(e=>e.branch==="Lạng Sơn").length}</div><div className="muted">nhân sự</div></div><div className="card"><Building2/><h3>Chi nhánh Bắc Ninh</h3><div className="metric">{employees.filter(e=>e.branch==="Bắc Ninh").length}</div><div className="muted">nhân sự</div></div></div>}

 {show&&<div className="modal"><div className="modalbox"><h2>Thêm nhân viên</h2><div className="form">{[["id","Mã nhân viên"],["name","Họ tên"],["specialty","Chuyên môn"],["join","Ngày vào làm"]].map(([k,l])=><label key={k}>{l}<input className="input" value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<label>Chức danh<select className="select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{Object.keys(roleName).filter(x=>x!=="company_director").map(x=><option key={x} value={x}>{roleName[x]}</option>)}</select></label><label>Cơ sở<select className="select" value={form.branch} onChange={e=>setForm({...form,branch:e.target.value,center:e.target.value})}><option>Lạng Sơn</option><option>Bắc Ninh</option></select></label></div><div className="actions"><button className="btn gray" onClick={()=>setShow(false)}>Hủy</button><button className="btn" onClick={addEmployee}>Lưu nhân viên</button></div></div></div>}
 </main></div>
}