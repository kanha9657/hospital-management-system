const adminTokenInput = document.getElementById('admin-token');
const btnLoad = document.getElementById('btn-load');
const toast = document.getElementById('toast');

const doctorForm = document.getElementById('doctor-form');
const docName = document.getElementById('doc-name');
const docSpec = document.getElementById('doc-spec');
const docClear = document.getElementById('doc-clear');
const doctorsList = document.getElementById('doctors-list');

const adminAppointments = document.getElementById('admin-appointments');

let editingDoctorId = null;

function showToast(text, success = true) {
  toast.textContent = text;
  toast.style.background = success ? 'linear-gradient(90deg,#046c4b,#06a77a)' : 'linear-gradient(90deg,#7c2a2a,#d9534f)';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

function tokenHeader() {
  return { 'Content-Type': 'application/json', 'x-admin-token': adminTokenInput.value.trim() };
}

async function loadAll() {
  await loadDoctors();
  await loadAppointments();
}

btnLoad.addEventListener('click', loadAll);

async function loadDoctors() {
  try {
    const res = await fetch('/api/admin/doctors', { headers: { 'x-admin-token': adminTokenInput.value }});
    if (res.status === 401) return showToast('Unauthorized token', false);
    const data = await res.json();
    if (!data.ok) throw new Error('Failed');
    doctorsList.innerHTML = data.doctors.map(d => `
      <div class="row doctor-row">
        <div>
          <strong>${escapeHtml(d.name)}</strong><div class="muted">${escapeHtml(d.specialization)}</div>
        </div>
        <div>
          <button class="btn ghost" data-action="edit" data-id="${d.id}" data-name="${escapeAttr(d.name)}" data-spec="${escapeAttr(d.specialization)}">Edit</button>
          <button class="btn" data-action="delete" data-id="${d.id}">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    showToast('Unable to load doctors', false);
  }
}

doctorsList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (action === 'edit') {
    editingDoctorId = id;
    docName.value = btn.dataset.name;
    docSpec.value = btn.dataset.spec;
    docName.focus();
  } else if (action === 'delete') {
    if (!confirm('Delete doctor? This will unassign appointments.')) return;
    try {
      const res = await fetch(`/api/admin/doctors/${id}`, { method: 'DELETE', headers: tokenHeader() });
      const data = await res.json();
      if (data.ok) {
        showToast('Doctor deleted');
        loadAll();
      } else showToast('Delete failed', false);
    } catch (err) {
      console.error(err);
      showToast('Network error', false);
    }
  }
});

doctorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = { name: docName.value.trim(), specialization: docSpec.value.trim() };
  if (!payload.name || !payload.specialization) return showToast('Provide name & specialization', false);
  try {
    const url = editingDoctorId ? `/api/admin/doctors/${editingDoctorId}` : '/api/admin/doctors';
    const method = editingDoctorId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: tokenHeader(), body: JSON.stringify(payload) });
    if (res.status === 401) return showToast('Unauthorized token', false);
    const data = await res.json();
    if (data.ok) {
      showToast(editingDoctorId ? 'Doctor updated' : 'Doctor added');
      doctorForm.reset();
      editingDoctorId = null;
      loadDoctors();
    } else {
      showToast('Save failed', false);
    }
  } catch (err) {
    console.error(err);
    showToast('Network error', false);
  }
});

docClear.addEventListener('click', () => { editingDoctorId = null; doctorForm.reset(); });

async function loadAppointments() {
  try {
    const res = await fetch('/api/admin/appointments', { headers: { 'x-admin-token': adminTokenInput.value }});
    if (res.status === 401) return showToast('Unauthorized token', false);
    const data = await res.json();
    if (!data.ok) throw new Error('Failed');
    adminAppointments.innerHTML = data.appointments.map(a => `
      <div class="row appointment-row">
        <div>
          <strong>${escapeHtml(a.name)}</strong>
          <div class="muted">${escapeHtml(a.disease)} • ${escapeHtml(a.email)} • ${escapeHtml(a.phone)}</div>
        </div>
        <div>
          <div class="muted">${new Date(a.appointment_date).toLocaleString()}<br/><small>${escapeHtml(a.doctor||'Any')}</small></div>
          <div style="margin-top:8px;">
            <button class="btn" data-action="delete" data-id="${a.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    showToast('Unable to load appointments', false);
  }
}

adminAppointments.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!confirm('Delete this appointment?')) return;
  try {
    const res = await fetch(`/api/admin/appointments/${id}`, { method: 'DELETE', headers: tokenHeader() });
    const data = await res.json();
    if (data.ok) {
      showToast('Appointment deleted');
      loadAppointments();
    } else showToast('Delete failed', false);
  } catch (err) {
    console.error(err);
    showToast('Network error', false);
  }
});

function escapeHtml(s){ if(!s && s !== 0) return ''; return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]; }); }
function escapeAttr(s){ return (s||'').replace(/"/g,'&quot;'); }
