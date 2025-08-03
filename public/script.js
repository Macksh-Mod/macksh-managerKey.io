async function loadKeys() {
  const res = await fetch('/list');
  const keys = await res.json();
  const tbody = document.querySelector('#keyTable tbody');
  tbody.innerHTML = '';

  for (const key in keys) {
    const { uuid, createdAt, expireDays } = keys[key];
    const expDate = new Date(new Date(createdAt).getTime() + expireDays * 86400000).toISOString().slice(0, 10);
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="key-cell" onclick="copyText('${key}')">${key}</td>
      <td class="device-cell" onclick="copyText('${uuid}')">${uuid}</td>
      <td>${createdAt.slice(0, 10)}</td>
      <td>${expDate}</td>
      <td><button onclick="removeKey('${key}')">❌</button></td>
    `;

    tbody.appendChild(tr);
  }
}

async function generateKey() {
  const uid = document.getElementById('uid').value.trim();
  const expireDays = parseInt(document.getElementById('days').value);
  const key = crypto.randomUUID();

  if (!uid || !expireDays) return alert('Điền đầy đủ UID và ngày hết hạn.');

  const res = await fetch('/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, uuid: uid, expireDays })
  });

  const json = await res.json();
  alert(json.message);
  loadKeys();
}

async function removeKey(key) {
  const res = await fetch('/remove?key=' + encodeURIComponent(key), {
    method: 'DELETE'
  });

  const json = await res.json();
  alert(json.message);
  loadKeys();
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Đã sao chép: ' + text);
  });
}

window.onload = loadKeys;