import { useEffect, useMemo, useState } from "react";
import { Check, Printer, Plus, Search } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useHRAuth } from "../lib/auth";

type Student={id:string;code:string;name:string;phone:string;classId:string;startDate:string};
type ClassRoom={id:string;code:string;name:string;course:string;teacher:string;teacherUserId:string|null;branch:string;center:string|null;schedule:string;totalSessions:number;status:string};
type Session={id:string;classId:string;no:number;date:string;topic:string};
type Mark="Có mặt"|"Đi muộn"|"Vắng"|"Nghỉ phép"|"";
type MarkRow={id?:string;sessionId:string;studentId:string;attendance:Mark;homework:boolean;reason:string;noteDate:string};

const today=new Date().toISOString().slice(0,10);
const monthKey=(d:Date)=>d.toISOString().slice(0,7);
const years=Array.from({length:4},(_,i)=>new Date().getFullYear()-1+i);
const months=["01","02","03","04","05","06","07","08","09","10","11","12"];
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);

const demoClasses:ClassRoom[]=[
 {id:"C001",code:"LH-TQ-01",name:"Tiếng Trung giao tiếp cơ bản",course:"Giao tiếp",teacher:"Giáo viên tiếng Trung",teacherUserId:null,branch:"Bắc Ninh",center:"Bắc Ninh",schedule:"2-4-6 • 19:30–21:00",totalSessions:30,status:"Đang học"},
 {id:"C002",code:"HSK2-01",name:"HSK 0 → HSK2 4 kỹ năng",course:"HSK 3.0",teacher:"Giáo viên tiếng Trung",teacherUserId:null,branch:"Lạng Sơn",center:"Lạng Sơn",schedule:"3-5-7 • 19:30–21:00",totalSessions:45,status:"Đang học"}
];

