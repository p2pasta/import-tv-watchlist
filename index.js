// imports
const pup = require('puppeteer')
var fs = require('fs');

// HERE IS THE DATA YOU NEED TO CHANGE
const config = {
	username: "ADD YOUR TRADINGVIEW EMAIL/USERNAME HERE",
	password: "ADD YOUR TRADINGVIEW PASSWORD HERE",
	txtname: "binance_eth_markets",
	exchange: "binance",
	remove_previous_watchlist: true
}


const url = "https://www.tradingview.com/chart/nBUhziY3"
const importNeeded = []

try {  
    var data = fs.createReadStream(config.txtname + '.txt', 'utf8');
    readLines(data, function(x){
    	importNeeded.push(x)    
    })
} catch(e) {
    console.log('Error:', e.stack);
}


// the main function
async function run () {
    const browser = await pup.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(url);

    // check if cookies need to be accepted 
    if((await page.$('.toast-305jedKL')) !== null){
    	if((await page.$('.button-1iktpaT1')) !== null){        	
    	   	await page.click('.button-1iktpaT1');
    	}
    }

    // wait for modal
    await page.waitForSelector('[data-dialog-name="gopro"]')
    // if there is a dialogue/modal
    if ((await page.$('[data-dialog-name="gopro"]')) !== null){
    	console.log("Dialogue/modal found. Closing it now.")

    	// Click the close button
    	await page.waitForSelector('button[aria-label="Close"]')
    	await page.click('button[aria-label="Close"]');

    	// Click the hamburger menu
    	await page.waitForSelector('.button-2WfzAPA-')
    	await page.click('.button-2WfzAPA-');
    	// const [button] = await page.$x("//div[@class='elements']/button[contains(., 'B¬utton text')]");
    	// Click the sign in button
    	const [signin] = await page.$x("//div[@class='label-2IihgTnv']/span[contains(., 'Sign In')]")
    	if (signin) {
    		await signin.click()

    		// click email sign in button
    		await page.waitForSelector('.tv-signin-dialog__toggle-email')
    		await page.click('.tv-signin-dialog__toggle-email')

    		// type in username & password 
    		await page.waitForSelector('.tv-button__loader')
    		await page.type('[autocomplete="username"]', config.username, { delay: 30 })
			await page.type('[autocomplete="current-password"]', config.password, { delay: 30 })
			await page.click('.tv-button__loader')


			// Wait for logged in
			await delay(2000)
			// Clear list before adding
			await page.waitForSelector("[data-name='settings-button']")
			await page.waitForSelector("[data-name='add-symbol-button']")
			
			if (remove_previous_watchlist) {			
				await page.click("[data-name='settings-button']")
				await page.waitForSelector('.menuBox-g78rwseC')

				const [clearList] = await page.$x("//div[@class='labelRow-2IihgTnv']/div[contains(., 'Clear list')]")
				if(clearList){
					console.log("Clearing list")
					clearList.click()
					// confirmation
					await page.waitForSelector("[data-name='confirm-dialog']")
					await page.click("button[name='yes']")

					// list is cleared, importing can begin
					
					await page.waitForSelector("[data-name='add-symbol-button']")
					await page.click("[data-name='add-symbol-button']")
					await page.waitForSelector("[data-role='search']")
					
					for (var i = 0; i < importNeeded.length; i++) {
						let p = importNeeded[i]
						let exchange = config.exchange.toUpperCase()						
						await page.type("[data-role='search']", p, { delay: 50 })
						delay(1000)
						await page.keyboard.press('Enter');					

						delay(1000)
						// remove existing input content					
						let inputValue = await page.$eval("[data-role='search']", el => el.value);
						for (let i = 0; i < inputValue.length; i++) {
						   await page.keyboard.press('Backspace');
						}									
					}
					await page.click("[data-name='close']")

					// Screenshot
		    		// await page.screenshot({path: 'screenshot.png'});
		    		// console.log("Screenshot taken.")
				} 
			} else {
				await page.waitForSelector("[data-name='add-symbol-button']")
				await page.click("[data-name='add-symbol-button']")
				await page.waitForSelector("[data-role='search']")
				
				for (var i = 0; i < importNeeded.length; i++) {
					let p = importNeeded[i]
					let exchange = config.exchange.toUpperCase()					
					await page.type("[data-role='search']", p, { delay: 50 })
					delay(1000)
					await page.keyboard.press('Enter');					

					delay(1000)
					// remove existing input content					
					let inputValue = await page.$eval("[data-role='search']", el => el.value);
					for (let i = 0; i < inputValue.length; i++) {
					   await page.keyboard.press('Backspace');
					}									
				}
				await page.click("[data-name='close']")
			} 		
    	}    	   	
    } else {
    	console.log("No dialogue or modal found")
    	await page.screenshot({path: 'screenshot.png'});
    	browser.close();
    }  
}

async function createList(){
	await page.waitForSelector("[data-name='watchlists-button']")
	await page.click("[data-name='watchlists-button']")
	const [createList] = await page.$x("//div[@class='labelRow-2IihgTnv']/div[contains(., 'Create new list…')]")
	if (createList){
		console.log("Create a list button found.")
		await createList.click()
	}
}

function delay(time) {
   return new Promise(function(resolve) { 
       setTimeout(resolve, time)
   });
}

const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};

const clickByText = async (page, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(`//em[contains(text(), ${escapedText})]`);
  
  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error(`Link not found: ${text}`);
  }
};

function readLines(input, func) {
  var remaining = '';

  input.on('data', function(data) {
    remaining += data;
    var index = remaining.indexOf('\n');
    while (index > -1) {
      var line = remaining.substring(0, index);
      remaining = remaining.substring(index + 1);
      func(line);
      index = remaining.indexOf('\n');
    }
  });

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
  });
}

run();

