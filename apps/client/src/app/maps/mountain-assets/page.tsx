const base='/assets/umbral/candidates/mountain-sanctuary-phase-c';

export default function Page() {
  const pieces=[['front-module-01.png','หน้าตรง · AI + แก้ขอบด้วย Workbench',64,96],['left-return-manual-01.png','ด้านซ้าย · ดัดแปลงด้วยการเลื่อนคอลัมน์พิกเซล',64,96],['right-return-manual-01.png','ด้านขวา · ดัดแปลงด้วยการเลื่อนคอลัมน์พิกเซล',64,96],['stairs-01.png','บันไดสั้น · geometry ตรง + รายละเอียด PixelLab',48,64],['waterfall-01.png','น้ำตก · ตัวเลือกจาก PixelLab',32,96]] as const;
  return <main style={{minHeight:'100dvh',padding:'24px',background:'#112623',color:'#e9d8ae',fontFamily:'Tahoma,sans-serif'}}>
    <h1 style={{fontSize:22}}>Mountain Sanctuary · ตรวจชิ้น terrain Phase C</h1>
    <p>ชุดทดลองแยกจากแผนที่ · ยังไม่ผ่านการอนุมัติภาพและยังไม่ใช้ใน production</p>
    <p>PixelLab 5 งาน · 41 / 50 generations · บันไดและน้ำตกยังเป็นภาพนิ่ง</p>
    <p><a href="/maps/mountain-sanctuary" style={{color:'#e9c681'}}>เปิดแผนที่เต็ม Phase D</a> · <a href="/maps/mountain-prototype" style={{color:'#b4d2c5'}}>กลับต้นแบบ geometry</a> · <a href={`${base}/manifest.json`} style={{color:'#b4d2c5'}}>ขนาด / ที่มา / hash</a></p>
    <h2 style={{fontSize:17,marginTop:24}}>หน้าตรงซ้ำสามชิ้น · 4× nearest</h2>
    <div style={{overflowX:'auto',maxWidth:'100%'}}><img src={`${base}/front-repeat-4x.png`} width={768} height={384} alt="หน้าผาหน้าตรงต่อกันสามชิ้น มีลายซ้ำให้ตรวจ" style={{maxWidth:'none',imageRendering:'pixelated'}} /></div>
    <h2 style={{fontSize:17,marginTop:24}}>ด้านซ้าย → หน้าตรง → ด้านขวา · 4× nearest</h2>
    <p>ผล AI ด้านข้างไม่ตรงคำสั่ง จึงเก็บเป็นงานไม่ผ่าน ตัวเลือกนี้เป็นชิ้นดัดแปลงจากหน้าตรง ไม่ใช่มุมด้านข้างที่ AI สร้างสำเร็จ</p>
    <div style={{overflowX:'auto',maxWidth:'100%'}}><img src={`${base}/left-front-right-4x.png`} width={768} height={384} alt="ตัวเลือกชิ้นดัดแปลงซ้าย หน้าตรง และขวา" style={{maxWidth:'none',imageRendering:'pixelated'}} /></div>
    <div style={{display:'flex',flexWrap:'wrap',gap:24,marginTop:24}}>{pieces.map(([file,label,w,h])=><figure key={file} style={{margin:0,maxWidth:'100%'}}><figcaption style={{maxWidth:256,lineHeight:1.6,marginBottom:8}}>{label}<br />Native {w}×{h} · แสดง 4×</figcaption><img src={`${base}/${file}`} width={w*4} height={h*4} alt={label} style={{imageRendering:'pixelated',background:'#1b3730'}} /></figure>)}</div>
    <p style={{marginTop:24}}>ชุดนี้ยังไม่ครอบคลุมมุมเว้าตามธรรมชาติทุกแบบ รอยต่อบันได/ทางลาด และ animation น้ำตก ต้องตรวจร่วมกับภูมิประเทศจริงในขั้นถัดไป</p>
  </main>;
}
