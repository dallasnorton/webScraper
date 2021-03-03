const puppeteer = require("puppeteer");
const fs = require("fs");

const main = async () => {
  const zip = "84043";

  const browser = await puppeteer.launch({
    // headless: false,
    // slowMo: 250, // slow down by 250ms
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  await page.goto("https://www.extraspace.com/");
  const searchInput = ".search-input-wrapper input";

  await page.click(searchInput);
  await page.keyboard.type(zip);
  await page.keyboard.press("Enter");

  await page.waitForNavigation();
  await page.screenshot({ path: "output/screenshot.png" });

  const facilitiesList = await page.$$("#results-in [data-qa=facility-card]");

  const getFacilityInfo = async () => {
    return Promise.all(
      facilitiesList.map(async (facility) => {
        return await facility.evaluate((node) => {
          const name = node.querySelector(".fn.org").innerText || "";
          const address = node.querySelector(".adr").innerText || "";
          const dataPrice = node.getAttribute("data-price") || "";
          return { name, address, price: dataPrice };
        });
      })
    );
  };
  const facilities = await getFacilityInfo();

  const data = {
    zip: zip,
    facilities,
  };

  await fs.writeFileSync(
    "output/response.json",
    JSON.stringify(data, null, "\t")
  );

  await browser.close();
};

main();
