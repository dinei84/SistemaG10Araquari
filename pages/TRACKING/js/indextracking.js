// indextracking.js
import { db } from "../../../js/firebase-config.js";
import { collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js"; 

const traelCollection = collection(db, "trael");

function getSaudacao() {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
}

async function carregarCarregamentos() {
    try {
        const querySnapshot = await getDocs(traelCollection);
        const cargas = document.getElementById("cargas-lista");
        cargas.innerHTML = "";

        querySnapshot.forEach((doc) => {
            const carga = doc.data();
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${carga.datanfe || ''}</td>
                <td>${carga.placa || ''}</td>
                <td>${carga.localizacao || ''}</td>
                <td>${carga.status || ''}</td>
                <td>${carga.mercadoria || ''}</td>
                <td>${carga.nfe || ''}</td>
                <td>${carga.cte || ''}</td>
                <td>${carga.previsao || ''}</td>
                <td style="background-color: ${carga.statusdiario?.trim().toLowerCase() === 'sim' ? 'green' : 'red'};">
                    ${carga.statusdiario || ''}
                </td>
                <td>
                    ${carga.telefone ? `<a href="https://wa.me/55${carga.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(getSaudacao() + `, preciso saber onde esta o motorista da placa ${carga.placa}`)}" target="_blank">
                        ${carga.telefone}
                    </a>` : ''}
                </td>
                <td>${carga.nome || ''}</td>
                <td>${carga.comentario || ''}</td>
                <td>
                  <button class="btn-edit" onclick="editarCarga('${doc.id}')">Editar</button>
                  <button class="btn-delete" onclick="excluirCarga('${doc.id}')">Excluir</button>
                </td>
            `;
            cargas.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao carregar cargas: ", error);
        alert("Erro ao carregar cargas");
    }
}

window.editarCarga = (id) => {
    window.location.href = `cadastro.html?carregamentoId=${id}`;
}

window.excluirCarga = async (id) => {
    if (confirm("Deseja realmente excluir esta carga?")) {
        try {
            await deleteDoc(doc(db, "trael", id));
            alert("Carga excluída com sucesso!");
            carregarCarregamentos();
        } catch (error) {
            console.error("Erro ao excluir carga: ", error);
            alert("Erro ao excluir carga");
        }
    }
}

window.addEventListener("load", carregarCarregamentos);

window.captureAndShare = async () => {
try {
    // Cria um clone da tabela original
    const originalTable = document.querySelector('table');
    const clonedTable = originalTable.cloneNode(true);

    // Configurações para ocultar colunas
    const hiddenColumns = ['Telefone', 'Motorista', 'Comentario', 'Ações'];
    const clonedThs = clonedTable.querySelectorAll('thead th');
    const clonedTrs = clonedTable.querySelectorAll('tbody tr');
    const hiddenColumnIndices = [];

    // Identifica colunas para ocultar
    hiddenColumns.push('Status Diário');
    clonedThs.forEach((th, index) => {
        if (hiddenColumns.includes(th.textContent.trim())) {
            hiddenColumnIndices.push(index);
            th.style.display = 'none';
        }
    });

    // Oculta células nas linhas
    clonedTrs.forEach(tr => {
        hiddenColumnIndices.forEach(index => {
            if (tr.cells[index]) {
                tr.cells[index].style.display = 'none';
            }
        });
    });

    // Posiciona o clone fora da tela
    clonedTable.style.position = 'absolute';
    clonedTable.style.left = '-9999px';
    document.body.appendChild(clonedTable);

    // Captura a imagem do clone
    const canvas = await html2canvas(clonedTable);
    document.body.removeChild(clonedTable);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], 'monitoramento_cargas.png', { type: 'image/png' });

    // Verifica se o navegador suporta o Web Share API
    if (navigator.share) {
        try {
            await navigator.share({
                files: [file],
                title: 'Monitoramento de Cargas',
                text: 'Relatório de Monitoramento de Cargas'
            });
        } catch (error) {
            // Se der erro na API de compartilhamento, usa o fallback do WhatsApp Web
            shareViaWhatsApp(canvas.toDataURL());
        }
    } else {
        // Fallback para WhatsApp Web direto
        shareViaWhatsApp(canvas.toDataURL());
    }

    // Adiciona a funcionalidade de download
    downloadImage(blob, 'monitoramento_cargas.png');
} catch (error) {
    console.error('Erro ao capturar ou compartilhar:', error);
    alert('Erro ao compartilhar ou baixar a imagem');
}
};

function shareViaWhatsApp(imageData) {
    const imageDataWithoutHeader = imageData.replace('data:image/png;base64,', '');
    const text = 'Relatório de Monitoramento de Cargas';
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
}

// Função para baixar a imagem
function downloadImage(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href); 
}