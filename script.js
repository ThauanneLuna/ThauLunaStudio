const {products,categories,boxThemes,paletteColors}=window.DATA;
const WA="5585987511775";
const brl=n=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const $=id=>document.getElementById(id);
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let cart=load("tl_cart",[]),fav=load("tl_fav",[]),onlyFav=false;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const from=p=>Math.min(...p.variations.map(v=>v.price));
const lineTotal=(p,v,q)=>p.extraUnit!=null&&p.minQuantity?v.price+Math.max(0,q-p.minQuantity)*(v.extra??p.extraUnit):v.price*q;
const T=i=>i.total??i.unitPrice*i.quantity;
const isPack=i=>{const p=products.find(x=>x.slug===i.slug);return !!(p&&p.extraUnit!=null)};
const open=(el)=>{el.hidden=false;$("overlay").hidden=false};
const closeAll=()=>{["modal","drawer","overlay"].forEach(i=>$(i).hidden=true)};
$("overlay").onclick=closeAll;
document.addEventListener("keydown",e=>e.key==="Escape"&&closeAll());

const SIZES=["PP","P","M","G","GG"];
const typeOf=p=>/pulseira/.test(p.slug)?"Pulseiras":/chaveiro/.test(p.slug)?"Chaveiros":/box/.test(p.slug)?"Boxes":/polaroid/.test(p.slug)?"Polaroids":"Papelaria";
const sizeOf=p=>{const c=p.customizations.find(x=>x.key==="tamanho"&&x.options);const o=c?c.options.map(x=>x.split(" ")[0]):[];const n=p.name.match(/Mini|Big|Tradicional/);return n?[n[0]]:o};
const hasTheme=p=>p.customizations.some(c=>c.type==="theme"||c.key==="tema");
const hasColor=p=>p.customizations.some(c=>c.type==="color");
const F=()=>{const q=new URLSearchParams(location.search);return{q:q.get("q")||"",cat:q.get("cat")||"",tipo:q.get("tipo")||"",tamanho:q.get("tamanho")||"",tema:q.get("tema")||"",cor:q.get("cor")||"",ordem:q.get("ordem")||"relevancia"}};
function setF(k,v){const q=new URLSearchParams(location.search);v&&v!=="relevancia"?q.set(k,v):q.delete(k);history.replaceState(null,"",location.pathname+(q.toString()?"?"+q:"")+location.hash);render()}
function filtros(f){
  const types=[...new Set(products.map(typeOf))],sizes=[...SIZES,"Mini","Tradicional","Big"];
  const sel=(k,l,o)=>`<label class="ff"><span>${l}</span><select data-f="${k}"><option value="">Todos</option>${o.map(x=>`<option ${f[k]===x?"selected":""}>${esc(x)}</option>`).join("")}</select></label>`;
  $("filtros").innerHTML=sel("tipo","Tipo",types)+sel("tamanho","Tamanho",sizes)+sel("tema","Tema",boxThemes.filter(t=>t!=="Criar outro tema"))+sel("cor","Cor",paletteColors);
  $("filtros").querySelectorAll("select").forEach(el=>el.onchange=()=>setF(el.dataset.f,el.value));
}
const IC={"":'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',presentes:'<path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-3 0-4.500-3-2-3.500 2-.4 2 2.500 2 3.500zm0 0c3 0 4.500-3 2-3.500-2-.4-2 2.500-2 3.500z"/>',boxes:'<path d="M3 8l9-4 9 4v9l-9 4-9-4zM3 8l9 4 9-4M12 12v9"/>',acessorios:'<path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM18 16l.8 2.200L21 19l-2.200.8L18 22l-.8-2.200L15 19l2.200-.8z"/>'};
function chips(f){
  const items=[["","Todos"],...categories.map(c=>[c.slug,c.label])];
  $("chips").innerHTML=items.map(([s,l])=>`<button class="${s===f.cat&&!onlyFav?"on":""}" data-c="${s}"><span class="ico"><svg viewBox="0 0 24 24">${IC[s]||IC[""]}</svg></span>${l}</button>`).join("");
  $("chips").querySelectorAll("button").forEach(b=>b.onclick=()=>{onlyFav=false;setF("cat",b.dataset.c)});
}
function render(){
  const f=F();chips(f);filtros(f);
  if(document.activeElement!==$("q"))$("q").value=f.q;
  $("sort").value=f.ordem;
  let list=products.filter(p=>(onlyFav?fav.includes(p.slug):(!f.cat||p.categories.includes(f.cat)))
    &&(!f.q||(p.name+" "+p.tagline).toLowerCase().includes(f.q.toLowerCase()))
    &&(!f.tipo||typeOf(p)===f.tipo)&&(!f.tamanho||sizeOf(p).includes(f.tamanho))
    &&(!f.tema||hasTheme(p))&&(!f.cor||hasColor(p)));
  if(f.ordem==="menor")list.sort((a,b)=>from(a)-from(b));
  if(f.ordem==="maior")list.sort((a,b)=>from(b)-from(a));
  if(f.ordem==="nome")list.sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  $("count").textContent=`${list.length} ${list.length===1?"peça encontrada":"peças encontradas"}`;
  $("grid").innerHTML=list.map(p=>`<article class="card" data-s="${p.slug}">
    <div class="ph"><img src="${p.images?.[0]||"img/logo.png"}" alt="${esc(p.name)}" loading="lazy"><span class="badge">${typeOf(p)}</span>
    <button class="heart ${fav.includes(p.slug)?"on":""}" data-h="${p.slug}" aria-label="Favoritar">${fav.includes(p.slug)?"♥":"♡"}</button></div>
    <div class="b"><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p><div class="pr"><span class="price"><small>a partir de</small>${brl(from(p))}</span><span class="add" aria-hidden="true">+</span></div></div></article>`).join("");
  $("empty").hidden=list.length>0;
  $("grid").querySelectorAll(".card").forEach(c=>c.onclick=e=>{
    if(e.target.dataset.h){toggleFav(e.target.dataset.h);return}
    showProduct(c.dataset.s)});
  $("favCount").textContent=fav.length;
  $("cartCount").textContent=cart.reduce((a,i)=>a+i.quantity,0);
}
$("q").oninput=e=>{clearTimeout(window._t);window._t=setTimeout(()=>setF("q",e.target.value),300)};
$("sort").onchange=e=>setF("ordem",e.target.value);
$("filtBtn").onclick=()=>{const o=$("filtros").hidden;$("filtros").hidden=!o;$("filtBtn").setAttribute("aria-expanded",o)};
$("clear").onclick=()=>{history.replaceState(null,"",location.pathname+location.hash);render()};
$("copyLink").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$("copyLink").textContent="Copiado ✓"}catch{$("copyLink").textContent="Copie da barra"}setTimeout(()=>$("copyLink").textContent="Copiar link",1800)};
$("bnFav").onclick=()=>$("favBtn").click();$("bnCart").onclick=()=>$("cartBtn").click();
function toggleFav(s){fav=fav.includes(s)?fav.filter(x=>x!==s):[...fav,s];save("tl_fav",fav);render()}
$("favBtn").onclick=()=>{onlyFav=!onlyFav;render();scrollTo({top:0,behavior:"smooth"})};

