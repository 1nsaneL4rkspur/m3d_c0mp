(function(){
  /* ---------- 淺色／深色主題手動切換 ---------- */
  var themeToggle = document.getElementById('themeToggle');
  var root = document.documentElement;

  function getEffectiveTheme(){
    var attr = root.getAttribute('data-theme');
    if(attr === 'light' || attr === 'dark') return attr;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function setTheme(theme){
    root.setAttribute('data-theme', theme);
    try{ localStorage.setItem('theme-pref', theme); }catch(e){}
  }
  try{
    var stored = localStorage.getItem('theme-pref');
    if(stored === 'light' || stored === 'dark'){ root.setAttribute('data-theme', stored); }
  }catch(e){}
  if(themeToggle){
    themeToggle.addEventListener('click', function(){
      setTheme(getEffectiveTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('navPanel');
  var backdrop = document.getElementById('backdrop');

  function openPanel(){
    panel.classList.add('open');
    backdrop.classList.add('show');
    menuBtn.setAttribute('aria-expanded','true');
  }
  function closePanel(){
    panel.classList.remove('open');
    backdrop.classList.remove('show');
    menuBtn.setAttribute('aria-expanded','false');
  }
  menuBtn.addEventListener('click', function(){
    if(panel.classList.contains('open')) closePanel(); else openPanel();
  });
  backdrop.addEventListener('click', closePanel);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closePanel();
  });

  var buttons = document.querySelectorAll('#filterSeg button');
  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      buttons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      document.body.classList.remove('mode-verified','mode-inference');
      var mode = btn.getAttribute('data-mode');
      if(mode === 'verified') document.body.classList.add('mode-verified');
      if(mode === 'inference') document.body.classList.add('mode-inference');
    });
  });

  /* ---------- Multi-page routing ---------- */
  var PAGES_WITH_FILTER = { intro:false, districts:false, uneven:true, climate:true, monastery:false, food:false, herbs:false };
  var PAGES_WITH_TOC = { intro:false, districts:true, uneven:true, climate:true, monastery:true, food:true, herbs:true };
  var pageEls = {};
  document.querySelectorAll('.page').forEach(function(p){ pageEls[p.getAttribute('data-page')] = p; });
  var pageTabs = Array.prototype.slice.call(document.querySelectorAll('.pagetab'));
  var filterboxInline = document.getElementById('filterboxInline');
  var tocLists = {};
  document.querySelectorAll('nav.toc[data-toc-for]').forEach(function(n){ tocLists[n.getAttribute('data-toc-for')] = n; });

  var links = {}, targets = {};
  function buildTocIndex(pageId){
    var nav = tocLists[pageId];
    if(!nav) return;
    var as = Array.prototype.slice.call(nav.querySelectorAll('a'));
    links[pageId] = as;
    targets[pageId] = as.map(function(a){ return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
    as.forEach(function(a){
      a.addEventListener('click', function(){ closePanel(); });
    });
  }
  Object.keys(tocLists).forEach(buildTocIndex);

  var currentPage = 'intro';

  function switchPage(id, opts){
    opts = opts || {};
    if(!pageEls[id]) id = 'intro';
    currentPage = id;

    Object.keys(pageEls).forEach(function(key){
      pageEls[key].hidden = (key !== id);
    });
    pageTabs.forEach(function(tab){
      var active = tab.getAttribute('data-page') === id;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    Object.keys(tocLists).forEach(function(key){
      tocLists[key].hidden = (key !== id);
    });
    if(filterboxInline){
      filterboxInline.style.display = PAGES_WITH_FILTER[id] ? '' : 'none';
    }
    if(menuBtn){
      menuBtn.style.display = PAGES_WITH_TOC[id] ? '' : 'none';
    }
    closePanel();
    if(!opts.keepHash){
      history.replaceState(null, '', '#p-' + id);
    }
    if(!opts.keepScroll){
      window.scrollTo(0, 0);
    }
    onScroll();
  }

  pageTabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      switchPage(tab.getAttribute('data-page'));
    });
  });

  function onScroll(){
    var as = links[currentPage], ts = targets[currentPage];
    if(!as || !ts || !ts.length) return;
    var pos = window.scrollY + 120;
    var current = ts[0];
    ts.forEach(function(t){ if(t.offsetTop <= pos) current = t; });
    as.forEach(function(a){ a.classList.remove('active'); });
    var idx = ts.indexOf(current);
    if(idx > -1) as[idx].classList.add('active');
  }
  window.addEventListener('scroll', onScroll, {passive:true});

  function routeFromHash(){
    var hash = location.hash.replace('#','');
    if(hash.indexOf('p-') === 0){
      switchPage(hash.slice(2), {keepHash:true});
    } else if(hash && document.getElementById(hash)){
      var el = document.getElementById(hash);
      var pageAncestor = el.closest ? el.closest('.page') : null;
      var pageId = pageAncestor ? pageAncestor.getAttribute('data-page') : currentPage;
      switchPage(pageId, {keepHash:true, keepScroll:true});
    } else {
      switchPage('intro', {keepHash:true, keepScroll:true});
    }
  }
  routeFromHash();
  window.addEventListener('hashchange', routeFromHash);
  onScroll();
})();
