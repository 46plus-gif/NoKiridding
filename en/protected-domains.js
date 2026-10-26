(() => {
  'use strict';
  // These are comparison references, not a claim that similar domains are malicious.
  const rows = [
    ['Microsoft','microsoft.com microsoftonline.com live.com outlook.com linkedin.com'],
    ['Google','google.com google.co.jp gmail.com youtube.com'], ['Amazon','amazon.com amazon.co.uk amazon.de amazon.co.jp amazon.ca amazon.fr'],
    ['Apple','apple.com apple.co.jp icloud.com'], ['Meta','facebook.com instagram.com whatsapp.com'],
    ['Mercari','mercari.com mercari.jp'], ['PayPal','paypal.com venmo.com'], ['Adobe','adobe.com'], ['Netflix','netflix.com'],
    ['Booking Holdings','booking.com agoda.com priceline.com'], ['Expedia','expedia.com expedia.co.jp hotels.com vrbo.com'],
    ['Airbnb','airbnb.com airbnb.jp'], ['Uber','uber.com ubereats.com'], ['Lyft','lyft.com'],
    ['eBay','ebay.com ebay.co.jp'], ['Alibaba','alibaba.com alibaba.co.jp aliexpress.com'], ['Walmart','walmart.com'],
    ['Target','target.com'], ['Costco','costco.com costco.co.jp'], ['Best Buy','bestbuy.com'], ['Etsy','etsy.com'],
    ['Shopify','shopify.com'], ['Mercado Libre','mercadolibre.com'], ['Rakuten','rakuten.com rakuten.co.jp'],
    ['Samsung','samsung.com'], ['Sony','sony.com sony.co.jp playstation.com'], ['Nintendo','nintendo.com nintendo.co.jp'],
    ['Electronic Arts','ea.com'], ['Valve','steampowered.com steamcommunity.com'], ['Epic Games','epicgames.com'],
    ['Roblox','roblox.com'], ['Discord','discord.com'], ['Zoom','zoom.us'], ['Salesforce','salesforce.com slack.com'],
    ['Dropbox','dropbox.com'], ['Box','box.com'], ['Notion','notion.so notion.com'], ['Canva','canva.com'],
    ['Figma','figma.com'], ['Atlassian','atlassian.com trello.com'], ['Automattic','wordpress.com tumblr.com'],
    ['GoDaddy','godaddy.com'], ['Cloudflare','cloudflare.com'], ['DigitalOcean','digitalocean.com'],
    ['Oracle','oracle.com'], ['IBM','ibm.com'], ['Cisco','cisco.com webex.com'], ['Dell','dell.com dell.co.jp'],
    ['HP','hp.com'], ['Lenovo','lenovo.com'], ['Intel','intel.com intel.co.jp'], ['AMD','amd.com'], ['NVIDIA','nvidia.com'],
    ['OpenAI','openai.com chatgpt.com'], ['Anthropic','anthropic.com claude.ai'], ['Spotify','spotify.com'],
    ['Reddit','reddit.com'], ['Pinterest','pinterest.com'], ['Snap','snap.com snapchat.com'],
    ['ByteDance','bytedance.com tiktok.com'], ['X','x.com twitter.com x.ai'], ['Quora','quora.com'],
    ['Yahoo','yahoo.com yahoo.co.jp'], ['Proton','proton.me protonmail.com'], ['Fastmail','fastmail.com'],
    ['1Password','1password.com'], ['Bitwarden','bitwarden.com'], ['Nord Security','nordsecurity.com nordvpn.com'],
    ['Surfshark','surfshark.com'], ['Intuit','intuit.com mailchimp.com'], ['DocuSign','docusign.com'],
    ['ServiceNow','servicenow.com servicenow.co.jp'], ['SAP','sap.com'], ['Workday','workday.com'], ['Okta','okta.com auth0.com'],
    ['Twilio','twilio.com sendgrid.com'], ['HubSpot','hubspot.com'], ['Zendesk','zendesk.com zendesk.co.jp'],
    ['Stripe','stripe.com'], ['Block','block.xyz squareup.com cash.app'], ['Wise','wise.com'],
    ['Revolut','revolut.com'], ['Coinbase','coinbase.com'], ['Binance','binance.com'], ['Kraken','kraken.com'],
    ['Robinhood','robinhood.com'], ['JPMorgan Chase','jpmorganchase.com chase.com'],
    ['Bank of America','bankofamerica.com'], ['Wells Fargo','wellsfargo.com'], ['Citigroup','citigroup.com citi.com'],
    ['American Express','americanexpress.com'], ['Capital One','capitalone.com'], ['HSBC','hsbc.com hsbc.co.jp'],
    ['Barclays','barclays.com'], ['Santander','santander.com'], ['ING','ing.com'], ['DHL','dhl.com'],
    ['UPS','ups.com'], ['FedEx','fedex.com'], ['Maersk','maersk.com'], ['Delta Air Lines','delta.com']
  ];
  globalThis.NoKiriddingDefaults = Object.freeze(rows.map(([name, domains]) =>
    Object.freeze({ name, domains: Object.freeze(domains.split(' ')) })));
})();