function showProduct(slug){
  const p=products.find(x=>x.slug===slug),min=p.minQuantity||1;
  const f=p.customizations.map(c=>{
    const n=`c_${c.key}`,opt=c.optional||c.type==="color";
    const lab=`${esc(c.label)}${opt?"":" *"}`;
    if(c.type==="text")return`<div class="field"><label>${lab}</label><input name="${n}" maxlength="${c.maxLength||200}" placeholder="${esc(c.placeholder||"")}"></div>`;
    if(c.type==="color")return`<div class="field"><b>${lab}</b><div class="cols">${paletteColors.map(x=>`<label><input type="${c.multi?"checkbox":"radio"}" name="${n}" value="${x}">${x}</label>`).join("")}</div></div>`;
    const o=c.type==="theme"?boxThemes:c.options;
    return`<div class="field"><label>${lab}</label><select name="${n}"><option value="">Selecione…</option>${o.map(x=>`<option>${esc(x)}</option>`).join("")}</select></div>`}).join("");
  $("modal").innerHTML=`<button class="x" id="mx" aria-label="Fechar">✕</button>
   <img class="main" src="${p.images?.[0]||"img/logo.png"}" alt="${esc(p.name)}">
   <h2>${esc(p.name)}</h2><p>${esc(p.description)}</p>
   ${p.highlights?`<ul>${p.highlights.map(h=>`<li>${esc(h)}</li>`).join("")}</ul>`:""}
   <form id="pf"><div class="field"><b>Opção *</b>${p.variations.map((v,i)=>`<label class="opt"><input type="radio" name="v" value="${v.id}" ${i===0?"checked":""}><span>${esc(v.name)} — <b class="price">${brl(v.price)}</b>${v.description?`<small>${esc(v.description)}</small>`:""}</span></label>`).join("")}</div>
   ${f}
   ${p.includes?`<p><b>Inclui:</b> ${p.includes.map(esc).join(" · ")}</p>`:""}
   <div class="field"><label>Observações (opcional)</label><textarea name="notes" rows="2"></textarea></div>
   ${p.photosViaWhatsApp?`<p><small>📸 ${esc(p.photosViaWhatsApp)}</small></p>`:""}
   <div class="field"><b>Quantidade${min>1?` (mínimo ${min})`:""}</b><span class="qty"><button type="button" id="qm">−</button><b id="qv">${min}</b><button type="button" id="qp">+</button></span></div>
   <p class="tot">Total: <b id="tp"></b>${p.extraUnit!=null?` <small id="tn"></small>`:""}</p>
   <p class="err" id="err"></p><button class="btn" type="submit">Adicionar ao carrinho</button></form>`;
  let q=min;
  const upd=()=>{const v=p.variations.find(x=>x.id===new FormData($("pf")).get("v"));$("tp").textContent=brl(lineTotal(p,v,q));if($("tn"))$("tn").textContent=`(${min} unidades + ${brl(v.extra??p.extraUnit)} por unidade extra)`};
  $("qm").onclick=()=>{q=Math.max(min,q-1);$("qv").textContent=q;upd()};
  $("qp").onclick=()=>{q++;$("qv").textContent=q;upd()};
  $("pf").querySelectorAll("[name=v]").forEach(r=>r.onchange=upd);upd();
  $("mx").onclick=closeAll;
  $("pf").onsubmit=e=>{
    e.preventDefault();const fd=new FormData(e.target),custom={};
    for(const c of p.customizations){
      const vals=fd.getAll(`c_${c.key}`).map(s=>String(s).trim()).filter(Boolean);
      if(!vals.length&&!(c.optional||c.type==="color")){$("err").textContent=`Preencha: ${c.label}`;return}
      if(vals.length)custom[c.label]=vals.join(", ");
    }
    const v=p.variations.find(x=>x.id===fd.get("v"));
    cart.push({id:Date.now(),slug:p.slug,productName:p.name,variationName:v.name,unitPrice:v.price,quantity:q,total:lineTotal(p,v,q),customizations:custom,notes:String(fd.get("notes")||"").trim(),photos:!!p.photosViaWhatsApp});
    save("tl_cart",cart);render();showCart();
  };
  open($("modal"));
}

