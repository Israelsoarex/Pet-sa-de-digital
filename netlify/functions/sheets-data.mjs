export default async (req) => {
  const API_KEY = process.env.API_KEY;
  const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

  if (!API_KEY || !SPREADSHEET_ID) {
    return new Response(
      JSON.stringify({ error: "Variáveis de ambiente API_KEY ou SPREADSHEET_ID não configuradas." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const sheetName = "Página1";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao conectar com Google Sheets: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
