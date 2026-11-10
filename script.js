const U = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const initialProperties = [
  { id: 'prop-1', title: 'The Sky Glass Villa', location: 'Beverly Hills, California', price: 18500000, type: 'Villa', beds: 5, baths: 7, sqft: '8,400', image: U('1613977257363-707ba9348227'), desc: 'Floor-to-ceiling glass, an infinity pool and canyon views from every bedroom.' },
  { id: 'prop-2', title: 'Aura Waterfront Penthouse', location: 'Palm Jumeirah, Dubai', price: 12400000, type: 'Penthouse', beds: 4, baths: 5, sqft: '6,200', image: U('1512917774080-9991f1c4c750'), desc: 'Full-floor penthouse with a private terrace and direct marina access.' },
  { id: 'prop-3', title: 'Monaco Harbor Cliff Mansion', location: 'Monte Carlo, Monaco', price: 24500000, type: 'Mansion', beds: 6, baths: 8, sqft: '11,000', image: U('1600585154340-be6161a56a0c'), desc: 'Cliffside mansion above the harbor with a wine cellar and a private elevator.' },
  { id: 'prop-4', title: 'Olive Grove Estate', location: 'Tuscany, Italy', price: 9800000, type: 'Estate', beds: 7, baths: 6, sqft: '12,500', image: U('1564013799919-ab600027ffc6'), desc: 'Restored stone estate on 40 acres of olive groves and vineyards.' },
  { id: 'prop-5', title: 'Hamptons Shoreline Residence', location: 'East Hampton, New York', price: 15200000, type: 'Mansion', beds: 6, baths: 7, sqft: '9,300', image: U('1580587771525-78b9dba3b914'), desc: 'Oceanfront residence with a private beach path, guest house and tennis court.' },
  { id: 'prop-6', title: 'Skyline Crown Penthouse', location: 'Manhattan, New York', price: 21000000, type: 'Penthouse', beds: 4, baths: 5, sqft: '5,800', image: U('1502672260266-1c1ef2d93688'), desc: 'Duplex crown penthouse with 360-degree views over Central Park.' }
];

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function persist(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

let propertiesData = load('luxestate_properties', initialProperties);
let favoritesList = load('luxestate_favs', []);
let isDarkMode = load('luxestate_theme', 'dark') === 'dark';
let activeInquiry = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + Math.round(n).toLocaleString();
const sqftNum = p => parseInt(String(p.sqft).replace(/\D/g, '')) || 0;
const imgTag = (src, cls) => `<img src="${esc(src)}" alt="" loading="lazy" class="${cls}" onerror="this.onerror=null;this.removeAttribute('src');this.classList.add('img-fallback')">`;

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  applyFilters();
  renderClientControlTable();
  updateFavBadge();
  recalculateEMI();
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') ['propertyModal', 'inquiryModal', 'detailModal'].forEach(closeModal);
  });
  ['propertyModal', 'inquiryModal', 'detailModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => { if (e.target.id === id) closeModal(id); });
  });
});

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDarkMode);
  document.documentElement.classList.toggle('light', !isDarkMode);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = `fa-solid ${isDarkMode ? 'fa-moon' : 'fa-sun'} text-amber-400`;
}
function toggleTheme() {
  isDarkMode = !isDarkMode;
  persist('luxestate_theme', isDarkMode ? 'dark' : 'light');
  applyTheme();
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-page').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-link, .mnav').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');
  document.getElementById(`nav-${tabId}`)?.classList.add('active');
  document.querySelectorAll(`.mnav[data-tab="${tabId}"]`).forEach(el => el.classList.add('active'));
  if (tabId === 'favorites') renderFavorites();
  if (tabId === 'client-hub') renderClientControlTable();
  window.scrollTo({ top: 0 });
}

function updatePriceLabel() {
  const r = document.getElementById('priceRange');
  const d = document.getElementById('priceDisplay');
  if (r && d) d.textContent = money(parseInt(r.value));
}

