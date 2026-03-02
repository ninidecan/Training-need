// ============================================
// APPLICATION STATE
// ============================================
let currentRole = null;
let currentWard = null;
let currentGroup = null;
let allData = [];
let wardData = {
  staff: { rn: 0, pn: 0, na: 0, aide: 0, other: 0, otherName: '' },
  potential: { fourMonth: [], short: [], graduate: [], practical: [] },
  needs: { fourMonth: [], short: [], graduate: [], practical: [] }
};

// Chart instances
let groupBarChart = null;
let groupPieChart = null;
let adminGroupChart = null;
let adminOrgPieChart = null;
let adminDemandChart = null;

// ============================================
// GOOGLE SHEETS API LAYER
// ============================================
const SheetsAPI = {
  async getAll() {
    try {
      const response = await fetch(`${API_URL}?action=getAll`);
      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      console.error('getAll error:', result.error);
      return [];
    } catch (error) {
      console.error('Network error (getAll):', error);
      showToast('ไม่สามารถเชื่อมต่อ Google Sheets ได้', 'error');
      return [];
    }
  },

  async create(record) {
    try {
      const response = await fetch(`${API_URL}?action=create`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(record)
      });
      const result = await response.json();
      return { isOk: result.success, id: result.id, error: result.error };
    } catch (error) {
      console.error('Network error (create):', error);
      return { isOk: false, error: error.toString() };
    }
  },

  async update(record) {
    try {
      const response = await fetch(`${API_URL}?action=update`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(record)
      });
      const result = await response.json();
      return { isOk: result.success, error: result.error };
    } catch (error) {
      console.error('Network error (update):', error);
      return { isOk: false, error: error.toString() };
    }
  },

  async delete(id) {
    try {
      const response = await fetch(`${API_URL}?action=delete&id=${encodeURIComponent(id)}`);
      const result = await response.json();
      return { isOk: result.success, error: result.error };
    } catch (error) {
      console.error('Network error (delete):', error);
      return { isOk: false, error: error.toString() };
    }
  }
};

// ============================================
// APP INITIALIZATION
// ============================================
async function initApp() {
  try {
    // Check API URL configuration
    if (API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
      document.getElementById('loadingScreen').classList.add('hidden');
      document.getElementById('loginPage').classList.remove('hidden');
      showToast('⚠️ กรุณาตั้งค่า API_URL ใน config.js ก่อน', 'warning');
      return;
    }

    // Load all data from Google Sheets
    allData = await SheetsAPI.getAll();

    // Hide loading, show login
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');

  } catch (error) {
    console.error('Init error:', error);
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
  }
}

// ============================================
// LOGIN & ROLE MANAGEMENT
// ============================================
function selectRole(role) {
  currentRole = role;
  const selectionArea = document.getElementById('selectionArea');
  const selectionTitle = document.getElementById('selectionTitle');
  const dropdown = document.getElementById('selectionDropdown');

  if (role === 'admin') {
    showAdminDashboard();
    return;
  }

  selectionArea.classList.remove('hidden');
  dropdown.innerHTML = '<option value="">-- กรุณาเลือก --</option>';

  if (role === 'ward') {
    selectionTitle.textContent = 'เลือกหอผู้ป่วย';
    WARDS.forEach(ward => {
      const group = GROUPS.find(g => g.id === ward.groupId);
      dropdown.innerHTML += `<option value="${ward.id}">${ward.name} (${group.name})</option>`;
    });
  } else if (role === 'group') {
    selectionTitle.textContent = 'เลือกกลุ่มงาน';
    GROUPS.forEach(group => {
      dropdown.innerHTML += `<option value="${group.id}">${group.name}</option>`;
    });
  }
}

function confirmLogin() {
  const dropdown = document.getElementById('selectionDropdown');
  const selectedValue = dropdown.value;

  if (!selectedValue) {
    showToast('กรุณาเลือกรายการ', 'warning');
    return;
  }

  if (currentRole === 'ward') {
    currentWard = WARDS.find(w => w.id === selectedValue);
    currentGroup = GROUPS.find(g => g.id === currentWard.groupId);
    loadWardData();
    showWardDashboard();
  } else if (currentRole === 'group') {
    currentGroup = GROUPS.find(g => g.id === selectedValue);
    showGroupDashboard();
  }
}

function logout() {
  currentRole = null;
  currentWard = null;
  currentGroup = null;
  wardData = {
    staff: { rn: 0, pn: 0, na: 0, aide: 0, other: 0, otherName: '' },
    potential: { fourMonth: [], short: [], graduate: [], practical: [] },
    needs: { fourMonth: [], short: [], graduate: [], practical: [] }
  };

  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('wardDashboard').classList.add('hidden');
  document.getElementById('groupDashboard').classList.add('hidden');
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('selectionArea').classList.add('hidden');
}

// ============================================
// WARD DASHBOARD
// ============================================
function showWardDashboard() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('wardDashboard').classList.remove('hidden');
  document.getElementById('wardNameDisplay').textContent = `${currentWard.name} - ${currentGroup.name}`;
  document.getElementById('requiredPercent').textContent = `${currentGroup.threshold}%`;
  showWardSection(1);
}

function showWardSection(section) {
  ['wardSection1', 'wardSection2', 'wardSection3'].forEach((id, idx) => {
    document.getElementById(id).classList.toggle('hidden', idx !== section - 1);
  });
  ['wardTab1', 'wardTab2', 'wardTab3'].forEach((id, idx) => {
    const tab = document.getElementById(id);
    if (idx === section - 1) {
      tab.classList.add('bg-primary', 'text-white');
      tab.classList.remove('text-gray-600', 'hover:bg-gray-100');
    } else {
      tab.classList.remove('bg-primary', 'text-white');
      tab.classList.add('text-gray-600', 'hover:bg-gray-100');
    }
  });
}

