(function() {
	'use strict';

	/** State and storage **/
	const STORAGE_KEY = 'clasa6b_data_v1';
	const THEME_KEY = 'clasa6b_theme';

	/** Elements **/
	const sections = () => document.querySelectorAll('.section');
	const navLinks = () => document.querySelectorAll('.nav-link');
	const yearEl = () => document.getElementById('year');

	// Header actions
	const darkModeToggle = () => document.getElementById('darkModeToggle');
	const exportBtn = () => document.getElementById('exportBtn');
	const importBtn = () => document.getElementById('importBtn');
	const importFileInput = () => document.getElementById('importFileInput');
	const shareLinkBtn = () => document.getElementById('shareLinkBtn');

	// Manuale
	const manualForm = () => document.getElementById('manualForm');
	const manualSubject = () => document.getElementById('manualSubject');
	const manualUrl = () => document.getElementById('manualUrl');
	const manualSearch = () => document.getElementById('manualSearch');
	const manualeList = () => document.getElementById('manualeList');

	// Teme
	const temaForm = () => document.getElementById('temaForm');
	const temaSubject = () => document.getElementById('temaSubject');
	const temaTitle = () => document.getElementById('temaTitle');
	const temaDue = () => document.getElementById('temaDue');
	const temaPriority = () => document.getElementById('temaPriority');
	const temaTeacher = () => document.getElementById('temaTeacher');
	const temaSearch = () => document.getElementById('temaSearch');
	const temeList = () => document.getElementById('temeList');
	const filterBtns = () => document.querySelectorAll('.filter-btn');

	/** Utils **/
	function readData() {
		try {
			const fromUrl = new URLSearchParams(location.search).get('data');
			if (fromUrl) {
				const json = JSON.parse(decodeURIComponent(atob(fromUrl)));
				localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
				// clean the URL to avoid confusion
				history.replaceState({}, '', location.pathname);
				return json;
			}
			const raw = localStorage.getItem(STORAGE_KEY);
			return raw ? JSON.parse(raw) : { manuals: [], homework: [] };
		} catch (e) {
			console.error('readData failed', e);
			return { manuals: [], homework: [] };
		}
	}
	function writeData(data) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	}
	function uid() {
		return Math.random().toString(36).slice(2) + Date.now().toString(36);
	}
	function validUrl(url) {
		try { new URL(url); return true; } catch { return false; }
	}
	function formatDateISO(dateStr) {
		if (!dateStr) return '';
		try { const d = new Date(dateStr); return d.toLocaleDateString('ro-RO'); } catch { return dateStr; }
	}
	function isThisWeek(d) {
		const date = new Date(d); if (isNaN(date)) return false;
		const now = new Date();
		const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1);
		start.setHours(0,0,0,0);
		const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
		return date >= start && date <= end;
	}
	function isNextWeek(d) {
		const date = new Date(d); if (isNaN(date)) return false;
		const now = new Date();
		const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 8);
		start.setHours(0,0,0,0);
		const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
		return date >= start && date <= end;
	}

	/** Render **/
	function render() {
		const data = readData();
		renderManuale(data);
		renderTeme(data);
	}

	function renderManuale(data) {
		const list = manualeList(); if (!list) return;
		const q = (manualSearch()?.value || '').toLowerCase().trim();
		const items = data.manuals.filter(m => !q || m.subject.toLowerCase().includes(q) || (m.url||'').toLowerCase().includes(q));
		list.innerHTML = items.map(m => manualCardHtml(m)).join('') || emptyState('Nu există manuale. Adaugă mai sus.');
		// attach actions
		items.forEach(m => attachManualActions(m.id));
	}

	function manualCardHtml(m) {
		const domain = (() => { try { return new URL(m.url).hostname.replace('www.',''); } catch { return ''; } })();
		return `
			<div class="manual-card" data-id="${m.id}">
				<div class="manual-icon"><i class="fas fa-book"></i></div>
				<h3>${escapeHtml(m.subject)}</h3>
				<p>${domain ? '• ' + domain : ''}</p>
				<div class="manual-actions">
					<a class="btn btn-outline" href="${m.url}" target="_blank" rel="noopener">Deschide</a>
					<button class="btn btn-small" data-action="edit">Editează</button>
					<button class="btn btn-small" data-action="delete">Șterge</button>
				</div>
			</div>
		`;
	}

	function attachManualActions(id) {
		const root = document.querySelector(`.manual-card[data-id="${CSS.escape(id)}"]`);
		if (!root) return;
		root.querySelector('[data-action="edit"]').addEventListener('click', () => onEditManual(id));
		root.querySelector('[data-action="delete"]').addEventListener('click', () => onDeleteManual(id));
	}

	function renderTeme(data) {
		const list = temeList(); if (!list) return;
		const q = (temaSearch()?.value || '').toLowerCase().trim();
		const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
		let items = data.homework.slice().sort((a,b) => new Date(a.due||0) - new Date(b.due||0));
		if (q) items = items.filter(t => t.subject.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || (t.teacher||'').toLowerCase().includes(q));
		if (activeFilter === 'urgent') items = items.filter(t => t.priority === 'urgent');
		if (activeFilter === 'this-week') items = items.filter(t => isThisWeek(t.due));
		if (activeFilter === 'next-week') items = items.filter(t => isNextWeek(t.due));
		list.innerHTML = items.map(t => temaCardHtml(t)).join('') || emptyState('Nu există teme. Adaugă mai sus.');
		items.forEach(t => attachTemaActions(t.id));
	}

	function temaCardHtml(t) {
		return `
			<div class="tema-card" data-id="${t.id}">
				<div class="tema-header">
					<h3>${escapeHtml(t.subject)} – ${escapeHtml(t.title)}</h3>
					<span class="tema-priority ${t.priority === 'urgent' ? 'urgent' : 'normal'}">${t.priority === 'urgent' ? 'Urgent' : 'Normal'}</span>
				</div>
				<div class="tema-content">
					<p><strong>Termen:</strong> ${formatDateISO(t.due)} ${t.teacher ? ' • ' + escapeHtml(t.teacher) : ''}</p>
				</div>
				<div class="tema-actions">
					<button class="btn btn-small" data-action="edit">Editează</button>
					<button class="btn btn-small" data-action="delete">Șterge</button>
				</div>
			</div>
		`;
	}

	function attachTemaActions(id) {
		const root = document.querySelector(`.tema-card[data-id="${CSS.escape(id)}"]`);
		if (!root) return;
		root.querySelector('[data-action="edit"]').addEventListener('click', () => onEditTema(id));
		root.querySelector('[data-action="delete"]').addEventListener('click', () => onDeleteTema(id));
	}

	function emptyState(text) {
		return `<div class="stat-item" style="text-align:center">${escapeHtml(text)}</div>`;
	}

	function escapeHtml(s) {
		return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
	}

	/** Actions: Manuale **/
	function onAddManual(e) {
		e.preventDefault();
		const subject = manualSubject().value.trim();
		const url = manualUrl().value.trim();
		if (!subject || !url || !validUrl(url)) { alert('Completează materia și un link valid.'); return; }
		const data = readData();
		data.manuals.push({ id: uid(), subject, url });
		writeData(data);
		manualForm().reset();
		renderManuale(data);
	}
	function onEditManual(id) {
		const data = readData();
		const m = data.manuals.find(x => x.id === id); if (!m) return;
		const subject = prompt('Materia', m.subject);
		if (subject === null) return;
		const url = prompt('Link manual', m.url);
		if (url === null) return;
		if (!subject.trim() || !url.trim() || !validUrl(url)) { alert('Date invalide.'); return; }
		m.subject = subject.trim(); m.url = url.trim();
		writeData(data); renderManuale(data);
	}
	function onDeleteManual(id) {
		if (!confirm('Ștergi acest manual?')) return;
		const data = readData();
		data.manuals = data.manuals.filter(x => x.id !== id);
		writeData(data); renderManuale(data);
	}

	/** Actions: Teme **/
	function onAddTema(e) {
		e.preventDefault();
		const subject = temaSubject().value.trim();
		const title = temaTitle().value.trim();
		const due = temaDue().value;
		const priority = temaPriority().value;
		const teacher = temaTeacher().value.trim();
		if (!subject || !title || !due) { alert('Completează materia, titlul și termenul.'); return; }
		const data = readData();
		data.homework.push({ id: uid(), subject, title, due, priority, teacher });
		writeData(data);
		temaForm().reset();
		renderTeme(data);
	}
	function onEditTema(id) {
		const data = readData();
		const t = data.homework.find(x => x.id === id); if (!t) return;
		const subject = prompt('Materia', t.subject); if (subject === null) return;
		const title = prompt('Titlul/Descriere', t.title); if (title === null) return;
		const due = prompt('Termen (YYYY-MM-DD)', t.due); if (due === null) return;
		const priority = prompt('Prioritate (normal/urgent)', t.priority) || 'normal';
		const teacher = prompt('Profesor (opțional)', t.teacher || '') || '';
		if (!subject.trim() || !title.trim() || !due.trim()) { alert('Date invalide.'); return; }
		t.subject = subject.trim(); t.title = title.trim(); t.due = due.trim(); t.priority = priority === 'urgent' ? 'urgent' : 'normal'; t.teacher = teacher.trim();
		writeData(data); renderTeme(data);
	}
	function onDeleteTema(id) {
		if (!confirm('Ștergi această temă?')) return;
		const data = readData();
		data.homework = data.homework.filter(x => x.id !== id);
		writeData(data); renderTeme(data);
	}

	/** Navigation **/
	function onNavigate(hash) {
		const target = (hash || location.hash || '#home') || '#home';
		sections().forEach(s => s.classList.remove('active'));
		const el = document.querySelector(target);
		if (el) el.classList.add('active');
		navLinks().forEach(a => a.classList.toggle('active', a.getAttribute('href') === target));
	}

	/** Import / Export / Share **/
	function doExport() {
		const json = JSON.stringify(readData(), null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = `clasa6b-data-${new Date().toISOString().slice(0,10)}.json`;
		document.body.appendChild(a); a.click(); a.remove();
		URL.revokeObjectURL(url);
	}
	function doImport(file) {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const data = JSON.parse(reader.result);
				if (!data || typeof data !== 'object' || !Array.isArray(data.manuals) || !Array.isArray(data.homework)) throw new Error('format');
				writeData(data);
				render();
				alert('Import realizat cu succes.');
			} catch (e) { alert('Fișier invalid.'); }
		};
		reader.readAsText(file);
	}
	function doShare() {
		const json = JSON.stringify(readData());
		const short = btoa(encodeURIComponent(json));
		const url = `${location.origin}${location.pathname}?data=${short}`;
		navigator.clipboard?.writeText(url).then(() => alert('Link copiat în clipboard!')).catch(() => prompt('Copiază linkul:', url));
	}

	/** Theme **/
	function applyTheme() {
		const theme = localStorage.getItem(THEME_KEY) || 'dark';
		if (theme === 'light') document.documentElement.classList.add('light'); else document.documentElement.classList.remove('light');
	}
	function toggleTheme() {
		const isLight = document.documentElement.classList.toggle('light');
		localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
	}

	/** Firebase Sync **/
	let fbApp = null;
	let fbDb = null;
	let fbDocRef = null;
	let fbUnsub = null;
	const FB_CONF_KEY = 'clasa6b_fb_conf_v1';
	function fbStatusEl() { return document.getElementById('fbStatus'); }
	function updateFbStatus(text) { if (fbStatusEl()) fbStatusEl().textContent = text; }
	function readFbConf() {
		try { const raw = localStorage.getItem(FB_CONF_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
	}
	function writeFbConf(conf) {
		try { localStorage.setItem(FB_CONF_KEY, JSON.stringify(conf)); } catch {}
	}
	function connectFirebase(conf) {
		try {
			if (!window.firebase) { alert('Firebase SDK indisponibil.'); return; }
			if (!conf?.apiKey || !conf?.authDomain || !conf?.projectId || !conf?.docPath) { alert('Completează apiKey, authDomain, projectId și document path.'); return; }
			if (fbUnsub) { fbUnsub(); fbUnsub = null; }
			fbApp = firebase.apps?.length ? firebase.app() : firebase.initializeApp({ apiKey: conf.apiKey, authDomain: conf.authDomain, projectId: conf.projectId });
			fbDb = firebase.firestore();
			fbDocRef = fbDb.doc(conf.docPath);
			writeFbConf(conf);
			updateFbStatus('Conectat (nesincronizat)');
		} catch (e) { console.error(e); alert('Conectarea a eșuat.'); }
	}
	async function fbPull() {
		if (!fbDocRef) { alert('Nu ești conectat la Firebase.'); return; }
		const snap = await fbDocRef.get();
		if (snap.exists) {
			const data = snap.data();
			if (data && Array.isArray(data.manuals) && Array.isArray(data.homework)) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
				render();
				updateFbStatus('Date sincronizate (pull)');
			} else { alert('Document invalid în Firestore.'); }
		} else { alert('Document inexistent.'); }
	}
	async function fbPush() {
		if (!fbDocRef) { alert('Nu ești conectat la Firebase.'); return; }
		const data = readData();
		await fbDocRef.set(data, { merge: false });
		updateFbStatus('Date trimise (push)');
	}
	function fbEnableRealtime() {
		if (!fbDocRef) { alert('Nu ești conectat la Firebase.'); return; }
		if (fbUnsub) return;
		fbUnsub = fbDocRef.onSnapshot(snap => {
			if (!snap.exists) return;
			const data = snap.data();
			if (data && Array.isArray(data.manuals) && Array.isArray(data.homework)) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
				render();
				updateFbStatus('Realtime activ (ascultă modificări)');
			}
		}, err => { console.error(err); updateFbStatus('Eroare realtime'); });
	}
	function fbDisableRealtime() {
		if (fbUnsub) { fbUnsub(); fbUnsub = null; }
		updateFbStatus('Conectat (realtime oprit)');
	}

	/** Init **/
	document.addEventListener('DOMContentLoaded', () => {
		applyTheme();
		if (yearEl()) yearEl().textContent = String(new Date().getFullYear());

		window.addEventListener('hashchange', () => onNavigate(location.hash));
		onNavigate(location.hash);

		// Manuale
		manualForm()?.addEventListener('submit', onAddManual);
		manualSearch()?.addEventListener('input', () => renderManuale(readData()));

		// Teme
		temaForm()?.addEventListener('submit', onAddTema);
		temaSearch()?.addEventListener('input', () => renderTeme(readData()));
		filterBtns().forEach(btn => btn.addEventListener('click', () => {
			filterBtns().forEach(b => b.classList.remove('active'));
			btn.classList.add('active');
			renderTeme(readData());
		}));

		// Header actions
		darkModeToggle()?.addEventListener('click', toggleTheme);
		exportBtn()?.addEventListener('click', doExport);
		importBtn()?.addEventListener('click', () => importFileInput()?.click());
		importFileInput()?.addEventListener('change', (e) => {
			const file = e.target.files?.[0]; if (file) doImport(file);
			e.target.value = '';
		});
		shareLinkBtn()?.addEventListener('click', doShare);

		// Firebase UI
		const fbForm = document.getElementById('firebaseForm');
		const fbApiKey = document.getElementById('fbApiKey');
		const fbAuthDomain = document.getElementById('fbAuthDomain');
		const fbProjectId = document.getElementById('fbProjectId');
		const fbDocPath = document.getElementById('fbDocPath');
		const saved = readFbConf();
		if (saved) {
			fbApiKey && (fbApiKey.value = saved.apiKey || '');
			fbAuthDomain && (fbAuthDomain.value = saved.authDomain || '');
			fbProjectId && (fbProjectId.value = saved.projectId || '');
			fbDocPath && (fbDocPath.value = saved.docPath || '');
		}
		fbForm?.addEventListener('submit', (e) => {
			e.preventDefault();
			connectFirebase({
				apiKey: fbApiKey?.value.trim(),
				authDomain: fbAuthDomain?.value.trim(),
				projectId: fbProjectId?.value.trim(),
				docPath: fbDocPath?.value.trim(),
			});
		});
		document.getElementById('fbEnable')?.addEventListener('click', fbEnableRealtime);
		document.getElementById('fbDisable')?.addEventListener('click', fbDisableRealtime);
		document.getElementById('fbPull')?.addEventListener('click', () => { fbPull(); });
		document.getElementById('fbPush')?.addEventListener('click', () => { fbPush(); });

		// Owner auth (email/password)
		function toggleOwnerUI(user) {
			const panel = document.getElementById('ownerOnlyPanel');
			if (panel) panel.classList.toggle('hidden', !user);
		}
		document.getElementById('ownerLogin')?.addEventListener('click', async () => {
			const email = document.getElementById('ownerEmail')?.value.trim();
			const password = document.getElementById('ownerPassword')?.value;
			if (!email || !password) { alert('Completează email și parolă.'); return; }
			try {
				if (!firebase.apps?.length) { alert('Configurează Firebase (apiKey/authDomain/projectId) o singură dată în index.html (window.FB_CONF).'); return; }
				await firebase.auth().signInWithEmailAndPassword(email, password);
				updateFbStatus('Autentificat');
			} catch (e) { console.error(e); alert('Login eșuat.'); }
		});
		document.getElementById('ownerLogout')?.addEventListener('click', async () => {
			try { await firebase.auth().signOut(); toggleOwnerUI(null); updateFbStatus('Deconectat'); } catch {}
		});
		firebase.auth?.().onAuthStateChanged?.(user => {
			toggleOwnerUI(user);
		});

		// Bootstrap Firebase app early if possible
		(function initFirebaseEarly() {
			try {
				if (firebase?.apps?.length) return;
				let conf = (window.FB_CONF && window.FB_CONF.apiKey) ? window.FB_CONF : readFbConf();
				if (conf && conf.apiKey && conf.authDomain && conf.projectId) {
					firebase.initializeApp({ apiKey: conf.apiKey, authDomain: conf.authDomain, projectId: conf.projectId });
				}
			} catch {}
		})();

		// first render
		render();
	});
})();
