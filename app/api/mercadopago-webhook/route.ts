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

function salvarPedidos(pedidos: any) {
  fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Webhook recebido do Mercado Pago:", body);

    const paymentId = body?.data?.id || body?.id;

    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Token do Mercado Pago não configurado." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await response.json();

    console.log("Pagamento consultado pelo webhook:", {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      external_reference: payment.external_reference,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao consultar pagamento no Mercado Pago." },
        { status: 500 }
      );
    }

    const orderId = payment.external_reference;

    if (orderId) {
      const pedidos = lerPedidos();

      pedidos[orderId] = {
        orderId,
        paymentId: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        pago: payment.status === "approved",
        atualizadoEm: new Date().toISOString(),
      };

      salvarPedidos(pedidos);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook Mercado Pago:", error);

    return NextResponse.json(
      { error: "Erro interno no webhook." },
      { status: 500 }
    );
  }
}