const CFG=window.TL_CONFIG||{};
const sb=(CFG.SUPABASE_URL&&CFG.SUPABASE_KEY&&window.supabase)?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_KEY):null;
let user=null,mode="login";
const FROM_CONFIRM=(/type=(signup|email|invite)/.test(location.hash)||(/access_token=/.test(location.hash)&&!/type=recovery/.test(location.hash)));
const HASH_ERR=(location.hash.match(/error_description=([^&]+)/)||[])[1];
const GSVG='<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.600 1.200 9.100 3.500l6.800-6.800C35.800 2.400 30.300 0 24 0 14.600 0 6.500 5.400 2.600 13.200l7.900 6.100C12.400 13.600 17.700 9.500 24 9.500z"/><path fill="#4285F4" d="M46.500 24.500c0-1.600-.1-3.100-.4-4.500H24v9h12.700c-.6 3-2.300 5.500-4.800 7.200l7.600 5.900c4.400-4.100 7-10.100 7-17.600z"/><path fill="#FBBC05" d="M10.500 28.700c-.5-1.500-.8-3-.8-4.700s.3-3.200.8-4.700l-7.900-6.100C.9 16.500 0 20.100 0 24s.9 7.500 2.600 10.800l7.900-6.100z"/><path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.600-5.900c-2.100 1.400-4.900 2.300-8.300 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z"/></svg>';let confirmed=false;
const toast=(m)=>{const t=document.createElement("div");t.className="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3500)};
const E=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const R=n=>Number(n).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const STATUS={recebido:["Pedido recebido","Recebemos seu pedido com muito carinho 💖"],em_producao:["Em produção","Suas peças estão sendo feitas à mão."],embalado:["Embalado","Pronto e embaladinho para envio."],enviado:["Enviado","Já está a caminho de você."],entregue:["Entregue","Chegou! Esperamos que ame ✨"],cancelado:["Cancelado","Este pedido foi cancelado."]};
const FLOW=["recebido","em_producao","embalado","enviado","entregue"];
const needCfg=()=>`<div class="page c"><h1>Conta</h1><p>O login ainda não foi conectado. Preencha <b>SUPABASE_URL</b> e <b>SUPABASE_KEY</b> no arquivo <code>config.js</code> para ativar.</p></div>`;
const avUrl=u=>{const m=u?.user_metadata||{};return m.avatar_url||m.picture||""};
const avLetter=u=>((u?.user_metadata?.full_name||u?.user_metadata?.name||u?.email||"?").trim()[0]||"?").toUpperCase();
const avHTML=(u,c="av")=>avUrl(u)?`<img class="${c}" src="${E(avUrl(u))}" alt="" referrerpolicy="no-referrer">`:`<span class="${c}">${E(avLetter(u))}</span>`;
function navUser(){const a=document.getElementById("acctBtn");if(!a)return;
  a.innerHTML=user?`${avHTML(user)}<span class="avn">Minha conta</span>`:"Entrar";a.href=user?"#/conta":"#/entrar";a.setAttribute("aria-label",user?"Minha conta":"Entrar")}
if(HASH_ERR)setTimeout(()=>toast("Não foi possível entrar: "+decodeURIComponent(HASH_ERR.replace(/\+/g," "))),600);
if(sb){
  sb.auth.getSession().then(({data})=>{user=data.session?.user||null;navUser();window.route&&window.route()});
  sb.auth.onAuthStateChange((ev,s)=>{user=s?.user||null;navUser();if(ev==="PASSWORD_RECOVERY")location.hash="#/reset-password";else if(ev==="SIGNED_IN"&&FROM_CONFIRM&&!confirmed){confirmed=true;toast("Tudo certo! Bem-vinda 💖");location.hash="#/conta"}else if(ev==="SIGNED_OUT")window.route&&window.route()});
}
window.ACCOUNT={
  async entrar(el){
    if(!sb){el.innerHTML=needCfg();return}
    if(user){location.hash="#/conta";return}
    const t={login:"Entrar",signup:"Criar conta",forgot:"Recuperar senha"}[mode];
    el.innerHTML=`<div class="page c"><h1>${t}</h1>${mode!=="forgot"?`<button type="button" class="gbtn" id="gg">${GSVG}Continuar com Google</button><div class="or"><span>ou use seu email</span></div>`:""}<form id="af" class="form">
      ${mode==="signup"?`<label>Nome</label><input name="name" required>`:""}
      <label>Email</label><input name="email" type="email" required>
      ${mode!=="forgot"?`<label>Senha</label><input name="password" type="password" minlength="6" required>`:""}
      <p class="err" id="ae"></p><button class="btn">${t}</button></form>
      <p class="links">${mode!=="login"?`<a href="#" data-m="login">Já tenho conta</a>`:`<a href="#" data-m="signup">Criar conta</a> · <a href="#" data-m="forgot">Esqueci a senha</a>`}</p></div>`;
    const gg=el.querySelector("#gg");
    if(gg)gg.onclick=async()=>{gg.disabled=true;
      let r;try{r=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}})}catch(x){r={error:x}}
      if(r.error){gg.disabled=false;const m=r.error.message||"";toast(/not enabled|unsupported provider/i.test(m)?"O login com Google ainda não foi ativado.":"Não consegui abrir o Google. Tente de novo.")}};
    el.querySelectorAll("[data-m]").forEach(a=>a.onclick=e=>{e.preventDefault();mode=a.dataset.m;ACCOUNT.entrar(el)});
    el.querySelector("#af").onsubmit=async e=>{
      e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),err=el.querySelector("#ae"),btn=e.target.querySelector(".btn");let r;err.textContent="";btn.disabled=true;
      const back=location.origin+location.pathname;
      try{
      if(mode==="login")r=await sb.auth.signInWithPassword({email:f.email,password:f.password});
      else if(mode==="signup")r=await sb.auth.signUp({email:f.email,password:f.password,options:{emailRedirectTo:back,data:{full_name:f.name}}});
      else r=await sb.auth.resetPasswordForEmail(f.email,{redirectTo:back});
      }catch(x){r={error:{message:"Não consegui conectar. Tente de novo."}}}
      btn.disabled=false;
      if(r.error){const m=r.error.message||"";err.textContent=/rate limit|once every|security purposes/i.test(m)?"Muitos pedidos de e-mail seguidos. Aguarde 1 minuto e tente de novo.":/not authorized/i.test(m)?"O envio de e-mails ainda não está liberado para este endereço. Chame a gente no WhatsApp.":m;return}
      if(mode==="login"){toast("Bem-vinda de volta 💖");location.hash="#/conta"}
      else if(mode==="signup"){
        if(r.data?.session){toast("Conta criada! 💖");location.hash="#/conta";return}
        const em=E(f.email);
        el.innerHTML=`<div class="page c"><span class="kick">Quase lá</span><h1>Confira seu email</h1><p>Enviamos um link de confirmação para <b>${em}</b>. Depois de confirmar, <b>volte para este site</b> e entre com seu email e senha.</p><p><small>Não chegou? Veja a caixa de spam.</small></p><button class="btn" id="goLogin">Já confirmei, entrar</button></div>`;
        el.querySelector("#goLogin").onclick=()=>{mode="login";ACCOUNT.entrar(el)};
      }
      else toast("Se esse email tiver cadastro, enviamos o link. Veja também o spam.");
    };
  },
  async conta(el){
    if(!sb){el.innerHTML=needCfg();return}
    if(!user){location.hash="#/entrar";return}
    el.innerHTML='<div class="acc"><p class="acc-load">Carregando sua conta…</p></div>';
    const [pr,od]=await Promise.all([
      sb.from("profiles").select("*").eq("id",user.id).maybeSingle(),
      sb.from("orders").select("order_code,status,created_at").eq("user_id",user.id).order("created_at",{ascending:false})]);
    if(!user){return}
    const p=pr.data||{},orders=od.data||[],last=orders[0];
    const nome=(p.full_name||user.user_metadata?.full_name||"").trim(),first=nome.split(" ")[0];
    const since=new Date(user.created_at).toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
    let nf=0,nc=0;try{nf=fav.length;nc=cart.reduce((a,i)=>a+i.quantity,0)}catch{}
    const F=(k,l,x={})=>`<div class="fld${x.full?" full":""}"><label for="f_${k}">${l}</label><input id="f_${k}" name="${k}" value="${E(p[k])}" ${x.attr||""}></div>`;
    el.innerHTML=`<div class="acc">
      <div class="acc-h"><div class="avwrap"><button type="button" class="avbtn" id="avBtn" aria-label="Alterar foto">${avHTML(user,"avatar")}<span class="cam" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-2h6l2 2h3v11H4zM12 17a3.500 3.500 0 100-7 3.500 3.500 0 000 7z"/></svg></span></button><input type="file" id="avFile" accept="image/*" hidden></div>
        <div class="acc-t"><span class="kick">Minha conta</span><h1>${first?`Olá, ${E(first)}!`:"Olá!"}</h1><p>${E(user.email)}<br><small>Cliente desde ${since}</small>${user.user_metadata?.avatar_url?`<br><button type="button" class="lnk" id="avRm">Remover foto</button>`:""}</p></div>
        <button class="pill" id="so">Sair</button></div>
      <div class="acc-cards">
        <a class="acard" href="#/pedidos"><b>${orders.length}</b><span>${orders.length===1?"pedido":"pedidos"}</span><small>${last?`Último: ${(STATUS[last.status]||[last.status])[0]}`:"Nenhum ainda"}</small></a>
        <a class="acard" href="#/" id="goFav"><b>${nf}</b><span>${nf===1?"favorito":"favoritos"}</span><small>Ver meus favoritos</small></a>
        <a class="acard" href="#/" id="goCart"><b>${nc}</b><span>${nc===1?"item":"itens"} no carrinho</span><small>Abrir carrinho</small></a>
      </div>
      <section class="acc-box"><h2>Meus dados</h2><p>Usamos para agilizar seus pedidos pelo WhatsApp.</p>
        <form id="pf2" class="grid2">${F("full_name","Nome completo",{full:1,attr:'autocomplete="name"'})}${F("phone","Telefone / WhatsApp",{attr:'type="tel" inputmode="tel" autocomplete="tel" placeholder="(85) 90000-0000"'})}${F("zip_code","CEP",{attr:'inputmode="numeric" autocomplete="postal-code" placeholder="00000-000"'})}${F("city","Cidade",{attr:'autocomplete="address-level2"'})}${F("address","Endereço",{attr:'autocomplete="street-address" placeholder="Rua, número, bairro"'})}
        <button class="btn full" id="sv">Salvar meus dados</button></form></section>
      <section class="acc-box"><h2>Senha</h2><p>Troque quando quiser, sem precisar de email.</p>
        <form id="pw" class="grid2"><div class="fld"><label for="np">Nova senha</label><input id="np" type="password" minlength="6" autocomplete="new-password" required></div><div class="fld"><label for="np2">Repita a senha</label><input id="np2" type="password" minlength="6" autocomplete="new-password" required></div>
        <p class="err full" id="pe"></p><button class="pill full">Atualizar senha</button></form></section>
      <section class="acc-box danger"><h2>Excluir conta</h2><p>Apaga seu cadastro e seus dados. Os pedidos já feitos ficam guardados para o estúdio. Não dá para desfazer.</p><button type="button" class="dang" id="delBtn">Excluir minha conta</button></section>
    </div>`;
    const toBlob=f=>new Promise((res,rej)=>{const im=new Image(),u=URL.createObjectURL(f);im.onload=()=>{const s=Math.min(im.width,im.height),c=document.createElement("canvas");c.width=c.height=320;c.getContext("2d").drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,320,320);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(new Error("img")),"image/jpeg",.85)};im.onerror=()=>rej(new Error("img"));im.src=u});
    const setMeta=async url=>{const r=await sb.auth.updateUser({data:{avatar_url:url}});if(r.error)throw r.error;if(r.data?.user)user=r.data.user;navUser()};
    const fi=el.querySelector("#avFile");el.querySelector("#avBtn").onclick=()=>fi.click();
    fi.onchange=async()=>{const f=fi.files[0];if(!f)return;if(!f.type.startsWith("image/")){toast("Escolha uma imagem.");return}
      try{const b=await toBlob(f),path=`${user.id}/avatar.jpg`;
        const up=await sb.storage.from("avatars").upload(path,b,{upsert:true,contentType:"image/jpeg"});if(up.error)throw up.error;
        await setMeta(sb.storage.from("avatars").getPublicUrl(path).data.publicUrl+"?v="+Date.now());toast("Foto atualizada 💖");ACCOUNT.conta(el)}
      catch(x){toast("Não consegui enviar a foto. O armazenamento de fotos ainda não foi ativado.")}};
    const rm=el.querySelector("#avRm");if(rm)rm.onclick=async()=>{try{await sb.storage.from("avatars").remove([`${user.id}/avatar.jpg`]);await setMeta("");toast("Foto removida.");ACCOUNT.conta(el)}catch{toast("Não consegui remover a foto.")}};
    el.querySelector("#delBtn").onclick=()=>{const w=document.createElement("div");w.className="sheet-bg";
      w.innerHTML=`<div class="sheet" role="dialog" aria-modal="true"><h3>Excluir sua conta?</h3><p>Seu cadastro e seus dados serão apagados para sempre. Os pedidos já feitos ficam guardados para o estúdio.</p><label for="dc" class="dl">Digite <b>EXCLUIR</b> para confirmar</label><input id="dc" autocomplete="off"><p class="err" id="de"></p><div class="srow"><button class="pill" data-x>Cancelar</button><button class="btn dang2" data-ok disabled>Excluir de vez</button></div></div>`;
      document.body.appendChild(w);const close=()=>w.remove(),ok=w.querySelector("[data-ok]"),inp=w.querySelector("#dc");
      w.onclick=e=>{if(e.target===w)close()};w.querySelector("[data-x]").onclick=close;
      inp.oninput=()=>{ok.disabled=inp.value.trim().toUpperCase()!=="EXCLUIR"};
      ok.onclick=async()=>{ok.disabled=true;ok.textContent="Excluindo…";const de=w.querySelector("#de");de.textContent="";
        try{await sb.storage.from("avatars").remove([`${user.id}/avatar.jpg`])}catch{}
        const {error}=await sb.rpc("delete_my_account");
        if(error){ok.disabled=false;ok.textContent="Excluir de vez";de.textContent=/function|schema cache|could not find/i.test(error.message)?"A exclusão ainda não foi ativada no banco. Chame a gente no WhatsApp.":error.message;return}
        try{await sb.auth.signOut()}catch{}user=null;navUser();close();toast("Conta excluída. Obrigada por ter passado por aqui 💖");location.hash="#/"}};
    el.querySelector("#so").onclick=async()=>{await sb.auth.signOut();toast("Você saiu da conta.");location.hash="#/"};
    el.querySelector("#goFav").onclick=()=>setTimeout(()=>document.getElementById("favBtn").click(),90);
    el.querySelector("#goCart").onclick=e=>{e.preventDefault();location.hash="#/";setTimeout(()=>document.getElementById("cartBtn").click(),90)};
    const zip=el.querySelector("#f_zip_code");
    zip.onblur=async()=>{const c=zip.value.replace(/\D/g,"");if(c.length!==8)return;
      try{const r=await(await fetch(`https://viacep.com.br/ws/${c}/json/`)).json();if(r.erro)return;
        const ci=el.querySelector("#f_city"),ad=el.querySelector("#f_address");
        if(!ci.value)ci.value=r.localidade||"";if(!ad.value)ad.value=[r.logradouro,r.bairro].filter(Boolean).join(", ")}catch{}};
    el.querySelector("#pf2").onsubmit=async e=>{e.preventDefault();const b=el.querySelector("#sv");b.disabled=true;b.textContent="Salvando…";
      const {error}=await sb.from("profiles").upsert({id:user.id,...Object.fromEntries(new FormData(e.target))});
      b.disabled=false;b.textContent="Salvar meus dados";toast(error?"Não consegui salvar: "+error.message:"Dados salvos 💖")};
    el.querySelector("#pw").onsubmit=async e=>{e.preventDefault();const a=el.querySelector("#np").value,c=el.querySelector("#np2").value,pe=el.querySelector("#pe");pe.textContent="";
      if(a!==c){pe.textContent="As senhas não são iguais.";return}
      const {error}=await sb.auth.updateUser({password:a});if(error){pe.textContent=error.message;return}e.target.reset();toast("Senha atualizada 💖")};
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
