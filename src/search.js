const debounce = require('debounce');

const {
  addPhotoBackground,
  addVideoBackground,
  removeBackground,
} = require('./viewer');
const api = require('./api');

const searchContainer = document.getElementById('searchContainer');
const searchResults = document.getElementById('searchResults');
const input = document.getElementById('searchBox');
const trending = document.getElementById('trending');
const explorePreviews = document.getElementById('explorePreview');

function handleExploreClick() {
  searchContainer.style.display = null;
  input.addEventListener('keyup', handleKeyUp);
}

function createImage(media) {
  const src = media.files.images['540'];
  if (!src) {
    return null;
  }

  // Need a container to make its height half of width with pure CSS.
  const container = document.createElement('div');
  container.classList.add('image-container');
  const image = document.createElement('div');
  image.style.backgroundImage = `url('${src}')`;
  image.classList.add('image');

  image.addEventListener('click', () => {
    removeBackground();

    if (media.type === 'photo') {
      const url = media.files.images['4096'] || media.files.images.max;
      addPhotoBackground(url);
    } else if (media.type === 'video') {
      const {hls, 848: mp4} = media.files.videos;
      addVideoBackground({hls, mp4});
    }
    closeSearch();
  });

  container.appendChild(image);
  return container;
}

document.getElementById('exploreButton').addEventListener('click', handleExploreClick);

api.getTrending()
  .then((trending) => {
    trending.forEach((media) => appendResultItem(media));
    trending
      .slice(0, 3)
      .forEach((media) => {
        const preview = createImage(media);
        preview && explorePreviews.appendChild(preview);
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
  const preview = createImage(media);
  preview && searchResults.appendChild(preview);
}

function closeSearch() {
  searchResults.scrollTop = 0;
  searchContainer.style.display = 'none';
  input.removeEventListener('keyup', handleKeyUp);
}

document.getElementById('closeButton').addEventListener('click', closeSearch);
