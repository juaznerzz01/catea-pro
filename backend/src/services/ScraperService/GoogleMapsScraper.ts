import puppeteer, { Browser, Page } from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import logger from "../../utils/logger";
import ScraperResult from "../../models/ScraperResult";
import ScraperFolder from "../../models/ScraperFolder";

interface ScrapeJob {
  id: string;
  term: string;
  city: string;
  scrolls: number;
  status: "running" | "done" | "error";
  progress: string;
  results: number;
  data: any[];
  companyId: number;
  folderId: number;
  createdAt: Date;
  error?: string;
}

const jobs = new Map<string, ScrapeJob>();

// Limpa jobs antigos (>1h) a cada 10 min
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt.getTime() > 3600000 && job.status !== "running") {
      jobs.delete(id);
    }
  }
}, 600000);

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: "new" as any,
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--window-size=1920,1080"
    ]
  });
}

async function handleConsent(page: Page): Promise<void> {
  try {
    // Google consent dialog
    const consentBtn = await page.$(
      'button[aria-label*="Aceitar"], button[aria-label*="Accept"], form[action*="consent"] button'
    );
    if (consentBtn) {
      await consentBtn.click();
      await page.waitForTimeout(2000);
    }
  } catch {}
}

async function extractResultsFromFeed(page: Page): Promise<any[]> {
  return page.evaluate(() => {
    const results: any[] = [];
    // Seleciona os cards de resultado dentro do feed
    const feed = document.querySelector('div[role="feed"]');
    if (!feed) return results;

    const items = feed.querySelectorAll(':scope > div > div > a[href*="/maps/place/"]');

    items.forEach((link: any) => {
      try {
        const container = link.closest('div');
        if (!container) return;

        // Pega o texto visível do card
        const allText = container.innerText || "";
        const lines = allText.split("\n").map((l: string) => l.trim()).filter(Boolean);

        // Nome - geralmente o aria-label do link ou primeira linha significativa
        let name = link.getAttribute("aria-label") || "";
        if (!name && lines.length > 0) name = lines[0];

        // URL do Maps
        const mapsLink = link.href || "";

        // Rating e reviews
        let rating = "";
        let reviewCount = "";
        const ratingEl = container.querySelector('span[role="img"]');
        if (ratingEl) {
          const ariaLabel = ratingEl.getAttribute("aria-label") || "";
          const ratingMatch = ariaLabel.match(/([\d,\.]+)/);
          if (ratingMatch) rating = ratingMatch[1].replace(",", ".");
        }
        const reviewMatch = allText.match(/\((\d[\d.]*)\)/);
        if (reviewMatch) reviewCount = reviewMatch[1];

        // Categoria - geralmente aparece como uma das primeiras linhas curtas
        let category = "";
        // Endereço - linha mais longa com números
        let address = "";
        // Telefone
        let phone = "";
        // Website
        let website = "";
        // Horário
        let hours = "";

        for (const line of lines) {
          if (line === name) continue;
          if (line.match(/^\d[,.]?\d?\s*$/) || line.match(/^\(\d/)) continue;

          // Telefone
          if (line.match(/^\+?\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}/) ||
              line.match(/^\(\d{2}\)/)) {
            if (!phone) phone = line;
            continue;
          }

          // Horário
          if (line.match(/Fecha|Abre|Aberto|Fechado|:00|hrs/i)) {
            if (!hours) hours = line;
            continue;
          }

          // Website (nunca contém espaços, tem ponto)
          if (line.match(/^[\w-]+\.[\w.]+\/?/) && !line.includes(" ")) {
            if (!website) website = line;
            continue;
          }

          // Endereço - tem número, vírgula, ou palavras como R., Av., Rua
          if (line.match(/\d/) && (line.includes(",") || line.match(/R\.|Av\.|Rua|Rod\.|Estr\.|Al\./i))) {
            if (!address) address = line;
            continue;
          }

          // Categoria - texto curto sem números
          if (!category && line.length < 40 && !line.match(/\d{3}/)) {
            category = line;
          }
        }

        if (name) {
          results.push({
            name,
            category,
            rating,
            reviewCount,
            phone,
            address,
            website,
            hours,
            plusCode: "",
            mapsLink
          });
        }
      } catch {}
    });

    return results;
  });
}

