const A2={2:1.88,3:1.023,4:.729,5:.577,6:.483,7:.419,8:.373,9:.337,10:.308};
const D3={2:0,3:0,4:0,5:0,6:0,7:.076,8:.136,9:.184,10:.223};
const D4={2:3.267,3:2.574,4:2.282,5:2.114,6:2.004,7:1.924,8:1.864,9:1.816,10:1.777};
let rows=[];

const $=id=>document.getElementById(id);
const num=id=>Number($(id).value);
const fmt=v=>Number.isFinite(v)?Number(v).toFixed(4):"-";

function parseValues(){
  return $("valueInput").value.split(/\r?\n|,|\t/).map(v=>Number(String(v).trim())).filter(Number.isFinite);
}

function groupValues(values,n){
  const groups=[];
  for(let i=0;i+n<=values.length;i+=n){
    const part=values.slice(i,i+n);
    const avg=part.reduce((a,b)=>a+b,0)/part.length;
    const range=Math.max(...part)-Math.min(...part);
    groups.push({group:groups.length+1,values:part,avg,range});
  }
  return groups;
}

function capability(values,usl,cl,lsl){
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  const variance=values.length>1?values.reduce((a,b)=>a+(b-mean)**2,0)/(values.length-1):0;
  const sd=Math.sqrt(variance);
  const cp=sd>0?(usl-lsl)/(6*sd):NaN;
  const cpk=sd>0?Math.min((usl-mean)/(3*sd),(mean-lsl)/(3*sd)):NaN;
  const ca=(usl-lsl)!==0?(mean-cl)/((usl-lsl)/2):NaN;
  return {mean,sd,cp,cpk,ca};
}

function calculate(){
  const values=parseValues();
  const n=Math.max(2,Math.min(10,Math.round(num("groupSize")||5)));
  const sampleCount=Math.max(1,Math.round(num("sampleCount")||values.length));
  const used=values.slice(0,sampleCount);
  const groups=groupValues(used,n);
  const usl=num("usl"),cl=num("cl"),lsl=num("lsl");
  const xbarbar=groups.length?groups.reduce((a,g)=>a+g.avg,0)/groups.length:NaN;
  const rbar=groups.length?groups.reduce((a,g)=>a+g.range,0)/groups.length:NaN;
  const xUcl=xbarbar+(A2[n]||A2[5])*rbar;
  const xLcl=xbarbar-(A2[n]||A2[5])*rbar;
  const rUcl=(D4[n]||D4[5])*rbar;
  const rLcl=(D3[n]??D3[5])*rbar;
  const cap=used.length?capability(used,usl,cl,lsl):{};
  rows=used.map((value,i)=>({No:i+1,Time:new Date(Date.now()+i*1000).toLocaleString(),Size:value,Group:Math.floor(i/n)+1}));
  renderMetrics({count:used.length,n,xbarbar,rbar,...cap});
  renderCharts(groups,{usl,cl,lsl,xbarbar,xUcl,xLcl,rbar,rUcl,rLcl});
  renderTable(rows);
}

function renderMetrics(m){
  const items=[
    ["筆數",m.count,""] , ["Xbar",fmt(m.xbarbar),""], ["Rbar",fmt(m.rbar),""],
    ["Cp",fmt(m.cp),m.cp>=1.33?"ok":"warn"], ["Cpk",fmt(m.cpk),m.cpk>=1.33?"ok":"warn"], ["Ca",fmt(m.ca),Math.abs(m.ca)<=.1?"ok":"warn"]
  ];
  $("metrics").innerHTML=items.map(([k,v,c])=>`<div class="metric ${c}"><span>${k}</span><strong>${v}</strong></div>`).join("");
}

function line(y,name,color,dash="solid"){
  return {x:[],y:[],mode:"lines",name,line:{color,dash,width:1.5},hoverinfo:"skip"};
}

function withSpan(trace,xs,y){trace.x=[xs[0],xs[xs.length-1]];trace.y=[y,y];return trace;}

function renderCharts(groups,lim){
  const xs=groups.map(g=>g.group);
  const xbar={x:xs,y:groups.map(g=>g.avg),mode:"lines+markers",name:"Xbar",line:{color:"#1570ef"}};
  const r={x:xs,y:groups.map(g=>g.range),mode:"lines+markers",name:"R",line:{color:"#099250"}};
  const common={margin:{l:56,r:24,t:42,b:44},paper_bgcolor:"#fff",plot_bgcolor:"#fff",legend:{orientation:"h"}};
  const xData=[xbar];
  const rData=[r];
  if(xs.length){
    xData.push(withSpan(line(0,"USL","#b42318","dot"),xs,lim.usl),withSpan(line(0,"CL","#475467","dash"),xs,lim.cl),withSpan(line(0,"LSL","#b42318","dot"),xs,lim.lsl),withSpan(line(0,"UCL","#f79009","dash"),xs,lim.xUcl),withSpan(line(0,"LCL","#f79009","dash"),xs,lim.xLcl));
    rData.push(withSpan(line(0,"Rbar","#475467","dash"),xs,lim.rbar),withSpan(line(0,"UCL","#f79009","dash"),xs,lim.rUcl),withSpan(line(0,"LCL","#f79009","dash"),xs,lim.rLcl));
  }
  Plotly.newPlot("xbarChart",xData,{...common,title:"Xbar 管制圖",xaxis:{title:"組別"},yaxis:{title:"平均值"}},{responsive:true,displaylogo:false});
  Plotly.newPlot("rChart",rData,{...common,title:"R 管制圖",xaxis:{title:"組別"},yaxis:{title:"全距"}},{responsive:true,displaylogo:false});
}

function renderTable(data){
  const head="<tr><th>No</th><th>Time</th><th>Size</th><th>Group</th></tr>";
  const body=data.map(r=>`<tr><td>${r.No}</td><td>${r.Time}</td><td>${fmt(r.Size)}</td><td>${r.Group}</td></tr>`).join("");
  $("dataTable").innerHTML=head+body;
}

function exportExcel(){
  if(!rows.length)calculate();
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),"原始資料");
  const settings=[
    ["product_name",$("productName").value],["group_n",$("groupSize").value],["sample_n",$("sampleCount").value],
    ["usl",$("usl").value],["cl",$("cl").value],["lsl",$("lsl").value],["export_time",new Date().toLocaleString()]
  ];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([["項目","值"],...settings]),"系統設定");
  XLSX.writeFile(wb,`EMSQC_${$("productName").value||"report"}.xlsx`);
}

function importFile(file){
  const reader=new FileReader();
  reader.onload=e=>{
    const wb=XLSX.read(e.target.result,{type:"array"});
    const sheet=wb.Sheets["原始資料"]||wb.Sheets[wb.SheetNames[0]];
    const data=XLSX.utils.sheet_to_json(sheet,{defval:null});
    const values=data.map(r=>Number(r.Size??r.size??r["量測值"]??Object.values(r).find(v=>Number.isFinite(Number(v))))).filter(Number.isFinite);
    $("valueInput").value=values.join("\n");
    $("sampleCount").value=values.length||$("sampleCount").value;
    calculate();
  };
  reader.readAsArrayBuffer(file);
}

$("calculate").addEventListener("click",calculate);
$("clearData").addEventListener("click",()=>{$("valueInput").value="";rows=[];calculate();});
$("exportExcel").addEventListener("click",exportExcel);
$("fileInput").addEventListener("change",e=>{if(e.target.files[0])importFile(e.target.files[0]);});
["productName","groupSize","sampleCount","usl","cl","lsl"].forEach(id=>$(id).addEventListener("change",calculate));
calculate();
