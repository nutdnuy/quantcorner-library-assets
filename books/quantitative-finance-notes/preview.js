const requestedPage = new URLSearchParams(location.search).get('page') || 'index';
if (/^[a-z0-9-]+$/.test(requestedPage)) document.querySelector('quantcorner-native-reader').setAttribute('page-url', requestedPage + '.json');