async function extractDetailedData(page: Page, link: string): Promise<any> {
  try {
    await page.goto(link, { waitUntil: "networkidle2", timeout: 15000 });
    await page.waitForTimeout(1500);

    return page.evaluate(() => {
      const getText = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? (el as HTMLElement).innerText.trim() : "";
      };

      const getAttr = (sel: string, attr: string) => {
        const el = document.querySelector(sel);
        return el ? el.getAttribute(attr) || "" : "";
      };

      // Nome
      const name = getText('h1') || "";

      // Categoria
      const categoryEl = document.querySelector('button[jsaction*="category"]');
      const category = categoryEl ? (categoryEl as HTMLElement).innerText.trim() : "";

      // Rating
      const ratingEl = document.querySelector('div.F7nice span[aria-hidden="true"]');
      const rating = ratingEl ? (ratingEl as HTMLElement).innerText.trim() : "";

      // Review count
      let reviewCount = "";
      const reviewEl = document.querySelector('div.F7nice span[aria-label]');
      if (reviewEl) {
        const label = reviewEl.getAttribute("aria-label") || "";
        const m = label.match(/([\d.]+)/);
        if (m) reviewCount = m[1];
      }

      // Info buttons
      let phone = "";
      let address = "";
      let website = "";
      let hours = "";
      let plusCode = "";

      const buttons = document.querySelectorAll('button[data-item-id]');
      buttons.forEach((btn: any) => {
        const itemId = btn.getAttribute("data-item-id") || "";
        const text = btn.getAttribute("aria-label") || btn.innerText || "";
        if (itemId.startsWith("phone:")) phone = text.replace(/^.*:\s*/, "");
        if (itemId === "address") address = text.replace(/^.*:\s*/, "");
        if (itemId === "oloc") plusCode = text.replace(/^.*:\s*/, "");
      });

      const websiteLink = document.querySelector('a[data-item-id="authority"]');
      if (websiteLink) website = websiteLink.getAttribute("href") || "";

      // Hours
      const hoursEl = document.querySelector('div[aria-label*="horário"], div[aria-label*="hours"]');
      if (hoursEl) hours = hoursEl.getAttribute("aria-label") || "";

      return {
        name,
        category,
        rating,
        reviewCount,
        phone,
        address,
        website,
        hours,
        plusCode,
        mapsLink: window.location.href
      };
    });
  } catch {
    return null;
  }
}

