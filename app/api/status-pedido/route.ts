import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const pedidosPath = path.join(process.cwd(), "pedidos.json");

function lerPedidos() {
  if (!fs.existsSync(pedidosPath)) {
    return {};
  }

  const conteudo = fs.readFileSync(pedidosPath, "utf-8");
  return JSON.parse(conteudo || "{}");
}

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Pedido não informado." },
        { status: 400 }
      );
    }

    const pedidos: any = lerPedidos();
    const pedido = pedidos[orderId];

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: pedido.status,
      pago: pedido.pago,
      message: pedido.pago
        ? "Pagamento aprovado! Figurinha liberada."
        : "Pagamento ainda não aprovado.",
    });
  } catch (error) {
    console.error("Erro ao consultar pedido:", error);

    return NextResponse.json(
      { error: "Erro interno ao consultar pedido." },
      { status: 500 }
    );
  }
}