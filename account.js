const CFG=window.TL_CONFIG||{};
const sb=(CFG.SUPABASE_URL&&CFG.SUPABASE_KEY&&window.supabase)?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_KEY):null;
let user=null,mode="login";
const toast=(m)=>{const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3500)};
const E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const R=n=>Number(n).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const STATUS={recebido:["Pedido recebido","Recebemos seu pedido com muito carinho 💖"],em_producao:["Em produção","Suas peças estão sendo feitas à mão."],embalado:["Embalado","Pronto e embaladinho para envio."],enviado:["Enviado","Já está a caminho de você."],entregue:["Entregue","Chegou! Esperamos que ame ✨"],cancelado:["Cancelado","Este pedido foi cancelado."]};
const FLOW=["recebido","em_producao","embalado","enviado","entregue"];
const needCfg=()=>`<div class="page c"><h1>Conta</h1><p>O login ainda não foi conectado. Preencha <b>SUPABASE_URL</b> e <b>SUPABASE_KEY</b> no arquivo <code>config.js</code> para ativar.</p></div>`;
function navUser(){const a=document.getElementById("acctBtn");if(a){a.textContent=user?"👤 Minha conta":"Entrar";a.href=user?"#/conta":"#/entrar"}}
if(sb){
  sb.auth.getSession().then(({data})=>{user=data.session?.user||null;navUser();window.route&&window.route()});
  sb.auth.onAuthStateChange((ev,s)=>{user=s?.user||null;navUser();if(ev==="PASSWORD_RECOVERY")location.hash="#/reset-password";else if(ev==="SIGNED_OUT")window.route&&window.route()});
}
window.ACCOUNT={
  async entrar(el){
    if(!sb){el.innerHTML=needCfg();return}
    if(user){location.hash="#/conta";return}
    const t={login:"Entrar",signup:"Criar conta",forgot:"Recuperar senha"}[mode];
    el.innerHTML=`<div class="page c"><h1>${t}</h1><form id="af" class="form">
      ${mode==="signup"?`<label>Nome</label><input name="name" required>`:""}
      <label>Email</label><input name="email" type="email" required>
      ${mode!=="forgot"?`<label>Senha</label><input name="password" type="password" minlength="6" required>`:""}
      <p class="err" id="ae"></p><button class="btn">${t}</button></form>
      <p class="links">${mode!=="login"?`<a href="#" data-m="login">Já tenho conta</a>`:`<a href="#" data-m="signup">Criar conta</a> · <a href="#" data-m="forgot">Esqueci a senha</a>`}</p></div>`;
    el.querySelectorAll("[data-m]").forEach(a=>a.onclick=e=>{e.preventDefault();mode=a.dataset.m;ACCOUNT.entrar(el)});
    el.querySelector("#af").onsubmit=async e=>{
      e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),err=el.querySelector("#ae");let r;
      const back=location.origin+location.pathname;
      if(mode==="login")r=await sb.auth.signInWithPassword({email:f.email,password:f.password});
      else if(mode==="signup")r=await sb.auth.signUp({email:f.email,password:f.password,options:{emailRedirectTo:back,data:{full_name:f.name}}});
      else r=await sb.auth.resetPasswordForEmail(f.email,{redirectTo:back});
      if(r.error){err.textContent=r.error.message;return}
      if(mode==="login"){toast("Bem-vinda de volta 💖");location.hash="#/conta"}
      else toast(mode==="signup"?"Cadastro realizado. Confira seu email.":"Enviamos um link para o seu email.");
    };
  },
  async conta(el){
    if(!sb){el.innerHTML=needCfg();return}
    if(!user){location.hash="#/entrar";return}
    const {data}=await sb.from("profiles").select("*").eq("id",user.id).maybeSingle();const p=data||{};
    const F=(k,l)=>`<label>${l}</label><input name="${k}" value="${E(p[k])}">`;
    el.innerHTML=`<div class="page c"><h1>Minha conta</h1><p>${E(user.email)}</p><form id="pf2" class="form">${F("full_name","Nome completo")}${F("phone","Telefone")}${F("city","Cidade")}${F("zip_code","CEP")}${F("address","Endereço")}<button class="btn">Salvar perfil</button></form>
      <p class="links"><a href="#/pedidos">Meus pedidos</a> · <a href="#" id="so">Sair</a></p></div>`;
    el.querySelector("#pf2").onsubmit=async e=>{e.preventDefault();const {error}=await sb.from("profiles").upsert({id:user.id,...Object.fromEntries(new FormData(e.target))});toast(error?error.message:"Perfil salvo 💖")};
    el.querySelector("#so").onclick=async e=>{e.preventDefault();await sb.auth.signOut();location.hash="#/"};
  },
  async pedidos(el){
    if(!sb){el.innerHTML=needCfg();return}
    if(!user){location.hash="#/entrar";return}
    const {data,error}=await sb.from("orders").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
    if(error){el.innerHTML=`<div class="page c"><p class="err">${E(error.message)}</p></div>`;return}
    el.innerHTML=`<div class="page"><h1>Meus pedidos</h1><p>Acompanhe o status e o código de rastreio.</p>${(data||[]).length?data.map(o=>{
      const m=STATUS[o.status]||[o.status,""],i=FLOW.indexOf(o.status);
      return `<div class="order"><div class="oh"><b>${E(o.order_code)}</b><span>${new Date(o.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})}</span><b class="price">${R(o.total)}</b></div>
      <p><b>${m[0]}</b> — ${m[1]}</p>${o.status!=="cancelado"?`<div class="flow">${FLOW.map((s,k)=>`<span class="${k<=i?"on":""}">${STATUS[s][0]}</span>`).join("")}</div>`:""}
      <ul>${(o.items||[]).map(x=>`<li>${E(x.productName)}${x.variationName?` — ${E(x.variationName)}`:""} × ${x.quantity||1}</li>`).join("")}</ul>
      ${o.tracking_code?`<p>Rastreio: <b>${E(o.tracking_code)}</b>${o.tracking_url?` · <a href="${E(o.tracking_url)}" target="_blank" rel="noopener">acompanhar</a>`:""}</p>`:""}</div>`}).join(""):"<p>Você ainda não tem pedidos. 🌙</p>"}</div>`;
  },
  reset(el){
    if(!sb){el.innerHTML=needCfg();return}
    el.innerHTML=`<div class="page c"><h1>Nova senha</h1><form id="rf" class="form"><label>Nova senha</label><input type="password" name="p" minlength="6" required><button class="btn">Atualizar</button></form></div>`;
    el.querySelector("#rf").onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.updateUser({password:new FormData(e.target).get("p")});toast(error?error.message:"Senha atualizada!");if(!error)location.hash="#/conta"};
  }
};
