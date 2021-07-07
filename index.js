const puppeteer = require("puppeteer");
const fs = require("fs");

const main = async ({ url, zip }) => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 25, // slow down by 250ms
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  await page.goto(url);
  const searchInput = ".search-input-wrapper input";

  await page.click(searchInput);
  await page.keyboard.type(zip);
  await page.keyboard.press("Enter");

  await page.waitForNavigation();
  // TODO TODO: create a new directory for url if it doesn't exist, else change
  //  directory to url directory and then save the timestamp.png
  // TODO save the filename as the url+timestamp.png
  await page.screenshot({ path: "output/screenshot.png" });

  // css selector to get all store-cards
  // .store-card is the class selector on the div dom element
  // [data-qa] is the attribute selector on the div dom element
  // no space between to select on the same level
  const facilitiesList = await page.$$(".store-card[data-qa]");

  // This is a function that gets called after the definition
  const getFacilityInfo = async () => {
    // Promise says to do the actions in the parameters, and then wait for them to finish
    return Promise.all(
      // take all the facilities in the list and loop over them
      facilitiesList.map(async (facility) => {
        try {
          return await facility.evaluate((node) => {
            // Kyle mostly working here
            const name =
              node.querySelector(
                ".store-card-container .store-card-address a.address span"
              )?.innerText || "";

            const streetAddress =
              node.querySelectorAll(
                ".store-card-container .store-card-address a.address span"
              )[1]?.innerText || "";

            const cityAddressSection =
              node.querySelectorAll(
                ".store-card-container .store-card-address a.address span"
              )[2]?.innerText || "";

            const address = `${streetAddress}
                              ${cityAddressSection}`;

            const dataPrice =
              node.querySelector(
                ".store-card-container .store-card-price-container .value"
              )?.innerText || "";
            const actualPrice = dataPrice.substring(1);

            // TODO go to facility page,
            // wait for page to load
            // css selector for each size card
            // get dimensions
            // get price
            // save to sizes object

            // return all that data as an object.
            return {
              name,
              address,
              price: actualPrice,
              sizes: { small: "$5", medium: "$10" },
            };
          });
        } catch (error) {
          console.log("error", error);
        }
      })
    );
  };
  // Calling the function above
  const facilities = await getFacilityInfo();

  const data = {
    url: url,
    zip: zip,
    facilities,
  };

  // write to file system the JSON.stringify data
  await fs.writeFileSync(
    "output/response.json",
    JSON.stringify(data, null, "\t")
  );

  // finish the session
  await browser.close();
};

main({ url: "https://www.extraspace.com/", zip: "84043" });
