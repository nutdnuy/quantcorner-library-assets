const page=new URLSearchParams(location.search).get('page')||'index';if(/^[a-z0-9/-]+$/.test(page))document.querySelector('quantcorner-native-reader').setAttribute('page-url',page+'.json');
