(function(){/*! instant.page v1.2.2 - (C) 2019 Alexandre Dieulot - https://instant.page/license */
var urlToPreload
var mouseoverTimer
var lastTouchTimestamp
var prefetcher=document.createElement('link')
var isSupported=prefetcher.relList&&prefetcher.relList.supports&&prefetcher.relList.supports('prefetch')
var isDataSaverEnabled=navigator.connection&&navigator.connection.saveData
var allowQueryString='instantAllowQueryString' in document.body.dataset
var allowExternalLinks='instantAllowExternalLinks' in document.body.dataset
if(isSupported&&!isDataSaverEnabled){prefetcher.rel='prefetch'
document.head.appendChild(prefetcher)
var eventListenersOptions={capture:!0,passive:!0}
document.addEventListener('touchstart',touchstartListener,eventListenersOptions)
document.addEventListener('mouseover',mouseoverListener,eventListenersOptions)}
function touchstartListener(event){lastTouchTimestamp=performance.now()
var linkElement=event.target.closest('a')
if(!isPreloadable(linkElement)){return}
linkElement.addEventListener('touchcancel',touchendAndTouchcancelListener,{passive:!0})
linkElement.addEventListener('touchend',touchendAndTouchcancelListener,{passive:!0})
urlToPreload=linkElement.href
preload(linkElement.href)}
function touchendAndTouchcancelListener(){urlToPreload=undefined
stopPreloading()}
function mouseoverListener(event){if(performance.now()-lastTouchTimestamp<1100){return}
var linkElement=event.target.closest('a')
if(!isPreloadable(linkElement)){return}
linkElement.addEventListener('mouseout',mouseoutListener,{passive:!0})
urlToPreload=linkElement.href
mouseoverTimer=setTimeout(function(){preload(linkElement.href)
mouseoverTimer=undefined},65)}
function mouseoutListener(event){if(event.relatedTarget&&event.target.closest('a')===event.relatedTarget.closest('a')){return}
if(mouseoverTimer){clearTimeout(mouseoverTimer)
mouseoverTimer=undefined}else{urlToPreload=undefined
stopPreloading()}}
function isPreloadable(linkElement){if(!linkElement||!linkElement.href){return}
if(urlToPreload===linkElement.href){return}
var preloadLocation=new URL(linkElement.href)
if(!allowExternalLinks&&preloadLocation.origin!==location.origin&&!('instant' in linkElement.dataset)){return}
if(!['http:','https:'].includes(preloadLocation.protocol)){return}
if(preloadLocation.protocol==='http:'&&location.protocol==='https:'){return}
if(!allowQueryString&&preloadLocation.search&&!('instant' in linkElement.dataset)){return}
if(preloadLocation.hash&&preloadLocation.pathname+preloadLocation.search===location.pathname+location.search){return}
if('noInstant' in linkElement.dataset){return}
return!0}
function preload(url){prefetcher.href=url}
function stopPreloading(){prefetcher.removeAttribute('href')}})()
;