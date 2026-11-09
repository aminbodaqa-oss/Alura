'use strict';
// سيرفر بدون أي مكتبات خارجية — يحتاج Node.js 22.13 أو أحدث (SQLite مدمجة)
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {DatabaseSync}=require('node:sqlite');
const PORT=+process.env.PORT||3000, ADMIN=process.env.ADMIN_PATH||'/admin';
const db=new DatabaseSync(path.join(__dirname,'data.db'));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS admin(id INTEGER PRIMARY KEY CHECK(id=1),username TEXT NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,phone TEXT,phone2 TEXT,governorate TEXT,address TEXT,qty INTEGER DEFAULT 1,notes TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,expires INTEGER NOT NULL);`);
for(const c of ['phone2 TEXT','governorate TEXT','bundle TEXT','shipping INTEGER DEFAULT 0','total INTEGER DEFAULT 0',"status TEXT DEFAULT 'جديد'"])try{db.exec(`ALTER TABLE orders ADD COLUMN ${c}`)}catch(e){}
const GOV=["القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "البحيرة", "المنوفية", "الغربية", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح"];
const one=(s,...a)=>db.prepare(s).get(...a), all=(s,...a)=>db.prepare(s).all(...a), run=(s,...a)=>db.prepare(s).run(...a);
const hash=(p,s)=>crypto.scryptSync(p,s,64).toString('hex');
const same=(a,b)=>{a=Buffer.from(a);b=Buffer.from(b);return a.length===b.length&&crypto.timingSafeEqual(a,b)};
const hits={};const limit=(k,n,ms)=>{const t=Date.now();hits[k]=(hits[k]||[]).filter(x=>t-x<ms);if(hits[k].length>=n)return false;hits[k].push(t);return true};
const json=(res,code,obj,h={})=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...h});res.end(JSON.stringify(obj))};
const readBody=req=>new Promise((ok,no)=>{let n=0;const c=[];req.on('data',d=>{n+=d.length;if(n>25e6){no(new Error('الحجم كبير'));req.destroy()}else c.push(d)});req.on('end',()=>{try{ok(JSON.parse(Buffer.concat(c).toString()||'{}'))}catch(e){no(e)}})});
const cl=(v,n)=>String(v??'').trim().slice(0,n);
const sid=req=>(/(?:^|; )sid=([a-f0-9]{64})/.exec(req.headers.cookie||'')||[])[1];
const authed=req=>{const t=sid(req);if(!t)return false;const s=one('SELECT expires FROM sessions WHERE token=?',t);return !!s&&s.expires>Date.now()};
const startSession=()=>{const t=crypto.randomBytes(32).toString('hex');run('DELETE FROM sessions WHERE expires<?',Date.now());run('INSERT INTO sessions VALUES(?,?)',t,Date.now()+7*864e5);return {'Set-Cookie':`sid=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`}};
const settings=()=>JSON.parse((one("SELECT value FROM settings WHERE key='main'")||{value:'{}'}).value);
const STATUS=['جديد','تم التأكيد','تم الشحن','تم التسليم','ملغي'],UP=path.join(__dirname,'uploads'),BK=path.join(__dirname,'backups');
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const secrets=()=>{try{return JSON.parse((one("SELECT value FROM settings WHERE key='secret'")||{value:'{}'}).value)}catch(e){return {}}};
const notify=async t=>{const k=secrets();if(!k.tgToken||!k.tgChat)return {ok:false,err:'أدخل التوكن ومعرّف الشات أولاً'};
 try{const r=await fetch(`https://api.telegram.org/bot${encodeURIComponent(k.tgToken)}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:k.tgChat,text:t})});const j=await r.json();return {ok:!!j.ok,err:j.description}}catch(e){return {ok:false,err:e.message}}};
function indexHtml(req){let h=fs.readFileSync(path.join(__dirname,'public','index.html'),'utf8');const s=settings();if(!s.siteName&&!s.productName)return h;
 const title=esc((s.siteName||'')+' | '+(s.productName||'')),desc=esc(s.heroSub||s.desc||''),img=(s.images||[])[0],host=(req.headers['x-forwarded-proto']||'http')+'://'+req.headers.host;
 const og=typeof img==='string'&&img.startsWith('/uploads/')?`<meta property="og:image" content="${esc(host+img)}">`:'';
 return h.replace('<title>المنتج</title>',`<title>${title}</title><meta name="description" content="${desc}"><meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">${og}<meta name="twitter:card" content="summary_large_image">`)}
