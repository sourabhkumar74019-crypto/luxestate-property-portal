// Initial Seed Properties
const initialProperties = [
  {
    id: 'prop-1',
    title: 'The Sky Glass Villa',
    location: 'Beverly Hills, California',
    price: 18500000,
    type: 'Villa',
    beds: 5,
    baths: 7,
    sqft: '8,400',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'prop-2',
    title: 'Aura Waterfront Penthouse',
    location: 'Palm Jumeirah, Dubai',
    price: 12400000,
    type: 'Penthouse',
    beds: 4,
    baths: 5,
    sqft: '6,200',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'prop-3',
    title: 'Monaco Harbor Cliff Mansion',
    location: 'Monte Carlo, Monaco',
    price: 24500000,
    type: 'Mansion',
    beds: 6,
    baths: 8,
    sqft: '11,000',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'prop-4',
    title: 'Zenith Modern Estate',
    location: 'Aspen, Colorado',
    price: 9800000,
    type: 'Estate',
    beds: 4,
    baths: 4,
    sqft: '5,800',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
  }
];

// App State Management
let propertiesData = JSON.parse(localStorage.getItem('luxestate_properties')) || initialProperties;
let favoritesList = JSON.parse(localStorage.getItem('luxestate_favs')) || [];
let currentLayout = 'grid';
let isDarkMode = true;

document.addEventListener('DOMContentLoaded', () => {
  renderProperties(propertiesData);
  updateFavBadge();
  recalculateEMI();
});

function savePropertiesToStorage() {
  localStorage.setItem('luxestate_properties', JSON.stringify(propertiesData));
}

// Theme Switcher Engine
function toggleTheme() {
  isDarkMode = !isDarkMode;
  const html = document.documentElement;
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');

  if (isDarkMode) {
    html.classList.remove('light');
    html.classList.add('dark');
    icon.className = 'fa-solid fa-moon text-amber-400';
    label.textContent = 'Dark';
  } else {
    html.classList.remove('dark');
    html.classList.add('light');
    icon.className = 'fa-solid fa-sun text-amber-500';
    label.textContent = 'Light';
  }
}

// Tab Switcher Engine
function switchTab(tabId) {
  document.querySelectorAll('.tab-page').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.getElementById(`nav-${tabId}`).classList.add('active');

  if (tabId === 'favorites') {
    renderFavorites();
  }
}

function updatePriceLabel() {
  const val = parseInt(document.getElementById('priceRange').value);
  document.getElementById('priceDisplay').textContent = `$${val.toLocaleString()}`;
}

// Filter Engine
function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const type = document.getElementById('typeFilter').value;
  const maxPrice = parseInt(document.getElementById('priceRange').value);
  const beds = document.getElementById('bedsFilter').value;

  const filtered = propertiesData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search) || item.location.toLowerCase().includes(search);
    const matchesType = type === 'all' || item.type === type;
    const matchesPrice = item.price <= maxPrice;
    const matchesBeds = beds === 'all' || item.beds >= parseInt(beds);

    return matchesSearch && matchesType && matchesPrice && matchesBeds;
  });

  renderProperties(filtered);
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('typeFilter').value = 'all';
  document.getElementById('priceRange').value = 25000000;
  document.getElementById('bedsFilter').value = 'all';
  updatePriceLabel();
  renderProperties(propertiesData);
}

