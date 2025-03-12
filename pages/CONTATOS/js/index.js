let editIndex = null;

document.getElementById('submitBtn').addEventListener('click', async function() {
    const driver = document.getElementById('driver').value;
    const phone = document.getElementById('phone').value;
    const owner = document.getElementById('owner').value;

    if (driver && phone && owner) {
        if (editIndex !== null) {
            await db.collection('drivers').doc(editIndex).set({ driver, phone, owner });
            editIndex = null;
        } else {
            await db.collection('drivers').add({ driver, phone, owner });
        }
        document.getElementById('driverForm').reset();
    } else {
        alert('Por favor, preencha todos os campos.');
    }
});

document.getElementById('viewListBtn').addEventListener('click', function() {
    window.location.href = 'lista.html';
});

document.getElementById('clearBtn').addEventListener('click', function() {
    document.getElementById('driver').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('owner').value = '';
});

document.addEventListener('DOMContentLoaded', async function() {
    const editIndexStored = localStorage.getItem('editIndex');
    if (editIndexStored !== null) {
        const doc = await db.collection('drivers').doc(editIndexStored).get();
        const driverData = doc.data();
        document.getElementById('driver').value = driverData.driver;
        document.getElementById('phone').value = driverData.phone;
        document.getElementById('owner').value = driverData.owner;
        editIndex = editIndexStored;
        localStorage.removeItem('editIndex');
    }
});

document.getElementById('phone').addEventListener('input', function(e) {
    const x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    e.target.value = !x[2] ? x[1] : `(${x[1]}) ${x[2]}${x[3] ? '-' + x[3] : ''}`;
});