export default function ClassAttendance(){
 const {profile}=useHRAuth();
 const live=Boolean(supabase&&profile);
 const [classes,setClasses]=useState<ClassRoom[]>(live?[]:demoClasses);
 const [students,setStudents]=useState<Student[]>([]);
 const [sessions,setSessions]=useState<Session[]>([]);
 const [marks,setMarks]=useState<MarkRow[]>([]);
 const [selected,setSelected]=useState("");
 const [month,setMonth]=useState(monthKey(new Date()));
 const [q,setQ]=useState("");
 const [loading,setLoading]=useState(live);
 const [saving,setSaving]=useState(false);
 const [showClass,setShowClass]=useState(false);
 const [showStudent,setShowStudent]=useState(false);
 const [formClass,setFormClass]=useState({code:"",name:"",course:"HSK 3.0",teacher:"",teacherUserId:"",branch:"Bắc Ninh",center:"Bắc Ninh",schedule:"2-4-6 • 19:30–21:00",totalSessions:30});
 const [formStudent,setFormStudent]=useState({code:"",name:"",phone:"",startDate:month+"-01"});
 const [employees,setEmployees]=useState<{id:string;name:string;userId:string|null;branch:string}[]>([]);

 const room=classes.find(c=>c.id===selected)||classes[0];
 const roomStudents=useMemo(()=>students.filter(s=>s.classId===room?.id&&((s.name+s.code+s.phone).toLowerCase().includes(q.toLowerCase()))),[students,room,q]);
 const monthSessions=useMemo(()=>sessions.filter(s=>s.classId===room?.id&&s.date.slice(0,7)===month).sort((a,b)=>a.date.localeCompare(b.date)),[sessions,room,month]);

 useEffect(()=>{if(live)loadLive()},[live,profile?.user_id]);
 useEffect(()=>{if(live&&room)loadClassData(room.id)},[live,room?.id,month]);

 async function loadLive(){
   if(!supabase)return;
   setLoading(true);
   const {data,error}=await supabase.from("class_rooms").select("id,code,name,course,teacher,teacher_user_id,branch,center,schedule,total_sessions,status").order("code");
   if(error){alert(error.message);setLoading(false);return}
   const mapped=(data||[]).map((c:any)=>({id:c.id,code:c.code,name:c.name,course:c.course||"",teacher:c.teacher||"",teacherUserId:c.teacher_user_id,branch:c.branch,center:c.center,schedule:c.schedule||"",totalSessions:c.total_sessions,status:c.status}));
   setClasses(mapped);
   if(mapped.length&&!selected)setSelected(mapped[0].id);
   const {data:es}=await supabase.from("hr_employees").select("id,full_name,user_id,branch").eq("status","Đang làm").order("full_name");
   setEmployees((es||[]).map((e:any)=>({id:e.id,name:e.full_name,userId:e.user_id,branch:e.branch})));
   setLoading(false);
 }

 async function loadClassData(classId:string){
   if(!supabase||!live)return;
   setLoading(true);
   const start=month+"-01";
   const d=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),1);
   const end=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-01";
   const results=await Promise.all([
     supabase.from("class_students").select("id,student_code,full_name,phone,start_date").eq("class_id",classId).order("student_code"),
     supabase.from("class_sessions").select("id,class_id,session_no,session_date,topic").eq("class_id",classId).gte("session_date",start).lt("session_date",end).order("session_date")
   ]);
   const e1=results[0].error,e2=results[1].error;
   if(e1||e2){alert((e1||e2)?.message);setLoading(false);return}
   const ss=(results[1].data||[]).map((s:any)=>({id:s.id,classId:s.class_id,no:s.session_no,date:s.session_date,topic:s.topic||""}));
   setStudents((results[0].data||[]).map((s:any)=>({id:s.id,code:s.student_code||"",name:s.full_name,phone:s.phone||"",classId:classId,startDate:s.start_date})));
   setSessions(prev=>prev.filter(x=>!(x.classId===classId&&x.date.slice(0,7)===month)).concat(ss));
   const ids=ss.map(x=>x.id);
   if(ids.length){
     const {data:at,error}=await supabase.from("class_attendance").select("id,session_id,student_id,status,homework,reason,note_date").in("session_id",ids);
     if(error){alert(error.message);setLoading(false);return}
     setMarks(prev=>prev.filter(x=>!ids.includes(x.sessionId)).concat((at||[]).map((a:any)=>({id:a.id,sessionId:a.session_id,studentId:a.student_id,attendance:a.status,homework:a.homework,reason:a.reason||"",noteDate:a.note_date||""}))));
   }else setMarks(prev=>prev.filter(x=>!sessions.filter(s=>s.classId===classId&&s.date.slice(0,7)===month).map(s=>s.id).includes(x.sessionId)));
   setLoading(false);
 }

 function scheduleDates(){
   if(!room)return [];
   const y=Number(month.slice(0,4)),m=Number(month.slice(5,7));
   const last=new Date(y,m,0).getDate();
   const wanted=room.schedule.includes("2-4-6")?[1,3,5]:room.schedule.includes("3-5-7")?[2,4,6]:[1,2,3,4,5,6];
   return Array.from({length:last},(_,i)=>i+1).filter(day=>wanted.includes(new Date(y,m-1,day).getDay())).map(day=>month+"-"+String(day).padStart(2,"0"));
 }

 async function createMonthlySessions(){
   if(!room)return;
   const existing=new Set(monthSessions.map(s=>s.date));
   const dates=scheduleDates().filter(d=>!existing.has(d));
   if(!dates.length)return;
   const base=sessions.filter(s=>s.classId===room.id).length;
   const rows=dates.map((date,i)=>({class_id:room.id,session_no:base+i+1,session_date:date,topic:""}));
   setSaving(true);
   if(live&&supabase){
     const {error}=await supabase.from("class_sessions").insert(rows);
     if(error){alert(error.message);setSaving(false);return}
     await loadClassData(room.id);
   }else{
     const ns=sessions.concat(rows.map(r=>({id:uid(),classId:room.id,no:r.session_no,date:r.session_date,topic:""})));
     setSessions(ns);
   }
   setSaving(false);
 }

 async function updateMark(date:string,studentId:string,patch:Partial<MarkRow>){
   const session=monthSessions.find(s=>s.date===date);if(!session)return;
   const old=marks.find(m=>m.sessionId===session.id&&m.studentId===studentId);
   const status=(patch.attendance??old?.attendance??"Có mặt") as Mark;
   const row={session_id:session.id,student_id:studentId,status:status||"Có mặt",homework:patch.homework??old?.homework??false,reason:patch.reason??old?.reason??"",note_date:patch.noteDate||old?.noteDate||null};
   setSaving(true);
   if(live&&supabase){
     const {data,error}=await supabase.from("class_attendance").upsert(row,{onConflict:"session_id,student_id"}).select("id,session_id,student_id,status,homework,reason,note_date").single();
     if(error){alert(error.message);setSaving(false);return}
     setMarks(prev=>prev.filter(m=>!(m.sessionId===session.id&&m.studentId===studentId)).concat({id:data.id,sessionId:data.session_id,studentId:data.student_id,attendance:data.status,homework:data.homework,reason:data.reason||"",noteDate:data.note_date||""}));
   }else setMarks(prev=>prev.filter(m=>!(m.sessionId===session.id&&m.studentId===studentId)).concat({sessionId:session.id,studentId,attendance:row.status as Mark,homework:row.homework,reason:row.reason,noteDate:row.note_date||""}));
   setSaving(false);
 }

 async function addClass(){
   if(!formClass.name.trim())return;
   if(live&&supabase){
     const {data,error}=await supabase.from("class_rooms").insert({code:formClass.code,name:formClass.name,course:formClass.course,teacher:formClass.teacher,teacher_user_id:formClass.teacherUserId||null,branch:formClass.branch,center:formClass.center,schedule:formClass.schedule,total_sessions:Number(formClass.totalSessions)}).select().single();
     if(error){alert(error.message);return}
     setShowClass(false);await loadLive();if(data)setSelected(data.id);return;
   }
   const c:ClassRoom={id:uid(),code:formClass.code,name:formClass.name,course:formClass.course,teacher:formClass.teacher,teacherUserId:formClass.teacherUserId||null,branch:formClass.branch,center:formClass.center,schedule:formClass.schedule,totalSessions:Number(formClass.totalSessions),status:"Đang học"};
   setClasses(x=>x.concat(c));setSelected(c.id);setShowClass(false);
 }

 async function addStudent(){
   if(!formStudent.name.trim()||!room)return;
   if(live&&supabase){
     const {error}=await supabase.from("class_students").insert({class_id:room.id,student_code:formStudent.code,full_name:formStudent.name,phone:formStudent.phone,start_date:formStudent.startDate});
     if(error){alert(error.message);return}
     setShowStudent(false);await loadClassData(room.id);return;
   }
   setStudents(x=>x.concat({id:uid(),code:formStudent.code,name:formStudent.name,phone:formStudent.phone,classId:room.id,startDate:formStudent.startDate}));setShowStudent(false);
 }

 const getMark=(sessionId:string,studentId:string)=>marks.find(m=>m.sessionId===sessionId&&m.studentId===studentId);
 const totals=roomStudents.reduce((a,s)=>{monthSessions.forEach(se=>{const x=getMark(se.id,s.id);if(x?.attendance==="Có mặt")a.present++;if(x?.attendance==="Đi muộn")a.late++;if(x?.attendance==="Vắng")a.absent++;if(x?.homework)a.hw++;});return a},{present:0,late:0,absent:0,hw:0});

 if(loading&&!room)return <div className="card">Đang tải dữ liệu lớp học từ Supabase…</div>;

 return <div className="attendance-sheet-wrap">
  <div className="toolbar no-print" style={{justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    <select className="select" value={selected} onChange={e=>setSelected(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name} • {c.branch}</option>)}</select>
    <select className="select" value={month} onChange={e=>setMonth(e.target.value)}>{years.flatMap(y=>months.map(m=><option key={y+"-"+m} value={y+"-"+m}>Tháng {m}/{y}</option>))}</select>
    <button className="btn gray" onClick={createMonthlySessions}><Plus size={14}/> Tạo lịch buổi tháng</button>
   </div>
   <div style={{display:"flex",gap:8}}><button className="btn gray" onClick={()=>setShowStudent(true)}><Plus size={14}/> Thêm học viên</button><button className="btn gray" onClick={()=>setShowClass(true)}><Plus size={14}/> Tạo lớp</button><button className="btn" onClick={()=>window.print()}><Printer size={14}/> In phiếu tháng</button></div>
  </div>

  {room&&<div className="attendance-paper">
   <div className="attendance-title">ATTENDANCE– PHIẾU ĐIỂM DANH</div>
   <div className="attendance-month">THÁNG {month.slice(5)}/{month.slice(0,4)}</div>
   <div className="class-info">
    <div className="class-info-title">Class Information/ Thông tin lớp học</div>
    <div className="class-info-row"><b>CLASS</b><span>{room.code} — {room.name}</span></div>
    <div className="class-info-row"><b>Date</b><span>Tháng {month.slice(5)}/{month.slice(0,4)} • {monthSessions.length} buổi</span></div>
    <div className="class-info-row"><b>Time</b><span>{room.schedule}</span></div>
   </div>
   <div className="sheet-scroll"><table className="attendance-table"><thead><tr>
    <th rowSpan={2} className="stt-col">STT</th><th rowSpan={2} className="student-col">Student Name</th><th rowSpan={2} className="start-col">Starting<br/>date</th>
    {monthSessions.map(s=><th key={s.id} colSpan={2} className="date-group">{new Date(s.date+"T00:00:00").toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"})}<br/><small>{s.no}</small></th>)}
    <th colSpan={2} className="note-head">Note of changes</th></tr><tr>
    {monthSessions.flatMap(s=>[<th key={s.id+"a"} className="sub-head">Att</th>,<th key={s.id+"h"} className="sub-head">HW</th>])}<th className="sub-head">Reason</th><th className="sub-head">Date</th></tr></thead>
    <tbody>{roomStudents.map((s,i)=><tr key={s.id}><td>{i+1}</td><td className="student-name-cell"><b>{s.name}</b><small>{s.code}</small></td><td>{s.startDate}</td>
     {monthSessions.flatMap(se=>{const x=getMark(se.id,s.id);return [<td key={se.id+"a"} className="mark-cell"><select value={x?.attendance||""} onChange={e=>updateMark(se.date,s.id,{attendance:e.target.value as Mark})}><option value="">—</option><option value="Có mặt">P</option><option value="Đi muộn">L</option><option value="Vắng">A</option><option value="Nghỉ phép">E</option></select></td>,<td key={se.id+"h"} className="hw-cell"><button className={"hw-check "+(x?.homework?"done":"")} onClick={()=>updateMark(se.date,s.id,{homework:!x?.homework})}>{x?.homework?<Check size={13}/>:null}</button></td>]})}
     <td className="reason-cell">{marks.find(m=>m.studentId===s.id&&monthSessions.some(se=>se.id===m.sessionId)&&m.reason)?.reason||""}</td><td className="reason-cell">{marks.find(m=>m.studentId===s.id&&monthSessions.some(se=>se.id===m.sessionId)&&m.noteDate)?.noteDate||""}</td>
    </tr>)}
    {Array.from({length:Math.max(0,16-roomStudents.length)}).map((_,i)=><tr key={"blank"+i}><td>{roomStudents.length+i+1}</td><td></td><td></td>{monthSessions.flatMap(se=>[<td key={se.id+"a"}></td>,<td key={se.id+"h"}></td>])}<td></td><td></td></tr>)}</tbody>
   </table></div>
   <div className="sheet-summary">Tổng tháng: <b>{totals.present}</b> có mặt • <b>{totals.late}</b> đi muộn • <b>{totals.absent}</b> vắng • <b>{totals.hw}</b> lượt hoàn thành HW {saving&&" • Đang lưu…"}</div>
   <div className="confirmation"><b>Confirmation</b><br/>Xác nhận sau mỗi buổi học về việc thực hiện điểm danh<div className="signatures"><span>CM's Signature: __________________</span><span>CM’s Name: __________________</span><span>Teacher's Signature: __________________</span></div></div>
  </div>}

  {showClass&&<div className="modal no-print"><div className="modalbox"><h2>Tạo lớp học</h2><div className="form">{[["code","Mã lớp"],["name","Tên lớp"],["course","Chương trình"],["teacher","Giáo viên"],["branch","Cơ sở"],["center","Trung tâm"],["schedule","Lịch học"],["totalSessions","Tổng số buổi"]].map(([k,l])=><label key={k}>{l}<input className="input" value={(formClass as any)[k]} onChange={e=>setFormClass({...formClass,[k]:k==="totalSessions"?Number(e.target.value):e.target.value})}/></label>)}<label>Giáo viên đăng nhập<select className="select" value={formClass.teacherUserId} onChange={e=>{const emp=employees.find(x=>x.userId===e.target.value);setFormClass({...formClass,teacherUserId:e.target.value,teacher:emp?.name||formClass.teacher})}}><option value="">Chưa phân công</option>{employees.filter(e=>e.userId).map(e=><option key={e.userId} value={e.userId}>{e.name} • {e.branch}</option>)}</select></label></div><div className="actions"><button className="btn gray" onClick={()=>setShowClass(false)}>Hủy</button><button className="btn" onClick={addClass}>Lưu lớp</button></div></div></div>}
  {showStudent&&<div className="modal no-print"><div className="modalbox"><h2>Thêm học viên — {room?.name}</h2><div className="form">{[["code","Mã học viên"],["name","Họ tên"],["phone","Số điện thoại"],["startDate","Ngày bắt đầu"]].map(([k,l])=><label key={k}>{l}<input className="input" type={k==="startDate"?"date":"text"} value={(formStudent as any)[k]} onChange={e=>setFormStudent({...formStudent,[k]:e.target.value})}/></label>)}</div><div className="actions"><button className="btn gray" onClick={()=>setShowStudent(false)}>Hủy</button><button className="btn" onClick={addStudent}>Thêm học viên</button></div></div></div>}
 </div>
}