// Render Property Grid / List
function renderProperties(list) {
  const container = document.getElementById('propertyContainer');
  document.getElementById('propertyCount').textContent = list.length;
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center space-y-3">
        <i class="fa-solid fa-building-circle-xmark text-4xl text-slate-500"></i>
        <h3 class="text-base font-bold text-brand">No Properties Match Your Search</h3>
        <p class="text-xs text-sub">Try broadening your filters or resetting parameters.</p>
      </div>
    `;
    return;
  }

  list.forEach(prop => {
    const isFav = favoritesList.includes(prop.id);
    const card = document.createElement('div');
    
    if (currentLayout === 'grid') {
      card.className = 'property-card card-bg rounded-2xl overflow-hidden border card-border flex flex-col justify-between';
      card.innerHTML = `
        <div>
          <div class="relative h-56 overflow-hidden">
            <img src="${prop.image}" alt="${prop.title}" class="w-full h-full object-cover transition transform duration-500 hover:scale-105">
            <button onclick="toggleFavorite('${prop.id}')" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition hover:scale-110">
              <i class="fa-solid fa-heart ${isFav ? 'text-rose-500' : 'text-slate-300'}"></i>
            </button>
            <span class="absolute bottom-4 left-4 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">${prop.type}</span>
          </div>

          <div class="p-5 space-y-3">
            <div class="flex justify-between items-start gap-2">
              <h3 class="font-extrabold text-brand text-base leading-snug">${prop.title}</h3>
              <span class="text-amber-500 font-extrabold text-base whitespace-nowrap">$${(prop.price / 1000000).toFixed(1)}M</span>
            </div>
            <p class="text-xs text-sub flex items-center gap-1.5"><i class="fa-solid fa-location-dot text-amber-500"></i> ${prop.location}</p>

            <div class="grid grid-cols-3 gap-2 py-3 border-y card-border text-xs text-sub font-semibold">
              <span class="flex items-center gap-1"><i class="fa-solid fa-bed text-amber-500"></i> ${prop.beds} Beds</span>
              <span class="flex items-center gap-1"><i class="fa-solid fa-bath text-amber-500"></i> ${prop.baths} Baths</span>
              <span class="flex items-center gap-1"><i class="fa-solid fa-ruler-combined text-amber-500"></i> ${prop.sqft} sqft</span>
            </div>
          </div>
        </div>

        <div class="p-5 pt-0 flex gap-2">
          <button onclick="openModal('inquiryModal')" class="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition">
            Book Viewing
          </button>
          <button onclick="openEditPropertyModal('${prop.id}')" class="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition" title="Edit Listing">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="deleteProperty('${prop.id}')" class="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-300 transition" title="Delete Listing">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
    } else {
      card.className = 'property-card card-bg rounded-2xl overflow-hidden border card-border col-span-full flex flex-col md:flex-row items-center justify-between p-4 gap-4';
      card.innerHTML = `
        <img src="${prop.image}" alt="${prop.title}" class="w-full md:w-48 h-36 object-cover rounded-xl">
        <div class="flex-1 space-y-2">
          <span class="text-amber-500 font-bold text-[10px] uppercase tracking-wider">${prop.type}</span>
          <h3 class="font-extrabold text-brand text-lg">${prop.title}</h3>
          <p class="text-xs text-sub flex items-center gap-1.5"><i class="fa-solid fa-location-dot text-amber-500"></i> ${prop.location}</p>
          <div class="flex gap-4 text-xs text-sub font-semibold pt-1">
            <span><i class="fa-solid fa-bed text-amber-500"></i> ${prop.beds} Beds</span>
            <span><i class="fa-solid fa-bath text-amber-500"></i> ${prop.baths} Baths</span>
            <span><i class="fa-solid fa-ruler-combined text-amber-500"></i> ${prop.sqft} sqft</span>
          </div>
        </div>
        <div class="flex flex-col items-end gap-3 w-full md:w-auto">
          <span class="text-amber-500 font-extrabold text-xl">$${(prop.price / 1000000).toFixed(1)}M</span>
          <div class="flex gap-2 w-full md:w-auto">
            <button onclick="toggleFavorite('${prop.id}')" class="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-rose-500"><i class="fa-solid fa-heart ${isFav ? 'text-rose-500' : ''}"></i></button>
            <button onclick="openModal('inquiryModal')" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition">Book Viewing</button>
            <button onclick="openEditPropertyModal('${prop.id}')" class="p-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition" title="Edit Listing"><i class="fa-solid fa-pen-to-square"></i></button>
            <button onclick="deleteProperty('${prop.id}')" class="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-300 transition" title="Delete Listing"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      `;
    }

    container.appendChild(card);
  });
}

// Property CRUD Controls
function openAddPropertyModal() {
  document.getElementById('editPropId').value = '';
  document.getElementById('propModalTitle').textContent = 'List / Submit New Property';
  document.getElementById('propSubmitBtn').textContent = 'Save Listing';
  
  document.getElementById('propTitle').value = '';
  document.getElementById('propLocation').value = '';
  document.getElementById('propPrice').value = '';
  document.getElementById('propImage').value = '';
  document.getElementById('propBeds').value = '';
  document.getElementById('propBaths').value = '';
  document.getElementById('propSqft').value = '';

  openModal('propertyModal');
}

function openEditPropertyModal(id) {
  const prop = propertiesData.find(p => p.id === id);
  if (!prop) return;

  document.getElementById('editPropId').value = prop.id;
  document.getElementById('propModalTitle').textContent = 'Replace / Change Listing Details';
  document.getElementById('propSubmitBtn').textContent = 'Update Property';

  document.getElementById('propTitle').value = prop.title;
  document.getElementById('propLocation').value = prop.location;
  document.getElementById('propPrice').value = prop.price;
  document.getElementById('propType').value = prop.type;
  document.getElementById('propImage').value = prop.image;
  document.getElementById('propBeds').value = prop.beds;
  document.getElementById('propBaths').value = prop.baths;
  document.getElementById('propSqft').value = prop.sqft;

  openModal('propertyModal');
}

function handlePropertySubmit(e) {
  e.preventDefault();

  const editId = document.getElementById('editPropId').value;
  const newPropData = {
    id: editId || 'prop-' + Date.now(),
    title: document.getElementById('propTitle').value,
    location: document.getElementById('propLocation').value,
    price: parseFloat(document.getElementById('propPrice').value),
    type: document.getElementById('propType').value,
    image: document.getElementById('propImage').value,
    beds: parseInt(document.getElementById('propBeds').value),
    baths: parseInt(document.getElementById('propBaths').value),
    sqft: document.getElementById('propSqft').value
  };

  if (editId) {
    const index = propertiesData.findIndex(p => p.id === editId);
    if (index !== -1) {
      propertiesData[index] = newPropData;
      showToast('Property listing updated successfully!', 'success');
    }
  } else {
    propertiesData.unshift(newPropData);
    showToast('New luxury listing published!', 'success');
  }

  savePropertiesToStorage();
  closeModal('propertyModal');
  applyFilters();
}