function showCart(){
  const total=cart.reduce((a,i)=>a+T(i),0);
  $("cartItems").innerHTML=cart.length?cart.map(i=>`<div class="ci"><b>${esc(i.productName)}</b> — ${esc(i.variationName)}
    ${Object.entries(i.customizations).map(([k,v])=>`<small>${esc(k)}: ${esc(v)}</small>`).join("")}
    ${i.notes?`<small>Obs: ${esc(i.notes)}</small>`:""}
    <div><span class="qty"><button data-d="${i.id}:-1">−</button>${i.quantity}<button data-d="${i.id}:1">+</button></span> · ${brl(T(i))} · <button class="rm" data-r="${i.id}">remover</button></div></div>`).join(""):"<p>Seu carrinho está vazio.</p>";
  $("cartFoot").innerHTML=cart.length?`<p><b>Total: ${brl(total)}</b></p>
    <div class="field"><label>Seu nome *</label><input id="fn"></div>
    <div class="field"><label>Cidade / CEP *</label><input id="fc"></div>
    <div class="field"><label>Observações gerais</label><textarea id="fo" rows="2"></textarea></div>
    <p class="err" id="ferr"></p><a class="btn" id="send" href="#">Finalizar pelo WhatsApp</a>`:"";
  $("cartItems").querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{const[id,d]=b.dataset.d.split(":");const it=cart.find(x=>x.id==id);const pr=products.find(x=>x.slug===it.slug),vv=pr.variations.find(x=>x.name===it.variationName);it.quantity=Math.max(pr.minQuantity||1,it.quantity+ +d);it.total=lineTotal(pr,vv,it.quantity);save("tl_cart",cart);render();showCart()});
  $("cartItems").querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{cart=cart.filter(x=>x.id!=b.dataset.r);save("tl_cart",cart);render();showCart()});
  if(cart.length)$("send").onclick=e=>{
    e.preventDefault();const n=$("fn").value.trim(),c=$("fc").value.trim();
    if(!n||!c){$("ferr").textContent="Informe seu nome e cidade/CEP.";return}
    const L=["*🌙 Novo pedido — Thau Luna Studio*","",`*Nome:* ${n}`,`*Cidade / CEP:* ${c}`];
    if($("fo").value.trim())L.push(`*Observações gerais:* ${$("fo").value.trim()}`);
    L.push("","*Produtos:*");
    cart.forEach((i,k)=>{L.push(`\n${k+1}. ${i.productName} — ${i.variationName}`,`   Quantidade: ${i.quantity}`,isPack(i)?`   Valor: ${brl(T(i))} (${products.find(x=>x.slug===i.slug).minQuantity} un. + ${brl(products.find(x=>x.slug===i.slug).variations.find(x=>x.name===i.variationName).extra??products.find(x=>x.slug===i.slug).extraUnit)} por unidade extra)`:`   Valor unitário: ${brl(i.unitPrice)}`,`   Subtotal: ${brl(T(i))}`);
      const cs=Object.entries(i.customizations).map(([k,v])=>`    • ${k}: ${v}`).join("\n");
      if(cs)L.push(`   Personalizações:\n${cs}`);if(i.notes)L.push(`   Observações: ${i.notes}`)});
    L.push("",`*Total:* ${brl(total)}`);
    const ph=cart.filter(i=>i.photos);
    if(ph.length){L.push("","*📸 Fotos que vou enviar nesta conversa:*");ph.forEach(i=>L.push(`• ${i.productName} — ${i.variationName}: ${i.quantity} foto(s)`))}
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(L.join("\n"))}`,"_blank");
  };
  open($("drawer"));
}
$("cartBtn").onclick=showCart;$("closeCart").onclick=closeAll;
render();

/* ---- Rotas (hash) ---- */
window.route=function(){
  const h=decodeURIComponent(location.hash||""),r=h.startsWith("#/")?h.slice(2).replace(/\/$/,""):"";
  const home=document.getElementById("home"),v=document.getElementById("view");
  closeAll();
  if(!r){home.hidden=false;v.hidden=true;document.title="Thau Luna Studio — Onde cada detalhe conta!";return}
  home.hidden=true;v.hidden=false;scrollTo(0,0);
  const A=window.ACCOUNT,acc={entrar:A.entrar,conta:A.conta,pedidos:A.pedidos,"reset-password":A.reset};
  if(acc[r])acc[r](v);
  else if(window.PAGES[r])v.innerHTML=window.PAGES[r];
  else v.innerHTML='<div class="page c"><h1>Página não encontrada</h1><p><a href="#/">Voltar ao catálogo</a></p></div>';
};
addEventListener("hashchange",window.route);
window.route();

/* ---- Menu hambúrguer (celular) ---- */
(()=>{const b=document.getElementById("menuBtn"),n=document.getElementById("nav");
const set=o=>{n.classList.toggle("open",o);b.setAttribute("aria-expanded",o);b.setAttribute("aria-label",o?"Fechar menu":"Abrir menu")};
b.onclick=()=>set(!n.classList.contains("open"));
n.addEventListener("click",e=>{if(e.target.closest("a"))set(false)});
addEventListener("hashchange",()=>set(false));
document.addEventListener("keydown",e=>{if(e.key==="Escape")set(false)});})();