function loadWardData() {
  const existingData = allData.find(d => d.type === 'ward' && d.wardId === currentWard.id);
  if (existingData && existingData.data) {
    try {
      wardData = typeof existingData.data === 'string' ? JSON.parse(existingData.data) : existingData.data;
      populateWardForm();
    } catch (e) {
      console.error('Parse error:', e);
    }
  }
}

function populateWardForm() {
  document.getElementById('staffRN').value = wardData.staff.rn || 0;
  document.getElementById('staffPN').value = wardData.staff.pn || 0;
  document.getElementById('staffNA').value = wardData.staff.na || 0;
  document.getElementById('staffAide').value = wardData.staff.aide || 0;
  document.getElementById('staffOther').value = wardData.staff.other || 0;
  document.getElementById('staffOtherName').value = wardData.staff.otherName || '';

  renderPotentialCourses();
  renderNeedsCourses();
  calculatePotential();
}

function calculatePotential() {
  wardData.staff.rn = parseInt(document.getElementById('staffRN').value) || 0;
  wardData.staff.pn = parseInt(document.getElementById('staffPN').value) || 0;
  wardData.staff.na = parseInt(document.getElementById('staffNA').value) || 0;
  wardData.staff.aide = parseInt(document.getElementById('staffAide').value) || 0;
  wardData.staff.other = parseInt(document.getElementById('staffOther').value) || 0;
  wardData.staff.otherName = document.getElementById('staffOtherName').value || '';

  const totalStaff = wardData.staff.rn + wardData.staff.pn + wardData.staff.na + wardData.staff.aide + wardData.staff.other;
  document.getElementById('totalStaff').textContent = `${totalStaff} คน`;

  // 4-month specialty (exclude management)
  let completed4Month = 0, studying4Month = 0;
  wardData.potential.fourMonth.forEach(course => {
    if (!course.name.includes('บริหาร') && !course.name.includes('การจัดการ')) {
      completed4Month += course.completed || 0;
      studying4Month += course.studying || 0;
    }
  });
  document.getElementById('total4MonthCompleted').textContent = completed4Month;
  document.getElementById('total4MonthStudying').textContent = studying4Month;
  document.getElementById('total4MonthAll').textContent = completed4Month + studying4Month;

  // Short courses
  let completedShort = 0, studyingShort = 0;
  wardData.potential.short.forEach(c => { completedShort += c.completed || 0; studyingShort += c.studying || 0; });
  document.getElementById('totalShortCompleted').textContent = completedShort;
  document.getElementById('totalShortStudying').textContent = studyingShort;
  document.getElementById('totalShortAll').textContent = completedShort + studyingShort;

  // Graduate
  let completedGrad = 0, studyingGrad = 0;
  wardData.potential.graduate.forEach(c => { completedGrad += c.completed || 0; studyingGrad += c.studying || 0; });
  document.getElementById('totalGradCompleted').textContent = completedGrad;
  document.getElementById('totalGradStudying').textContent = studyingGrad;
  document.getElementById('totalGradAll').textContent = completedGrad + studyingGrad;

  // Practical
  let completedPractical = 0, studyingPractical = 0;
  wardData.potential.practical.forEach(c => { completedPractical += c.completed || 0; studyingPractical += c.studying || 0; });
  document.getElementById('totalPracticalCompleted').textContent = completedPractical;
  document.getElementById('totalPracticalStudying').textContent = studyingPractical;
  document.getElementById('totalPracticalAll').textContent = completedPractical + studyingPractical;

  // Potential percentage
  const totalRN = wardData.staff.rn;
  const potentialCount = completed4Month + studying4Month;
  let potentialPercent = totalRN > 0 ? (potentialCount / totalRN) * 100 : 0;

  document.getElementById('currentPotentialPercent').textContent = `${potentialPercent.toFixed(2)}%`;

  // Threshold check
  const threshold = currentGroup.threshold;
  const statusEl = document.getElementById('potentialStatus');
  const gapEl = document.getElementById('potentialGap');

  if (potentialPercent >= threshold) {
    statusEl.innerHTML = '<span class="badge badge-success text-base">✓ ผ่านเกณฑ์</span>';
    gapEl.classList.add('hidden');
  } else {
    statusEl.innerHTML = '<span class="badge badge-danger text-base">✗ ต่ำกว่าเกณฑ์</span>';
    gapEl.classList.remove('hidden');
    const gapPercent = threshold - potentialPercent;
    const gapPeople = Math.ceil((threshold / 100 * totalRN) - potentialCount);
    document.getElementById('gapPercent').textContent = gapPercent.toFixed(2);
    document.getElementById('gapPeople').textContent = Math.max(0, gapPeople);
  }

  calculateNeedsProjection();
}

