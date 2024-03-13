// options.js
document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('save').addEventListener('click', saveOptions);

function saveOptions() {
    var clientId = document.getElementById('clientId').value;
    var clientSecret = document.getElementById('clientSecret').value;
    chrome.storage.sync.set({
        clientId: clientId,
        clientSecret: clientSecret
    }, function() {
        // Update status to let user know options were saved
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

function loadOptions() {
    chrome.storage.sync.get({
        clientId: '',
        clientSecret: ''
    }, function(items) {
        document.getElementById('clientId').value = items.clientId;
        document.getElementById('clientSecret').value = items.clientSecret;
    });
}
