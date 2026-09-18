import { useMemo, useState } from "react";
import { Check, Printer, Plus, Search } from "lucide-react";

type Student={id:string;code:string;name:string;phone:string;classId:string;startDate:string};
type ClassRoom={id:string;code:string;name:string;course:string;teacher:string;branch:string;schedule:string;totalSessions:number;status:string};
type Session={id:string;classId:string;no:number;date:string;topic:string};
type Mark="Có mặt"|"Đi muộn"|"Vắng"|"Nghỉ phép"|"";
type MarkRow={sessionId:string;studentId:string;attendance:Mark;homework:boolean;reason:string;noteDate:string};

const load=<T,>(k:string,d:T):T=>{try{return JSON.parse(localStorage.getItem(k)||"null")??d}catch{return d}};
const save=(k:string,v:unknown)=>localStorage.setItem(k,JSON.stringify(v));
const uid=()=>crypto.randomUUID();
const monthKey=(d:Date)=>d.toISOString().slice(0,7);

const demoClasses:ClassRoom[]=[
 {id:"C001",code:"LH-TQ-01",name:"Tiếng Trung giao tiếp cơ bản",course:"Giao tiếp",teacher:"Giáo viên tiếng Trung",branch:"Bắc Ninh",schedule:"2-4-6 • 19:30–21:00",totalSessions:30,status:"Đang học"},
 {id:"C002",code:"HSK2-01",name:"HSK 0 → HSK2 4 kỹ năng",course:"HSK 3.0",teacher:"Giáo viên tiếng Trung",branch:"Lạng Sơn",schedule:"3-5-7 • 19:30–21:00",totalSessions:45,status:"Đang học"}
];
const demoStudents:Student[]=[
 {id:"S001",code:"HV001",name:"Nguyễn Minh Anh",phone:"",classId:"C001",startDate:"2026-09-01"},
 {id:"S002",code:"HV002",name:"Trần Thu Hà",phone:"",classId:"C001",startDate:"2026-09-01"},
 {id:"S003",code:"HV003",name:"Lê Văn Nam",phone:"",classId:"C001",startDate:"2026-09-01"},
 {id:"S004",code:"HV004",name:"Phạm Ngọc Mai",phone:"",classId:"C002",startDate:"2026-09-01"},
 {id:"S005",code:"HV005",name:"Hoàng Linh",phone:"",classId:"C002",startDate:"2026-09-01"}
];

const months=["01","02","03","04","05","06","07","08","09","10","11","12"];
const years=Array.from({length:4},(_,i)=>new Date().getFullYear()-1+i);

