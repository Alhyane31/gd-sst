import puppeteer from "puppeteer";

type RenderOptions = {
  format?: "A4" | "A5";
  landscape?: boolean;
};

export async function renderHtmlToPdf(
  html: string,
  options: RenderOptions = {}
): Promise<Buffer | null> {
  const { format = "A4", landscape = false } = options;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({ format, landscape, printBackground: true });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch (e) {
    console.error("renderHtmlToPdf error:", e);
    return null;
  }
}