async function runScrape(job: ScrapeJob): Promise<void> {
  let browser: Browser | null = null;

  try {
    job.progress = "Iniciando navegador...";
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultTimeout(30000);

    // Monta a query de busca
    let query = job.term;
    if (job.city) query += ` em ${job.city}`;

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    job.progress = "Abrindo Google Maps...";
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });

    await handleConsent(page);

    // Espera o feed de resultados
    job.progress = "Carregando resultados...";
    try {
      await page.waitForSelector('div[role="feed"]', { timeout: 10000 });
    } catch {
      // Pode ser que só tem 1 resultado (abriu direto no local)
      const singleResult = await extractDetailedData(page, page.url());
      if (singleResult && singleResult.name) {
        job.data = [singleResult];
        job.results = 1;
        job.status = "done";
        job.progress = "1 resultado encontrado";
        await saveJobResults(job);
        return;
      }
      throw new Error("Nenhum resultado encontrado para esta busca");
    }

    // Scroll para carregar mais resultados
    for (let i = 0; i < job.scrolls; i++) {
      job.progress = `Rolagem ${i + 1}/${job.scrolls}...`;

      const endReached = await page.evaluate(() => {
        const feed = document.querySelector('div[role="feed"]');
        if (!feed) return true;
        feed.scrollBy(0, 3000);
        // Verifica se chegou ao final
        const endMsg = feed.querySelector('span.HlvSq');
        return !!endMsg;
      });

      if (endReached) {
        job.progress = `Final da lista (rolagem ${i + 1}/${job.scrolls})`;
        break;
      }

      // Delay aleatório entre scrolls (1-2.5s)
      await page.waitForTimeout(1000 + Math.random() * 1500);
    }

    // Extrai dados da lista
    job.progress = "Extraindo dados da lista...";
    const feedResults = await extractResultsFromFeed(page);

    if (feedResults.length === 0) {
      throw new Error("Nenhum resultado extraído");
    }

    job.progress = `${feedResults.length} encontrados, coletando detalhes...`;

    // Para cada resultado, visita a página de detalhes para pegar mais info
    const detailedResults: any[] = [];
    const maxDetailed = Math.min(feedResults.length, 500);

    for (let i = 0; i < maxDetailed; i++) {
      const item = feedResults[i];
      job.progress = `Detalhes ${i + 1}/${maxDetailed}...`;
      job.results = detailedResults.length;

      if (item.mapsLink) {
        const detailed = await extractDetailedData(page, item.mapsLink);
        if (detailed && detailed.name) {
          detailedResults.push(detailed);
        } else {
          // Usa dados do feed como fallback
          detailedResults.push(item);
        }
      } else {
        detailedResults.push(item);
      }

      // Delay entre visitas (0.5-1.5s)
      if (i < maxDetailed - 1) {
        await page.waitForTimeout(500 + Math.random() * 1000);
      }
    }

    job.data = detailedResults;
    job.results = detailedResults.length;
    job.status = "done";
    job.progress = `${detailedResults.length} resultados coletados`;

    // Salva automaticamente no banco
    await saveJobResults(job);

  } catch (err: any) {
    logger.error(`Scraper error job ${job.id}: ${err.message}`);
    job.status = "error";
    job.error = err.message;
    job.progress = `Erro: ${err.message}`;
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}

async function saveJobResults(job: ScrapeJob): Promise<void> {
  try {
    if (!job.data.length || !job.folderId) return;

    const folder = await ScraperFolder.findOne({
      where: { id: job.folderId, companyId: job.companyId }
    });
    if (!folder) return;

    const records = job.data.map(r => ({
      folderId: job.folderId,
      companyId: job.companyId,
      name: r.name || "",
      category: r.category || "",
      rating: r.rating || "",
      reviewCount: r.reviewCount || "",
      phone: r.phone || "",
      address: r.address || "",
      website: r.website || "",
      hours: r.hours || "",
      plusCode: r.plusCode || "",
      mapsLink: r.mapsLink || ""
    }));

    await ScraperResult.bulkCreate(records);
    job.progress = `${records.length} resultados salvos na pasta`;
    logger.info(`Scraper job ${job.id}: ${records.length} results saved to folder ${job.folderId}`);
  } catch (err: any) {
    logger.error(`Scraper save error job ${job.id}: ${err.message}`);
  }
}

// ========== API PÚBLICA ==========

export function startJob(
  term: string,
  city: string,
  scrolls: number,
  companyId: number,
  folderId: number
): string {
  const id = uuidv4();
  const job: ScrapeJob = {
    id,
    term,
    city,
    scrolls: Math.min(scrolls, 50),
    status: "running",
    progress: "Iniciando...",
    results: 0,
    data: [],
    companyId,
    folderId,
    createdAt: new Date()
  };

  jobs.set(id, job);

  // Executa em background
  runScrape(job);

  return id;
}

export function getJobs(companyId: number): any[] {
  const result: any[] = [];
  for (const [, job] of jobs) {
    if (job.companyId === companyId) {
      result.push({
        id: job.id,
        term: job.term,
        city: job.city,
        status: job.status,
        progress: job.progress,
        results: job.results,
        error: job.error,
        createdAt: job.createdAt
      });
    }
  }
  return result.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export function getJobResults(jobId: string, companyId: number): any[] | null {
  const job = jobs.get(jobId);
  if (!job || job.companyId !== companyId) return null;
  return job.data;
}