function applyFilters() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const type = document.getElementById('typeFilter')?.value || 'all';
  const maxPrice = parseInt(document.getElementById('priceRange')?.value) || 25000000;
  const sort = document.getElementById('sortSelect')?.value || 'new';

  const list = propertiesData.filter(p =>
    (p.title.toLowerCase().includes(search) || p.location.toLowerCase().includes(search)) &&
    (type === 'all' || p.type === type) && p.price <= maxPrice);

  if (sort === 'low') list.sort((a, b) => a.price - b.price);
  if (sort === 'high') list.sort((a, b) => b.price - a.price);
  if (sort === 'size') list.sort((a, b) => sqftNum(b) - sqftNum(a));

  const count = document.getElementById('resultCount');
  if (count) count.textContent = `${list.length} ${list.length === 1 ? 'property' : 'properties'}`;
  renderProperties(list);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('typeFilter').value = 'all';
  document.getElementById('priceRange').value = 25000000;
  document.getElementById('sortSelect').value = 'new';
  updatePriceLabel();
  applyFilters();
}

function renderProperties(list) {
  const c = document.getElementById('propertyContainer');
  if (!c) return;
  if (!list.length) {
    c.innerHTML = `<div class="col-span-full py-12 text-center text-sub">No properties match these filters. <button onclick="resetFilters()" class="text-amber-500 font-bold underline">Reset filters</button></div>`;
    return;
  }
  c.innerHTML = list.map(p => {
    const fav = favoritesList.includes(p.id);
    return `
    <article class="property-card card-bg rounded-2xl overflow-hidden border card-border flex flex-col justify-between">
      <div>
        <div class="relative h-56 overflow-hidden" onclick="openDetail('${p.id}')">
          ${imgTag(p.image, 'card-img w-full h-full object-cover')}
          <button onclick="event.stopPropagation();toggleFavorite('${p.id}')" aria-label="${fav ? 'Remove from saved' : 'Save property'}" aria-pressed="${fav}" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white">
            <i class="fa-solid fa-heart ${fav ? 'text-rose-500' : 'text-slate-300'}"></i>
          </button>
          <span class="absolute bottom-4 left-4 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full">${esc(p.type)}</span>
        </div>
        <div class="p-5 space-y-3">
          <div class="flex justify-between items-start gap-2">
            <h3 class="font-extrabold text-brand text-base">${esc(p.title)}</h3>
            <span class="text-amber-500 font-extrabold text-base whitespace-nowrap">$${(p.price / 1e6).toFixed(1)}M</span>
          </div>
          <p class="text-xs text-sub"><i class="fa-solid fa-location-dot text-amber-500"></i> ${esc(p.location)}</p>
          <div class="grid grid-cols-3 gap-2 py-2 border-y card-border text-xs text-sub font-semibold">
            <span><i class="fa-solid fa-bed text-amber-500"></i> ${p.beds} Beds</span>
            <span><i class="fa-solid fa-bath text-amber-500"></i> ${p.baths} Baths</span>
            <span><i class="fa-solid fa-ruler-combined text-amber-500"></i> ${esc(p.sqft)} sqft</span>
          </div>
        </div>
      </div>
      <div class="p-5 pt-0 grid grid-cols-2 gap-2">
        <button onclick="openDetail('${p.id}')" class="bg-slate-800 hover:bg-slate-700 text-brand font-bold text-xs py-2.5 rounded-xl transition">View details</button>
        <button onclick="prepareWhatsAppInquiry('${p.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5">
          <i class="fa-brands fa-whatsapp"></i> Inquire
        </button>
      </div>
    </article>`;
  }).join('');
}

function openDetail(id) {
  const p = propertiesData.find(x => x.id === id);
  if (!p) return;
  const down = p.price * 0.2, monthly = calcMonthly(p.price - down, 6.5, 20);
  document.getElementById('detailBody').innerHTML = `
    ${imgTag(p.image, 'w-full h-64 object-cover')}
    <div class="p-6 space-y-4">
      <div class="flex justify-between items-start gap-3">
        <div><h3 class="text-xl font-black text-brand">${esc(p.title)}</h3>
          <p class="text-xs text-sub mt-1"><i class="fa-solid fa-location-dot text-amber-500"></i> ${esc(p.location)}</p></div>
        <span class="text-xl font-black text-amber-500">${money(p.price)}</span>
      </div>
      <p class="text-sm text-sub leading-relaxed">${esc(p.desc || 'Contact us for the full property brochure and a private viewing.')}</p>
      <div class="grid grid-cols-4 gap-2 text-center text-xs font-bold">
        <div class="input-field rounded-xl py-3">${esc(p.type)}</div>
        <div class="input-field rounded-xl py-3">${p.beds} beds</div>
        <div class="input-field rounded-xl py-3">${p.baths} baths</div>
        <div class="input-field rounded-xl py-3">${esc(p.sqft)} sqft</div>
      </div>
      <p class="text-xs text-sub">Estimated from <span class="text-amber-500 font-extrabold">${money(monthly)}/month</span> with 20% down at 6.5% over 20 years.</p>
      <div class="grid grid-cols-2 gap-2">
        <button onclick="useInCalculator('${p.id}')" class="bg-slate-800 hover:bg-slate-700 text-brand font-bold text-xs py-3 rounded-xl">Open in mortgage estimator</button>
        <button onclick="closeModal('detailModal');prepareWhatsAppInquiry('${p.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl"><i class="fa-brands fa-whatsapp"></i> Inquire on WhatsApp</button>
      </div>
    </div>`;
  openModal('detailModal');
}

