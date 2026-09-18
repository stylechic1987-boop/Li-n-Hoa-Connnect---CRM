import { useMemo, useState } from "react";
import { CalendarDays, Check, ClipboardCheck, Plus, Search, Users, X } from "lucide-react";

type Student={id:string;code:string;name:string;phone:string;classId:string};
type ClassRoom={id:string;code:string;name:string;course:string;teacher:string;branch:string;schedule:string;totalSessions:number;status:string};
type Session={id:string;classId:string;no:number;date:string;topic:string};
type Mark="Có mặt"|"Đi muộn"|"Vắng"|"Nghỉ phép";
type MarkRow={sessionId:string;studentId:string;status:Mark;note:string};

const load=<T,>(k:string,d:T):T=>{try{return JSON.parse(localStorage.getItem(k)||"null")??d}catch{return d}};
const save=(k:string,v:unknown)=>localStorage.setItem(k,JSON.stringify(v));
const today=new Date().toISOString().slice(0,10);

const demoClasses:ClassRoom[]=[
 {id:"C001",code:"LH-TQ-01",name:"Tiếng Trung giao tiếp cơ bản",course:"Giao tiếp",teacher:"Giáo viên tiếng Trung",branch:"Bắc Ninh",schedule:"2-4-6 • 19:30–21:00",totalSessions:30,status:"Đang học"},
 {id:"C002",code:"HSK2-01",name:"HSK 0 → HSK2 4 kỹ năng",course:"HSK 3.0",teacher:"Giáo viên tiếng Trung",branch:"Lạng Sơn",schedule:"3-5-7 • 19:30–21:00",totalSessions:45,status:"Đang học"}
];
const demoStudents:Student[]=[
 {id:"S001",code:"HV001",name:"Nguyễn Minh Anh",phone:"",classId:"C001"},
 {id:"S002",code:"HV002",name:"Trần Thu Hà",phone:"",classId:"C001"},
 {id:"S003",code:"HV003",name:"Lê Văn Nam",phone:"",classId:"C001"},
 {id:"S004",code:"HV004",name:"Phạm Ngọc Mai",phone:"",classId:"C002"},
 {id:"S005",code:"HV005",name:"Hoàng Linh",phone:"",classId:"C002"}
];

