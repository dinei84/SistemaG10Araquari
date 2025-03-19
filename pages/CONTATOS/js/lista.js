
import { db } from '../../../js/firebase-config.js';
import { collection, getDocs, doc, deleteDoc } from '../../../js/firebase-config.js';
import { auth } from "../../../js/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

let drivers = [];

// Adiciona evento DOMContentLoaded para carregar dados ao carregar a página
document.addEventListener('DOMContentLoaded', async function() {
    // Chama a função para buscar os dados
    await getDrivers();

    // Adiciona evento ao botão de voltar
    document.getElementById('backBtn').addEventListener('click', function() {
        window.location.href = 'contato.html';
    });

    // Adiciona evento de input para busca
    document.getElementById('searchInput').addEventListener('input', function() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filteredDrivers = drivers.filter(driver => {
            return driver.driver.toLowerCase().includes(searchTerm) ||
                   driver.phone.toLowerCase().includes(searchTerm) ||
                   driver.owner.toLowerCase().includes(searchTerm);
        });
        renderTable(filteredDrivers);
    });

    // Adiciona evento ao botão de download
document.getElementById('downloadBtn').addEventListener('click', function() {
    if (drivers.length === 0) {
        alert("Nenhum dado disponível para download.");
        return;
    }

    // Mapeia os dados para um formato adequado
    const dataToExport = drivers.map(driver => ({
        Motorista: driver.driver,
        Telefone: driver.phone,
        Frotista: driver.owner
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "Motoristas");
    XLSX.writeFile(wb, 'motoristas.xlsx');
});
});

// Função para buscar dados do Firestore
async function getDrivers() {
    const querySnapshot = await db.collection('drivers').get();
    drivers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    sortAndRenderTable();
}

// Atualiza a função sortAndRenderTable para usar os dados buscados
function sortAndRenderTable() {
    drivers.sort((a, b) => {
        if (a.driver < b.driver) return -1;
        if (a.driver > b.driver) return 1;
        if (a.owner < b.owner) return -1;
        if (a.owner > b.owner) return 1;
        return 0;
    });
    renderTable(drivers);
}

// Renderiza a tabela com os dados fornecidos
function renderTable(driversToRender) {
    const tableBody = document.querySelector('#driversTable tbody');
    tableBody.innerHTML = '';

    driversToRender.forEach((driverData) => {
        const row = document.createElement('tr');

        const driverCell = document.createElement('td');
        driverCell.textContent = driverData.driver;
        row.appendChild(driverCell);

        const phoneCell = document.createElement('td');
        phoneCell.textContent = driverData.phone;
        row.appendChild(phoneCell);

        const ownerCell = document.createElement('td');
        ownerCell.textContent = driverData.owner;
        row.appendChild(ownerCell);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions';

        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.className = 'edit';
        editButton.addEventListener('click', () => editDriver(driverData.id));
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Apagar';
        deleteButton.addEventListener('click', () => deleteDriver(driverData.id));
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}

async function editDriver(id) {
    localStorage.setItem('editIndex', id);
    window.location.href = 'contato.html';
}

async function deleteDriver(id) {
    if (!confirm('Tem certeza que deseja apagar este motorista?')) {
        return;
    }
    await deleteDoc(doc(db, 'drivers', id));
    drivers = drivers.filter(driver => driver.id !== id);
    sortAndRenderTable();
}