function deleteProperty(id) {
  if (confirm('Are you sure you want to remove this property listing?')) {
    propertiesData = propertiesData.filter(p => p.id !== id);
    favoritesList = favoritesList.filter(favId => favId !== id);
    savePropertiesToStorage();
    localStorage.setItem('luxestate_favs', JSON.stringify(favoritesList));
    updateFavBadge();
    applyFilters();
    showToast('Listing removed from portal', 'info');
  }
}

// Favorites Storage Toggle
function toggleFavorite(id) {
  if (favoritesList.includes(id)) {
    favoritesList = favoritesList.filter(item => item !== id);
    showToast('Removed from favorites vault', 'info');
  } else {
    favoritesList.push(id);
    showToast('Saved to favorites vault!', 'success');
  }

  localStorage.setItem('luxestate_favs', JSON.stringify(favoritesList));
  updateFavBadge();
  applyFilters();
}

function updateFavBadge() {
  document.getElementById('favCountBadge').textContent = favoritesList.length;
}

function renderFavorites() {
  const container = document.getElementById('favoritesContainer');
  const favProps = propertiesData.filter(p => favoritesList.includes(p.id));
  container.innerHTML = '';

  if (favProps.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center space-y-3">
        <i class="fa-solid fa-heart-crack text-5xl text-slate-600"></i>
        <h3 class="text-lg font-bold text-brand">Your Favorites Vault is Empty</h3>
        <p class="text-xs text-sub">Explore properties and click the heart icon to save listings here.</p>
      </div>
    `;
    return;
  }

  favProps.forEach(prop => {
    const card = document.createElement('div');
    card.className = 'card-bg rounded-2xl overflow-hidden border card-border p-4 flex flex-col justify-between';
    card.innerHTML = `
      <div class="space-y-3">
        <img src="${prop.image}" class="w-full h-44 object-cover rounded-xl">
        <h3 class="font-extrabold text-brand text-base">${prop.title}</h3>
        <p class="text-xs text-sub"><i class="fa-solid fa-location-dot text-amber-500 mr-1"></i> ${prop.location}</p>
        <p class="text-amber-500 font-extrabold text-lg">$${(prop.price / 1000000).toFixed(1)}M</p>
      </div>
      <button onclick="toggleFavorite('${prop.id}')" class="mt-4 w-full bg-rose-500/10 text-rose-500 border border-rose-500/30 text-xs font-bold py-2 rounded-xl hover:bg-rose-500 hover:text-white transition">
        Remove Listing
      </button>
    `;
    container.appendChild(card);
  });
}

function clearAllFavorites() {
  favoritesList = [];
  localStorage.setItem('luxestate_favs', JSON.stringify(favoritesList));
  updateFavBadge();
  renderFavorites();
  showToast('Favorites vault cleared', 'info');
}

function setViewLayout(mode) {
  currentLayout = mode;
  document.getElementById('btnLayoutGrid').classList.toggle('active', mode === 'grid');
  document.getElementById('btnLayoutList').classList.toggle('active', mode === 'list');
  applyFilters();
}

// Mortgage Calculation Logic
function recalculateEMI() {
  const price = parseFloat(document.getElementById('calcPrice').value) || 0;
  const down = parseFloat(document.getElementById('calcDownPayment').value) || 0;
  const rate = parseFloat(document.getElementById('calcInterest').value) || 0;
  const tenure = parseInt(document.getElementById('calcTenure').value) || 30;

  const principal = price - down;
  const monthlyRate = (rate / 100) / 12;
  const totalMonths = tenure * 12;

  if (principal <= 0 || monthlyRate <= 0) return;

  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  const totalCost = emi * totalMonths;
  const totalInterest = totalCost - principal;

  document.getElementById('emiOutput').textContent = `$${Math.round(emi).toLocaleString()}`;
  document.getElementById('loanAmountOutput').textContent = `$${Math.round(principal).toLocaleString()}`;
  document.getElementById('totalInterestOutput').textContent = `$${Math.round(totalInterest).toLocaleString()}`;
  document.getElementById('totalCostOutput').textContent = `$${Math.round(totalCost).toLocaleString()}`;
}

// Settings & Auth Handlers
function handleSettingsSave(e) {
  e.preventDefault();
  showToast('Agent profile and agency credentials updated!', 'success');
}

function handleAuthLogin(e) {
  e.preventDefault();
  closeModal('authModal');
  showToast('Logged in as Agent Sourabh Kumar', 'success');
}

function handleInquirySubmit(e) {
  e.preventDefault();
  closeModal('inquiryModal');
  showToast('Confidential inquiry dispatched to agent!', 'success');
}

// Modal Helpers
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Toast Notification Engine
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-xl text-xs font-bold text-white shadow-xl backdrop-blur-md border flex items-center gap-2 pointer-events-auto transition transform translate-y-2 opacity-0 ${type === 'success' ? 'bg-emerald-600/90 border-emerald-400' : 'bg-slate-800/90 border-slate-600'}`;
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;

  container.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
