import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID do pagamento não informado." },
        { status: 400 }
      );
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

    if (!response.ok) {
      console.error("Erro ao consultar pagamento:", payment);

      return NextResponse.json(
        {
          error: "Erro ao consultar pagamento no Mercado Pago.",
          details: payment,
        },
        { status: 500 }
      );
    }

    const aprovado = payment.status === "approved";

    return NextResponse.json({
      success: true,
      status: payment.status,
      aprovado,
      message: aprovado
        ? "Pagamento aprovado! Figurinha liberada."
        : "Pagamento ainda não aprovado.",
    });
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error);

    return NextResponse.json(
      { error: "Erro interno ao verificar pagamento." },
      { status: 500 }
    );
  }
}