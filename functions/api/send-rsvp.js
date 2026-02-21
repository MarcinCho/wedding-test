// Plik: functions/api/send-rsvp.js

export async function onRequestPost({ request, env }) {
  try {
    // 1. Sprawdź czy klucz API istnieje
    if (!env.RESEND_API_KEY) {
      console.error(
        "BŁĄD: Brak klucza RESEND_API_KEY w zmiennych środowiskowych."
      );
      return new Response(
        JSON.stringify({
          error: "Server configuration error: Missing API Key",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Pobierz dane z formularza
    const { name, guestCount, comment } = await request.json();

    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Wyślij do Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev", // Zmień to dopiero jak zweryfikujesz domenę!
        to: "marcin.chowaniec@outlook.com", // <--- WPISZ TU SWÓJ E-MAIL!
        subject: `Wesele RSVP: ${name}`,
        html: `<p><strong>Gość:</strong> ${name}</p><p><strong>Liczba osób:</strong> ${guestCount}</p><p><strong>Komentarz:</strong> ${comment}</p>`,
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("BŁĄD RESEND:", data); // To pojawi się w logach Cloudflare
      return new Response(
        JSON.stringify({
          error: "Email provider error",
          details: data,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("CRITICAL ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
