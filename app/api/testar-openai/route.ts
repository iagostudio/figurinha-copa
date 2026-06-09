import { NextResponse } from "next/server";

export async function GET() {
  const chaveExiste = !!process.env.OPENAI_API_KEY;

  if (!chaveExiste) {
    return NextResponse.json(
      { error: "A chave OPENAI_API_KEY não foi encontrada." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Chave da OpenAI encontrada com sucesso no backend!",
  });
}