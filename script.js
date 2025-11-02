// util: seletor rápido
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ano no rodapé
$("#year").textContent = new Date().getFullYear();

// menu mobile
const menuToggle = $(".menu-toggle");
const navbar = $(".navbar");
menuToggle?.addEventListener("click", () => {
  navbar.classList.toggle("open");
});

// buscar (filtra cards por texto)
const form = $(".search");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const term = $("#search").value.trim().toLowerCase();
  const cards = $$(".product");
  cards.forEach(card => {
    const tags = (card.dataset.tags || "").toLowerCase();
    const text = card.textContent.toLowerCase();
    const show = tags.includes(term) || text.includes(term) || term === "";
    card.style.display = show ? "" : "none";
  });
  toast(term ? `Filtrando por: "${term}"` : "Mostrando todos");
});

// adicionar ao carrinho (demo)
$$(".add-cart").forEach(btn => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.product || "Produto";
    toast(`${name} adicionado ao carrinho`);
  });
});

// ações rápidas
$$(".quick-actions .icon-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const act = btn.dataset.action;
    if (act === "whatsapp") window.open("https://wa.me/5517992077928","_blank");
    if (act === "cart") toast("Seu carrinho está vazio (demo)");
  });
});

// botão voltar ao topo
const toTop = $(".to-top");
const onScroll = () => {
  const y = window.scrollY;
  toTop.style.display = y > 500 ? "grid" : "none";
  // sombra discreta no header quando rola
  $(".site-header").style.boxShadow = y > 4 ? "0 6px 16px rgba(0,0,0,.06)" : "0 2px 0 rgba(0,0,0,.03)";
};
window.addEventListener("scroll", onScroll);
toTop.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));
onScroll();

// toast simples
let toastTimer;
function toast(text){
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove("show"), 2200);
}

/* ====== CONFIG ====== */
const WHATS_NUMBER = "5517992077928"; // coloque o seu número com DDI/DD
const CURRENCY = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' });

/* ====== ESTADO ====== */
let cart = JSON.parse(localStorage.getItem('cart_v1') || '[]');

/* ====== HELPERS ====== */
const fmt = (n) => CURRENCY.format(n);
const save = () => localStorage.setItem('cart_v1', JSON.stringify(cart));
const findItem = (id) => cart.find(i => i.id === id);

/* ====== UI DO DRAWER ====== */
const drawer = document.getElementById('cartDrawer');
const itemsEl = document.getElementById('cartItems');
const totalEl = document.getElementById('cartTotal');
const cartBtn = document.querySelector('.quick-actions .icon-btn[data-action="cart"]');

function openCart(){ drawer.classList.add('show'); drawer.setAttribute('aria-hidden','false'); }
function closeCart(){ drawer.classList.remove('show'); drawer.setAttribute('aria-hidden','true'); }
document.getElementById('closeCart')?.addEventListener('click', closeCart);
drawer?.addEventListener('click', (e)=> { if(e.target === drawer) closeCart(); });

/* Badge no ícone do carrinho */
function updateCartBadge(){
  const count = cart.reduce((s,i)=> s + i.qty, 0);
  if(cartBtn) cartBtn.setAttribute('data-count', count || '');
}

/* Render dos itens */
function renderCart(){
  if(!itemsEl) return;
  itemsEl.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    const li = document.createElement('div');
    li.className = 'cart-item';
    total += item.price * item.qty;

    li.innerHTML = `
      <div>
        <h4>${item.name}</h4>
        <div class="cart-price">${fmt(item.price)} <small>• cada</small></div>
      </div>
      <div class="qty" data-id="${item.id}">
        <button class="dec" aria-label="Diminuir">–</button>
        <strong>${item.qty}</strong>
        <button class="inc" aria-label="Aumentar">+</button>
        <button class="decall" title="Remover" aria-label="Remover" style="margin-left:6px">🗑️</button>
      </div>
    `;
    itemsEl.appendChild(li);
  });
  totalEl.textContent = fmt(total);
  updateCartBadge();
}
renderCart();

/* Controles de quantidade */
itemsEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const wrap = e.target.closest('.qty');
  const id = wrap?.dataset.id;
  const it = findItem(id);
  if(!it) return;

  if(btn.classList.contains('inc')) it.qty += 1;
  if(btn.classList.contains('dec')) it.qty = Math.max(1, it.qty - 1);
  if(btn.classList.contains('decall')) cart = cart.filter(i => i.id !== id);

  save(); renderCart();
});

/* Abrir drawer pelo ícone do carrinho */
cartBtn?.addEventListener('click', () => {
  openCart();
});

/* Adicionar ao carrinho nos cards existentes */
document.querySelectorAll('.add-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product');
    const id = card?.dataset.id || btn.dataset.product?.toLowerCase().replace(/\s+/g,'-');
    const name = btn.dataset.product || card?.querySelector('h3')?.textContent?.trim() || 'Produto';
    const price = parseFloat(card?.dataset.price || '0') || 0;

    const found = findItem(id);
    if(found){ found.qty += 1; }
    else{ cart.push({ id, name, price, qty: 1 }); }

    save(); renderCart();
    // toast feedback (usa seu toast existente)
    if(typeof toast === 'function') toast(`${name} adicionado ao carrinho`);
  });
});

/* Checkout pelo WhatsApp */
document.getElementById('checkoutWhats')?.addEventListener('click', () => {
  if(cart.length === 0){ if(typeof toast === 'function') toast('Carrinho vazio'); return; }

  const nome = document.getElementById('cliNome').value.trim();
  const end  = document.getElementById('cliEndereco').value.trim();
  const bairro = document.getElementById('cliBairro').value.trim();
  const ciduf = document.getElementById('cliCidadeUF').value.trim();
  const cep   = document.getElementById('cliCEP').value.trim();
  const pag   = document.getElementById('cliPagamento').value.trim();
  const obs   = document.getElementById('cliObs').value.trim();

  if(!nome || !end || !bairro || !ciduf){
    if(typeof toast === 'function') toast('Preencha nome, endereço, bairro e cidade/UF');
    return;
  }

  const linhas = [];
  linhas.push('Olá! Quero fazer um pedido:');
  linhas.push('');
  linhas.push('*Itens:*');

  let total = 0;
  cart.forEach((it, idx) => {
    const sub = it.price * it.qty;
    total += sub;
    const preco = it.price ? ` — ${fmt(it.price)} un.` : '';
    linhas.push(`${idx+1}. ${it.name} x${it.qty}${preco} (Subtotal: ${fmt(sub)})`);
  });

  linhas.push('');
  linhas.push(`*Total:* ${fmt(total)}`);
  linhas.push('');
  linhas.push('*Dados para entrega:*');
  linhas.push(`Nome: ${nome}`);
  linhas.push(`Endereço: ${end}`);
  linhas.push(`Bairro: ${bairro}`);
  linhas.push(`Cidade/UF: ${ciduf}`);
  if(cep) linhas.push(`CEP: ${cep}`);
  if(pag) linhas.push(`Pagamento: ${pag}`);
  if(obs){ linhas.push(''); linhas.push(`Obs: ${obs}`); }

  const texto = encodeURIComponent(linhas.join('\n'));
  const url = `https://wa.me/${WHATS_NUMBER}?text=${texto}`;
  window.open(url, '_blank');
});
