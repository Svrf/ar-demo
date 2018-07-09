const debounce = require('debounce');
const SVRF = require('svrf-client');

const {start} = require('../dist/demo_tiger');
const {removeBackground, addPhotoBackground} = require('./viewer');

start();

const authApi = new SVRF.AuthenticateApi();
const mediaApi = new SVRF.MediaApi();

let trendingResults = null;
const resultsCache = {};

authApi.authenticate(new SVRF.Body('a key'))
  .then(({token}) => mediaApi.apiClient.authentications.XAppToken.apiKey = token)
  .then(() => mediaApi.getTrending({size: 50}))
  .then(({media}) => {
    const photos = media.filter((m) => m.type === 'photo');
    trendingResults = photos;

    photos
      .filter((p) => p.files.images['540'])
      .slice(0, 3)
      .forEach((p) => {
        const preview = document.createElement('img');
        preview.src = p.files.images['540'];
        explorePreviews.appendChild(preview);
        preview.addEventListener('click', () => {
          removeBackground();
          addPhotoBackground(p);
        });
      });
  });

const searchContainer = document.getElementById('searchContainer');
const searchResults = document.getElementById('searchResults');
const input = document.getElementById('searchBox');
const trending = document.getElementById('trending');
const explorePreviews = document.getElementById('explorePreview');

const handleKeyUp = debounce(() => {
  const {value} = input;

  trending.style.visibility = value.length ? 'hidden' : null;

  if(value.length === 0) {
    populateWithItems(trendingResults);
    return;
  }

  if(value.length < 3) {
    return;
  }

  if(resultsCache[value]) {
    populateWithItems(resultsCache[value]);
    return;
  }

  mediaApi.search(value, 'photo')
    .then(({media}) => {
      console.log(media);
      resultsCache[value] = media;
      populateWithItems(media);
    });
}, 500);

function appendResultItem(media) {
  const preview = document.createElement('img');
  const src = media.files.images['540'];
  if (!src) {
    return;
  }

  preview.src = src;
  preview.addEventListener('click', () => {
    removeBackground();
    addPhotoBackground(media);
    closeSearch();
  });

  searchResults.appendChild(preview);
}

function populateWithItems(items) {
  searchResults.innerHTML = '';
  items.forEach((item) => appendResultItem(item));
}

function closeSearch() {
  searchContainer.style.display = 'none';
  input.value = '';
  input.removeEventListener('keyup', handleKeyUp);
}

document.getElementById('exploreButton').addEventListener('click', function () {
  if (!trendingResults) {
    return;
  }

  searchContainer.style.display = null;
  populateWithItems(trendingResults);
  input.addEventListener('keyup', handleKeyUp);
});

document.getElementById('backButton').addEventListener('click', closeSearch);