export default function ClassAttendance(){
 const [classes,setClasses]=useState<ClassRoom[]>(()=>load("lh_class_rooms",demoClasses));
 const [students,setStudents]=useState<Student[]>(()=>load("lh_class_students",demoStudents));
 const [sessions,setSessions]=useState<Session[]>(()=>load("lh_class_sessions",[]));
 const [marks,setMarks]=useState<MarkRow[]>(()=>load("lh_class_attendance",[]));
 const [selected,setSelected]=useState(classes[0]?.id||"");
 const [month,setMonth]=useState(monthKey(new Date()));
 const [q,setQ]=useState("");
 const [showClass,setShowClass]=useState(false);
 const [showStudent,setShowStudent]=useState(false);
 const [formClass,setFormClass]=useState({code:"",name:"",course:"HSK 3.0",teacher:"",branch:"Bắc Ninh",schedule:"2-4-6 • 19:30–21:00",totalSessions:30});
 const [formStudent,setFormStudent]=useState({code:"",name:"",phone:"",startDate:month+"-01"});
 const room=classes.find(c=>c.id===selected)||classes[0];

 const roomStudents=useMemo(()=>students.filter(s=>s.classId===room?.id&&((s.name+s.code+s.phone).toLowerCase().includes(q.toLowerCase()))),[students,room,q]);
 const monthSessions=useMemo(()=>sessions.filter(s=>s.classId===room?.id&&s.date.startsWith(month)).sort((a,b)=>a.date.localeCompare(b.date)),[sessions,room,month]);

 const getMark=(sessionId:string,studentId:string)=>marks.find(m=>m.sessionId===sessionId&&m.studentId===studentId);
 const ensureSession=(date:string)=>{
   if(!room)return null;
   const found=sessions.find(s=>s.classId===room.id&&s.date===date);
   if(found)return found;
   const count=sessions.filter(s=>s.classId===room.id).length;
   const s:Session={id:uid(),classId:room.id,no:count+1,date,topic:""};
   const next=[...sessions,s];setSessions(next);save("lh_class_sessions",next);return s;
 };
 const updateMark=(date:string,studentId:string,patch:Partial<MarkRow>)=>{
   const s=ensureSession(date);if(!s)return;
   const old=getMark(s.id,studentId);
   const row:MarkRow={sessionId:s.id,studentId,attendance:old?.attendance||"",homework:old?.homework||false,reason:old?.reason||"",noteDate:old?.noteDate||"",...patch};
   const next=[...marks.filter(m=>!(m.sessionId===s.id&&m.studentId===studentId)),row];
   setMarks(next);save("lh_class_attendance",next);
 };
 const createMonthlySessions=()=>{
   if(!room)return;
   const [y,m]=month.split("-").map(Number);
   const days:number[]=[];
   const last=new Date(y,m,0).getDate();
   for(let d=1;d<=last;d++){
     const dt=new Date(y,m-1,d); const dow=dt.getDay(); // 0 Sun
     const wanted=room.schedule.includes("2-4-6")?[1,3,5]:room.schedule.includes("3-5-7")?[2,4,6]:[1,2,3,4,5,6];
     if(wanted.includes(dow))days.push(d);
   }
   const existing=new Set(sessions.filter(s=>s.classId===room.id).map(s=>s.date));
   let next=[...sessions];let n=sessions.filter(s=>s.classId===room.id).length;
   days.forEach(d=>{const date=`${month}-${String(d).padStart(2,"0")}`;if(!existing.has(date)){n++;next.push({id:uid(),classId:room.id,no:n,date,topic:""});}});
   setSessions(next);save("lh_class_sessions",next);
 };
 const addClass=()=>{if(!formClass.name.trim())return;const c:ClassRoom={id:uid(),...formClass,totalSessions:Number(formClass.totalSessions),status:"Đang học"};const next=[...classes,c];setClasses(next);save("lh_class_rooms",next);setSelected(c.id);setShowClass(false);};
 const addStudent=()=>{if(!formStudent.name.trim()||!room)return;const s:Student={id:uid(),...formStudent,classId:room.id};const next=[...students,s];setStudents(next);save("lh_class_students",next);setShowStudent(false);setFormStudent({code:"",name:"",phone:"",startDate:month+"-01"});};

 const totals=roomStudents.reduce((a,s)=>{monthSessions.forEach(se=>{const x=getMark(se.id,s.id);if(x?.attendance==="Có mặt")a.present++;if(x?.attendance==="Đi muộn")a.late++;if(x?.attendance==="Vắng")a.absent++;if(x?.homework)a.hw++;});return a},{present:0,late:0,absent:0,hw:0});

 return <div className="attendance-sheet-wrap">
  <div className="toolbar no-print" style={{justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    <select className="select" value={selected} onChange={e=>setSelected(e.target.value)}>{classes.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}</select>
    <select className="select" value={month} onChange={e=>setMonth(e.target.value)}>{years.flatMap(y=>months.map(m=><option key={`${y}-${m}`} value={`${y}-${m}`}>Tháng {m}/{y}</option>))}</select>
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

   <div className="sheet-scroll">
    <table className="attendance-table">
     <thead>
      <tr>
       <th rowSpan={2} className="stt-col">STT</th>
       <th rowSpan={2} className="student-col">Student Name</th>
       <th rowSpan={2} className="start-col">Starting<br/>date</th>
       {monthSessions.map(s=><th key={s.id} colSpan={2} className="date-group">{new Date(s.date+"T00:00:00").toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"})}<br/><small>{s.no}</small></th>)}
       <th colSpan={2} className="note-head">Note of changes</th>
      </tr>
      <tr>
       {monthSessions.map(s=><><th key={s.id+"a"} className="sub-head">Att</th><th key={s.id+"h"} className="sub-head">HW</th></>)}
       <th className="sub-head">Reason</th><th className="sub-head">Date</th>
      </tr>
     </thead>
     <tbody>
      {roomStudents.map((s,i)=><tr key={s.id}>
       <td>{i+1}</td><td className="student-name-cell"><b>{s.name}</b><small>{s.code}</small></td><td>{s.startDate}</td>
       {monthSessions.map(se=>{const x=getMark(se.id,s.id);return <><td key={se.id+"a"} className="mark-cell">
         <select value={x?.attendance||""} onChange={e=>updateMark(se.date,s.id,{attendance:e.target.value as Mark})} aria-label="Attendance">
          <option value="">—</option><option value="Có mặt">P</option><option value="Đi muộn">L</option><option value="Vắng">A</option><option value="Nghỉ phép">E</option>
         </select>
        </td><td key={se.id+"h"} className="hw-cell"><button className={"hw-check "+(x?.homework?"done":"")} onClick={()=>updateMark(se.date,s.id,{homework:!x?.homework})}>{x?.homework?<Check size={13}/>:null}</button></td></>})}
       <td className="reason-cell"><input value={marks.filter(m=>m.studentId===s.id&&monthSessions.some(se=>se.id===m.sessionId)).find(m=>m.reason)?.reason||""} onChange={e=>{const se=monthSessions.find(se=>getMark(se.id,s.id)?.reason);if(se)updateMark(se.date,s.id,{reason:e.target.value});}} placeholder=""/></td>
       <td className="reason-cell">{monthSessions.map(se=>getMark(se.id,s.id)?.noteDate).find(Boolean)||""}</td>
      </tr>)}
      {Array.from({length:Math.max(0,16-roomStudents.length)}).map((_,i)=><tr key={"blank"+i}><td>{roomStudents.length+i+1}</td><td></td><td></td>{monthSessions.flatMap(se=><[1,2].map(k=><td key={se.id+k}></td>))}<td></td><td></td></tr>)}
     </tbody>
    </table>
   </div>

   <div className="sheet-summary">Tổng tháng: <b>{totals.present}</b> có mặt • <b>{totals.late}</b> đi muộn • <b>{totals.absent}</b> vắng • <b>{totals.hw}</b> lượt hoàn thành HW</div>
   <div className="confirmation">
    <b>Confirmation</b><br/>Xác nhận sau mỗi buổi học về việc thực hiện điểm danh
    <div className="signatures"><span>CM's Signature: __________________</span><span>CM’s Name: __________________</span><span>Teacher's Signature: __________________</span></div>
   </div>
  </div>}

  {showClass&&<div className="modal no-print"><div className="modalbox"><h2>Tạo lớp học</h2><div className="form">{[["code","Mã lớp"],["name","Tên lớp"],["course","Chương trình"],["teacher","Giáo viên"],["branch","Cơ sở"],["schedule","Lịch học"],["totalSessions","Tổng số buổi"]].map(([k,l])=><label key={k}>{l}<input className="input" value={(formClass as any)[k]} onChange={e=>setFormClass({...formClass,[k]:k==="totalSessions"?Number(e.target.value):e.target.value})}/></label>)}</div><div className="actions"><button className="btn gray" onClick={()=>setShowClass(false)}>Hủy</button><button className="btn" onClick={addClass}>Lưu lớp</button></div></div></div>}
  {showStudent&&<div className="modal no-print"><div className="modalbox"><h2>Thêm học viên — {room?.name}</h2><div className="form">{[["code","Mã học viên"],["name","Họ tên"],["phone","Số điện thoại"],["startDate","Ngày bắt đầu"]].map(([k,l])=><label key={k}>{l}<input className="input" type={k==="startDate"?"date":"text"} value={(formStudent as any)[k]} onChange={e=>setFormStudent({...formStudent,[k]:e.target.value})}/></label>)}</div><div className="actions"><button className="btn gray" onClick={()=>setShowStudent(false)}>Hủy</button><button className="btn" onClick={addStudent}>Thêm học viên</button></div></div></div>}
 </div>
}