export default function ClassAttendance(){
 const [classes,setClasses]=useState<ClassRoom[]>(()=>load("lh_class_rooms",demoClasses));
 const [students,setStudents]=useState<Student[]>(()=>load("lh_class_students",demoStudents));
 const [sessions,setSessions]=useState<Session[]>(()=>load("lh_class_sessions",[]));
 const [marks,setMarks]=useState<MarkRow[]>(()=>load("lh_class_attendance",[]));
 const [selected,setSelected]=useState(classes[0]?.id||"");
 const [date,setDate]=useState(today);
 const [q,setQ]=useState("");
 const [showClass,setShowClass]=useState(false);
 const [showStudent,setShowStudent]=useState(false);
 const [formClass,setFormClass]=useState({code:"",name:"",course:"HSK 3.0",teacher:"",branch:"Bắc Ninh",schedule:"2-4-6 • 19:30–21:00",totalSessions:30});
 const [formStudent,setFormStudent]=useState({code:"",name:"",phone:""});
 const room=classes.find(c=>c.id===selected)||classes[0];
 const roomStudents=useMemo(()=>students.filter(s=>s.classId===room?.id&&((s.name+s.code+s.phone).toLowerCase().includes(q.toLowerCase()))),[students,room,q]);
 const roomSessions=sessions.filter(s=>s.classId===room?.id).sort((a,b)=>a.no-b.no);
 const current=roomSessions.find(s=>s.date===date);
 const activeSession=current||{id:"",classId:room?.id||"",no:roomSessions.length+1,date,topic:""};
 const getMark=(sid:string)=>marks.find(m=>m.sessionId===activeSession.id&&m.studentId===sid)?.status;
 const setMark=(sid:string,status:Mark)=>{
   let sidSession=activeSession.id;
   let ss=sessions;
   if(!sidSession){
     sidSession=crypto.randomUUID();
     const s={id:sidSession,classId:room.id,no:roomSessions.length+1,date,topic:""};
     ss=[...sessions,s]; setSessions(ss); save("lh_class_sessions",ss);
   }
   const next=[...marks.filter(m=>!(m.sessionId===sidSession&&m.studentId===sid)),{sessionId:sidSession,studentId:sid,status,note:""}];
   setMarks(next); save("lh_class_attendance",next);
 };
 const summary={present:roomStudents.filter(s=>getMark(s.id)==="Có mặt").length,late:roomStudents.filter(s=>getMark(s.id)==="Đi muộn").length,absent:roomStudents.filter(s=>getMark(s.id)==="Vắng").length,leave:roomStudents.filter(s=>getMark(s.id)==="Nghỉ phép").length};
 const addClass=()=>{
   if(!formClass.name.trim())return;
   const c:ClassRoom={id:crypto.randomUUID(),...formClass,totalSessions:Number(formClass.totalSessions),status:"Đang học"};
   const next=[...classes,c];setClasses(next);save("lh_class_rooms",next);setSelected(c.id);setShowClass(false);
 };
 const addStudent=()=>{
   if(!formStudent.name.trim()||!room)return;
   const s:Student={id:crypto.randomUUID(),...formStudent,classId:room.id};
   const next=[...students,s];setStudents(next);save("lh_class_students",next);setShowStudent(false);setFormStudent({code:"",name:"",phone:""});
 };
 const createSession=()=>{
   if(!room)return;
   if(current)return;
   const s:Session={id:crypto.randomUUID(),classId:room.id,no:roomSessions.length+1,date,topic:""};
   const next=[...sessions,s];setSessions(next);save("lh_class_sessions",next);
 };
 return <div>
  <div className="toolbar" style={{justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    <select className="select" value={selected} onChange={e=>setSelected(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}</select>
    <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
   </div>
   <div style={{display:"flex",gap:8}}><button className="btn gray" onClick={()=>setShowStudent(true)}><Plus size={14}/> Thêm học viên</button><button className="btn" onClick={()=>setShowClass(true)}><Plus size={14}/> Tạo lớp</button></div>
  </div>
  {room&&<><div className="cards">
   <div className="card"><div className="muted">Học viên</div><div className="metric">{students.filter(s=>s.classId===room.id).length}</div></div>
   <div className="card"><div className="muted">Buổi học</div><div className="metric">{roomSessions.length}/{room.totalSessions}</div></div>
   <div className="card"><div className="muted">Có mặt</div><div className="metric">{summary.present}</div></div>
   <div className="card"><div className="muted">Vắng</div><div className="metric">{summary.absent}</div></div>
  </div>
  <div className="grid" style={{marginTop:16}}>
   <div className="card">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><div><h3 style={{margin:"0 0 4px"}}>Điểm danh: {room.name}</h3><div className="muted">{room.branch} • {room.schedule} • {room.teacher}</div></div><button className="btn" onClick={createSession}><ClipboardCheck size={14}/> Mở buổi {roomSessions.length+1}</button></div>
    <div className="toolbar" style={{marginTop:14}}><div style={{position:"relative"}}><Search size={15} style={{position:"absolute",left:10,top:11}}/><input className="input" style={{paddingLeft:32,width:260}} placeholder="Tìm học viên..." value={q} onChange={e=>setQ(e.target.value)}/></div></div>
    <table className="table"><thead><tr><th>STT</th><th>Học viên</th><th>Có mặt</th><th>Đi muộn</th><th>Vắng</th><th>Nghỉ phép</th></tr></thead>
    <tbody>{roomStudents.map((s,i)=><tr key={s.id}><td>{i+1}</td><td><b>{s.name}</b><div className="muted">{s.code}{s.phone&&" • "+s.phone}</div></td>
      {(["Có mặt","Đi muộn","Vắng","Nghỉ phép"] as Mark[]).map(st=><td key={st}><button className={"att-btn "+(getMark(s.id)===st?"selected":"")} onClick={()=>setMark(s.id,st)}>{getMark(s.id)===st?<Check size={14}/>:<span/>}</button></td>)}
    </tr>)}</tbody></table>
    <div className="muted" style={{marginTop:12}}>Ngày {new Date(date+"T00:00:00").toLocaleDateString("vi-VN")} • Có mặt {summary.present} • Đi muộn {summary.late} • Vắng {summary.absent} • Nghỉ phép {summary.leave}</div>
   </div>
   <div className="card"><h3>Thông tin lớp</h3><p><b>{room.code}</b></p><p>Khóa: {room.course}</p><p>Giáo viên: {room.teacher||"Chưa phân công"}</p><p>Cơ sở: {room.branch}</p><p>Lịch: {room.schedule}</p><p>Tiến độ: {roomSessions.length}/{room.totalSessions} buổi</p><hr/><h3>Lịch sử điểm danh</h3>{roomSessions.slice().reverse().slice(0,8).map(s=><button key={s.id} className="history-row" onClick={()=>setDate(s.date)}><span>Buổi {s.no}</span><span>{new Date(s.date+"T00:00:00").toLocaleDateString("vi-VN")}</span></button>)}{!roomSessions.length&&<div className="muted">Chưa có buổi nào.</div>}</div>
  </div></>}
  {showClass&&<div className="modal"><div className="modalbox"><h2>Tạo lớp học</h2><div className="form">{[["code","Mã lớp"],["name","Tên lớp"],["course","Chương trình"],["teacher","Giáo viên"],["branch","Cơ sở"],["schedule","Lịch học"],["totalSessions","Tổng số buổi"]].map(([k,l])=><label key={k}>{l}<input className="input" value={(formClass as any)[k]} onChange={e=>setFormClass({...formClass,[k]:k==="totalSessions"?Number(e.target.value):e.target.value})}/></label>)}</div><div className="actions"><button className="btn gray" onClick={()=>setShowClass(false)}>Hủy</button><button className="btn" onClick={addClass}>Lưu lớp</button></div></div></div>}
  {showStudent&&<div className="modal"><div className="modalbox"><h2>Thêm học viên — {room?.name}</h2><div className="form">{[["code","Mã học viên"],["name","Họ tên"],["phone","Số điện thoại"]].map(([k,l])=><label key={k}>{l}<input className="input" value={(formStudent as any)[k]} onChange={e=>setFormStudent({...formStudent,[k]:e.target.value})}/></label>)}</div><div className="actions"><button className="btn gray" onClick={()=>setShowStudent(false)}>Hủy</button><button className="btn" onClick={addStudent}>Thêm học viên</button></div></div></div>}
 </div>
}