function useInCalculator(id) {
  const p = propertiesData.find(x => x.id === id);
  if (!p) return;
  document.getElementById('calcPrice').value = p.price;
  closeModal('detailModal');
  switchTab('calculator');
  recalculateEMI();
}

function renderClientControlTable() {
  const tbody = document.getElementById('clientControlTableBody');
  if (!tbody) return;
  if (!propertiesData.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-sub">No properties yet. Use Add New Property to create the first listing.</td></tr>`;
    return;
  }
  tbody.innerHTML = propertiesData.map(p => `
    <tr class="transition">
      <td class="p-4 flex items-center gap-3">
        ${imgTag(p.image, 'w-12 h-12 object-cover rounded-xl')}
        <div><h4 class="font-bold text-brand text-xs">${esc(p.title)}</h4>
          <span class="text-[10px] text-sub">${p.beds} Beds • ${p.baths} Baths</span></div>
      </td>
      <td class="p-4 text-sub font-bold">${esc(p.type)}</td>
      <td class="p-4 font-extrabold text-amber-500">${money(p.price)}</td>
      <td class="p-4 text-sub">${esc(p.location)}</td>
      <td class="p-4 text-right space-x-2 whitespace-nowrap">
        <button onclick="openEditPropertyModal('${p.id}')" class="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs hover:bg-amber-500 hover:text-slate-950 transition">Edit</button>
        <button onclick="deleteProperty('${p.id}')" class="px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-xl font-bold text-xs hover:bg-rose-500 hover:text-white transition">Delete</button>
      </td>
    </tr>`).join('');
}

