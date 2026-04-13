import { useState, useRef, useEffect, useCallback } from "react";

const PROVS=[
  {id:"groq",name:"Groq",url:"https://api.groq.com/openai/v1/chat/completions",model:"llama-3.3-70b-versatile",keyUrl:"https://console.groq.com/keys",ph:"gsk_...",desc:"Nhanh nhất · 30 req/phút"},
  {id:"gemini",name:"Gemini",url:"GEM",model:"gemini-2.0-flash",keyUrl:"https://aistudio.google.com/apikey",ph:"AIza...",desc:"Google · 15 req/phút"},
];
const GENRES=["Pop","Ballad","R&B","Hip-hop","EDM","Acoustic","Rock","Jazz","Lo-fi","Indie","Trap","Latin","Funk","Soul"];
const MOODS=["Buồn","Vui","Chill","Sâu lắng","Năng lượng","Lãng mạn","Cô đơn","Hy vọng","Dramatic","Dreamy","Dark","Nostalgic"];
const TEMPOS=["Slow (60-80)","Medium (80-110)","Fast (110-140)","Very Fast (140+)"];
const VOCALS=["Nam trầm","Nam cao","Nữ nhẹ","Nữ khoẻ","Rap","Whisper","Falsetto","Duet"];
const PRESETS=[
  {name:"Ballad buồn",icon:"🥀",g:"Ballad",m:"Buồn",t:"Slow (60-80)",v:"Nam cao"},
  {name:"Pop năng lượng",icon:"⚡",g:"Pop",m:"Năng lượng",t:"Fast (110-140)",v:"Nữ khoẻ"},
  {name:"Lo-fi chill",icon:"☕",g:"Lo-fi",m:"Chill",t:"Slow (60-80)",v:"Nam trầm"},
  {name:"R&B lãng mạn",icon:"🌙",g:"R&B",m:"Lãng mạn",t:"Medium (80-110)",v:"Nam cao"},
  {name:"EDM festival",icon:"🎆",g:"EDM",m:"Năng lượng",t:"Very Fast (140+)",v:"Nữ khoẻ"},
  {name:"Acoustic sâu lắng",icon:"🍂",g:"Acoustic",m:"Sâu lắng",t:"Slow (60-80)",v:"Nữ nhẹ"},
  {name:"Hip-hop Việt",icon:"🔥",g:"Hip-hop",m:"Năng lượng",t:"Fast (110-140)",v:"Rap"},
  {name:"Indie dreamy",icon:"✨",g:"Indie",m:"Dreamy",t:"Medium (80-110)",v:"Nữ nhẹ"},
];
const STEPS=[{n:"Tìm bài",i:"🔍"},{n:"Tuỳ chỉnh",i:"🎛"},{n:"Lời Việt",i:"✍"},{n:"AI Music",i:"🎵"}];
const PLATS=[
  {id:"suno",name:"Suno",url:"https://suno.com",free:"50 cr/ngày",color:"#a78bfa",icon:"🎵",vocal:true,desc:"Vocal + nhạc hoàn chỉnh. Tốt nhất.",how:"Custom → Style of Music + Lyrics → Create",exP:"Vietnamese emotional pop ballad, male tenor, breathy, piano, strings, 85bpm, melancholic, studio quality"},
  {id:"udio",name:"Udio",url:"https://udio.com",free:"100 cr/tháng",color:"#60a5fa",icon:"🎧",vocal:true,desc:"Vocal tự nhiên, extend bài dài.",how:"Prompt + tags + Lyrics → Generate",exP:"Vietnamese pop ballad, emotional male vocals, piano-driven, strings, 85bpm, studio"},
  {id:"musicfx",name:"MusicFX",url:"https://aitestkitchen.withgoogle.com/tools/music-fx",free:"Free 100%",color:"#34d399",icon:"🎹",vocal:false,desc:"Google. Nhạc nền → ghép vocal CapCut.",how:"Paste prompt ngắn → Generate → Download",exP:"emotional piano ballad, soft strings, acoustic guitar, 85bpm, cinematic"},
  {id:"stableaudio",name:"Stable Audio",url:"https://stableaudio.com",free:"20 tr/tháng",color:"#fbbf24",icon:"🔊",vocal:false,desc:"Nhạc nền HQ. Negative prompt.",how:"Prompt + negative + duration → Generate",exP:"pop ballad instrumental, piano, strings, 85bpm, wide stereo, warm mastering"},
  {id:"riffusion",name:"Riffusion",url:"https://www.riffusion.com",free:"Free",color:"#f87171",icon:"🎸",vocal:true,desc:"Nhanh. Thử ý tưởng.",how:"Prompt ngắn + lyrics ngắn",exP:"Vietnamese pop ballad, male vocal, piano, 85bpm"},
];
const C={bg1:"#0f1117",bg2:"#181b24",card:"#14161e",border:"#282d3a",gold:"#e8d5b7",t1:"#eaedf3",t2:"#b8bcc8",t3:"#828899",t4:"#555b6e"};
const LS={g:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}},s:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const countSyl=t=>{if(!t||t.match(/^\[/)||t.match(/^\(/)||!t.trim())return 0;return t.trim().replace(/[,.\-!?;:"""''()…]/g,"").split(/\s+/).filter(Boolean).length};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const recPlat=(g,m)=>(g==="Hip-hop"||g==="EDM"||g==="Trap")?"suno":(m==="Chill"||g==="Lo-fi")?"udio":"suno";
const bpmFrom=t=>t.includes("60")?70:t.includes("80")?95:t.includes("110")?125:150;
const isContent=l=>l&&!l.match(/^\[/)&&!l.match(/^\(/)&&l.trim().length>0;

export default function App(){
  const[step,setStep]=useState(0);
  const[q,setQ]=useState("");
  const[loading,setLoading]=useState(false);
  const[loadMsg,setLoadMsg]=useState("");
  const[song,setSong]=useState(null);
  const[viet,setViet]=useState(null);
  const[genre,setGenre]=useState("Ballad");
  const[mood,setMood]=useState("Buồn");
  const[tempo,setTempo]=useState("Medium (80-110)");
  const[vocal,setVocal]=useState("Nam cao");
  const[notes,setNotes]=useState("");
  const[mode,setMode]=useState("foreign");
  const[copied,setCopied]=useState("");
  const[tab,setTab]=useState(LS.g("vmm_tab","suno"));
  const[prov,setProv]=useState(LS.g("vmm_p","groq"));
  const[keys,setKeys]=useState(LS.g("vmm_k",{}));
  const[showSet,setShowSet]=useState(false);
  const[hist,setHist]=useState(LS.g("vmm_h6",[]));
  const[editLine,setEditLine]=useState(null);
  const[editTxt,setEditTxt]=useState("");
  const[regenSec,setRegenSec]=useState(null);
  const[pasteMode,setPasteMode]=useState(false);
  const[pasteLy,setPasteLy]=useState("");
  const[undos,setUndos]=useState([]);
  const[toasts,setToasts]=useState([]);
  const[showOnb,setShowOnb]=useState(!LS.g("vmm_s5",false));
  const[promptsDirty,setPromptsDirty]=useState(false);
  const[editSongLine,setEditSongLine]=useState(null);
  const[editSongTxt,setEditSongTxt]=useState("");
  const rRef=useRef(null);
  const ak=keys[prov]||"";

  const toast=(msg,type="info")=>{const id=Date.now();setToasts(t=>[...t,{id,msg,type}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3200)};

  useEffect(()=>{if(!loading)return;const ms=["Đang tìm lyrics...","Phân tích cấu trúc...","Viết lời Việt giữ vần...","Tạo prompt 5 platforms..."];
    let i=0;setLoadMsg(ms[0]);const iv=setInterval(()=>{i=(i+1)%ms.length;setLoadMsg(ms[i])},2500);return()=>clearInterval(iv)},[loading]);
  useEffect(()=>{LS.s("vmm_tab",tab)},[tab]);

  const stateRef=useRef({step:0,q:"",loading:false});
  useEffect(()=>{stateRef.current={step,q,loading}},[step,q,loading]);
  const searchFn=useRef(null);const rewriteFn=useRef(null);
  useEffect(()=>{
    const h=e=>{if(!e.ctrlKey||e.key!=="Enter")return;e.preventDefault();
      const{step:s,q:qv,loading:l}=stateRef.current;if(l)return;
      if(s===0&&qv.trim()&&searchFn.current)searchFn.current();
      else if(s===1)setStep(2);
      else if(s===2&&rewriteFn.current)rewriteFn.current();
    };window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)},[]);

  const callAI=useCallback(async(sys,usr,retries=2)=>{
    for(let a=0;a<=retries;a++){try{
      if(prov==="gemini"){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${ak}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:`${sys}\n\n${usr}`}]}],generationConfig:{temperature:0.7,maxOutputTokens:4096}})});const d=await r.json();if(d.error)throw new Error(d.error.message);return d.candidates?.[0]?.content?.parts?.[0]?.text||""}
      const r=await fetch(PROVS[0].url,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${ak}`},body:JSON.stringify({model:PROVS[0].model,messages:[{role:"system",content:sys},{role:"user",content:usr}],temperature:0.7,max_tokens:4096})});const d=await r.json();if(d.error)throw new Error(d.error.message);return d.choices[0].message.content;
    }catch(e){if(a<retries){toast(`Thử lại (${a+1})...`,"warn");await sleep(1500*(a+1));continue}throw e}}
  },[prov,ak]);

  const pJ=raw=>{const c=raw.replace(/```json|```/g,"").trim();const m=c.match(/\{[\s\S]*\}/);if(!m)throw new Error("AI trả sai format, thử lại");try{return JSON.parse(m[0])}catch{const fixed=m[0].replace(/"((?:[^"\\]|\\.)*)"/g,(match)=>match.replace(/[\x00-\x1f]/g,ch=>ch==="\n"?"\\n":ch==="\r"?"\\r":ch==="\t"?"\\t":""));return JSON.parse(fixed)}};

  const genPrompts=useCallback(async(lyrics,title,g,m,t,v,instr)=>{
    const bpm=bpmFrom(t);const vE=v.includes("nữ")||v==="Duet"?"female":"male";
    const raw=await callAI(
`Chuyên gia AI music tools: Suno, Udio, MusicFX, Stable Audio, Riffusion. CHỈ JSON.`,
`Bài: "${title}" | ${g} | ${m} | ${bpm}BPM | Vocal: ${v} (${vE}) | Instruments: ${instr||"piano, guitar, strings, drums"}

LYRICS:
${lyrics}

TẠO JSON:
{
"suno":{"style_of_music":"tags cách phẩy, ≤200 ký tự. VD: Vietnamese ${g.toLowerCase()}, ${m.toLowerCase()}, ${vE} vocal, breathy, piano arpeggios, soft strings, acoustic guitar, ${bpm}bpm, studio quality, warm reverb, dynamic build","lyrics_for_suno":"[Verse 1]\\n(Softly)\\nlyrics...\\n\\n[Chorus]\\n(Powerful, belt)\\nlyrics...\\n\\n[Outro]\\n(Fading)\\nlyrics...\\n[End]","tips":"1. suno.com → Create\\n2. Bật Custom\\n3. Paste Style of Music\\n4. Paste Lyrics\\n5. Create → chờ 30s\\n6. Nghe 2 bản, chọn hay hơn\\n\\nMẹo: Đổi breathy → powerful để đổi chất giọng"},
"udio":{"prompt":"1-2 câu tiếng Anh mô tả sound","tags":"${g.toLowerCase()}, vietnamese, ${m.toLowerCase()}, ${vE} vocal, piano, ${bpm}bpm","lyrics_for_udio":"[Verse]\\nlyrics...\\n[Chorus]\\nlyrics... (không đánh số)","tips":"1. udio.com → Create\\n2. Paste prompt\\n3. Thêm tags\\n4. Bật Custom Lyrics → paste\\n5. Generate\\n\\nMẹo: Dùng Extend để kéo dài bài"},
"musicfx":{"prompt":"≤100 ký tự! CHỈ nhạc nền. VD: emotional piano ballad, soft strings, ${bpm}bpm, ${m.toLowerCase()} cinematic","tips":"⚠ Chỉ nhạc nền, KHÔNG vocal!\\n1. aitestkitchen.withgoogle.com/tools/music-fx\\n2. Paste prompt (giữ ngắn!)\\n3. Generate → download MP3\\n4. Ghép vocal bằng CapCut hoặc Audacity"},
"stableaudio":{"prompt":"chi tiết instruments mood ${bpm}BPM production mixing","negative_prompt":"vocals, singing, speech, distortion, noise, clipping, low quality","duration":"45","tips":"1. stableaudio.com\\n2. Paste prompt + negative\\n3. Chọn duration\\n4. Generate → download\\n\\n⚠ Không vocal, ghép riêng"},
"riffusion":{"prompt":"≤50 ký tự. VD: Vietnamese ${g.toLowerCase()} ${m.toLowerCase()} ${vE} vocal ${bpm}bpm","lyrics_for_riffusion":"CHỈ chorus + 1 verse ngắn","tips":"1. riffusion.com\\n2. Prompt ngắn\\n3. Paste lyrics ngắn\\n4. Generate\\n\\n⚠ Chất lượng thấp hơn Suno/Udio"}
}`);
    return pJ(raw);
  },[callAI]);

  const handleSearch=useCallback(async()=>{
    if(!q.trim()){return}
    if(!ak){setShowSet(true);toast("Nhập API key trước (miễn phí)","warn");return}
    setLoading(true);try{
      const raw=await callAI(
`Chuyên gia âm nhạc. CHỈ JSON thuần túy, KHÔNG markdown/backtick.
Nếu KHÔNG BIẾT hoặc KHÔNG CHẮC bài này, trả về: {"error":"Không tìm thấy bài này"}`,
`Bài: "${q}"
JSON:{"title":"","artist":"","lyrics":"TOÀN BỘ lyrics có [Verse 1][Chorus][Bridge][Pre-Chorus][Outro]","genre":"","mood":"","tempo":"slow/medium/fast","bpm":120,"key":"Am","instruments":"nhạc cụ","confidence":"high/low","note":"ghi chú nếu không chắc"}`);
      const p=pJ(raw);
      if(p.error){toast("Không tìm thấy — thử paste lyrics thủ công","warn");setLoading(false);return}
      setSong(p);const g=GENRES.find(g=>p.genre?.toLowerCase().includes(g.toLowerCase()));if(g)setGenre(g);
      setStep(1);
      if(p.confidence==="low")toast("Lyrics có thể sai — nên paste lyrics thật","warn");
      else toast("Tìm thấy!","ok");
    }catch(e){toast(e.message,"err")}setLoading(false);
  },[q,ak,callAI]);

  useEffect(()=>{searchFn.current=handleSearch},[handleSearch]);

  const handleManual=()=>{if(!pasteLy.trim())return;
    setSong({title:q||"Bài hát",artist:"",lyrics:pasteLy,genre,mood,tempo:"medium",bpm:100,key:"",instruments:"",confidence:"manual"});
    setPasteMode(false);setStep(1);toast("OK","ok")};

  const handleRewrite=useCallback(async()=>{
    if(!song||!ak)return;setLoading(true);
    const bpm=bpmFrom(tempo);const vE=vocal.includes("nữ")||vocal==="Duet"?"female":"male";
    const task=mode==="foreign"?"CHUYỂN sang TIẾNG VIỆT":"VIẾT BÀI MỚI tiếng Việt lấy cảm hứng từ";
    try{
    setLoadMsg("Viết lời Việt (~10s)...");
    const lRaw=await callAI(`Nhạc sĩ Việt chuyên nghiệp. CHỈ JSON.`,
`${task}: "${song.title}"${song.artist?" - "+song.artist:""}
${genre}|${mood}|${bpm}BPM|Vocal:${vocal}|Instruments:${song.instruments||"N/A"}|Key:${song.key||"N/A"}
${notes?`Yêu cầu:${notes}`:""}

LYRICS GỐC:
${song.lyrics}

QUY TẮC BẮT BUỘC:
1. GIỮ ĐÚNG cấu trúc section
2. Mỗi câu Việt ≈ số âm tiết câu gốc (±2). VD: "When I look into your eyes"(7) → "Khi anh nhìn vào mắt em"(7)
3. Vần tự nhiên cuối câu
4. HÁT ĐƯỢC — tránh từ khó phát âm ở nốt cao
5. [Verse 1][Pre-Chorus][Chorus][Bridge][Outro] trên dòng riêng

JSON: {"title":"tên Việt","lyrics":"full lyrics có section markers"}`);
    const lR=pJ(lRaw);
    setLoadMsg("Tạo prompt 5 platforms (~10s)...");
    const pR=await genPrompts(lR.lyrics,lR.title,genre,mood,tempo,vocal,song.instruments);
    const result={title:lR.title,lyrics:lR.lyrics,prompts:pR};
    setViet(result);setUndos([]);setPromptsDirty(false);
    const rec=recPlat(genre,mood);setTab(rec);
    const h=[{id:Date.now(),date:new Date().toLocaleDateString("vi"),orig:song.title+(song.artist?" - "+song.artist:""),viet:result.title,mode,genre,mood,vocal,tempo,notes,lyrics:result.lyrics,prompts:pR,origLyrics:song.lyrics,instruments:song.instruments},...hist].slice(0,20);
    setHist(h);LS.s("vmm_h6",h);setStep(3);
    toast(`Xong! Gợi ý: ${PLATS.find(x=>x.id===rec)?.name}`,"ok");
    setTimeout(()=>rRef.current?.scrollIntoView({behavior:"smooth"}),100);
    }catch(e){toast(e.message,"err")}setLoading(false);
  },[song,ak,genre,mood,tempo,vocal,notes,mode,callAI,genPrompts,hist]);

  useEffect(()=>{rewriteFn.current=handleRewrite},[handleRewrite]);

  const regenPromptsOnly=async()=>{
    if(!viet||!ak)return;setLoading(true);setLoadMsg("Cập nhật prompt...");
    try{const pR=await genPrompts(viet.lyrics,viet.title,genre,mood,tempo,vocal,song?.instruments);
      setViet(v=>({...v,prompts:pR}));setPromptsDirty(false);toast("Prompt đã cập nhật","ok");
    }catch(e){toast(e.message,"err")}setLoading(false);
  };

  const handleRegen=async sec=>{
    if(!viet||!ak)return;setRegenSec(sec);try{
      const origLines=song.lyrics.split("\n");let origSec="";let inS=false;
      origLines.forEach(l=>{if(l.toLowerCase().includes(`[${sec.toLowerCase()}`)){inS=true;origSec+=l+"\n"}else if(inS&&l.match(/^\[/))inS=false;else if(inS)origSec+=l+"\n"});
      const raw=await callAI("Nhạc sĩ. CHỈ lyrics mới, KHÔNG giải thích.",
`Viết lại [${sec}] bài "${viet.title}"(${genre},${mood},${vocal}).
Phần gốc (đếm âm tiết): ${origSec||"N/A"}
Bài hiện tại:\n${viet.lyrics}
CHỈ trả về lyrics mới cho [${sec}], KHÔNG header, KHÔNG giải thích.`);
      setUndos(u=>[...u,viet.lyrics]);
      const lines=viet.lyrics.split("\n");let si=-1,ei=-1;let inSec=false;
      lines.forEach((l,i)=>{if(l.toLowerCase().includes(`[${sec.toLowerCase()}`)){inSec=true;si=i}else if(inSec&&l.match(/^\[/)&&i>si){ei=i;inSec=false}});
      if(si>=0){if(ei<0)ei=lines.length;setViet(v=>({...v,lyrics:[...lines.slice(0,si),`[${sec}]`,...raw.trim().split("\n").filter(l=>!l.match(/^\[/)),...lines.slice(ei)].join("\n")}));setPromptsDirty(true);toast(`[${sec}] viết lại xong`,"ok")}
    }catch(e){toast(e.message,"err")}setRegenSec(null);
  };

  const undo=()=>{if(!undos.length)return;setViet(v=>({...v,lyrics:undos.at(-1)}));setUndos(u=>u.slice(0,-1));setPromptsDirty(true);toast("Undo","info")};
  const saveLine=(moveNext=false)=>{
    if(editLine===null||!viet)return;setUndos(u=>[...u,viet.lyrics]);
    const ls=viet.lyrics.split("\n");ls[editLine]=editTxt;setViet(v=>({...v,lyrics:ls.join("\n")}));setPromptsDirty(true);
    if(moveNext){let n=editLine+1;while(n<ls.length&&!isContent(ls[n]))n++;if(n<ls.length){setEditLine(n);setEditTxt(ls[n])}else setEditLine(null)}else setEditLine(null);
  };
  const saveSongLine=()=>{if(editSongLine===null||!song)return;const ls=song.lyrics.split("\n");ls[editSongLine]=editSongTxt;setSong({...song,lyrics:ls.join("\n")});setEditSongLine(null)};

  const copyAll=pid=>{const p=viet?.prompts?.[pid];if(!p)return;let t="";Object.entries(p).forEach(([k,v])=>{if(v&&k!=="tips")t+=`[${k}]\n${v}\n\n`});cp(t,`all-${pid}`);toast("Đã copy prompt","ok")};
  const exportTxt=()=>{if(!viet)return;let t=`${viet.title}\nGốc: ${song.title}${song.artist?" - "+song.artist:""}\n${genre}|${mood}|${tempo}|${vocal}\n\n─── LỜI VIỆT ───\n${viet.lyrics}\n`;PLATS.forEach(pl=>{const pd=viet.prompts?.[pl.id];if(pd){t+=`\n═══ ${pl.name.toUpperCase()} ═══\n`;Object.entries(pd).forEach(([k,v])=>{if(v&&k!=="tips")t+=`[${k}]\n${v}\n\n`});if(pd.tips)t+=`[Hướng dẫn]\n${pd.tips}\n`}});
    const b=new Blob([t],{type:"text/plain;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`${viet.title.replace(/[^\w\sÀ-ỹ]/g,"").replace(/\s+/g,"_")}.txt`;a.click();toast("Đã tải","ok")};

  const cp=(t,l)=>{navigator.clipboard.writeText(t);setCopied(l);setTimeout(()=>setCopied(""),1800)};
  const CB=({text,label,color})=>(<button onClick={()=>cp(text,label)} style={{...Z.cb,borderColor:color||C.gold,color:copied===label?"#1a1a2e":(color||C.gold),background:copied===label?(color||C.gold):"transparent"}}>{copied===label?"✓ Copied":"Copy"}</button>);
  const reset=()=>{setStep(0);setQ("");setSong(null);setViet(null);setNotes("");setEditLine(null);setEditSongLine(null);setPasteMode(false);setPasteLy("");setUndos([]);setPromptsDirty(false)};
  const ap=PLATS.find(p=>p.id===tab);const pd=viet?.prompts?.[tab];
  const getSec=ly=>ly?[...new Set((ly.match(/\[([^\]]+)\]/g)||[]).map(x=>x.replace(/[\[\]]/g,"")))]:[]; 
  const applyPreset=p=>{setGenre(p.g);setMood(p.m);setTempo(p.t);setVocal(p.v);toast(p.name,"info")};
  const loadHist=h=>{setSong({title:h.orig.split(" - ")[0],artist:h.orig.split(" - ")[1]||"",lyrics:h.origLyrics||"",genre:h.genre,mood:h.mood,instruments:h.instruments});
    setViet({title:h.viet,lyrics:h.lyrics,prompts:h.prompts});setGenre(h.genre);setMood(h.mood);if(h.vocal)setVocal(h.vocal);if(h.tempo)setTempo(h.tempo);if(h.notes)setNotes(h.notes);setMode(h.mode);setTab("suno");setStep(3);setPromptsDirty(false)};
  const getOrigIdx=vi=>{if(!song||!viet)return-1;const vL=viet.lyrics.split("\n"),oL=song.lyrics.split("\n");
    let vc=0;for(let i=0;i<=vi;i++)if(isContent(vL[i]))vc++;if(!vc)return-1;
    let oc=0;for(let i=0;i<oL.length;i++){if(isContent(oL[i])){oc++;if(oc===vc)return i}}return-1};
  const curStep=step>=1&&step<=3?step:0;
  const recommended=recPlat(genre,mood);

  const SylComp=({orig,vi})=>{
    if(!orig||!vi)return null;
    const oL=orig.split("\n").filter(isContent);const vL=vi.split("\n").filter(isContent);
    const n=Math.min(oL.length,vL.length);if(!n)return null;
    const pairs=Array.from({length:n},(_,i)=>({o:countSyl(oL[i]),v:countSyl(vL[i])}));
    const diffs=pairs.map(p=>Math.abs(p.o-p.v));const avg=diffs.reduce((a,b)=>a+b,0)/diffs.length;
    const good=diffs.filter(d=>d<=2).length;const pct=Math.round(good/n*100);
    return(<div style={{background:C.bg2,borderRadius:8,padding:12,marginTop:10,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{color:C.t3,fontSize:12,fontWeight:600}}>NHỊP ÂM TIẾT ({n} câu)</span>
        <span style={{fontSize:12,fontWeight:700,color:pct>=80?"#34d399":pct>=50?"#fbbf24":"#f87171"}}>{pct}% khớp · ±{avg.toFixed(1)}</span>
      </div>
      <div style={{display:"flex",gap:2,height:24,alignItems:"end"}}>
        {pairs.slice(0,50).map((p,i)=>{const d=Math.abs(p.o-p.v);return<div key={i} style={{flex:1,minWidth:3,height:Math.max(5,24-d*5),background:d<=1?"#34d399":d<=3?"#fbbf24":"#f87171",borderRadius:"3px 3px 0 0",opacity:.8}} title={`Gốc:${p.o} Việt:${p.v}`}/>})}
      </div>
      <p style={{color:C.t4,fontSize:11,marginTop:6}}>Xanh = khớp · Vàng = lệch nhẹ · Đỏ = lệch nhiều</p>
    </div>);
  };

  return(
    <div style={Z.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}::selection{background:${C.gold};color:#1a1a2e}
        @keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sp{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes toastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        .fi{animation:su .25s ease both}
        .pill{display:inline-flex;align-items:center;gap:4px;padding:6px 14px;border-radius:20px;font-size:12.5px;cursor:pointer;transition:all .12s;border:1.5px solid ${C.border};color:${C.t3};background:transparent;font-family:'DM Sans',sans-serif;white-space:nowrap;user-select:none;min-height:34px}
        .pill:hover{border-color:${C.gold};color:${C.t1}}.pill.on{background:${C.gold};color:#1a1a2e;border-color:${C.gold};font-weight:600}
        .btn{padding:10px 22px;border:none;border-radius:8px;font-size:13.5px;font-weight:600;cursor:pointer;transition:all .12s;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;gap:5px;min-height:40px}
        .btn:hover:not(:disabled){transform:translateY(-1px)}.bp{background:${C.gold};color:#1a1a2e}.bp:hover:not(:disabled){background:#f5e6c8}
        .bs{background:transparent;color:${C.gold};border:1.5px solid ${C.gold}44}.bs:hover:not(:disabled){background:${C.gold}08}
        .btn:disabled{opacity:.3;cursor:not-allowed}textarea,input{font-family:'DM Sans',sans-serif}
        .tab{padding:10px 16px;border:none;background:transparent;color:${C.t4};font-size:13px;font-weight:500;cursor:pointer;border-bottom:2.5px solid transparent;transition:all .12s;font-family:'DM Sans',sans-serif;white-space:nowrap}
        .tab:hover{color:${C.t2}}.tab.on{color:#fff;border-bottom-color:var(--c)}
        pre{font-family:'DM Sans',sans-serif!important}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${C.bg1}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        @media(max-width:680px){.cg{grid-template-columns:1fr!important;direction:ltr}.cg>.viet-col{order:-1!important}.pg{grid-template-columns:1fr!important}.stepper-l{display:none!important}.preset-g{grid-template-columns:repeat(2,1fr)!important}.onb-g{grid-template-columns:1fr 1fr!important}}
        .lyline{padding:3px 6px;border-radius:4px;cursor:pointer;transition:background .08s}.lyline:hover{background:${C.gold}0d}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;animation:fadeIn .12s}
        .modal{background:${C.card};border:1px solid ${C.border};border-radius:14px;padding:24px;max-width:440px;width:94%;max-height:80vh;overflow-y:auto}
        .toast-c{position:fixed;top:16px;right:16px;z-index:200;display:flex;flex-direction:column;gap:8px;pointer-events:none}
        .toast{animation:toastIn .2s ease;padding:10px 16px;border-radius:8px;font-size:13px;font-family:'DM Sans',sans-serif;border:1px solid;pointer-events:auto}
        .dirty-bar{background:#fbbf2412;border:1px solid #fbbf2422;border-radius:8px;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}
      `}</style>

      <div className="toast-c">{toasts.map(t=>(<div key={t.id} className="toast" style={{background:t.type==="ok"?"#34d39912":t.type==="err"?"#f8717112":t.type==="warn"?"#fbbf2412":C.gold+"0a",color:t.type==="ok"?"#34d399":t.type==="err"?"#f87171":t.type==="warn"?"#fbbf24":C.gold,borderColor:t.type==="ok"?"#34d39933":t.type==="err"?"#f8717133":t.type==="warn"?"#fbbf2433":C.gold+"22"}}>{t.type==="ok"?"✓ ":t.type==="err"?"✕ ":t.type==="warn"?"⚠ ":""}{t.msg}</div>))}</div>

      <header style={Z.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={reset}>
          <div style={Z.logo}>♪</div>
          <div><h1 style={Z.h1}>Việt Music Maker</h1><p style={{fontSize:12,color:C.t4}}>Nhạc ngoại → Lời Việt → AI Music</p></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {hist.length>0&&step===0&&<button className="btn bs" onClick={()=>setStep(9)} style={{fontSize:12,padding:"6px 14px"}}>📋 {hist.length}</button>}
          <button className="btn bs" onClick={()=>setShowSet(true)} style={{fontSize:12,padding:"6px 14px",color:ak?C.gold:"#f87171",borderColor:ak?C.gold+"44":"#f8717144"}}>⚙ {ak?PROVS.find(p=>p.id===prov)?.name:"Chưa có API"}</button>
          {step>0&&step<9&&<button className="btn bs" onClick={reset} style={{fontSize:12,padding:"6px 14px"}}>← Mới</button>}
        </div>
      </header>

      {step>=1&&step<=3&&(<div style={{display:"flex",alignItems:"center",marginBottom:16}}>
        {STEPS.map((s,i)=>(<div key={i} style={{display:"flex",alignItems:"center",flex:i<3?1:"none"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,cursor:i<curStep?"pointer":"default"}} onClick={()=>{if(i===0)setStep(1);else if(i<curStep)setStep(i)}}>
            <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,background:i<=curStep?C.gold:C.bg2,color:i<=curStep?"#1a1a2e":C.t4,fontWeight:600,boxShadow:i===curStep?`0 0 0 3px ${C.gold}33`:"none"}}>{s.i}</div>
            <span className="stepper-l" style={{color:i<=curStep?C.gold:C.t4,fontSize:12,fontWeight:i===curStep?600:400}}>{s.n}</span>
          </div>{i<3&&<div style={{flex:1,height:2,background:i<curStep?C.gold+"66":C.bg2,margin:"0 8px"}}/>}
        </div>))}</div>)}

      {showSet&&(<div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setShowSet(false)}}><div className="modal fi">
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <h3 style={{color:C.gold,fontSize:18,fontFamily:"'Instrument Serif',serif",fontWeight:400}}>Cài đặt API</h3>
          <button onClick={()=>setShowSet(false)} style={{background:"none",border:"none",color:C.t3,cursor:"pointer",fontSize:18}}>✕</button>
        </div>
        <p style={{color:C.t2,fontSize:13,marginBottom:14}}>Cả hai đều miễn phí. Chọn một và nhập key.</p>
        {PROVS.map(pv=>(<div key={pv.id} style={{...Z.card,marginBottom:10,borderColor:prov===pv.id?C.gold+"55":C.border,cursor:"pointer"}} onClick={()=>{setProv(pv.id);LS.s("vmm_p",pv.id)}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:10,height:10,borderRadius:"50%",background:prov===pv.id?C.gold:C.border}}/><span style={{color:C.t1,fontWeight:600,fontSize:15}}>{pv.name}</span></div>
            <span style={{color:C.t3,fontSize:12}}>{pv.desc}</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <input type="password" style={{...Z.inp,flex:1,fontSize:14}} placeholder={pv.ph} value={keys[pv.id]||""} onClick={e=>e.stopPropagation()} onChange={e=>{const nk={...keys,[pv.id]:e.target.value};setKeys(nk);LS.s("vmm_k",nk)}}/>
            <a href={pv.keyUrl} target="_blank" rel="noopener" className="btn bs" onClick={e=>e.stopPropagation()} style={{fontSize:12,textDecoration:"none"}}>Lấy key ↗</a>
          </div>
        </div>))}
        <p style={{color:C.t4,fontSize:12,marginTop:8}}>Key lưu trên trình duyệt. Không gửi server nào.</p>
      </div></div>)}

      {loading&&(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:50}}>
        <div style={{width:28,height:28,border:`3px solid ${C.bg2}`,borderTopColor:C.gold,borderRadius:"50%",animation:"sp .7s linear infinite"}}/>
        <p style={{color:C.gold,fontSize:14,marginTop:14,fontWeight:500}}>{loadMsg}</p>
      </div>)}

      {step===0&&!loading&&(<div className="fi">
        {showOnb&&(<div style={{...Z.card,marginBottom:18,borderColor:C.gold+"22",position:"relative"}}>
          <button onClick={()=>{setShowOnb(false);LS.s("vmm_s5",true)}} style={{position:"absolute",top:10,right:12,background:"none",border:"none",color:C.t4,cursor:"pointer",fontSize:16}}>✕</button>
          <p style={{color:C.gold,fontSize:15,fontWeight:600,marginBottom:12}}>Cách hoạt động</p>
          <div className="onb-g" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,textAlign:"center"}}>
            {[{i:"🔍",t:"Tìm / paste lyrics",d:"AI tìm hoặc bạn paste chính xác"},{i:"🎛",t:"Chọn style",d:"Genre, mood, tempo, giọng"},{i:"✍",t:"AI viết lời Việt",d:"Giữ nhịp vần, sửa từng câu"},{i:"🎵",t:"Copy → AI Music",d:"5 platforms, prompt riêng"}].map((x,i)=>
              <div key={i}><div style={{fontSize:24,marginBottom:4}}>{x.i}</div><p style={{color:C.t1,fontSize:13,fontWeight:600}}>{x.t}</p><p style={{color:C.t3,fontSize:12,lineHeight:1.4,marginTop:3}}>{x.d}</p></div>)}
          </div>
        </div>)}
        <div style={{display:"flex",gap:8,marginBottom:18}}>
          <button className={`pill ${mode==="foreign"?"on":""}`} onClick={()=>setMode("foreign")}>🌍 Nhạc ngoại → Việt</button>
          <button className={`pill ${mode==="viet"?"on":""}`} onClick={()=>setMode("viet")}>🇻🇳 Nhạc Việt → Bài mới</button>
        </div>
        {!pasteMode?(<>
          <div style={{display:"flex",gap:8}}>
            <input style={{...Z.inp,flex:1,fontSize:15,padding:"12px 16px"}} placeholder={mode==="foreign"?'"Die With A Smile - Lady Gaga"':'"Waiting For You - MONO"'} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()}/>
            <button className="btn bp" onClick={handleSearch} disabled={loading||!q.trim()} style={{fontSize:14}}>Tìm</button>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
            {!ak?<p style={{color:"#f87171",fontSize:12.5,cursor:"pointer",fontWeight:500}} onClick={()=>setShowSet(true)}>⚠ Bấm vào đây để nhập API key (miễn phí)</p>:<span/>}
            <button onClick={()=>setPasteMode(true)} style={{background:"none",border:"none",color:C.t3,fontSize:12.5,cursor:"pointer",textDecoration:"underline",padding:"4px 0"}}>Hoặc paste lyrics chính xác →</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}>
            {(mode==="foreign"?["Die With A Smile - Lady Gaga","Perfect - Ed Sheeran","Glimpse of Us - Joji","Cupid - FIFTY FIFTY","Dandelions - Ruth B","APT - ROSÉ","Unstoppable - Sia","Night Changes - One Direction"]:["Waiting For You - MONO","Có chắc yêu là đây - Sơn Tùng","See tình - Hoàng Thuỳ Linh","Lạc trôi - Sơn Tùng","Ngày đầu tiên - Đức Phúc"]).map(x=><button key={x} className="pill" onClick={()=>setQ(x)}>{x}</button>)}
          </div>
          <div style={{marginTop:28,paddingTop:18,borderTop:`1px solid ${C.border}`}}>
            <p style={{color:C.t2,fontSize:14,fontWeight:600,marginBottom:12}}>5 AI Music Platforms — mỗi bài tạo prompt riêng</p>
            <div className="pg" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {PLATS.map(p=>(<a key={p.id} href={p.url} target="_blank" rel="noopener" style={{...Z.card,padding:14,borderColor:p.color+"22",textDecoration:"none",display:"block",transition:"border .12s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=p.color+"55"} onMouseLeave={e=>e.currentTarget.style.borderColor=p.color+"22"}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span>{p.icon} <span style={{color:p.color,fontWeight:600,fontSize:13.5}}>{p.name}</span>{p.vocal?<span style={{fontSize:10,color:"#34d399",marginLeft:4}}>🎤</span>:<span style={{fontSize:10,color:"#fbbf24",marginLeft:4}}>🎹</span>}</span>
                  <span style={{color:C.t4,fontSize:11,background:C.bg2,padding:"3px 8px",borderRadius:8}}>{p.free}</span>
                </div>
                <p style={{color:C.t3,fontSize:12,lineHeight:1.4,marginBottom:6}}>{p.desc}</p>
                <div style={{background:C.bg1,borderRadius:6,padding:8}}><pre style={{fontSize:11,lineHeight:1.4,color:p.color+"88",whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif"}}>{p.exP}</pre></div>
              </a>))}
            </div>
          </div>
        </>):(<div className="fi">
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <p style={{color:C.gold,fontSize:14,fontWeight:600}}>Paste lyrics chính xác</p>
            <button onClick={()=>setPasteMode(false)} style={{background:"none",border:"none",color:C.t3,fontSize:12,cursor:"pointer"}}>← Tìm bằng AI</button>
          </div>
          <input style={{...Z.inp,width:"100%",marginBottom:8,fontSize:14}} placeholder="Tên bài (tuỳ chọn)" value={q} onChange={e=>setQ(e.target.value)}/>
          <textarea style={{...Z.inp,width:"100%",minHeight:180,resize:"vertical",lineHeight:1.8,fontSize:14}} placeholder={"Paste lyrics từ Genius / AZLyrics...\n\n[Verse 1]\nLyrics...\n\n[Chorus]\nLyrics..."} value={pasteLy} onChange={e=>setPasteLy(e.target.value)}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
            <p style={{color:"#34d399",fontSize:12}}>💡 Lyrics thật → kết quả chính xác hơn rất nhiều</p>
            <button className="btn bp" onClick={handleManual} disabled={!pasteLy.trim()}>Tiếp →</button>
          </div>
        </div>)}
      </div>)}

      {step===9&&(<div className="fi">
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <h3 style={{fontFamily:"'Instrument Serif',serif",color:C.gold,fontSize:18,fontWeight:400}}>Lịch sử</h3>
          <div style={{display:"flex",gap:6}}>
            {hist.length>0&&<button className="btn bs" onClick={()=>{setHist([]);LS.s("vmm_h6",[]);setStep(0);toast("Đã xoá","info")}} style={{color:"#f87171",borderColor:"#f8717133"}}>Xoá hết</button>}
            <button className="btn bs" onClick={()=>setStep(0)}>← Về</button>
          </div>
        </div>
        {hist.map(h=>(<div key={h.id} style={{...Z.card,marginBottom:8,cursor:"pointer"}} onClick={()=>loadHist(h)} onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold+"33"} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          <div style={{display:"flex",justifyContent:"space-between"}}><div><p style={{color:C.t1,fontSize:14,fontWeight:500}}>{h.viet}</p><p style={{color:C.t4,fontSize:12,marginTop:2}}>← {h.orig}</p></div>
            <div style={{textAlign:"right"}}><p style={{color:C.t4,fontSize:12}}>{h.date}</p><p style={{color:C.t4,fontSize:11}}>{h.genre} · {h.mood}</p></div></div>
        </div>))}
      </div>)}

      {step===1&&song&&!loading&&(<div className="fi">
        <div style={Z.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",flexWrap:"wrap",gap:6,marginBottom:8}}>
            <div><h2 style={{fontFamily:"'Instrument Serif',serif",fontSize:20,color:C.t1,fontWeight:400}}>{song.title}</h2>{song.artist&&<p style={{color:C.t3,fontSize:13,marginTop:2}}>{song.artist}</p>}</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{[song.genre,song.tempo,song.key,song.bpm&&song.bpm+"BPM"].filter(Boolean).map((t,i)=>(<span key={i} className="pill" style={{cursor:"default",color:C.t4,minHeight:"auto",padding:"3px 10px"}}>{t}</span>))}</div>
          </div>
          {song.confidence==="low"&&<div style={{background:"#fbbf2410",border:"1px solid #fbbf2422",borderRadius:8,padding:"8px 12px",marginBottom:10}}>
            <p style={{color:"#fbbf24",fontSize:12.5}}>⚠ AI không chắc lyrics đúng. Bấm vào câu sai để sửa, hoặc <button onClick={()=>{setPasteMode(true);setPasteLy(song.lyrics);setStep(0)}} style={{background:"none",border:"none",color:"#fbbf24",textDecoration:"underline",cursor:"pointer",fontSize:12.5,fontFamily:"'DM Sans'"}}>paste lại toàn bộ</button></p>
          </div>}
          {song.confidence!=="low"&&song.confidence!=="manual"&&<div style={{background:C.gold+"08",border:`1px solid ${C.gold}15`,borderRadius:8,padding:"6px 12px",marginBottom:10}}>
            <p style={{color:C.t3,fontSize:12}}>Bấm vào câu để sửa nếu sai. Hoặc <button onClick={()=>{setPasteMode(true);setPasteLy(song.lyrics);setStep(0)}} style={{background:"none",border:"none",color:C.gold,textDecoration:"underline",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans'"}}>paste lyrics thật</button></p>
          </div>}
          <div style={Z.lyBox}>
            {song.lyrics.split("\n").map((line,i)=>{const isSec=line.match(/^\[/);
              if(editSongLine===i)return(<div key={i} style={{display:"flex",gap:4,marginBottom:2}}>
                <input style={{...Z.inp,flex:1,fontSize:13,padding:"4px 8px"}} value={editSongTxt} onChange={e=>setEditSongTxt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveSongLine();if(e.key==="Escape")setEditSongLine(null)}} autoFocus/>
                <button onClick={saveSongLine} style={{...Z.cb,background:C.gold,color:"#1a1a2e",borderColor:C.gold}}>✓</button>
              </div>);
              return<div key={i} className={isSec?"":"lyline"} onClick={()=>{if(!isSec){setEditSongLine(i);setEditSongTxt(line)}}} style={{fontSize:13,lineHeight:1.75,color:isSec?C.t3:C.t2,fontWeight:isSec?600:400,whiteSpace:"pre-wrap",padding:"0 6px"}}>{line||"\u00A0"}</div>
            })}
          </div>
        </div>
        <button className="btn bp" onClick={()=>setStep(2)} style={{width:"100%",marginTop:10,fontSize:15}}>Tiếp → Tuỳ chỉnh style</button>
      </div>)}

      {step===2&&song&&!loading&&(<div className="fi"><div style={Z.card}>
        <p style={{color:C.gold,fontSize:15,fontWeight:600,marginBottom:12}}>Preset nhanh</p>
        <div className="preset-g" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
          {PRESETS.map(p=>{const active=p.g===genre&&p.m===mood&&p.t===tempo&&p.v===vocal;
            return<button key={p.name} onClick={()=>applyPreset(p)} style={{...Z.card,padding:"8px",cursor:"pointer",borderColor:active?C.gold:C.border,background:active?C.gold+"0d":C.card,textAlign:"center"}}>
              <div style={{fontSize:20}}>{p.icon}</div><div style={{color:active?C.gold:C.t3,fontSize:12,fontWeight:active?600:400,marginTop:2}}>{p.name}</div>
            </button>})}
        </div>
        <CR l="Thể loại"><PG items={GENRES} v={genre} set={setGenre}/></CR>
        <CR l="Mood"><PG items={MOODS} v={mood} set={setMood}/></CR>
        <CR l="Tempo"><PG items={TEMPOS} v={tempo} set={setTempo}/></CR>
        <CR l="Giọng hát"><PG items={VOCALS} v={vocal} set={setVocal}/></CR>
        <CR l="Ghi chú"><textarea style={{...Z.inp,width:"100%",resize:"vertical",fontSize:14}} placeholder="VD: Thêm rap, drop EDM, giữ melody gốc..." value={notes} onChange={e=>setNotes(e.target.value)} rows={2}/></CR>
        <button className="btn bp" onClick={handleRewrite} disabled={loading} style={{width:"100%",marginTop:8,fontSize:15}}>✨ Viết lời Việt + Tạo prompt</button>
        <p style={{color:C.t4,fontSize:11,textAlign:"center",marginTop:6}}>AI viết lời (~10s) → tạo prompt 5 platforms (~10s)</p>
      </div></div>)}

      {step===3&&viet&&!loading&&(<div className="fi" ref={rRef}>
        <div className="cg" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={Z.card}>
            <p style={{color:C.t4,fontSize:11}}>BÀI GỐC</p>
            <h3 style={{fontFamily:"'Instrument Serif',serif",fontSize:16,color:C.t2,fontWeight:400,marginBottom:6}}>{song.title}{song.artist&&<span style={{color:C.t4}}> — {song.artist}</span>}</h3>
            <div style={{...Z.lyBox,maxHeight:380}}>
              {song.lyrics.split("\n").map((line,i)=>{const isSec=line.match(/^\[/);const isHL=editLine!==null&&getOrigIdx(editLine)===i;
                return<div key={i} style={{fontSize:13,lineHeight:1.75,color:isSec?C.t3:isHL?C.gold:C.t3,fontWeight:isSec?600:400,whiteSpace:"pre-wrap",background:isHL?C.gold+"12":"transparent",borderRadius:4,padding:"0 6px",transition:"background .15s"}}>{line||"\u00A0"}</div>})}
            </div>
          </div>
          <div className="viet-col" style={{...Z.card,borderColor:C.gold+"33"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:4}}>
              <div><p style={{color:C.gold,fontSize:11}}>LỜI VIỆT</p><h3 style={{fontFamily:"'Instrument Serif',serif",fontSize:16,color:C.t1,fontWeight:400}}>{viet.title}</h3></div>
              <div style={{display:"flex",gap:4}}>
                {undos.length>0&&<button className="btn bs" onClick={undo} style={{fontSize:11,padding:"4px 10px"}}>↩{undos.length}</button>}
                <CB text={viet.lyrics} label="vly"/><button className="btn bs" onClick={exportTxt} style={{fontSize:11,padding:"4px 10px"}}>↓</button>
              </div>
            </div>
            <div style={{...Z.lyBox,maxHeight:380,marginTop:6}}>
              {viet.lyrics.split("\n").map((line,i)=>{const isSec=line.match(/^\[/);
                if(editLine===i){const oi=getOrigIdx(i);const oL=song.lyrics.split("\n");const origLine=oi>=0?oL[oi]:null;const oSyl=origLine?countSyl(origLine):null;const cSyl=countSyl(editTxt);
                  return(<div key={i}>
                    <div style={{display:"flex",gap:4,marginBottom:2,alignItems:"center"}}>
                      <input style={{...Z.inp,flex:1,fontSize:14,padding:"4px 8px"}} value={editTxt} onChange={e=>setEditTxt(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter")saveLine(false);if(e.key==="Tab"){e.preventDefault();saveLine(true)}if(e.key==="Escape")setEditLine(null)}} autoFocus/>
                      {oSyl!==null&&<span style={{fontSize:11,fontWeight:700,color:Math.abs(oSyl-cSyl)<=2?"#34d399":Math.abs(oSyl-cSyl)<=4?"#fbbf24":"#f87171",whiteSpace:"nowrap",minWidth:36,textAlign:"center"}}>{cSyl}/{oSyl}</span>}
                      <button onClick={()=>saveLine(false)} style={{...Z.cb,background:C.gold,color:"#1a1a2e",borderColor:C.gold}}>✓</button>
                    </div>
                    {origLine&&<p style={{color:C.gold+"77",fontSize:12,fontStyle:"italic",padding:"2px 8px",marginBottom:2,background:C.gold+"08",borderRadius:4}}>↳ {origLine}</p>}
                    <p style={{color:C.t4,fontSize:10}}>Enter lưu · Tab lưu+câu tiếp · Esc huỷ</p>
                  </div>)}
                return<div key={i} className={isSec?"":"lyline"} onClick={()=>{if(!isSec){setEditLine(i);setEditTxt(line)}}} style={{fontSize:13,lineHeight:1.75,color:isSec?C.gold:C.t2,fontWeight:isSec?600:400,whiteSpace:"pre-wrap",padding:"0 6px"}}>{line||"\u00A0"}</div>})}
            </div>
            <p style={{color:C.t4,fontSize:11,marginTop:6}}>Bấm câu → sửa + xem câu gốc + đếm âm tiết</p>
            {getSec(viet.lyrics).length>0&&(<div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
              <span style={{color:C.t4,fontSize:12}}>Viết lại:</span>
              {getSec(viet.lyrics).map(sec=><button key={sec} className="pill" onClick={()=>handleRegen(sec)} disabled={!!regenSec} style={{color:regenSec===sec?"#1a1a2e":C.t3,background:regenSec===sec?C.gold:"transparent"}}>{regenSec===sec?"…":sec}</button>)}
            </div>)}
            <SylComp orig={song.lyrics} vi={viet.lyrics}/>
            {promptsDirty&&(<div className="dirty-bar"><p style={{color:"#fbbf24",fontSize:12}}>⚠ Lời đã sửa — prompt chưa cập nhật</p>
              <button className="btn bp" onClick={regenPromptsOnly} disabled={loading} style={{fontSize:12,padding:"6px 14px"}}>Cập nhật prompt</button></div>)}
          </div>
        </div>

        <div style={{...Z.card,marginTop:10,borderColor:ap?.color+"22"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
            <p style={{color:C.t1,fontSize:15,fontWeight:600}}>Prompt AI Music</p>
            <div style={{display:"flex",gap:5}}>
              <button className="btn bs" onClick={()=>copyAll(tab)} style={{borderColor:ap?.color+"44",color:copied===`all-${tab}`?"#1a1a2e":ap?.color,background:copied===`all-${tab}`?ap?.color:"transparent"}}>{copied===`all-${tab}`?"✓":"Copy All"}</button>
              <button className="btn bs" onClick={exportTxt}>↓ TXT</button>
            </div>
          </div>
          <div style={{display:"flex",borderBottom:`2px solid ${C.border}`,overflowX:"auto",marginBottom:14}}>
            {PLATS.map(p=>(<button key={p.id} className={`tab ${tab===p.id?"on":""}`} style={{"--c":p.color}} onClick={()=>setTab(p.id)}>{p.icon} {p.name}{p.id===recommended&&tab!==p.id?" ⭐":""}</button>))}
          </div>
          {pd&&(<div className="fi" key={tab}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
              <div><span style={{color:ap.color,fontWeight:600,fontSize:14}}>{ap.name}</span>
                {ap.vocal?<span style={{fontSize:11,color:"#34d399",marginLeft:6}}>🎤 Có vocal</span>:<span style={{fontSize:11,color:"#fbbf24",marginLeft:6}}>🎹 Nhạc nền</span>}
                {tab===recommended&&<span style={{fontSize:11,color:C.gold,marginLeft:6}}>⭐ Gợi ý</span>}
              </div>
              <a href={ap.url} target="_blank" rel="noopener" className="btn bs" style={{textDecoration:"none"}}>Mở {ap.name} ↗</a>
            </div>
            {Object.entries(pd).filter(([k,v])=>v&&k!=="tips").map(([k,v])=>{
              const lb={style_of_music:"Style of Music ⭐",lyrics_for_suno:"Lyrics (Custom Lyrics)",prompt:"Prompt ⭐",tags:"Tags",lyrics_for_udio:"Lyrics",lyrics_for_riffusion:"Lyrics",negative_prompt:"Negative Prompt",duration:"Duration"}[k]||k;
              return(<div key={k} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{color:C.t3,fontSize:12,fontWeight:600,textTransform:"uppercase"}}>{lb}</span><CB text={v} label={`${tab}-${k}`} color={ap.color}/>
                </div>
                <div style={{...Z.lyBox,maxHeight:k.includes("lyrics")?240:120}}><pre style={{...Z.lyTxt,color:ap.color}}>{v}</pre></div>
              </div>)})}
            {pd.tips&&(<div style={{background:ap.color+"0d",borderRadius:8,padding:14,marginTop:6,border:`1px solid ${ap.color}22`}}>
              <p style={{color:ap.color,fontSize:12,fontWeight:600,marginBottom:4}}>💡 Hướng dẫn</p>
              <pre style={{color:C.t2,fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap",fontFamily:"'DM Sans',sans-serif"}}>{pd.tips}</pre>
            </div>)}
          </div>)}
        </div>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button className="btn bp" onClick={()=>{setViet(null);setUndos([]);setStep(2);setPromptsDirty(false)}}>↻ Viết lại toàn bộ</button>
          <button className="btn bs" onClick={reset}>← Bài mới</button>
        </div>
      </div>)}

      <footer style={{marginTop:28,paddingTop:12,borderTop:`1px solid ${C.border}`,textAlign:"center",color:C.t4,fontSize:11}}>Việt Music Maker · Tìm → Lời Việt → Prompt → AI Music → Nhạc</footer>
    </div>
  );
}

function CR({l,children}){return<div style={{marginBottom:10}}><label style={{display:"block",color:C.t3,fontSize:12,marginBottom:5,fontWeight:500}}>{l}</label>{children}</div>}
function PG({items,v,set}){return<div style={{display:"flex",flexWrap:"wrap",gap:5}}>{items.map(i=><button key={i} className={`pill ${v===i?"on":""}`} onClick={()=>set(i)}>{i}</button>)}</div>}

const Z={
  root:{minHeight:"100vh",background:C.bg1,color:C.t1,fontFamily:"'DM Sans',sans-serif",padding:16,maxWidth:900,margin:"0 auto"},
  hdr:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,paddingBottom:12,borderBottom:`1px solid ${C.border}`},
  logo:{width:38,height:38,background:`linear-gradient(135deg,${C.gold},#c4a882)`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#1a1a2e",fontWeight:700},
  h1:{fontFamily:"'Instrument Serif',serif",fontSize:20,color:C.gold,fontWeight:400},
  card:{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16},
  inp:{padding:"10px 14px",background:C.bg2,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.t1,fontSize:13,outline:"none"},
  lyBox:{background:C.bg1,borderRadius:8,padding:12,maxHeight:280,overflowY:"auto"},
  lyTxt:{fontFamily:"'DM Sans',sans-serif",fontSize:13,lineHeight:1.75,color:C.t2,whiteSpace:"pre-wrap",wordBreak:"break-word"},
  cb:{padding:"4px 12px",borderRadius:6,fontSize:12,cursor:"pointer",transition:"all .12s",border:`1.5px solid ${C.gold}`,background:"transparent",color:C.gold,fontFamily:"'DM Sans',sans-serif",fontWeight:600,whiteSpace:"nowrap",minHeight:28},
};
