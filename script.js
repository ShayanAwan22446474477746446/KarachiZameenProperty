/* script.js - Shared application logic with dark mode support
   Storage Key: karachizameen_properties_v2
   Default contact number: 0345-227260-7
*/

const STORAGE_KEY = 'karachizameen_properties_v2';
const THEME_KEY = 'karachizameen_theme';

// Theme utilities
function applySavedTheme(){
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  if(saved === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}

function toggleTheme(){
  if(document.body.classList.contains('dark')){
    document.body.classList.remove('dark');
    localStorage.setItem(THEME_KEY, 'light');
  } else {
    document.body.classList.add('dark');
    localStorage.setItem(THEME_KEY, 'dark');
  }
}

/* ---------- Storage helpers ---------- */
function generateId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

function getAllProperties(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch(e){
    console.error('localStorage parse error', e);
    return [];
  }
}

function saveAllProperties(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function addProperty(prop){
  const list = getAllProperties();
  list.unshift(prop); // newest first
  saveAllProperties(list);
  if(window.currentRender) window.currentRender();
}

/* ---------- Utility ---------- */
function escapeHtml(text=''){ return String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function formatPrice(v){ return v ? Number(v).toLocaleString() : 'N/A'; }
function sanitizeWhatsAppNumber(raw){ if(!raw) return ''; let n = raw.replace(/[\s\-()]/g,''); if(n.startsWith('+')) n = n.slice(1); n = n.replace(/\D/g,''); return n; }

/* ---------- Card HTML ---------- */
function createPropertyCardHTML(p){
  const imageHtml = p.image ? `<img src="${p.image}" alt="${escapeHtml(p.name)}" class="card-img" style="height:140px; object-fit:cover; border-radius:8px 8px 0 0;">` : '';
  return `
    <div class="card">
      ${imageHtml}
      <div class="card-body">
        <div class="flex justify-between items-start gap-3">
          <div>
            <h4 class="card-title">${escapeHtml(p.name || 'Untitled')}</h4>
            <div class="property-meta">${escapeHtml(p.location || '')} • ${escapeHtml(p.type || '')} ${p.bedrooms? ' • '+p.bedrooms+'bd':''}</div>
          </div>
          <div class="text-right">
            <div class="price">PKR ${formatPrice(p.price)}</div>
            <div class="mt-2"><span class="badge">${p.category === 'sale' ? 'For Sale' : 'For Rent'}</span></div>
          </div>
        </div>
        <p class="card-desc mt-3">${p.description? escapeHtml(p.description).slice(0,140): ''}</p>

        <div class="mt-4 property-actions">
          <button class="btn" onclick="viewProperty('${'${p.id}'}')"><i class="fas fa-eye mr-2"></i>View</button>
          <button class="btn" onclick="contactProperty('${'${p.contact}'}')"><i class="fas fa-phone mr-2"></i>Call</button>
          <button class="btn" onclick="openWhatsApp('${'${p.contact}'}')"><i class="fab fa-whatsapp mr-2"></i>WhatsApp</button>
          <button class="btn danger" onclick="deletePropertyConfirm('${'${p.id}'}')"><i class="fas fa-trash mr-2"></i>Delete</button>
        </div>
      </div>
    </div>
  `;
}

/* ---------- Featured on Home ---------- */
function renderFeatured(containerSelector, limit = 6){
  const container = document.querySelector(containerSelector);
  if(!container) return;
  const list = getAllProperties().slice(0,limit);
  container.innerHTML = '';
  if(list.length === 0){
    container.innerHTML = `<div class="empty">No properties yet. Add one from Sell page.</div>`;
    return;
  }
  list.forEach(p => {
    const div = document.createElement('div');
    div.innerHTML = createPropertyCardHTML(p);
    container.appendChild(div.firstElementChild);
  });
}

/* ---------- View property (detail modal) ---------- */
function viewProperty(id){
  const list = getAllProperties();
  const p = list.find(x=>x.id===id);
  if(!p) return alert('Property not found.');
  const modal = document.getElementById('detailModal');
  const title = document.getElementById('detailTitle');
  const body = document.getElementById('detailBody');

  title.innerText = p.name;
  body.innerHTML = `
    <div style="display:flex; gap:16px; flex-wrap:wrap;">
      <div style="flex:0 0 300px;">
        ${'${p.image ? `<img src="${p.image}" style="width:100%; border-radius:8px; object-fit:cover;" />` : `<div style="width:100%;height:200px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#94a3b8">No Image</div>`}'}
      </div>
      <div class="col">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><strong>${'${escapeHtml(p.location)}'}</strong> • <span class="badge">${'${escapeHtml(p.type)}'}</span></div>
          <div class="price">PKR ${'${formatPrice(p.price)}'}</div>
        </div>
        <div style="margin-top:12px; color:#334155;">${'${p.description ? escapeHtml(p.description).replaceAll("\n","<br/>") : "No description provided."}'}</div>
        <ul style="margin-top:12px; color:#475569; font-size:14px; padding-left:18px;">
          <li>Bedrooms: ${'${p.bedrooms||0}'}</li>
          <li>Bathrooms: ${'${p.bathrooms||0}'}</li>
          <li>Size: ${'${p.size? p.size + " sq ft" : "N/A"}'}</li>
          <li>Category: ${'${p.category === "sale" ? "For Sale" : "For Rent"}'}</li>
        </ul>

        <div style="margin-top:12px; display:flex; gap:8px;">
          <a class="btn" href="tel:0345-227260-7" onclick="event.stopPropagation();"><i class="fas fa-phone mr-2"></i>Call</a>
          <button class="btn" onclick="openWhatsApp('0345-227260-7'); event.stopPropagation();"><i class="fab fa-whatsapp mr-2"></i>WhatsApp</button>
          <button class="btn danger" onclick="deletePropertyConfirm('${'${p.id}'}'); event.stopPropagation();"><i class="fas fa-trash mr-2"></i>Delete</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('detailClose').onclick = closeDetailModal;
  modal.classList.remove('hidden');
}

function closeDetailModal(){
  const modal = document.getElementById('detailModal');
  modal.classList.add('hidden');
}

/* ---------- Contact helpers ---------- */
function contactProperty(phone){
  if(!phone) return alert('Contact not provided.');
  window.open('tel:' + phone, '_self');
}

function openWhatsApp(phone){
  if(!phone) return alert('Contact not provided.');
  const n = sanitizeWhatsAppNumber(phone);
  if(!n) return alert('Invalid number for WhatsApp.');
  window.open('https://wa.me/' + n, '_blank');
}

/* ---------- Delete ---------- */
function deletePropertyConfirm(id){
  if(!confirm('Delete this property?')) return;
  deletePropertyById(id);
  closeDetailModal();
}

/* ---------- Filters: areas ------ */
function getUniqueAreas(){
  const list = getAllProperties();
  const areas = [...new Set(list.map(p => p.location).filter(Boolean))];
  return areas;
}

function populateAreaOptions(selector){
  const select = document.querySelector(selector);
  if(!select) return;
  const areas = getUniqueAreas();
  select.innerHTML = `<option value="">All Areas</option>` + areas.map(a=>`<option value="${'${escapeHtml(a)}'}">${'${escapeHtml(a)}'}</option>`).join('');
}

/* ---------- Render lists with pagination & sorting ---------- */
window.currentRender = null;

function renderListPaged(category, targetSelector, emptySelector, options = {}){
  const pageSize = options.pageSize || 6;
  const target = document.querySelector(targetSelector);
  const emptyEl = document.querySelector(emptySelector);
  if(!target) return;

  let state = { page: 1, pageSize, ...options };
  window.currentRender = () => renderPage(state);

  if(options.searchInput){
    const si = document.querySelector(options.searchInput);
    if(si) si.oninput = () => { state.page = 1; renderPage(state); };
  }
  if(options.areaFilter){
    const af = document.querySelector(options.areaFilter);
    if(af) af.onchange = () => { state.page = 1; renderPage(state); };
  }
  if(options.typeFilter){
    const tf = document.querySelector(options.typeFilter);
    if(tf) tf.onchange = () => { state.page = 1; renderPage(state); };
  }
  if(options.sortSelect){
    const ss = document.querySelector(options.sortSelect);
    if(ss) ss.onchange = () => { state.page = 1; renderPage(state); };
  }

  function renderPage(s){
    const all = getAllProperties().filter(p => p.category === (category==='sale' ? 'sale' : 'rent'));
    const q = (document.querySelector(s.searchInput)?.value || '').trim().toLowerCase();
    const areaVal = document.querySelector(s.areaFilter)?.value || '';
    const typeVal = document.querySelector(s.typeFilter)?.value || '';
    let filtered = all.filter(p => {
      let ok = true;
      if(q){
        const combined = `${p.name} ${p.location} ${p.type} ${p.description}`.toLowerCase();
        ok = combined.includes(q);
      }
      if(ok && areaVal) ok = p.location === areaVal;
      if(ok && typeVal) ok = p.type === typeVal;
      return ok;
    });

    const sortVal = document.querySelector(s.sortSelect)?.value || '';
    if(sortVal === 'price_asc') filtered.sort((a,b)=> (Number(a.price)||0) - (Number(b.price)||0));
    if(sortVal === 'price_desc') filtered.sort((a,b)=> (Number(b.price)||0) - (Number(a.price)||0));

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / s.pageSize));
    if(s.page > totalPages) s.page = totalPages;

    const start = (s.page - 1) * s.pageSize;
    const pageItems = filtered.slice(start, start + s.pageSize);

    target.innerHTML = '';
    if(pageItems.length === 0){
      if(emptyEl) emptyEl.classList.remove('hidden');
    } else {
      if(emptyEl) emptyEl.classList.add('hidden');
      pageItems.forEach(p => {
        const div = document.createElement('div');
        div.innerHTML = createPropertyCardHTML(p);
        target.appendChild(div.firstElementChild);
      });
    }

    const pagContainer = document.querySelector(s.paginationContainer);
    if(pagContainer){
      pagContainer.innerHTML = '';
      const prev = document.createElement('button');
      prev.className = 'btn';
      prev.textContent = 'Prev';
      prev.disabled = s.page <= 1;
      prev.onclick = () => { s.page = Math.max(1, s.page - 1); renderPage(s); };
      pagContainer.appendChild(prev);

      const info = document.createElement('div');
      info.style.display = 'flex';
      info.style.alignItems = 'center';
      info.style.gap = '8px';
      info.style.padding = '6px 10px';
      info.textContent = `Page ${s.page} of ${totalPages}`;
      pagContainer.appendChild(info);

      const next = document.createElement('button');
      next.className = 'btn';
      next.textContent = 'Next';
      next.disabled = s.page >= totalPages;
      next.onclick = () => { s.page = Math.min(totalPages, s.page + 1); renderPage(s); };
      pagContainer.appendChild(next);
    }
  }

  populateAreaOptions(options.areaFilter);
  renderPage(state);
}

/* ---------- Preview HTML for Sell page ---------- */
function createPropertyPreviewHTML(d){
  const img = d.image ? `<img src="${d.image}" alt="${escapeHtml(d.name)}" style="width:100%; border-radius:8px; margin-bottom:8px;">` : '';
  return `
    <div class="card">
      ${img}
      <div class="card-body">
        <h4 class="card-title">${escapeHtml(d.name || 'Untitled')}</h4>
        <div class="property-meta">${escapeHtml(d.location || '')} • ${escapeHtml(d.type || '')}</div>
        <div class="price mt-2">PKR ${formatPrice(d.price)}</div>
        <p class="card-desc mt-3">${d.description ? escapeHtml(d.description) : ''}</p>
        <div class="mt-3">
          <strong>Category:</strong> ${d.category || 'N/A'}<br/>
          <strong>Contact:</strong> ${escapeHtml(d.contact || '')}
        </div>
      </div>
    </div>
  `;
}

/* ---------- Optional: clear all (debug) ---------- */
function clearAllProperties(){
  if(confirm('Clear all saved properties?')) {
    localStorage.removeItem(STORAGE_KEY);
    if(window.currentRender) window.currentRender();
  }
}

/* ---------- Attach global behavior: detail modal close by click outside ---------- */
document.addEventListener('click', function(e){
  const modal = document.getElementById('detailModal');
  if(!modal) return;
  if(!modal.classList.contains('hidden') && e.target === modal){
    closeDetailModal();
  }
});

// expose theme helpers to pages
window.toggleTheme = toggleTheme;
window.applySavedTheme = applySavedTheme;
