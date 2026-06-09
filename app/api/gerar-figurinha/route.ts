import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { promptBaseFigurinha } from "@/lib/prompt-figurinha";
import fs from "fs";
import path from "path";

async function fileToBase64(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

function localFileToBase64(filePath: string) {
  return fs.readFileSync(filePath, "base64");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const foto = formData.get("foto") as File | null;
    const nome = String(formData.get("nome") || "").trim();
    const nascimento = String(formData.get("nascimento") || "").trim();
    const altura = String(formData.get("altura") || "").trim();
    const peso = String(formData.get("peso") || "").trim();
    const time = String(formData.get("time") || "").trim();

    if (!foto || !nome) {
      return NextResponse.json(
        { error: "Envie uma foto e informe pelo menos o nome da pessoa." },
        { status: 400 }
      );
    }

    const timeFormatado = time ? `${time} (BRA)` : "BRASIL";

    const informacoesPreenchidas = [
      `Nome: ${nome}`,
      nascimento ? `Data de nascimento: ${nascimento}` : null,
      altura ? `Altura: ${altura}` : null,
      peso ? `Peso: ${peso}` : null,
      `Time/País: ${timeFormatado}`,
    ].filter(Boolean);

    if (process.env.USE_OPENAI !== "true") {
      return NextResponse.json({
        success: true,
        message: "Modo teste: figurinha simulada gerada com sucesso!",
        confirmacao: `Sua figurinha será criada com estas informações: ${informacoesPreenchidas.join(
          " | "
        )}. As informações não preenchidas não aparecerão na figurinha.`,
        previewUrl: "/preview-teste.png",
        orderId: crypto.randomUUID(),
      });
    }

    const fotoBase64 = await fileToBase64(foto);

    const referenciaPath = path.join(
      process.cwd(),
      "public",
      "figurinha-referencia.jpg"
    );

    const referenciaBase64 = localFileToBase64(referenciaPath);

    const promptFinal = `
${promptBaseFigurinha}

Dados da figurinha:
- Nome: ${nome}
${nascimento ? `- Data de nascimento: ${nascimento}` : ""}
${altura ? `- Altura: ${altura}` : ""}
${peso ? `- Peso: ${peso}` : ""}
- Time/País: ${timeFormatado}

Instruções específicas:
- usar a imagem 1 como a foto do cliente
- usar a imagem 2 como referência exata do estilo da figurinha
- manter a pessoa com o rosto semelhante ao da imagem 1
- usar a imagem 1 somente para rosto, aparência, idade aproximada, cabelo, expressão e proporção da pessoa
- NÃO usar a roupa original da imagem 1
- substituir obrigatoriamente a roupa original por uma camisa amarela da Seleção Brasileira, igual ou muito parecida com a camisa da figurinha de referência
- a camisa deve ter aparência esportiva, natural no corpo e proporcional
- a camisa deve parecer natural no corpo da pessoa
- manter a pose e a posição da pessoa iguais à figurinha de referência
- manter o corpo proporcional e natural
- não inventar informações que não foram preenchidas
- manter obrigatoriamente o selo retangular amarelo/vermelho no canto inferior direito, na mesma posição da figurinha de referência
- não remover o selo inferior direito
- não substituir o selo por outro elemento
- manter faixas, bordas, ícones e elementos gráficos principais da figurinha de referência
`;

    const response = await openai.responses.create({
  model: "gpt-5.5",
  input: [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: promptFinal,
        },
        {
          type: "input_image",
          image_url: `data:${foto.type || "image/jpeg"};base64,${fotoBase64}`,
        },
        {
          type: "input_image",
          image_url: `data:image/jpeg;base64,${referenciaBase64}`,
        },
      ] as any,
    },
  ],
  tools: [
    {
      type: "image_generation",
    },
  ],
});
    const imageGenerationCall = response.output.find(
      (item: any) => item.type === "image_generation_call"
    ) as any;

    const imageBase64 = imageGenerationCall?.result;
        if (!imageBase64) {
      return NextResponse.json(
        { error: "A OpenAI não retornou a imagem da figurinha." },
        { status: 500 }
      );
    }

    const previewUrl = `data:image/png;base64,${imageBase64}`;
    const orderId = crypto.randomUUID();

    return NextResponse.json({
      success: true,
      message: "Figurinha gerada com sucesso!",
      confirmacao: `Sua figurinha será criada com estas informações: ${informacoesPreenchidas.join(
        " | "
      )}. As informações não preenchidas não aparecerão na figurinha.`,
      previewUrl,
      orderId,
    });
  } catch (error) {
    console.error("Erro ao gerar figurinha:", error);

    return NextResponse.json(
      {
        error:
          "Erro ao gerar a figurinha com a OpenAI. Verifique a chave, saldo ou permissões da conta.",
      },
      { status: 500 }
    );
  }
}