function calculateNeedsProjection() {
  const totalRN = wardData.staff.rn;
  let currentPotential = 0;
  wardData.potential.fourMonth.forEach(c => {
    if (!c.name.includes('บริหาร') && !c.name.includes('การจัดการ')) {
      currentPotential += (c.completed || 0) + (c.studying || 0);
    }
  });

  let totalNeeds4Month = 0;
  wardData.needs.fourMonth.forEach(n => { totalNeeds4Month += (n.persons || []).length; });
  document.getElementById('totalNeed4Month').textContent = `${totalNeeds4Month} คน`;

  let newPotentialPercent = totalRN > 0 ? ((currentPotential + totalNeeds4Month) / totalRN) * 100 : 0;
  const el = document.getElementById('newPotential4Month');
  el.textContent = `${newPotentialPercent.toFixed(2)}%`;
  el.className = newPotentialPercent >= currentGroup.threshold ? 'font-bold text-green-600' : 'font-bold text-red-600';

  let totalNeedShort = 0;
  wardData.needs.short.forEach(n => totalNeedShort += (n.persons || []).length);
  document.getElementById('totalNeedShort').textContent = `${totalNeedShort} คน`;

  let totalNeedGrad = 0;
  wardData.needs.graduate.forEach(n => totalNeedGrad += (n.persons || []).length);
  document.getElementById('totalNeedGrad').textContent = `${totalNeedGrad} คน`;

  document.getElementById('totalNeedPractical').textContent = `${wardData.needs.practical.length} คน`;
}

// ============================================
// POTENTIAL COURSE MANAGEMENT
// ============================================
function addSpecialtyCourse(type) {
  const targetArray = type === '4month' ? wardData.potential.fourMonth :
                      type === 'short' ? wardData.potential.short :
                      type === 'graduate' ? wardData.potential.graduate : wardData.potential.practical;
  targetArray.push({ name: '', completed: 0, studying: 0 });
  renderPotentialCourses();
}

function removePotentialCourse(type, index) {
  const list = type === '4month' ? wardData.potential.fourMonth :
               type === 'short' ? wardData.potential.short :
               type === 'graduate' ? wardData.potential.graduate : wardData.potential.practical;
  list.splice(index, 1);
  renderPotentialCourses();
  calculatePotential();
}

function updatePotentialCourse(type, index, field, value) {
  const list = type === '4month' ? wardData.potential.fourMonth :
               type === 'short' ? wardData.potential.short :
               type === 'graduate' ? wardData.potential.graduate : wardData.potential.practical;
  if (field === 'name') list[index].name = value;
  else list[index][field] = parseInt(value) || 0;
  calculatePotential();
}

function renderPotentialCourses() {
  renderCourseList('4month', wardData.potential.fourMonth, 'specialty4MonthList', SPECIALTY_COURSES_4MONTH);
  renderCourseList('short', wardData.potential.short, 'shortCourseList', SHORT_COURSES);
  renderCourseList('graduate', wardData.potential.graduate, 'graduateList', GRADUATE_COURSES);
  renderCourseList('practical', wardData.potential.practical, 'practicalNurseList', PRACTICAL_COURSES);
}

