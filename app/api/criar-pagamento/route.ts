import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Pedido não informado." },
        { status: 400 }
      );
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token do Mercado Pago não configurado." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": orderId,
      },
      body: JSON.stringify({
        transaction_amount: 12.0,
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
    console.error("Erro interno ao criar pagamento:", error);

    return NextResponse.json(
      { error: "Erro interno ao criar pagamento." },
      { status: 500 }
    );
  }
}