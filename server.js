// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 7000;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
//var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

const cors_proxy = require('./lib/cors-anywhere');
const server = cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
//  requireHeader: ['origin', 'x-requested-with'],
//  checkRateLimit: checkRateLimit,
  removeHeaders: [
//    'cookie',
//    'cookie2',
    // Strip Heroku-specific headers
//    'x-request-start',
//    'x-request-id',
//    'via',
//    'connect-time',
//    'total-route-time',
    // Other Heroku added debug headers
    // 'x-forwarded-for',
    // 'x-forwarded-proto',
    // 'x-forwarded-port',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
//    xfwd: false,
  },
  handleInitialRequest: function(req, res, location){
    if (location === null){
      return true;
    }
    console.log(`handleInitialRequest location:${location.href}`)
    //console.log('this:', this)
    let dotPos = location.host.indexOf('.')
    if (dotPos > 0){
      const domain = location.host.substring(dotPos+1)
      if (domain.length >= 4 || domain === 'js' || domain === 'top' || domain === 'ico'){
        dotPos = -1
      }
    }
    if (dotPos === -1 && this.lastLocation){
      //  console.log('wrong url:', location)
      if (location.path === '/'){ location.path = '' }
      const fixedUrl = `/${this.lastLocation.host}/${location.host}${location.path}`
      //console.log(`host: ${location.host} path:${location.path}`)
      const fixedHref = `${location.protocol}/${fixedUrl}`
      location.path = `/${location.host}${location.path}`
      //console.log('fixed path:', location.path)
      location.pathname = location.path
      location.host = this.lastLocation.host
      location.hostname = location.host
      location.href = fixedHref
      //  console.log('Fixed url:', location)
      console.log('Fixed url:', location.href)
      req.url = fixedUrl
      //  console.log('fixed req:',  req);
    }else{
      this.lastLocation = location
      console.log('url:', location.href)
      //  console.log('req:',  req);
    }
    //console.log('req:',  req);
//    console.log('req.headers:',  req.headers);
    //console.log('req.keys:',  Object.keys(req));
    //console.log('req.corsAnywhereRequestState.keys:',  Object.keys(req.corsAnywhereRequestState));
  }
})

const proxy = server.proxy

/*
proxy.on('proxyReq', function(proxyReq, req, res, options) {
    //  console.log('syms:', Object.getOwnPropertySymbols(proxyReq))
    //  Object.getOwnPropertySymbols(proxyReq).forEach(s => console.log(s, ' toString=' ,s.toString()))
    const kOutHeadersSym = Object.getOwnPropertySymbols(proxyReq).find(s => s.toString() === 'Symbol(kOutHeaders)')
    const kOutHeaders = proxyReq[kOutHeadersSym]
    let proxy_proto = kOutHeaders['x-forwarded-proto'][1]
    const pos = proxy_proto.lastIndexOf(',')
    proxy_proto = pos > 0 ? proxy_proto.substring(pos+1) : proxy_proto
    const proxy_host = `${proxy_proto}://${kOutHeaders['x-forwarded-host'][1]}`
    console.log(`proxy host = ${proxy_host}`)
    //  console.log('kOutHeaders:', kOutHeaders)

    console.log('proexyReq:',  proxyReq);
    const proxyUrl = `${proxy_host}/`
    const host = req.headers.referer?.substring(proxyUrl.length)
    console.log(`refer from ${host} referer: ${req.headers.referer}`)
    console.log('req.url:',  req.url);
//    console.log(req)
});
*/

server.listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
