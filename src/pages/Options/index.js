//document.addEventListener('DOMContentLoaded', async () => {
//  const settings = new Settings();
//  await settings.load();
//
//  document.getElementById('blockpage').value = settings.blockpage;
//  document.getElementById('limit').value = settings.limit;
//  document.getElementById('whitelist').value = settings.whitelist;
//
//  const blockvalsContainer = document.getElementById('blockvals-container');
//  const keys = [2, 3, 5, 10, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 120, 130, 150];
//
//  keys.forEach(key => {
//    const label = document.createElement('label');
//    label.innerHTML = `<span>${key}:</span> <input type="text" id="blockval-${key}" value="${settings.blockvals[key] || ''}"><br>`;
//    blockvalsContainer.appendChild(label);
//  });
//
//  document.getElementById('options-form').addEventListener('submit', async (e) => {
//    e.preventDefault();
//
//    settings.blockpage = document.getElementById('blockpage').value;
//    settings.limit = parseInt(document.getElementById('limit').value, 10);
//    settings.whitelist = document.getElementById('whitelist').value;
//
//    keys.forEach(key => {
//      settings.blockvals[key] = document.getElementById(`blockval-${key}`).value;
//    });
//
//    await settings.save();
//    console.log("Настройки сохранены");
//  });
//});
