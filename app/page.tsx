"use client";

import { useState } from "react";

export default function Home() {
  const [foto, setFoto] = useState<File | null>(null);
  const [nome, setNome] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [time, setTime] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [orderId, setOrderId] = useState("");
  const [pixCopiaECola, setPixCopiaECola] = useState("");
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [paymentId, setPaymentId] = useState("");

  function abrirConfirmacao() {
  if (!foto || !nome) {
    setMensagem("Envie uma foto e informe pelo menos o nome da pessoa.");
    
    return;
  }

  setMensagem("");
  setPreviewUrl("");
  setOrderId("");
  setPixCopiaECola("");
  setPagamentoAprovado(false);
  setConfirmacao("");
  setMostrarConfirmacao(true);
}

async function gerarFigurinha() {
  setMostrarConfirmacao(false);
  setMensagem("Enviando dados para o backend...");

  const formData = new FormData();

  if (foto) {
    formData.append("foto", foto);
  }

  formData.append("nome", nome);
  formData.append("nascimento", nascimento);
  formData.append("altura", altura);
  formData.append("peso", peso);
  formData.append("time", time);

  const resposta = await fetch("/api/gerar-figurinha", {
    method: "POST",
    body: formData,
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    setMensagem(dados.error || "Erro ao gerar figurinha.");
    return;
  }

  setMensagem(dados.message);
  setConfirmacao(dados.confirmacao);
  setPreviewUrl(dados.previewUrl);
  setOrderId(dados.orderId);
}

async function criarPagamento() {
  setMensagem("Gerando Pix...");

  const resposta = await fetch("/api/criar-pagamento", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    setMensagem(dados.error || "Erro ao criar pagamento.");
    return;
  }

  setMensagem(dados.message);
  setPixCopiaECola(dados.pixCopiaECola);
  setQrCodeBase64(dados.qrCodeBase64);
  setPaymentId(dados.paymentId);
}

async function verificarPagamento() {
  if (!paymentId) {
    setMensagem("Pagamento ainda não foi criado.");
    return;
  }

  setMensagem("Verificando pagamento...");

  const resposta = await fetch("/api/verificar-pagamento", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentId,
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    setMensagem(dados.error || "Erro ao verificar pagamento.");
    return;
  }

  setMensagem(dados.message);

  if (dados.aprovado) {
    setPagamentoAprovado(true);
  }
}

async function consultarStatusPedido() {
  if (!orderId) {
    setMensagem("Pedido ainda não foi criado.");
    return;
  }

  const resposta = await fetch("/api/status-pedido", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    setMensagem(dados.error || "Erro ao consultar pedido.");
    return;
  }

  setMensagem(dados.message);

  if (dados.pago) {
    setPagamentoAprovado(true);
  }
}

  return (
    <main className="min-h-screen bg-green-800 px-4 py-8 text-white">
      <section className="mx-auto max-w-xl rounded-3xl bg-black/40 p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-72 w-52 animate-bounce items-center justify-center rounded-2xl bg-transparent drop-shadow-2xl">
            <img
              src="/figurinha-referencia.jpg"
              alt="Figurinha de referência"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-4xl font-black">
            Sua Figurinha da Copa ⚽
          </h1>

          <p className="mt-3 text-lg text-white/90">
            Crie sua figurinha personalizada estilo álbum da Copa e receba em alta definição.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block font-semibold">
              Selecione a foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
              className="w-full rounded-xl bg-white px-4 py-3 text-black file:mr-4 file:rounded-lg file:border-0 file:bg-yellow-400 file:px-4 file:py-2 file:font-bold file:text-green-950"
            />
            <p className="mt-1 text-sm text-white/80">
              Envie uma foto com rosto nítido, boa iluminação e olhando para frente.
            </p>
          </div>

          <input
            type="text"
            placeholder="Nome da pessoa obrigatório"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-white px-4 py-3 text-black placeholder:text-gray-500 outline-none"
          />

          <input
            type="text"
            placeholder="Data de nascimento (opcional)"
            value={nascimento}
            onChange={(e) => setNascimento(e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-white px-4 py-3 text-black placeholder:text-gray-500 outline-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Altura (opcional)"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              className="w-full rounded-xl border border-white/30 bg-white px-4 py-3 text-black placeholder:text-gray-500 outline-none"
            />

            <input
              type="text"
              placeholder="Peso (opcional)"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="w-full rounded-xl border border-white/30 bg-white px-4 py-3 text-black placeholder:text-gray-500 outline-none"
            />
          </div>

          <input
            type="text"
            placeholder="Time do coração (opcional)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-white/30 bg-white px-4 py-3 text-black placeholder:text-gray-500 outline-none"
          />

          <button
            onClick={abrirConfirmacao}
            className="w-full rounded-2xl bg-yellow-300 px-6 py-4 text-lg font-black text-green-950"
          >
            Gerar minha figurinha
          </button>

          {mensagem && (
            <div className="rounded-xl bg-white/20 p-4 text-center font-semibold">
              {mensagem}
            </div>
          )}

          {confirmacao && (
            <div className="rounded-xl bg-yellow-100 p-4 text-sm font-semibold text-green-950">
              {confirmacao}
            </div>
          )}

          {previewUrl && (
            <div className="mt-6 rounded-2xl bg-white/20 p-4 text-center">
              <div className="relative mx-auto w-64 overflow-hidden rounded-2xl border-4 border-yellow-300">
                <img
                  src={previewUrl}
                  alt="Prévia da figurinha"
                  className={pagamentoAprovado ? "w-full" : "w-full blur-[2px]"}
                />

                {!pagamentoAprovado && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                    <div className="mb-2 rounded-full bg-yellow-300 p-5 text-4xl">
                      ⚽
                    </div>
                    <p className="font-black text-white">
                      Prévia bloqueada
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={criarPagamento}
                className="mt-4 w-full rounded-2xl bg-green-500 px-6 py-4 text-lg font-black text-white shadow-lg"
              >
                Liberar por R$12,90
              </button>
              {pixCopiaECola && (
                <div className="mt-4 rounded-xl bg-white p-4 text-center text-black">
                  <p className="font-bold">Pague com Pix para liberar sua figurinha:</p>

                  {qrCodeBase64 && (
                    <img
                      src={`data:image/png;base64,${qrCodeBase64}`}
                      alt="QR Code Pix"
                      className="mx-auto mt-4 h-56 w-56"
                    />
                  )}

                  <p className="mt-4 font-bold">Pix copia e cola:</p>

                  <textarea
                    readOnly
                    value={pixCopiaECola}
                    className="mt-2 h-28 w-full rounded-xl border p-3 text-sm"
                  />

                  <button
                    onClick={() => navigator.clipboard.writeText(pixCopiaECola)}
                    className="mt-3 w-full rounded-2xl bg-green-600 px-4 py-3 font-black text-white"
                  >
                    Copiar código Pix
                  </button>

                  <button
                    onClick={verificarPagamento}
                    className="mt-3 w-full rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
                  >
                    Já paguei, verificar pagamento
                  </button>

                 
                </div>
              )}


              {pagamentoAprovado && (
                <a
                  href={previewUrl}
                  download
                  className="mt-4 block w-full rounded-2xl bg-yellow-300 px-6 py-4 text-center text-lg font-black text-green-950 shadow-lg"
                >
                  Baixar figurinha em alta definição
                </a>
              )}

              <p className="mt-2 text-sm text-white/80">
                Pedido: {orderId}
              </p>
            </div>
          )}
        </div>
      </section>
      {mostrarConfirmacao && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-6 text-green-950 shadow-2xl">
      <h2 className="text-2xl font-black text-center">
        Confirme as informações ⚽
      </h2>

      <p className="mt-3 text-center text-sm text-gray-700">
        Sua figurinha será criada apenas com as informações preenchidas abaixo.
        As informações em branco não aparecerão na figurinha.
      </p>

      <div className="mt-5 space-y-2 rounded-2xl bg-green-50 p-4 text-sm font-semibold">
        <p>Nome: {nome}</p>

        {nascimento && <p>Data de nascimento: {nascimento}</p>}

        {altura && <p>Altura: {altura}</p>}

        {peso && <p>Peso: {peso}</p>}

        <p>
          Time/País: {time ? `${time} (BRA)` : "BRASIL"}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setMostrarConfirmacao(false)}
          className="w-1/2 rounded-2xl bg-gray-200 px-4 py-3 font-black text-gray-800"
        >
          Editar
        </button>

        <button
          onClick={gerarFigurinha}
          className="w-1/2 rounded-2xl bg-yellow-300 px-4 py-3 font-black text-green-950"
        >
          Confirmar e gerar
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}