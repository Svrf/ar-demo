const debounce = require('debounce');

const {start} = require('../dist/demo_tiger');
const {removeBackground, addPhotoBackground} = require('./viewer');
const api = require('./api');

start();

const searchContainer = document.getElementById('searchContainer');
const searchResults = document.getElementById('searchResults');
const input = document.getElementById('searchBox');
const trending = document.getElementById('trending');
const explorePreviews = document.getElementById('explorePreview');

function handleExploreClick() {
  searchContainer.style.display = null;
  input.addEventListener('keyup', handleKeyUp);
}

api.authenticate()
  .then(() => {
    document.getElementById('exploreButton').addEventListener('click', handleExploreClick);
    return api.getTrending();
  }).then((trending) => {
    trending.forEach((media) => appendResultItem(media));
    trending
      .slice(0, 3)
      .forEach((media) => {
        const preview = document.createElement('img');
        preview.src = media.files.images['540'];
        explorePreviews.appendChild(preview);
        preview.addEventListener('click', () => {
          removeBackground();
          addPhotoBackground(media);
        });
      });
  });


let isLoading = false;
function scrollHandler() {
  const isBottom = searchResults.scrollTop + searchResults.clientHeight === searchResults.scrollHeight;
  if (!isBottom || isLoading) {
    return;
  }

  isLoading = true;
  const promise = input.value.length < 3 ? api.loadMoreTrending() : api.loadMoreSearch();
  promise.then((media) => {
    isLoading = false;
    media.forEach(appendResultItem);
  });
}
searchResults.addEventListener('scroll', scrollHandler);

const handleKeyUp = debounce(() => {
  const {value} = input;

  trending.style.visibility = value.length ? 'hidden' : null;

  if(value.length > 0 && value.length < 3) {
    return;
  }

  isLoading = true;
  searchResults.innerHTML = '';

  const promise = value.length === 0 ? api.getTrending() : api.search(value);
  promise.then((media) => {
    isLoading = false;
    media.forEach(appendResultItem);
  });
}, 1000);

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

function closeSearch() {
  searchResults.scrollTop = 0;
  searchContainer.style.display = 'none';
  input.removeEventListener('keyup', handleKeyUp);
}

document.getElementById('backButton').addEventListener('click', closeSearch);