function openAddPropertyModal() {
  document.getElementById('editPropId').value = '';
  document.getElementById('propModalTitle').textContent = 'Add new property';
  document.getElementById('propSubmitBtn').textContent = 'Publish property';
  ['propTitle', 'propPrice', 'propLocation', 'propImage', 'propDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('propBeds').value = 4;
  document.getElementById('propBaths').value = 5;
  document.getElementById('propSqft').value = '6,500';
  openModal('propertyModal');
}

function openEditPropertyModal(id) {
  const p = propertiesData.find(x => x.id === id);
  if (!p) return;
  document.getElementById('editPropId').value = p.id;
  document.getElementById('propModalTitle').textContent = 'Edit property';
  document.getElementById('propSubmitBtn').textContent = 'Save changes';
  const set = (k, v) => document.getElementById(k).value = v ?? '';
  set('propTitle', p.title); set('propPrice', p.price); set('propType', p.type);
  set('propLocation', p.location); set('propImage', p.image); set('propDesc', p.desc);
  set('propBeds', p.beds); set('propBaths', p.baths); set('propSqft', p.sqft);
  openModal('propertyModal');
}

function handlePropertySubmit(e) {
  e.preventDefault();
  const g = id => document.getElementById(id).value;
  const editId = g('editPropId');
  const data = {
    id: editId || 'prop-' + Date.now(),
    title: g('propTitle').trim(), price: parseFloat(g('propPrice')), type: g('propType'),
    location: g('propLocation').trim(), image: g('propImage').trim(), desc: g('propDesc').trim(),
    beds: parseInt(g('propBeds')), baths: parseInt(g('propBaths')), sqft: g('propSqft')
  };
  if (editId) {
    const i = propertiesData.findIndex(p => p.id === editId);
    if (i !== -1) propertiesData[i] = data;
    showToast('Changes saved');
  } else {
    propertiesData.unshift(data);
    showToast('Property published');
  }
  persist('luxestate_properties', propertiesData);
  closeModal('propertyModal');
  applyFilters();
  renderClientControlTable();
}

function deleteProperty(id) {
  if (!confirm('Delete this property? This cannot be undone.')) return;
  propertiesData = propertiesData.filter(p => p.id !== id);
  favoritesList = favoritesList.filter(f => f !== id);
  persist('luxestate_properties', propertiesData);
  persist('luxestate_favs', favoritesList);
  updateFavBadge();
  applyFilters();
  renderClientControlTable();
  showToast('Property deleted', 'info');
}

function toggleFavorite(id) {
  const adding = !favoritesList.includes(id);
  favoritesList = adding ? [...favoritesList, id] : favoritesList.filter(f => f !== id);
  persist('luxestate_favs', favoritesList);
  updateFavBadge();
  if (adding) showToast('Saved to favorites');
  applyFilters();
  if (!document.getElementById('tab-favorites').classList.contains('hidden')) renderFavorites();
}

function updateFavBadge() {
  const b = document.getElementById('favCountBadge');
  if (b) b.textContent = favoritesList.length;
}

function renderFavorites() {
  const c = document.getElementById('favoritesContainer');
  const favs = propertiesData.filter(p => favoritesList.includes(p.id));
  if (!favs.length) {
    c.innerHTML = `<div class="col-span-full py-12 text-center text-sub">No saved homes yet. Tap the heart on any listing to keep it here.</div>`;
    return;
  }
  c.innerHTML = favs.map(p => `
    <div class="card-bg rounded-2xl p-4 border card-border space-y-3">
      ${imgTag(p.image, 'w-full h-40 object-cover rounded-xl')}
      <h3 class="font-extrabold text-brand">${esc(p.title)}</h3>
      <p class="text-amber-500 font-extrabold">${money(p.price)}</p>
      <div class="grid grid-cols-2 gap-2">
        <button onclick="openDetail('${p.id}')" class="bg-slate-800 text-brand text-xs font-bold py-2 rounded-xl">View</button>
        <button onclick="toggleFavorite('${p.id}')" class="bg-rose-500/10 text-rose-500 text-xs font-bold py-2 rounded-xl">Remove</button>
      </div>
    </div>`).join('');
}

function prepareWhatsAppInquiry(id) {
  activeInquiry = propertiesData.find(p => p.id === id);
  openModal('inquiryModal');
}

function handleInquirySubmit(e) {
  e.preventDefault();
  const name = document.getElementById('inqName').value;
  const phone = document.getElementById('inqPhone').value;
  const title = activeInquiry ? `${activeInquiry.title} (${money(activeInquiry.price)})` : 'a property';
  const text = `Hi, I want to inquire about "${title}". Name: ${name}, Phone: ${phone}`;
  closeModal('inquiryModal');
  window.open(`https://wa.me/919876543210?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

// Standard amortised monthly payment
function calcMonthly(loan, ratePct, years) {
  const n = years * 12, r = ratePct / 100 / 12;
  return r === 0 ? loan / n : loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

function recalculateEMI() {
  const g = id => document.getElementById(id);
  if (!g('calcPrice')) return;
  const price = Math.max(parseFloat(g('calcPrice').value) || 0, 0);
  const downPct = +g('calcDown').value, rate = +g('calcRate').value, years = +g('calcYears').value;
  g('downLabel').textContent = downPct + '%';
  g('rateLabel').textContent = rate.toFixed(1) + '%';
  g('yearsLabel').textContent = years + ' years';

  const down = price * downPct / 100, loan = price - down;
  const monthly = calcMonthly(loan, rate, years), total = monthly * years * 12;
  g('emiOutput').textContent = money(monthly);
  g('downOut').textContent = money(down);
  g('loanOut').textContent = money(loan);
  g('interestOut').textContent = money(total - loan);
  g('totalOut').textContent = money(total);
  g('principalBar').style.width = (total ? (loan / total) * 100 : 0) + '%';
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  const color = type === 'info' ? 'bg-slate-700 border-slate-500' : 'bg-emerald-600/90 border-emerald-400';
  t.className = `px-4 py-3 rounded-xl text-xs font-bold text-white border shadow-xl mb-16 md:mb-0 ${color}`;
  t.setAttribute('role', 'status');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
