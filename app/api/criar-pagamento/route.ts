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
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Pedido não informado." },
        { status: 400 }
      );
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Token do Mercado Pago não configurado." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": orderId,
      },
      body: JSON.stringify({
        transaction_amount: 12.9,
        description: "Figurinha personalizada estilo futebol",
        payment_method_id: "pix",
        payer: {
          email: `cliente-${orderId}@emailteste.com`,
          first_name: "Cliente",
        },
        external_reference: orderId,
      }),
    });

    const payment = await response.json();

    if (!response.ok) {
      console.error("Erro Mercado Pago:", payment);

      return NextResponse.json(
        {
          error: "Erro ao gerar Pix no Mercado Pago.",
          details: payment,
        },
        { status: 500 }
      );
    }

        const pedidos: any = lerPedidos();

    pedidos[orderId] = {
      orderId,
      paymentId: payment.id,
      status: payment.status,
      pago: false,
      criadoEm: new Date().toISOString(),
    };

    salvarPedidos(pedidos);


    return NextResponse.json({
      success: true,
      message: "Pix gerado com sucesso!",
      paymentId: payment.id,
      status: payment.status,
      pixCopiaECola:
        payment.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64:
        payment.point_of_interaction?.transaction_data?.qr_code_base64,
    });
  } catch (error) {
    console.error("Erro ao criar pagamento:", error);



    return NextResponse.json(
      { error: "Erro interno ao criar pagamento." },
      { status: 500 }
    );
  }
}