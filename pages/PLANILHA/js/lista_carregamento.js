import { db } from "../../../js/firebase-config.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  increment,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { auth } from "../../../js/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/login.html";
  } else {
    console.log("Usuário autenticado:", user.email);
  }
});

const urlParams = new URLSearchParams(window.location.search);
const freteId = urlParams.get("freteId");

if (!freteId) {
  alert("Frete ID não encontrado!");
  // Optionally redirect back to frete list
  window.location.href = "lista_fretes.html";
}

function formatNumber(number) {
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseFormattedNumber(str) {
  // Primeiro remove pontos de milhar, depois substitui vírgula decimal por ponto
  return parseFloat(str.replace(/\./g, "").replace(",", "."));
}

document.getElementById(
  "btnNovoCarregamento"
).href = `adicionar_carregamento.html?freteId=${freteId}`;

async function carregarCarregamentos() {
  try {
    // Carrega informações do frete específico
    const freteDoc = await getDoc(doc(db, "fretes", freteId));
    if (freteDoc.exists()) {
      const freteData = freteDoc.data();

      // Limpa os dados anteriores, mantendo o cabeçalho
      const tabelaFretes = document.getElementById("tabelaFretes");
      const cabecalhoFretes = tabelaFretes.querySelector("thead");
      tabelaFretes.innerHTML = "";
      tabelaFretes.appendChild(cabecalhoFretes);

      // Cria corpo da tabela e adiciona os dados do frete
      const corpoFretes = document.createElement("tbody");
      corpoFretes.id = "corpoTabelaFretes";
      const linhaFrete = `
                <tr>
                    <td>${freteData.cliente || "N/A"}</td>
                    <td>${freteData.expedidor || "N/A"}</td>
                    <td>${freteData.destinatario || "N/A"}</td>
                    <td>${freteData.recebedor || "N/A"}</td>
                    <td>${freteData.destinotroca || "N/A"}</td>
                    <td>${freteData.destino || "N/A"}</td>
                    <td>${freteData.produto || "N/A"}</td>
                    <td>${freteData.embalagem || "N/A"}</td>
                    <td>${freteData.liberado || "N/A"}</td>
                    <td>${freteData.marcado || "N/A"}</td>
                    <td>${freteData.saldo || "N/A"}</td>
                    <td>${freteData.frempresa || "N/A"}</td>
                    <td>${freteData.motorista || "N/A"}</td>
                    <td>${freteData.pedido || "N/A"}</td>
                    <td>${freteData.operacao || "N/A"}</td>
                    <td>${freteData.lote || "N/A"}</td>
                    <td>${freteData.observacoes || "N/A"}</td>
                </tr>
            `;
      corpoFretes.innerHTML = linhaFrete;
      tabelaFretes.appendChild(corpoFretes);
    } else {
      console.error("Frete não encontrado!");
      alert("Frete não encontrado!");
    }

    // Carrega os carregamentos relacionados
    const querySnapshot = await getDocs(
      collection(db, "fretes", freteId, "carregamentos")
    );
    const corpoTabelaCarregamentos = document.getElementById(
      "corpoTabelaCarregamentos"
    );
    corpoTabelaCarregamentos.innerHTML = "";

    if (querySnapshot.empty) {
      console.log("Nenhum carregamento encontrado para este frete.");
      corpoTabelaCarregamentos.innerHTML =
        "Ainda nenhum Carregamento cadastrado para este Frete.";
    } else {
      querySnapshot.forEach((doc) => {
        const carregamento = doc.data();
        const linha = `
                    <tr>
                        <td>${carregamento.dataoc || "N/A"}</td>
                        <td>${carregamento.placa || "N/A"}</td>
                        <td>${carregamento.motorista || "N/A"}</td>
                        <td>${carregamento["tipo-veiculo"] || "N/A"}</td>
                        <td>${formatNumber(
                          carregamento["peso-carregado"] || "N/A"
                        )}</td>
                        <td>${carregamento.fretemotorista || "N/A"}</td>
                        <td>${carregamento.emissor || "N/A"}</td>
                        <td>${carregamento["data-manifesto"] || "N/A"}</td>
                        <td>${carregamento.cte || "N/A"}</td>
                        <td>${carregamento["data-entrega"] || "N/A"}</td>
                        <td>${carregamento.nfe || "N/A"}</td>
                        <td>${carregamento.observacao || "N/A"}</td>
                        <td class="acoes">
                            <button class="btn-editar" onclick="editarCarregamento('${
                              doc.id
                            }')">Editar</button>
                            <button class="btn-excluir" onclick="excluirCarregamento('${
                              doc.id
                            }')">Excluir</button>
                        </td>
                    </tr>
                `;
        corpoTabelaCarregamentos.innerHTML += linha;
      });
    }
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    alert("Erro ao carregar dados. Verifique o console para mais detalhes.");
  }
}

window.editarCarregamento = (carregamentoId) => {
  window.location.href = `adicionar_carregamento.html?freteId=${freteId}&carregamentoId=${carregamentoId}`;
};

window.excluirCarregamento = async (carregamentoId) => {
  if (
    confirm("Tem certeza que deseja excluir este carregamento permanentemente?")
  ) {
    try {
      const carregamentoRef = doc(
        db,
        "fretes",
        freteId,
        "carregamentos",
        carregamentoId
      );
      const carregamentoSnap = await getDoc(carregamentoRef);
      const peso = carregamentoSnap.data()["peso-carregado"];

      // Atualizar frete
      const freteRef = doc(db, "fretes", freteId);
      await updateDoc(freteRef, {
        carregado: increment(-peso),
        saldo: increment(peso),
      });

      await deleteDoc(carregamentoRef);
      carregarCarregamentos();
      alert("Carregamento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir carregamento:", error);
    }
  }
};

// Regex for number input validation
const numberPattern = /^[0-9]+(\.[0-9]{1,2})?$/; // Allows up to two decimal places

document.querySelectorAll('input[type="number"]').forEach((input) => {
  input.addEventListener("input", function (e) {
    if (!numberPattern.test(this.value)) {
      this.value = this.value.slice(0, -1); // Remove the last character if invalid
    }
  });
});

// Substitua a função window.captureAndShare por esta versão melhorada
window.captureAndDownload = async () => {
  try {
    alert("Preparando para captura...");

    // Elementos a serem ocultados
    const elementsToHide = [
      document.getElementById("btnNovoCarregamento"),
      document.getElementById("btn-voltar-fretes"),
      document.querySelector('button[onclick="captureAndDownload()"]'),
      ...document.querySelectorAll(".acoes"), // Coluna de ações
    ];

    // Ocultar elementos
    elementsToHide.forEach((element) => {
      if (element) element.classList.add("hide-for-print");
    });

    // Configurações do html2canvas
    const options = {
      scale: 2,
      logging: true,
      useCORS: true,
      scrollY: -window.scrollY,
      onclone: (clonedDoc) => {
        // Garantir que elementos permaneçam ocultos no clone
        clonedDoc.querySelectorAll(".hide-for-print").forEach((element) => {
          element.style.display = "none";
        });
      },
    };

    const container = document.querySelector(".container");
    const canvas = await html2canvas(container, options);
    const dataUrl = canvas.toDataURL("image/png", 1.0);

    // Criar e disparar download
    const link = document.createElement("a");
    link.download = `Carregamentos_${freteId}_${new Date()
      .toISOString()
      .slice(0, 10)}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Restaurar elementos
    elementsToHide.forEach((element) => {
      if (element) element.classList.remove("hide-for-print");
    });

    alert("Imagem gerada com sucesso!");
  } catch (error) {
    console.error("Erro na captura:", error);
    alert("Falha ao gerar imagem");
  }
};

// Carrega os carregamentos quando a página é aberta
carregarCarregamentos();
