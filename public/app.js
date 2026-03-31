const form = document.getElementById('appointment-form');
const diseaseSelect = document.getElementById('disease');
const doctorSelect = document.getElementById('doctor');
const toast = document.getElementById('toast');
const appointmentsDiv = document.getElementById('appointments');
const viewBtn = document.getElementById('view-appointments');

let doctors = [];

function showToast(text, success = true) {
  toast.textContent = text;
  toast.style.background = success ? 'linear-gradient(90deg,#046c4b,#06a77a)' : 'linear-gradient(90deg,#7c2a2a,#d9534f)';
  toast.classList.remove('hidden');
  toast.animate([{opacity:0, transform: 'translateY(8px)'},{opacity:1, transform:'translateY(0)'}], {duration:220, easing:'ease-out'});
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

async function loadDoctors() {
  try {
    const res = await fetch('/api/doctors');
    const data = await res.json();
    if (!data.ok) throw new Error('Failed');
    doctors = data.doctors;
    populateDiseaseOptions();
    populateDoctorOptions();
  } catch (err) {
    console.error(err);
    showToast('Unable to load doctors. Running offline sample.', false);
    // fallback sample
    doctors = [
      {id:1, name:'Dr. Asha Patel', specialization:'Cardiology'},
      {id:2, name:'Dr. Rohit Kumar', specialization:'General Medicine'},
      {id:3, name:'Dr. Meera Singh', specialization:'Dermatology'}
    ];
    populateDiseaseOptions();
    populateDoctorOptions();
  }
}

function unique(arr) {
  return [...new Set(arr)];
}

function populateDiseaseOptions() {
  // use specializations as "diseases" / concerns
  const specializations = unique(doctors.map(d => d.specialization));
  // add some common concerns
  const extras = ['Fever', 'Cold & Cough', 'Diabetes', 'Hypertension'];
  const items = [...specializations, ...extras].slice(0, 12);
  diseaseSelect.innerHTML = '<option value="">Select a concern</option>' + items.map(s => `<option value="${s}">${s}</option>`).join('');
}

function populateDoctorOptions(filterSpecialization) {
  const items = filterSpecialization ? doctors.filter(d => d.specialization === filterSpecialization) : doctors;
  doctorSelect.innerHTML = '<option value="">Any available</option>' + items.map(d => `<option value="${d.id}">${d.name} — ${d.specialization}</option>`).join('');
}

diseaseSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  populateDoctorOptions(val);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    disease: document.getElementById('disease').value,
    doctor_id: document.getElementById('doctor').value || null,
    appointment_date: document.getElementById('appointment_date').value
  };

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.ok) {
      showToast('Appointment booked ✅');
      form.reset();
      loadAppointments();
    } else {
      // show server-provided error if available
      showToast(data.error || 'Failed to book appointment', false);
      console.error('Booking failed:', data);
    }
  } catch (err) {
    console.error(err);
    showToast('Network error', false);
  }
});

async function loadAppointments() {
  try {
    const res = await fetch('/api/appointments');
    const data = await res.json();
    if (!data.ok) throw new Error('Failed');
    const rows = data.appointments;
    if (!rows.length) {
      appointmentsDiv.innerHTML = '<div class="muted">No appointments yet.</div>';
      return;
    }
    appointmentsDiv.innerHTML = rows.map(r => `
      <div class="appointment-item">
        <div>
          <div><strong>${escapeHtml(r.name)}</strong> <span class="muted">• ${escapeHtml(r.disease)}</span></div>
          <div class="muted">${escapeHtml(r.email)} • ${escapeHtml(r.phone)}</div>
        </div>
        <div class="muted">${new Date(r.appointment_date).toLocaleString()}<br/><small>${escapeHtml(r.doctor||'Any')}</small></div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
    appointmentsDiv.innerHTML = '<div class="muted">Unable to load appointments</div>';
  }
}

function escapeHtml(s){
  if(!s && s !== 0) return '';
  return String(s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c];
  });
}

viewBtn.addEventListener('click', (e) => {
  loadAppointments();
  window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
});

// init
loadDoctors();
loadAppointments();
