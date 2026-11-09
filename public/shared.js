const $=s=>document.querySelector(s);
const LOGO=c=>'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="${c}"/><path d="M12 28v-4a12 12 0 0 1 24 0v4" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><rect x="9" y="27" width="8" height="12" rx="3" fill="#fff"/><rect x="31" y="27" width="8" height="12" rx="3" fill="#fff"/></svg>`);
const logoSrc=()=>S.logoImg||LOGO(S.colors.primary);
const GOV=["القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "البحيرة", "المنوفية", "الغربية", "كفر الشيخ", "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح"];
const svg=(e,a,b)=>'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/><circle cx="300" cy="300" r="190" fill="#fff" fill-opacity=".14"/><text x="300" y="370" font-size="220" text-anchor="middle">${e}</text></svg>`);
const DEF={
 siteName:'نبض',logo:'🎧',logoImg:'',
 heroTitle:'صوت صافي من غير أي أسلاك',
 heroSub:'سماعة نبض اللاسلكية بخاصية عزل الضوضاء وبطارية تكفي ٤٠ ساعة تشغيل.',
 badge:'عرض لفترة محدودة',
 productName:'سماعة نبض برو',
 desc:'سماعة بلوتوث بتصميم مريح وصوت نقي، مناسبة للشغل والرياضة والسفر. شحن سريع ١٠ دقايق يديك ٥ ساعات تشغيل.',
 price:1499,oldPrice:2199,currency:'ج.م',
 cta:'اطلب الآن',whatsapp:'201000000000',
 featTitle:'ليه تختار نبض برو؟',
 features:[
  {icon:'🔇',title:'عزل ضوضاء فعّال',text:'يقلل أصوات المواصلات والمكتب بنسبة تصل إلى ٩٥٪.'},
  {icon:'🔋',title:'بطارية ٤٠ ساعة',text:'تشغيل متواصل لأسبوع كامل مع شحن سريع.'},
  {icon:'💧',title:'مقاومة للعرق',text:'معتمدة IPX5 للتمارين والجري.'},
  {icon:'📶',title:'بلوتوث ٥.٣',text:'اتصال ثابت وبدون تأخير في الصوت.'}],
 galTitle:'معرض الصور',
 images:[svg('🎧','#0e7c86','#12262b'),svg('🔊','#ff5a36','#7a1f0c'),svg('🔋','#0e7c86','#5fc2c9'),svg('🎵','#2b3a67','#0e7c86')],
 countdown:{on:true,end:new Date(Date.now()+3*864e5).toISOString(),title:'العرض ينتهي خلال',after:'انتهى العرض'},
 form:{title:'اطلب الآن والدفع عند الاستلام',btn:'تأكيد الطلب',ok:'تم استلام طلبك! هنحولك على واتساب لتأكيده.'},
 bundles:[{label:'قطعة واحدة',qty:1,price:1499},{label:'قطعتين (وفّر أكتر)',qty:2,price:2699},{label:'٣ قطع',qty:3,price:3799}],
 shipping:{default:60,free:0,byGov:{}},
 stock:{on:true,left:7,text:'باقي {n} قطع فقط!'},
 trust:[{icon:'💵',text:'الدفع عند الاستلام'},{icon:'🛡',text:'ضمان سنة كاملة'},{icon:'↩️',text:'استرجاع خلال ١٤ يوم'}],
 revTitle:'آراء عملائنا',
 reviews:[{name:'محمد أحمد',text:'الصوت نقي والبطارية فعلاً بتعدي الأسبوع.',stars:5},{name:'سارة علي',text:'مريحة جداً ومناسبة للجيم.',stars:5},{name:'كريم حسن',text:'التوصيل كان سريع والمنتج مطابق للوصف.',stars:4}],
 faqTitle:'أسئلة شائعة',
 faq:[{q:'هل الدفع عند الاستلام متاح؟',a:'أيوه، بتدفع للمندوب بعد ما تعاين المنتج.'},{q:'مدة التوصيل؟',a:'من ٢ لـ ٤ أيام عمل حسب المحافظة.'},{q:'هل فيه ضمان؟',a:'ضمان سنة ضد عيوب الصناعة.'}],
 video:'',
 track:{fb:'',tt:'',ga:''},
 colors:{primary:'#0e7c86',accent:'#ff5a36',bg:'#eef3f4',text:'#12262b',card:'#ffffff'},
 footerText:'جميع الحقوق محفوظة. شحن لكل المحافظات وضمان سنة كاملة.',
 phone:'0100 000 0000',email:'hello@nabd.example',
 links:[{t:'الشروط والأحكام',u:'#'},{t:'سياسة الاسترجاع',u:'#'}]
};
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(m){alert(m)}
function applyColors(){const r=document.documentElement.style,c=S.colors;for(const k in c)r.setProperty('--'+k,c[k]);document.title=S.siteName+' | '+S.productName;let l=document.querySelector('link[rel=icon]');if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l)}l.href=logoSrc()}
const fmt=n=>Number(n||0).toLocaleString('ar-EG');
let S=structuredClone(DEF);
async function loadSettings(){try{const r=await fetch('/api/settings');S=Object.assign(structuredClone(DEF),await r.json())}catch(e){}applyColors()}

const shipFor=(g,sub)=>{const s=S.shipping||{};if(+s.free>0&&sub>=+s.free)return 0;const v=(s.byGov||{})[g];return v===undefined||v===''?+s.default||0:+v||0};
