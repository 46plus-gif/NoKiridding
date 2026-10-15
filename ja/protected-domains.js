(() => {
  'use strict';
  // These are comparison references, not a claim that similar domains are malicious.
  const rows = [
    ['Microsoft','microsoft.com microsoftonline.com live.com outlook.com linkedin.com'],
    ['Google','google.com gmail.com youtube.com'], ['Amazon','amazon.com amazon.co.uk amazon.de amazon.co.jp'],
    ['Apple','apple.com icloud.com'], ['Meta','facebook.com instagram.com whatsapp.com'],
    ['PayPal','paypal.com venmo.com'], ['Adobe','adobe.com'], ['Netflix','netflix.com'],
    ['Booking Holdings','booking.com agoda.com priceline.com'], ['Expedia','expedia.com hotels.com vrbo.com'],
    ['Airbnb','airbnb.com'], ['Uber','uber.com ubereats.com'], ['Lyft','lyft.com'],
    ['eBay','ebay.com'], ['Alibaba','alibaba.com aliexpress.com'], ['Walmart','walmart.com'],
    ['Target','target.com'], ['Costco','costco.com'], ['Best Buy','bestbuy.com'], ['Etsy','etsy.com'],
    ['Shopify','shopify.com'], ['Mercado Libre','mercadolibre.com'], ['Rakuten','rakuten.com rakuten.co.jp'],
    ['Samsung','samsung.com'], ['Sony','sony.com playstation.com'], ['Nintendo','nintendo.com'],
    ['Electronic Arts','ea.com'], ['Valve','steampowered.com steamcommunity.com'], ['Epic Games','epicgames.com'],
    ['Roblox','roblox.com'], ['Discord','discord.com'], ['Zoom','zoom.us'], ['Salesforce','salesforce.com slack.com'],
    ['Dropbox','dropbox.com'], ['Box','box.com'], ['Notion','notion.so notion.com'], ['Canva','canva.com'],
    ['Figma','figma.com'], ['Atlassian','atlassian.com trello.com'], ['Automattic','wordpress.com tumblr.com'],
    ['GoDaddy','godaddy.com'], ['Cloudflare','cloudflare.com'], ['DigitalOcean','digitalocean.com'],
    ['Oracle','oracle.com'], ['IBM','ibm.com'], ['Cisco','cisco.com webex.com'], ['Dell','dell.com'],
    ['HP','hp.com'], ['Lenovo','lenovo.com'], ['Intel','intel.com'], ['AMD','amd.com'], ['NVIDIA','nvidia.com'],
    ['OpenAI','openai.com chatgpt.com'], ['Anthropic','anthropic.com claude.ai'], ['Spotify','spotify.com'],
    ['Reddit','reddit.com'], ['Pinterest','pinterest.com'], ['Snap','snap.com snapchat.com'],
    ['ByteDance','bytedance.com tiktok.com'], ['X','x.com twitter.com'], ['Quora','quora.com'],
    ['Yahoo','yahoo.com'], ['Proton','proton.me protonmail.com'], ['Fastmail','fastmail.com'],
    ['1Password','1password.com'], ['Bitwarden','bitwarden.com'], ['Nord Security','nordsecurity.com nordvpn.com'],
    ['Surfshark','surfshark.com'], ['Intuit','intuit.com mailchimp.com'], ['DocuSign','docusign.com'],
    ['ServiceNow','servicenow.com'], ['SAP','sap.com'], ['Workday','workday.com'], ['Okta','okta.com auth0.com'],
    ['Twilio','twilio.com sendgrid.com'], ['HubSpot','hubspot.com'], ['Zendesk','zendesk.com'],
    ['Stripe','stripe.com'], ['Block','block.xyz squareup.com cash.app'], ['Wise','wise.com'],
    ['Revolut','revolut.com'], ['Coinbase','coinbase.com'], ['Binance','binance.com'], ['Kraken','kraken.com'],
    ['Robinhood','robinhood.com'], ['JPMorgan Chase','jpmorganchase.com chase.com'],
    ['Bank of America','bankofamerica.com'], ['Wells Fargo','wellsfargo.com'], ['Citigroup','citigroup.com citi.com'],
    ['American Express','americanexpress.com'], ['Capital One','capitalone.com'], ['HSBC','hsbc.com'],
    ['Barclays','barclays.com'], ['Santander','santander.com'], ['ING','ing.com'], ['DHL','dhl.com'],
    ['UPS','ups.com'], ['FedEx','fedex.com'], ['Maersk','maersk.com'], ['Delta Air Lines','delta.com']
  ];
  globalThis.NoKiriddingDefaults = Object.freeze(rows.map(([name, domains]) =>
    Object.freeze({ name, domains: Object.freeze(domains.split(' ')) })));
})();