const backup=()=>{try{fs.mkdirSync(BK,{recursive:true});const f=path.join(BK,`data-${new Date().toISOString().slice(0,10)}.db`);if(!fs.existsSync(f))db.exec(`VACUUM INTO '${f.replace(/'/g,"''")}'`);const all=fs.readdirSync(BK).sort();while(all.length>14)fs.unlinkSync(path.join(BK,all.shift()))}catch(e){console.log('backup:',e.message)}};
backup();setInterval(backup,6*36e5);
const FILES={'/':'index.html',[ADMIN]:'admin.html','/shared.js':'shared.js'};

http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://x'),p=u.pathname.replace(/(.)\/$/,'$1'),m=req.method,ip=req.socket.remoteAddress;
 if(m==='GET'&&FILES[p]){const f=FILES[p];res.writeHead(200,{'Content-Type':f.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','X-Frame-Options':'DENY'});return res.end(f==='index.html'?indexHtml(req):fs.readFileSync(path.join(__dirname,'public',f)))}
 if(m==='GET'&&p.startsWith('/uploads/')){const n=p.slice(9);if(!/^[a-f0-9]{20}\.(png|jpg|webp|gif)$/.test(n)||!fs.existsSync(path.join(UP,n)))return json(res,404,{error:'not found'});
  res.writeHead(200,{'Content-Type':'image/'+(n.endsWith('.jpg')?'jpeg':n.split('.')[1]),'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'});return res.end(fs.readFileSync(path.join(UP,n)))}
 if(!p.startsWith('/api/'))return json(res,404,{error:'not found'});
 const r=p.slice(5);
 // ---- عام ----
 if(r==='settings'&&m==='GET')return json(res,200,settings());
 if(r==='me')return json(res,200,{user:authed(req)?(one('SELECT username FROM admin')||{}).username||null:null,setup:!one('SELECT 1 x FROM admin')});
 if(r==='order'&&m==='POST'){
  if(!limit('o'+ip,5,6e4))return json(res,429,{error:'حاول بعد دقيقة'});
  const d=await readBody(req),nd=x=>cl(x,20).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)),name=cl(d.name,80),phone=nd(d.phone),phone2=nd(d.phone2),gov=cl(d.governorate,30),address=cl(d.address,250),notes=cl(d.notes,300);
  if(d.website)return json(res,200,{ok:true,wa:'#'});
  if(name.length<2||phone.replace(/\D/g,'').length<8||address.length<5||!GOV.includes(gov)||(phone2&&phone2.replace(/\D/g,'').length<8))return json(res,400,{error:'من فضلك أكمل بياناتك بشكل صحيح'});
  const s=settings(),bs=Array.isArray(s.bundles)?s.bundles:[],b=bs.length?(bs[+d.bundle]||bs[0]):null,cur=s.currency||'';
  const qty=b?Math.max(1,+b.qty||1):Math.min(99,Math.max(1,parseInt(d.qty)||1)),sub=b?(+b.price||0):(+s.price||0)*qty,label=b?cl(b.label,60):'';
  const sh=s.shipping||{},v=(sh.byGov||{})[gov],ship=(+sh.free>0&&sub>=+sh.free)?0:(v===undefined||v===''?+sh.default||0:+v||0),total=sub+ship;
  const num=String(s.whatsapp||process.env.WHATSAPP||'').replace(/\D/g,'');
  const msg=`طلب جديد: ${s.productName||'المنتج'}${label?' ('+label+')':''}\nالاسم: ${name}\nالموبايل: ${phone}${phone2?'\nموبايل إضافي: '+phone2:''}\nالمحافظة: ${gov}\nالعنوان: ${address}\nالكمية: ${qty}\nسعر المنتج: ${sub} ${cur}\nالشحن: ${ship?ship+' '+cur:'مجاني'}\nالإجمالي: ${total} ${cur}${notes?'\nملاحظات: '+notes:''}`;
  const wa=`https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  if(!one("SELECT id FROM orders WHERE phone=? AND IFNULL(bundle,'')=? AND created_at>datetime('now','-10 minutes')",phone,label)){
   run('INSERT INTO orders(name,phone,phone2,governorate,address,qty,notes,bundle,shipping,total) VALUES(?,?,?,?,?,?,?,?,?,?)',name,phone,phone2,gov,address,qty,notes,label,ship,total);
   notify(msg);
  }
  return json(res,200,{ok:true,wa});
 }
 // ---- حساب الأدمن ----
 if(r==='setup'&&m==='POST'){
  if(one('SELECT 1 x FROM admin'))return json(res,403,{error:'الحساب موجود بالفعل'});
  const d=await readBody(req),un=cl(d.username,40),pw=String(d.password||'');
  if(un.length<3||pw.length<8)return json(res,400,{error:'اسم المستخدم 3 أحرف وكلمة المرور 8 أحرف على الأقل'});
  const salt=crypto.randomBytes(16).toString('hex');run('INSERT INTO admin VALUES(1,?,?,?)',un,salt,hash(pw,salt));
  return json(res,200,{ok:true},startSession());
 }
 if(r==='login'&&m==='POST'){
  if(!limit('l'+ip,8,9e5))return json(res,429,{error:'محاولات كتير، جرّب بعد ١٥ دقيقة'});
  const d=await readBody(req),a=one('SELECT * FROM admin');
  if(!a||d.username!==a.username||!same(hash(String(d.password||''),a.salt),a.hash))return json(res,401,{error:'بيانات الدخول غير صحيحة'});
  return json(res,200,{ok:true},startSession());
 }
 if(r==='logout'&&m==='POST'){const t=sid(req);if(t)run('DELETE FROM sessions WHERE token=?',t);return json(res,200,{ok:true},{'Set-Cookie':'sid=; Max-Age=0; Path=/'})}
 // ---- محمي ----
 if(!authed(req))return json(res,401,{error:'سجّل الدخول أولاً'});
 if(r==='settings'&&m==='PUT'){const d=await readBody(req);if(!d||typeof d!=='object'||Array.isArray(d))return json(res,400,{error:'بيانات غير صحيحة'});run("INSERT INTO settings VALUES('main',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",JSON.stringify(d));return json(res,200,{ok:true})}
 if(r==='orders'&&m==='GET')return json(res,200,all('SELECT * FROM orders ORDER BY id DESC LIMIT 3000'));
 if(/^orders\/\d+$/.test(r)&&m==='DELETE'){run('DELETE FROM orders WHERE id=?',+r.split('/')[1]);return json(res,200,{ok:true})}
 if(r==='upload'&&m==='POST'){const d=await readBody(req),mm=/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(d.data||'');if(!mm)return json(res,400,{error:'صيغة الصورة غير مدعومة'});
  const buf=Buffer.from(mm[2],'base64'),name=crypto.createHash('sha1').update(buf).digest('hex').slice(0,20)+'.'+(mm[1]==='jpeg'?'jpg':mm[1]);fs.mkdirSync(UP,{recursive:true});fs.writeFileSync(path.join(UP,name),buf);return json(res,200,{url:'/uploads/'+name})}
 if(r==='secrets'&&m==='GET'){const k=secrets();return json(res,200,{tgChat:k.tgChat||'',tgToken:k.tgToken?'set':''})}
 if(r==='secrets'&&m==='PUT'){const d=await readBody(req),k=secrets();run("INSERT INTO settings VALUES('secret',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",JSON.stringify({tgToken:cl(d.tgToken,120)||k.tgToken||'',tgChat:cl(d.tgChat,40)}));return json(res,200,{ok:true})}
 if(r==='notify-test'&&m==='POST')return json(res,200,await notify('✅ رسالة تجربة من لوحة التحكم'));
 if(/^orders\/\d+$/.test(r)&&m==='PATCH'){const d=await readBody(req);if(!STATUS.includes(d.status))return json(res,400,{error:'حالة غير صحيحة'});run('UPDATE orders SET status=? WHERE id=?',d.status,+r.split('/')[1]);return json(res,200,{ok:true})}
 if(r==='password'&&m==='POST'){
  const d=await readBody(req),a=one('SELECT * FROM admin'),np=String(d.new||'');
  if(!same(hash(String(d.old||''),a.salt),a.hash))return json(res,401,{error:'كلمة المرور الحالية غلط'});
  if(np.length<8)return json(res,400,{error:'كلمة المرور الجديدة قصيرة'});
  const salt=crypto.randomBytes(16).toString('hex');run('UPDATE admin SET salt=?,hash=? WHERE id=1',salt,hash(np,salt));return json(res,200,{ok:true});
 }
 json(res,404,{error:'not found'});
}catch(e){json(res,400,{error:e.message||'خطأ'})}}).listen(PORT,()=>console.log(`الموقع: http://localhost:${PORT}\nلوحة التحكم: http://localhost:${PORT}${ADMIN}`));