function renderCourseList(type, courses, containerId, courseOptions) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  courses.forEach((course, idx) => {
    const div = document.createElement('div');
    div.className = 'flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl';
    div.innerHTML = `
      <select onchange="updatePotentialCourse('${type}', ${idx}, 'name', this.value)" 
        class="flex-1 min-w-[200px] p-2 border border-gray-200 rounded-lg focus:border-primary">
        <option value="">-- เลือกหลักสูตร --</option>
        ${courseOptions.map(c => `<option value="${c}" ${course.name === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-500">จบแล้ว:</label>
        <input type="number" min="0" value="${course.completed || 0}" 
          onchange="updatePotentialCourse('${type}', ${idx}, 'completed', this.value)"
          class="w-16 p-2 border border-gray-200 rounded-lg text-center">
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-500">กำลังเรียน:</label>
        <input type="number" min="0" value="${course.studying || 0}"
          onchange="updatePotentialCourse('${type}', ${idx}, 'studying', this.value)"
          class="w-16 p-2 border border-gray-200 rounded-lg text-center">
      </div>
      <button onclick="removePotentialCourse('${type}', ${idx})" 
        class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    `;
    container.appendChild(div);
  });
}

// ============================================
// NEEDS MANAGEMENT
// ============================================
function addNeedCourse(type) {
  const arr = type === '4month' ? wardData.needs.fourMonth :
              type === 'short' ? wardData.needs.short : wardData.needs.graduate;
  arr.push({ name: '', persons: [] });
  renderNeedsCourses();
}

function removeNeedCourse(type, index) {
  const arr = type === '4month' ? wardData.needs.fourMonth :
              type === 'short' ? wardData.needs.short : wardData.needs.graduate;
  arr.splice(index, 1);
  renderNeedsCourses();
  calculateNeedsProjection();
}

function updateNeedCourse(type, index, value) {
  const arr = type === '4month' ? wardData.needs.fourMonth :
              type === 'short' ? wardData.needs.short : wardData.needs.graduate;
  arr[index].name = value;
}

function addPersonToNeed(type, courseIndex) {
  const arr = type === '4month' ? wardData.needs.fourMonth :
              type === 'short' ? wardData.needs.short : wardData.needs.graduate;
  if (!arr[courseIndex].persons) arr[courseIndex].persons = [];
  arr[courseIndex].persons.push({ name: '' });
  renderNeedsCourses();
}

function updatePersonName(type, courseIndex, personIndex, value) {
  const arr = type === '4month' ? wardData.needs.fourMonth :
              type === 'short' ? wardData.needs.short : wardData.needs.graduate;
  arr[courseIndex].persons[personIndex].name = value;
}

function removePerson(type, courseIndex, personIndex) {
  const arr = type === '4month' ? wardData.needs.fourMonth :
              type === 'short' ? wardData.needs.short : wardData.needs.graduate;
  arr[courseIndex].persons.splice(personIndex, 1);
  renderNeedsCourses();
  calculateNeedsProjection();
}

function addPracticalNurseNeed() {
  wardData.needs.practical.push({ name: '' });
  renderNeedsCourses();
}

function updatePracticalNurseName(index, value) {
  wardData.needs.practical[index].name = value;
}

function removePracticalNurseNeed(index) {
  wardData.needs.practical.splice(index, 1);
  renderNeedsCourses();
  calculateNeedsProjection();
}

function renderNeedsCourses() {
  renderNeedList('4month', wardData.needs.fourMonth, 'need4MonthList', SPECIALTY_COURSES_4MONTH);
  renderNeedList('short', wardData.needs.short, 'needShortList', SHORT_COURSES);
  renderNeedList('graduate', wardData.needs.graduate, 'needGradList', GRADUATE_COURSES);
  renderPracticalNurseNeeds();
  calculateNeedsProjection();
}

function renderNeedList(type, needs, containerId, courseOptions) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  needs.forEach((need, idx) => {
    const div = document.createElement('div');
    div.className = 'p-4 border-2 border-gray-100 rounded-xl';
    div.innerHTML = `
      <div class="flex items-center gap-3 mb-3">
        <select onchange="updateNeedCourse('${type}', ${idx}, this.value)"
          class="flex-1 p-2 border border-gray-200 rounded-lg focus:border-primary">
          <option value="">-- เลือกหลักสูตร --</option>
          ${courseOptions.map(c => `<option value="${c}" ${need.name === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <button onclick="removeNeedCourse('${type}', ${idx})"
          class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
      <div class="space-y-2" id="persons-${type}-${idx}">
        ${(need.persons || []).map((person, pIdx) => `
          <div class="flex items-center gap-2">
            <input type="text" value="${person.name}" placeholder="ชื่อ-นามสกุล"
              onchange="updatePersonName('${type}', ${idx}, ${pIdx}, this.value)"
              class="flex-1 p-2 border border-gray-200 rounded-lg focus:border-primary">
            <button onclick="removePerson('${type}', ${idx}, ${pIdx})"
              class="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>
      <button onclick="addPersonToNeed('${type}', ${idx})"
        class="mt-2 w-full p-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors">
        + เพิ่มชื่อบุคลากร
      </button>
      <div class="mt-2 text-sm text-gray-500">
        จำนวน: <span class="font-semibold text-primary">${(need.persons || []).length}</span> คน
      </div>
    `;
    container.appendChild(div);
  });
}

function renderPracticalNurseNeeds() {
  const container = document.getElementById('needPracticalList');
  container.innerHTML = '';

  wardData.needs.practical.forEach((person, idx) => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 p-2 bg-gray-50 rounded-lg';
    div.innerHTML = `
      <span class="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm">${idx + 1}</span>
      <input type="text" value="${person.name}" placeholder="ชื่อ-นามสกุล"
        onchange="updatePracticalNurseName(${idx}, this.value)"
        class="flex-1 p-2 border border-gray-200 rounded-lg focus:border-primary">
      <button onclick="removePracticalNurseNeed(${idx})"
        class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;
    container.appendChild(div);
  });
}

// ============================================
// SAVE WARD DATA TO GOOGLE SHEETS
// ============================================
async function saveWardData() {
  const saveBtn = document.getElementById('saveWardBtn');
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" class="opacity-75"></path></svg><span>กำลังบันทึก...</span>';
  saveBtn.disabled = true;

  try {
    const existingRecord = allData.find(d => d.type === 'ward' && d.wardId === currentWard.id);

    const recordData = {
      type: 'ward',
      wardId: currentWard.id,
      wardName: currentWard.name,
      groupId: currentGroup.id,
      groupName: currentGroup.name,
      data: JSON.stringify(wardData),
      updatedAt: new Date().toISOString(),
      status: 'submitted'
    };

    let result;
    if (existingRecord) {
      recordData.id = existingRecord.id;
      recordData.createdAt = existingRecord.createdAt;
      result = await SheetsAPI.update(recordData);
    } else {
      recordData.createdAt = new Date().toISOString();
      result = await SheetsAPI.create(recordData);
    }

    if (result.isOk) {
      showToast('✅ บันทึกข้อมูลลง Google Sheets แล้ว', 'success');
      // Refresh data
      allData = await SheetsAPI.getAll();
    } else {
      showToast('เกิดข้อผิดพลาดในการบันทึก: ' + (result.error || ''), 'error');
    }
  } catch (error) {
    console.error('Save error:', error);
    showToast('เกิดข้อผิดพลาด', 'error');
  } finally {
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  }
}

// ============================================
// GROUP DASHBOARD
// ============================================
function showGroupDashboard() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('groupDashboard').classList.remove('hidden');
  document.getElementById('groupNameDisplay').textContent = currentGroup.name;
  showGroupSection(1);
  renderGroupData();
}

function showGroupSection(section) {
  ['groupSection1', 'groupSection2'].forEach((id, idx) => {
    document.getElementById(id).classList.toggle('hidden', idx !== section - 1);
  });
  ['groupTab1', 'groupTab2'].forEach((id, idx) => {
    const tab = document.getElementById(id);
    if (idx === section - 1) {
      tab.classList.add('bg-green-600', 'text-white');
      tab.classList.remove('text-gray-600', 'hover:bg-gray-100');
    } else {
      tab.classList.remove('bg-green-600', 'text-white');
      tab.classList.add('text-gray-600', 'hover:bg-gray-100');
    }
  });
}

function renderGroupData() {
  const groupWards = WARDS.filter(w => w.groupId === currentGroup.id);
  const groupWardData = allData.filter(d => d.type === 'ward' && d.groupId === currentGroup.id);

  const summaryContainer = document.getElementById('groupPotentialSummary');
  summaryContainer.innerHTML = '';

  let chartLabels = [];
  let chartData = [];

  groupWards.forEach(ward => {
    const wardRecord = groupWardData.find(d => d.wardId === ward.id);
    let stats = { rn: 0, potential: 0, percent: 0 };

    if (wardRecord && wardRecord.data) {
      try {
        const data = typeof wardRecord.data === 'string' ? JSON.parse(wardRecord.data) : wardRecord.data;
        stats.rn = data.staff.rn || 0;
        let potentialCount = 0;
        (data.potential.fourMonth || []).forEach(c => {
          if (!c.name.includes('บริหาร') && !c.name.includes('การจัดการ')) {
            potentialCount += (c.completed || 0) + (c.studying || 0);
          }
        });
        stats.potential = potentialCount;
        stats.percent = stats.rn > 0 ? (potentialCount / stats.rn * 100) : 0;
      } catch (e) {}
    }

    chartLabels.push(ward.name);
    chartData.push(stats.percent.toFixed(1));

    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-xl';
    div.innerHTML = `
      <div>
        <h4 class="font-semibold text-gray-800">${ward.name}</h4>
        <p class="text-sm text-gray-500">พยาบาล: ${stats.rn} คน | เฉพาะทาง: ${stats.potential} คน</p>
      </div>
      <div class="text-right">
        <p class="text-2xl font-bold ${stats.percent >= currentGroup.threshold ? 'text-green-600' : 'text-red-600'}">${stats.percent.toFixed(1)}%</p>
        <span class="badge ${stats.percent >= currentGroup.threshold ? 'badge-success' : 'badge-danger'}">
          ${stats.percent >= currentGroup.threshold ? '✓ ผ่านเกณฑ์' : '✗ ต่ำกว่าเกณฑ์'}
        </span>
      </div>
    `;
    summaryContainer.appendChild(div);
  });

  renderGroupCharts(chartLabels, chartData);
  renderGroupNeeds(groupWardData);
}

function renderGroupCharts(labels, data) {
  if (groupBarChart) groupBarChart.destroy();
  if (groupPieChart) groupPieChart.destroy();

  const barCtx = document.getElementById('groupBarChart').getContext('2d');
  groupBarChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: 'ศักยภาพ (%)', data: data, backgroundColor: data.map(v => parseFloat(v) >= currentGroup.threshold ? '#10b981' : '#ef4444'), borderRadius: 8 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } } }
  });

  const passCount = data.filter(v => parseFloat(v) >= currentGroup.threshold).length;
  const failCount = data.length - passCount;
  const pieCtx = document.getElementById('groupPieChart').getContext('2d');
  groupPieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: { labels: ['ผ่านเกณฑ์', 'ต่ำกว่าเกณฑ์'], datasets: [{ data: [passCount, failCount], backgroundColor: ['#10b981', '#ef4444'] }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function renderGroupNeeds(groupWardData) {
  const container = document.getElementById('groupNeedsSummary');
  container.innerHTML = '';

  const needsByType = { '4month': {}, 'short': {}, 'graduate': {}, 'practical': [] };

  groupWardData.forEach(record => {
    if (!record.data) return;
    try {
      const data = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
      const ward = WARDS.find(w => w.id === record.wardId);

      ['fourMonth', 'short', 'graduate'].forEach(type => {
        const typeKey = type === 'fourMonth' ? '4month' : type;
        (data.needs[type] || []).forEach(need => {
          if (!need.name) return;
          if (!needsByType[typeKey][need.name]) needsByType[typeKey][need.name] = [];
          (need.persons || []).forEach(person => {
            if (person.name) {
              needsByType[typeKey][need.name].push({ name: person.name, ward: ward ? ward.name : 'N/A', wardId: record.wardId });
            }
          });
        });
      });

      (data.needs.practical || []).forEach(person => {
        if (person.name) needsByType.practical.push({ name: person.name, ward: ward ? ward.name : 'N/A', wardId: record.wardId });
      });
    } catch (e) {}
  });

  const typeLabels = { '4month': 'หลักสูตรเฉพาะทาง (4 เดือน)', 'short': 'หลักสูตรระยะสั้น', 'graduate': 'ระดับบัณฑิตศึกษา', 'practical': 'หลักสูตรผู้ช่วยพยาบาล' };
  const typeColors = { '4month': 'blue', 'short': 'green', 'graduate': 'purple', 'practical': 'orange' };
  const borderColors = { '4month': '#3b82f6', 'short': '#10b981', 'graduate': '#8b5cf6', 'practical': '#f97316' };

  ['4month', 'short', 'graduate'].forEach(type => {
    const needs = needsByType[type];
    if (Object.keys(needs).length === 0) return;

    const section = document.createElement('div');
    section.className = 'border-l-4 pl-4 mb-6';
    section.style.borderColor = borderColors[type];

    let html = `<h3 class="text-lg font-semibold text-${typeColors[type]}-600 mb-3">${typeLabels[type]}</h3>`;
    Object.entries(needs).forEach(([courseName, persons]) => {
      html += `
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 class="font-medium text-gray-700 mb-2">${courseName} <span class="text-sm text-gray-500">(${persons.length} คน)</span></h4>
          <div class="space-y-1">
            ${persons.map((p, idx) => `
              <div class="flex items-center justify-between py-1 px-2 bg-white rounded">
                <span class="text-sm">${p.name} <span class="text-xs text-gray-400">(${p.ward})</span></span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    section.innerHTML = html;
    container.appendChild(section);
  });

  if (needsByType.practical.length > 0) {
    const section = document.createElement('div');
    section.className = 'border-l-4 pl-4';
    section.style.borderColor = '#f97316';
    section.innerHTML = `
      <h3 class="text-lg font-semibold text-orange-600 mb-3">${typeLabels.practical} (${needsByType.practical.length} คน)</h3>
      <div class="space-y-1">
        ${needsByType.practical.map(p => `
          <div class="flex items-center justify-between py-1 px-2 bg-gray-50 rounded">
            <span class="text-sm">${p.name} <span class="text-xs text-gray-400">(${p.ward})</span></span>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(section);
  }
}

// ============================================
// ADMIN DASHBOARD
// ============================================
function showAdminDashboard() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');
  showAdminSection(1);
  renderAdminData();
}

function showAdminSection(section) {
  ['adminSection1', 'adminSection2', 'adminSection3'].forEach((id, idx) => {
    document.getElementById(id).classList.toggle('hidden', idx !== section - 1);
  });
  ['adminTab1', 'adminTab2', 'adminTab3'].forEach((id, idx) => {
    const tab = document.getElementById(id);
    if (idx === section - 1) {
      tab.classList.add('bg-purple-600', 'text-white');
      tab.classList.remove('text-gray-600', 'hover:bg-gray-100');
    } else {
      tab.classList.remove('bg-purple-600', 'text-white');
      tab.classList.add('text-gray-600', 'hover:bg-gray-100');
    }
  });
}

function parseWardRecord(record) {
  if (!record || !record.data) return null;
  try {
    return typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
  } catch (e) { return null; }
}

function getWardStats(record, group) {
  const data = parseWardRecord(record);
  if (!data) return { rn: 0, potential: 0, percent: 0 };
  const rn = data.staff.rn || 0;
  let potential = 0;
  (data.potential.fourMonth || []).forEach(c => {
    if (!c.name.includes('บริหาร') && !c.name.includes('การจัดการ')) {
      potential += (c.completed || 0) + (c.studying || 0);
    }
  });
  return { rn, potential, percent: rn > 0 ? (potential / rn * 100) : 0 };
}

function renderAdminData() {
  const wardRecords = allData.filter(d => d.type === 'ward');

  document.getElementById('adminTotalGroups').textContent = GROUPS.length;
  document.getElementById('adminTotalWards').textContent = WARDS.length;

  let totalNurses = 0, totalPercent = 0, wardCount = 0;
  wardRecords.forEach(record => {
    const data = parseWardRecord(record);
    if (!data) return;
    totalNurses += data.staff.rn || 0;
    let pot = 0;
    (data.potential.fourMonth || []).forEach(c => {
      if (!c.name.includes('บริหาร') && !c.name.includes('การจัดการ')) pot += (c.completed || 0) + (c.studying || 0);
    });
    if (data.staff.rn > 0) { totalPercent += (pot / data.staff.rn * 100); wardCount++; }
  });

  document.getElementById('adminTotalNurses').textContent = totalNurses;
  document.getElementById('adminAvgPotential').textContent = wardCount > 0 ? (totalPercent / wardCount).toFixed(1) + '%' : '0%';

  renderAdminPotentialTable(wardRecords);
  renderAdminDemands(wardRecords);
  renderAdminCharts(wardRecords);
}

function renderAdminPotentialTable(wardRecords) {
  const tbody = document.getElementById('adminPotentialTable');
  tbody.innerHTML = '';

  WARDS.forEach(ward => {
    const group = GROUPS.find(g => g.id === ward.groupId);
    const record = wardRecords.find(r => r.wardId === ward.id);
    const stats = getWardStats(record, group);

    const row = document.createElement('tr');
    row.className = 'border-b border-gray-100 hover:bg-gray-50';
    row.innerHTML = `
      <td class="py-3 px-4 text-sm">${group.name}</td>
      <td class="py-3 px-4 font-medium">${ward.name}</td>
      <td class="py-3 px-4 text-center">${stats.rn}</td>
      <td class="py-3 px-4 text-center">${stats.potential}</td>
      <td class="py-3 px-4 text-center font-semibold ${stats.percent >= group.threshold ? 'text-green-600' : 'text-red-600'}">${stats.percent.toFixed(1)}%</td>
      <td class="py-3 px-4 text-center text-gray-500">${group.threshold}%</td>
      <td class="py-3 px-4 text-center">
        <span class="badge ${stats.percent >= group.threshold ? 'badge-success' : 'badge-danger'}">
          ${stats.percent >= group.threshold ? '✓' : '✗'}
        </span>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderAdminDemands(wardRecords) {
  const container = document.getElementById('adminAllDemands');
  container.innerHTML = '';

  const allNeeds = { '4month': {}, 'short': {}, 'graduate': {}, 'practical': [] };

  wardRecords.forEach(record => {
    const data = parseWardRecord(record);
    if (!data) return;
    const ward = WARDS.find(w => w.id === record.wardId);
    const group = GROUPS.find(g => g.id === record.groupId);

    ['fourMonth', 'short', 'graduate'].forEach(type => {
      const typeKey = type === 'fourMonth' ? '4month' : type;
      (data.needs[type] || []).forEach(need => {
        if (!need.name) return;
        if (!allNeeds[typeKey][need.name]) allNeeds[typeKey][need.name] = [];
        (need.persons || []).forEach(person => {
          if (person.name) {
            allNeeds[typeKey][need.name].push({ name: person.name, ward: ward ? ward.name : 'N/A', group: group ? group.name : 'N/A', wardId: record.wardId });
          }
        });
      });
    });

    (data.needs.practical || []).forEach(person => {
      if (person.name) allNeeds.practical.push({ name: person.name, ward: ward ? ward.name : 'N/A', group: group ? group.name : 'N/A', wardId: record.wardId });
    });
  });

  const typeLabels = { '4month': 'หลักสูตรเฉพาะทาง (4 เดือน)', 'short': 'หลักสูตรระยะสั้น', 'graduate': 'ระดับบัณฑิตศึกษา', 'practical': 'หลักสูตรผู้ช่วยพยาบาล' };

  ['4month', 'short', 'graduate'].forEach(type => {
    const needs = allNeeds[type];
    if (Object.keys(needs).length === 0) return;

    const section = document.createElement('div');
    section.className = 'mb-6';
    section.innerHTML = `
      <h3 class="text-lg font-semibold text-purple-700 mb-4 border-b-2 border-purple-200 pb-2">${typeLabels[type]}</h3>
      <div class="space-y-4">
        ${Object.entries(needs).map(([courseName, persons]) => `
          <div class="bg-gray-50 rounded-xl p-4">
            <h4 class="font-medium text-gray-700 mb-3">${courseName} <span class="text-sm text-gray-500 ml-2">(${persons.length} คน)</span></h4>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead><tr class="text-left text-gray-500"><th class="pb-2">ชื่อ-นามสกุล</th><th class="pb-2">หอผู้ป่วย</th><th class="pb-2">กลุ่มงาน</th></tr></thead>
                <tbody>
                  ${persons.map(p => `
                    <tr class="border-t border-gray-200">
                      <td class="py-2">${p.name}</td>
                      <td class="py-2">${p.ward}</td>
                      <td class="py-2 text-gray-500">${p.group}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(section);
  });

  if (allNeeds.practical.length > 0) {
    const section = document.createElement('div');
    section.innerHTML = `
      <h3 class="text-lg font-semibold text-purple-700 mb-4 border-b-2 border-purple-200 pb-2">${typeLabels.practical} (${allNeeds.practical.length} คน)</h3>
      <div class="bg-gray-50 rounded-xl p-4">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-left text-gray-500"><th class="pb-2">ชื่อ-นามสกุล</th><th class="pb-2">หอผู้ป่วย</th><th class="pb-2">กลุ่มงาน</th></tr></thead>
            <tbody>
              ${allNeeds.practical.map(p => `
                <tr class="border-t border-gray-200"><td class="py-2">${p.name}</td><td class="py-2">${p.ward}</td><td class="py-2 text-gray-500">${p.group}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(section);
  }
}

function renderAdminCharts(wardRecords) {
  if (adminGroupChart) adminGroupChart.destroy();
  if (adminOrgPieChart) adminOrgPieChart.destroy();
  if (adminDemandChart) adminDemandChart.destroy();

  // Group potential chart
  const groupStats = GROUPS.map(group => {
    const groupWards = WARDS.filter(w => w.groupId === group.id);
    let totalRN = 0, totalPotential = 0;
    groupWards.forEach(ward => {
      const record = wardRecords.find(r => r.wardId === ward.id);
      const data = parseWardRecord(record);
      if (!data) return;
      totalRN += data.staff.rn || 0;
      (data.potential.fourMonth || []).forEach(c => {
        if (!c.name.includes('บริหาร') && !c.name.includes('การจัดการ')) totalPotential += (c.completed || 0) + (c.studying || 0);
      });
    });
    return { name: group.name.replace('การพยาบาล', '').trim(), percent: totalRN > 0 ? (totalPotential / totalRN * 100) : 0, threshold: group.threshold };
  });

  const groupCtx = document.getElementById('adminGroupChart').getContext('2d');
  adminGroupChart = new Chart(groupCtx, {
    type: 'bar',
    data: {
      labels: groupStats.map(g => g.name),
      datasets: [{ label: 'ศักยภาพ (%)', data: groupStats.map(g => g.percent.toFixed(1)), backgroundColor: groupStats.map(g => g.percent >= g.threshold ? '#10b981' : '#ef4444'), borderRadius: 8 }]
    },
    options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } } }
  });

  // Organization pie
  let passCount = 0, failCount = 0;
  WARDS.forEach(ward => {
    const group = GROUPS.find(g => g.id === ward.groupId);
    const record = wardRecords.find(r => r.wardId === ward.id);
    const stats = getWardStats(record, group);
    if (stats.percent >= group.threshold) passCount++; else failCount++;
  });

  const pieCtx = document.getElementById('adminOrgPieChart').getContext('2d');
  adminOrgPieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: { labels: ['ผ่านเกณฑ์', 'ต่ำกว่าเกณฑ์'], datasets: [{ data: [passCount, failCount], backgroundColor: ['#10b981', '#ef4444'] }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });

  // Demand chart
  const demandCounts = {};
  wardRecords.forEach(record => {
    const data = parseWardRecord(record);
    if (!data) return;
    (data.needs.fourMonth || []).forEach(need => {
      if (need.name) {
        const shortName = need.name.replace('การพยาบาล', '').substring(0, 20);
        demandCounts[shortName] = (demandCounts[shortName] || 0) + (need.persons || []).length;
      }
    });
  });

  const demandLabels = Object.keys(demandCounts);
  const demandData = Object.values(demandCounts);

  if (demandLabels.length > 0) {
    const demandCtx = document.getElementById('adminDemandChart').getContext('2d');
    adminDemandChart = new Chart(demandCtx, {
      type: 'bar',
      data: { labels: demandLabels, datasets: [{ label: 'จำนวนความต้องการ (คน)', data: demandData, backgroundColor: '#8b5cf6', borderRadius: 8 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }
}

async function refreshAdminData() {
  showToast('กำลังโหลดข้อมูล...', 'info');
  allData = await SheetsAPI.getAll();
  renderAdminData();
  showToast('รีเฟรชข้อมูลแล้ว', 'success');
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
function exportWardExcel() {
  const data = [
    ['ระบบสำรวจความต้องการศึกษาต่อเนื่อง'],
    [`หอผู้ป่วย: ${currentWard.name}`],
    [`กลุ่มงาน: ${currentGroup.name}`],
    [''],
    ['ข้อมูลบุคลากร'],
    ['ประเภท', 'จำนวน (คน)'],
    ['พยาบาลวิชาชีพ', wardData.staff.rn],
    ['ผู้ช่วยพยาบาล', wardData.staff.pn],
    ['ผู้ช่วยเหลือคนไข้', wardData.staff.na],
    ['พนักงานช่วยการพยาบาล', wardData.staff.aide],
    ['อื่น ๆ', wardData.staff.other],
    [''],
    ['ศักยภาพหลักสูตรเฉพาะทาง (4 เดือน)'],
    ['หลักสูตร', 'จบแล้ว', 'กำลังเรียน']
  ];
  wardData.potential.fourMonth.forEach(c => data.push([c.name, c.completed, c.studying]));
  data.push([''], ['ความต้องการหลักสูตรเฉพาะทาง (4 เดือน)'], ['หลักสูตร', 'ชื่อ-นามสกุล']);
  wardData.needs.fourMonth.forEach(n => (n.persons || []).forEach(p => data.push([n.name, p.name])));
  downloadCSV(data, `ward_${currentWard.id}_data.csv`);
}

function exportGroupExcel() {
  const groupWards = WARDS.filter(w => w.groupId === currentGroup.id);
  const groupWardData = allData.filter(d => d.type === 'ward' && d.groupId === currentGroup.id);
  const data = [
    ['ระบบสำรวจความต้องการศึกษาต่อเนื่อง'],
    [`กลุ่มงาน: ${currentGroup.name}`],
    [''],
    ['สรุปศักยภาพตามหอผู้ป่วย'],
    ['หอผู้ป่วย', 'พยาบาล (คน)', 'เฉพาะทาง (คน)', 'ศักยภาพ (%)']
  ];
  groupWards.forEach(ward => {
    const record = groupWardData.find(d => d.wardId === ward.id);
    const stats = getWardStats(record);
    data.push([ward.name, stats.rn, stats.potential, stats.percent.toFixed(1)]);
  });
  downloadCSV(data, `group_${currentGroup.id}_data.csv`);
}

function exportAdminExcel() {
  const wardRecords = allData.filter(d => d.type === 'ward');
  const data = [
    ['ระบบสำรวจความต้องการศึกษาต่อเนื่อง - ข้อมูลทั้งองค์กร'],
    [''],
    ['สรุปศักยภาพทุกหอผู้ป่วย'],
    ['กลุ่มงาน', 'หอผู้ป่วย', 'พยาบาล', 'เฉพาะทาง', 'ศักยภาพ (%)', 'เกณฑ์ (%)']
  ];
  WARDS.forEach(ward => {
    const group = GROUPS.find(g => g.id === ward.groupId);
    const record = wardRecords.find(r => r.wardId === ward.id);
    const stats = getWardStats(record, group);
    data.push([group.name, ward.name, stats.rn, stats.potential, stats.percent.toFixed(1), group.threshold]);
  });
  downloadCSV(data, 'organization_education_needs.csv');
}

function downloadCSV(data, filename) {
  const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  showToast('ดาวน์โหลดไฟล์แล้ว', 'success');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  toastMessage.textContent = message;
  toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 transition-all';
  if (type === 'success') toast.classList.add('bg-green-600', 'text-white');
  else if (type === 'error') toast.classList.add('bg-red-600', 'text-white');
  else if (type === 'warning') toast.classList.add('bg-yellow-500', 'text-white');
  else toast.classList.add('bg-gray-800', 'text-white');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

let confirmCallback = null;

function showConfirm(message, callback) {
  document.getElementById('confirmMessage').textContent = message;
  document.getElementById('confirmModal').classList.remove('hidden');
  confirmCallback = callback;
  document.getElementById('confirmBtn').onclick = async () => {
    closeConfirmModal();
    if (confirmCallback) await confirmCallback();
  };
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.add('hidden');
  confirmCallback = null;
}

function renderCurrentView() {
  if (currentRole === 'ward' && currentWard) loadWardData();
  else if (currentRole === 'group' && currentGroup) renderGroupData();
  else if (currentRole === 'admin') renderAdminData();
}

function showWardDashboardView() {
  showToast('กรุณาดูที่ส่วนที่ 2.5 สรุปศักยภาพ', 'info');
  showWardSection(2);
}

function showGroupCharts() {
  showGroupSection(1);
  showToast('กำลังแสดง Dashboard', 'info');
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', initApp);
