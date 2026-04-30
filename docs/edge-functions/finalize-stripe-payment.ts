import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Stripe with your secret key
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-client-info, apikey",
      },
      status: 204,
    });
  }

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Parse request body
    const { paymentIntentId } = await req.json();

    // Validate required fields
    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ error: "paymentIntentId is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Retrieve the PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if payment succeeded
    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({
          error: "Payment not succeeded",
          status: paymentIntent.status,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Get order_id from metadata
    const orderId = paymentIntent.metadata.order_id;
    if (!orderId) {
      return new Response(
        JSON.stringify({
          error: "Order ID not found in payment intent metadata",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Get the payment transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("payment_transactions")
      .select("amount, status")
      .eq("order_id", orderId)
      .eq("transaction_id", paymentIntentId)
      .single();

    if (fetchError || !transaction) {
      return new Response(
        JSON.stringify({ error: "Payment transaction not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Update Order Status to 'NEW'
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        order_status: "NEW",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("order_status", "DRAFT");

    if (updateOrderError) {
      return new Response(
        JSON.stringify({ error: "Failed to update order status" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Update payment transaction status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({ status: "SUCCEEDED" })
      .eq("order_id", orderId);

    if (updateError) {
      console.error("Error updating payment transaction:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update payment status" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    const { data } = await supabase
      .from("orders")
      .select("order_number, email")
      .eq("id", orderId)
      .single();

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        orderNumber: data?.order_number,
        email: data?.email,
        message: "Payment finalized successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("Error finalizing payment:", error);

    return new Response(
      JSON.stringify({ error: error.message || "An unknown error occurred" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});
